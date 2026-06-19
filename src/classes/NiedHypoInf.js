import { calcDistanceKm, calcLngDiff, calcReachTime, exactRound } from '@/utils/Utils'
import travelTimes from '@/utils/TravelTimes'

const nearTravelTimeMaxDistance = 2000
const hypocenterSearchSteps = [
    { degree: 3, depth: 100 },
    { degree: 1, depth: 50 },
    { degree: 0.3, depth: 20 },
    { degree: 0.1, depth: 10 }
]
const maxHypocenterSearchIterations = 1000
const clusterMergeThreshold = {
    lat: 1,
    lng: 1,
    depth: 100,
    originStamp: 10000
}
const minInferenceClusterSize = 4
const penaltyFullWeightClusterSize = 20
const penaltyZeroWeightClusterSize = 120
const penaltyFullWeight = 10
const maxEmptyActiveUpdatesBeforeFinal = 15
const maxInactiveUpdatesBeforeRemove = 10
const minResidualThreshold = 5000
const residualOutlierToleranceRatio = 3
const maxClusterMatchResidual = minResidualThreshold
const minReliableStationCount = 100
const sWaveCountPenaltyRatio = 2.5
const sWaveCountPenaltyMultiplier = 3
const sortedInactiveStationsCacheKey = Symbol('sortedInactiveStations')

export class FindNiedHypocenter {
    constructor(inactiveStations, adjStationIds) {
        this.activeStations = new Map()
        this.clusters = []
        this.stationClusterMap = new Map()
        this.inactiveStations = null
        this.inactiveStationMap = new Map()
        this.inactiveStationsKey = ''
        this.inactiveStationsVersion = 0
        this.inactivePenaltyCandidateCache = new WeakMap()
        this.adjStationIds = adjStationIds
        this.stationDensityWeights = this.calcStationDensityWeights(adjStationIds)
        this.nextClusterId = 1
        this.updateVersion = 0
        this.setInactiveStations(inactiveStations)
    }

    update(newActiveStations = [], inactiveStations = this.inactiveStations, stationUpdates = newActiveStations) {
        this.updateVersion++
        this.setInactiveStations(inactiveStations)
        newActiveStations.forEach(station => this.addActiveStation(station))
        this.updateActiveStationSources(stationUpdates)
        this.refreshClusterFinalStates()
        this.refreshActiveStationMaxAscends()
        this.refreshClusterResults()
        this.mergeCloseClusters()
        this.removeInactiveClusters()
        return this.getResults()
    }

    addActiveStation(station) {
        if(this.activeStations.has(station.id)) return
        const stationSnapshot = this.createStationSnapshot(station)
        this.activeStations.set(stationSnapshot.id, stationSnapshot)

        const neighborClusters = this.findNeighborClusters(stationSnapshot)
        if(neighborClusters.length === 0) {
            const matchingCluster = this.findBestMatchingCluster(stationSnapshot)
            if(matchingCluster) {
                this.addStationToCluster(stationSnapshot, matchingCluster)
            }
            else {
                this.createCluster([stationSnapshot], null, true)
            }
        }
        else if(neighborClusters.length === 1) {
            this.addStationToCluster(stationSnapshot, neighborClusters[0])
        }
        else {
            this.mergeAdjacentClusters(stationSnapshot, neighborClusters)
        }
    }

    createStationSnapshot(station) {
        return {
            id: station.id,
            latLng: [...station.latLng],
            triggerStamp: station.triggerStamp,
            updateStamp: station.updateStamp,
            maxAscend: station.ascend,
            maxLevel: station.level,
            densityWeight: this.getStationDensityWeight(station.id),
            activeForPenalty: false,
            source: station
        }
    }

    calcStationDensityWeights(adjStationIds) {
        return Object.fromEntries(
            Object.keys(adjStationIds || {}).map(id => {
                const localNeighborCount = Math.max(adjStationIds[id]?.length || 0, 1)
                return [id, 1 / Math.sqrt(localNeighborCount)]
            })
        )
    }

    getStationDensityWeight(stationId) {
        return this.stationDensityWeights[stationId] ?? 1
    }

    updateActiveStationSources(stations) {
        stations.forEach(station => {
            const activeStation = this.activeStations.get(station.id)
            if(activeStation) activeStation.source = station
        })
    }

    refreshActiveStationMaxAscends() {
        this.activeStations.forEach(station => {
            const oldWeight = this.getStationWeight(station)
            const oldActiveForPenalty = station.activeForPenalty
            station.maxAscend = Math.max(station.maxAscend || 0, station.source?.ascend || 0)
            station.maxLevel = Math.max(station.maxLevel ?? -1, station.source?.level ?? -1)
            station.activeForPenalty = this.isPenaltyReferenceStation(station)
            if(oldWeight !== this.getStationWeight(station) || oldActiveForPenalty !== station.activeForPenalty) {
                const cluster = this.stationClusterMap.get(station.id)
                if(cluster) this.markClusterUpdated(cluster)
            }
        })
    }

    findNeighborClusters(station) {
        const clusterSet = new Set()
        const neighborIds = this.adjStationIds?.[station.id] || []
        neighborIds.forEach(id => {
            const cluster = this.stationClusterMap.get(id)
            if(cluster) clusterSet.add(cluster)
        })
        return [...clusterSet]
    }

    findBestMatchingCluster(station) {
        if(!this.hasValidTriggerStamp(station)) return null
        const bestMatch = this.clusters.reduce((best, cluster) => {
            const residual = this.calcClusterStationResidual(station, cluster)
            if(residual === null || residual > maxClusterMatchResidual) return best
            if(!best || residual < best.residual) return { cluster, residual }
            return best
        }, null)
        return bestMatch?.cluster || null
    }

    calcClusterStationResidual(station, cluster) {
        const result = cluster.result
        if(!result?.hypocenter || !Number.isFinite(result.originStamp)) return null
        const optionCache = new Map()
        const options = this.calcStationOriginOptions(station, result.hypocenter, optionCache)
        return Math.min(
            Math.abs(options.P.originStamp - result.originStamp),
            Math.abs(options.S.originStamp - result.originStamp)
        )
    }

    createCluster(stations, initialHypocenter = null, markUpdated = false) {
        const cluster = {
            id: this.nextClusterId++,
            stations: [],
            dirty: true,
            result: null,
            previousResults: {
                P: null,
                S: null
            },
            reportNum: 0,
            emptyActiveUpdateCount: 0,
            inactiveUpdateCount: 0,
            hasNewStation: false,
            final: false,
            lastReportUpdateVersion: null,
            initialHypocenter
        }
        stations.forEach(station => this.addStationToCluster(station, cluster, markUpdated))
        this.clusters.push(cluster)
        return cluster
    }

    addStationToCluster(station, cluster, markUpdated = true) {
        if(cluster.stations.some(item => item.id === station.id)) return
        this.insertStationToCluster(station, cluster)
        this.stationClusterMap.set(station.id, cluster)
        if(cluster.final) return
        if(markUpdated) this.markClusterUpdated(cluster)
        else cluster.dirty = true
        cluster.hasNewStation = true
        cluster.emptyActiveUpdateCount = 0
        cluster.inactiveUpdateCount = 0
    }

    insertStationToCluster(station, cluster) {
        let low = 0
        let high = cluster.stations.length
        while(low < high) {
            const mid = Math.floor((low + high) / 2)
            if(cluster.stations[mid].triggerStamp <= station.triggerStamp) {
                low = mid + 1
            }
            else {
                high = mid
            }
        }
        cluster.stations.splice(low, 0, station)
    }

    markClusterUpdated(cluster) {
        if(cluster.final) return
        if(cluster.lastReportUpdateVersion !== this.updateVersion) {
            cluster.reportNum++
            cluster.lastReportUpdateVersion = this.updateVersion
        }
        cluster.dirty = true
    }

    mergeAdjacentClusters(station, clusters) {
        const initialHypocenter = clusters.find(cluster => cluster.result?.hypocenter)?.result.hypocenter ||
            clusters.find(cluster => cluster.initialHypocenter)?.initialHypocenter ||
            null
        const baseCluster = clusters.reduce((best, cluster) => 
            this.selectReportNumBaseCluster(best, cluster)
        )
        const reportNum = baseCluster.reportNum
        const emptyActiveUpdateCount = Math.min(...clusters.map(cluster => cluster.emptyActiveUpdateCount))
        const stations = [station]
        clusters.forEach(cluster => {
            stations.push(...cluster.stations)
            this.removeCluster(cluster)
        })
        const mergedCluster = this.createCluster(stations, initialHypocenter, false)
        mergedCluster.reportNum = reportNum
        mergedCluster.previousResults = baseCluster.previousResults
        mergedCluster.emptyActiveUpdateCount = emptyActiveUpdateCount
        mergedCluster.inactiveUpdateCount = 0
        mergedCluster.lastReportUpdateVersion = baseCluster.lastReportUpdateVersion
        this.markClusterUpdated(mergedCluster)
        mergedCluster.hasNewStation = true
        return mergedCluster
    }

    removeCluster(cluster) {
        this.clusters = this.clusters.filter(item => item !== cluster)
        cluster.stations.forEach(station => this.stationClusterMap.delete(station.id))
    }

    removeInactiveClusters() {
        this.clusters
            .filter(cluster => this.refreshClusterInactiveUpdateCount(cluster))
            .forEach(cluster => this.removeCluster(cluster))
    }

    refreshClusterInactiveUpdateCount(cluster) {
        if(this.isClusterFullyInactive(cluster)) {
            cluster.inactiveUpdateCount++
            return cluster.inactiveUpdateCount >= maxInactiveUpdatesBeforeRemove
        }
        cluster.inactiveUpdateCount = 0
        return false
    }

    isClusterFullyInactive(cluster) {
        return cluster.stations.length > 0 &&
            cluster.stations.every(station => this.inactiveStationMap.has(station.id))
    }

    setInactiveStations(inactiveStations) {
        const inactiveStationArr = Array.from(inactiveStations || [])
        const inactiveStationsKey = `${inactiveStationArr.length}:${inactiveStationArr.map(station => station.id).join(',')}`
        this.inactiveStations = inactiveStations
        if(this.inactiveStationsKey === inactiveStationsKey) return
        this.inactiveStationsKey = inactiveStationsKey
        this.inactiveStationsVersion++
        this.inactiveStationMap = new Map(
            inactiveStationArr.map(station => [station.id, station])
        )
        this.clusters.forEach(cluster => {
            this.markClusterUpdated(cluster)
        })
    }

    refreshClusterFinalStates() {
        this.clusters.forEach(cluster => {
            if(cluster.final) return
            if(cluster.hasNewStation) {
                cluster.emptyActiveUpdateCount = 0
                cluster.hasNewStation = false
                return
            }
            cluster.emptyActiveUpdateCount++
            if(cluster.emptyActiveUpdateCount >= maxEmptyActiveUpdatesBeforeFinal) {
                if(cluster.lastReportUpdateVersion !== this.updateVersion) {
                    cluster.reportNum++
                    cluster.lastReportUpdateVersion = this.updateVersion
                }
                cluster.final = true
                cluster.dirty = false
            }
        })
    }

    refreshClusterResults() {
        this.clusters.forEach(cluster => {
            if(cluster.final) return
            if(!cluster.dirty) return
            if(cluster.stations.length < minInferenceClusterSize) {
                cluster.result = this.createClusterResult(cluster, this.createHypocenterResult(null, this.createInvalidLikelihood(null)))
                cluster.previousResults = { P: null, S: null }
                cluster.dirty = false
                return
            }
            const initialHypocenter = cluster.initialHypocenter || cluster.result?.hypocenter || null
            const previousWaveMaps = this.createPreviousWaveMaps(cluster.previousResults)
            const result = this.findBestHypocenter(cluster.stations, initialHypocenter, previousWaveMaps)
            // this.logNewScenarioStations(result, previousWaveMaps)
            cluster.previousResults = this.mergeValidPreviousResults(cluster.previousResults, result.previousResults)
            cluster.result = this.createClusterResult(cluster, this.createPublicHypocenterResult(result))
            cluster.initialHypocenter = result.hypocenter
            cluster.dirty = false
        })
    }

    mergeCloseClusters() {
        let merged = true
        while(merged) {
            merged = false
            for(let i = 0; i < this.clusters.length; i++) {
                for(let j = i + 1; j < this.clusters.length; j++) {
                    const cluster1 = this.clusters[i]
                    const cluster2 = this.clusters[j]
                    if(this.canMergeClusterResults(cluster1.result, cluster2.result)) {
                        const initialHypocenter = cluster1.result?.hypocenter || cluster2.result?.hypocenter || null
                        const stations = [...cluster1.stations, ...cluster2.stations]
                        const baseCluster = this.selectReportNumBaseCluster(cluster1, cluster2)
                        const reportNum = baseCluster.reportNum
                        const emptyActiveUpdateCount = Math.min(cluster1.emptyActiveUpdateCount, cluster2.emptyActiveUpdateCount)
                        this.removeCluster(cluster1)
                        this.removeCluster(cluster2)
                        const mergedCluster = this.createCluster(stations, initialHypocenter, false)
                        mergedCluster.reportNum = reportNum
                        mergedCluster.previousResults = baseCluster.previousResults
                        mergedCluster.emptyActiveUpdateCount = emptyActiveUpdateCount
                        mergedCluster.inactiveUpdateCount = 0
                        mergedCluster.hasNewStation = false
                        mergedCluster.lastReportUpdateVersion = baseCluster.lastReportUpdateVersion
                        this.markClusterUpdated(mergedCluster)
                        this.refreshClusterResults()
                        mergedCluster.dirty = false
                        merged = true
                        break
                    }
                }
                if(merged) break
            }
        }
    }

    selectReportNumBaseCluster(cluster1, cluster2) {
        if(cluster1.stations.length !== cluster2.stations.length) {
            return cluster1.stations.length > cluster2.stations.length ? cluster1 : cluster2
        }
        return cluster1.reportNum >= cluster2.reportNum ? cluster1 : cluster2
    }

    getResults() {
        return this.clusters
            .map(cluster => cluster.result && {
                ...cluster.result,
                reportNum: cluster.reportNum,
                final: cluster.final
            })
            .filter(result => result?.hypocenter && Number.isFinite(result.score))
    }

    createPreviousWaveMaps(previousResults) {
        return {
            P: this.createPreviousWaveMap(previousResults?.P),
            S: this.createPreviousWaveMap(previousResults?.S)
        }
    }

    createPreviousWaveMap(result) {
        if(!Array.isArray(result?.stations)) return null
        const waveMap = new Map(
            result.stations
                .filter(item => item?.station?.id !== undefined && (item.wave === 'P' || item.wave === 'S'))
                .map(item => [item.station.id, item.wave])
        )
        return waveMap.size > 0 ? waveMap : null
    }

    logNewScenarioStations(result, previousWaveMaps) {
        if(!Array.isArray(result?.stations)) return
        const previousWaveMap = previousWaveMaps?.[result.firstWave]
        const newStations = result.stations
            .filter(item => item?.station && !previousWaveMap?.has(item.station.id))
            .map(item => ({
                id: item.station.id,
                latLng: item.station.latLng,
                wave: item.wave
            }))
        if(newStations.length > 0) {
            console.log('[FindNiedHypocenter] new stations', result.scenario, newStations)
        }
    }

    calcLikelihood(cluster, hypocenter, previousWaveMaps = null) {
        const optionCache = new Map()
        const previousResults = Object.fromEntries(['P', 'S'].map(firstWave => [
            firstWave,
            this.calcFirstWaveLikelihood(cluster, hypocenter, firstWave, optionCache, previousWaveMaps?.[firstWave])
        ]))
        const result = Object.values(previousResults)
            .reduce((best, item) => item.score < best.score ? item : best)
        return {
            ...result,
            previousResults
        }
    }

    calcFirstWaveLikelihood(cluster, hypocenter, firstWave, optionCache, previousWaveMap = null) {
        if(!Array.isArray(cluster) || cluster.length === 0) {
            return this.createInvalidLikelihood(firstWave)
        }
        if(!cluster.every(station => this.hasValidTriggerStamp(station))) {
            return this.createInvalidLikelihood(firstWave)
        }
        const greedyResults = ['P', 'S'].map(lastWave =>
            this.calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache)
        )
        const results = [...greedyResults]
        if(previousWaveMap?.size) {
            results.push(
                this.calcPreviousWaveScenarioLikelihood(cluster, hypocenter, firstWave, optionCache, previousWaveMap)
            )
        }
        return results.reduce((best, result) => result.score < best.score ? result : best)
    }

    mergeValidPreviousResults(previousResults, nextPreviousResults) {
        return Object.fromEntries(['P', 'S'].map(firstWave => {
            const nextResult = nextPreviousResults?.[firstWave]
            return [
                firstWave,
                Number.isFinite(nextResult?.score) ? nextResult : previousResults?.[firstWave] || null
            ]
        }))
    }

    findBestHypocenter(cluster, initialHypocenter = null, previousWaveMaps = null) {
        if(!Array.isArray(cluster) || cluster.length === 0) {
            return this.createHypocenterResult(null, this.createInvalidLikelihood(null))
        }

        const { lat, lng } = this.calcInitialHypocenterLatLng(cluster)
        let currentResult = this.evaluateHypocenter(cluster, initialHypocenter || { lat, lng, depth: 10 }, previousWaveMaps)
        let stepIndex = 0
        let iteration = 0
        while(stepIndex < hypocenterSearchSteps.length && iteration < maxHypocenterSearchIterations) {
            iteration++
            const { degree, depth } = hypocenterSearchSteps[stepIndex]
            const candidates = this.createNeighborHypocenters(currentResult.hypocenter, degree, depth)
                .map(hypocenter => this.evaluateHypocenter(cluster, hypocenter, previousWaveMaps))
            const bestCandidate = candidates.reduce(
                (best, candidate) => candidate.score < best.score ? candidate : best,
                currentResult
            )
            if(bestCandidate.score < currentResult.score) {
                currentResult = bestCandidate
            }
            else {
                stepIndex++
            }
        }
        // this.logFinalScenarioRmses(cluster, currentResult.hypocenter)
        return currentResult
    }

    logFinalScenarioRmses(cluster, hypocenter) {
        const optionCache = new Map()
        const scenarioResults = ['P', 'S'].flatMap(firstWave => ['P', 'S'].map(lastWave => {
                const key = `${firstWave}${lastWave}`
                const result = this.calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache)
                return { key: result.scenario || key, result }
            }))
        const rmses = Object.fromEntries(
            scenarioResults.map(({ key, result }) => [key, result.rmse])
        )
        const scores = Object.fromEntries(
            scenarioResults.map(({ key, result }) => [key, result.score])
        )
        console.log('[FindNiedHypocenter] final scenario RMSE', rmses)
        console.log('[FindNiedHypocenter] final scenario score', scores)
        scenarioResults.forEach(({ key, result }) => {
            console.log(`[FindNiedHypocenter] ${key} waves`, result.stations.map(station => station.wave))
        })
    }

    calcInitialHypocenterLatLng(cluster) {
        const earliestTriggerStamp = cluster[0].triggerStamp
        const earliestStations = cluster.filter(station => station.triggerStamp === earliestTriggerStamp)
        const [latSum, lngSum] = earliestStations.reduce(
            (sum, station) => [sum[0] + station.latLng[0], sum[1] + station.latLng[1]],
            [0, 0]
        )
        return {
            lat: exactRound(latSum / earliestStations.length, 1),
            lng: exactRound(lngSum / earliestStations.length, 1)
        }
    }

    calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache) {
        if(!Array.isArray(cluster) || cluster.length === 0) {
            return this.createInvalidLikelihood(firstWave, lastWave)
        }
        if(!cluster.every(station => this.hasValidTriggerStamp(station))) {
            return this.createInvalidLikelihood(firstWave, lastWave)
        }

        return this.calcGreedyScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache)
    }

    calcGreedyScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache) {
        const stationResults = []
        const originEntries = []
        const triggerRankWeights = this.calcTriggerRankWeights(cluster)
        const lastStationIndex = cluster.length - 1
        this.addScenarioStationResult(cluster[0], hypocenter, firstWave, optionCache, triggerRankWeights, stationResults, originEntries)
        let lastStationResult = null
        if(lastStationIndex > 0) {
            lastStationResult = this.addScenarioStationResult(cluster[lastStationIndex], hypocenter, lastWave, optionCache, triggerRankWeights, null, originEntries)
        }
        for(const i of this.createMiddleOutStationIndexes(1, lastStationIndex - 1)) {
            const station = cluster[i]
            const options = this.calcStationOriginOptions(station, hypocenter, optionCache)
            const selected = this.selectClosestOption(options, originEntries)
            this.addScenarioStationResult(station, hypocenter, selected?.wave ?? 'N', optionCache, triggerRankWeights, stationResults, originEntries, options)
        }
        if(lastStationResult) stationResults.push(lastStationResult)
        return this.createScenarioLikelihoodResult(
            cluster,
            hypocenter,
            firstWave,
            lastWave,
            `${firstWave}${lastWave}`,
            optionCache,
            stationResults,
            originEntries
        )
    }

    calcPreviousWaveScenarioLikelihood(cluster, hypocenter, firstWave, optionCache, previousWaveMap) {
        const stationResults = new Array(cluster.length)
        const originEntries = []
        const triggerRankWeights = this.calcTriggerRankWeights(cluster)
        const lastStationIndex = cluster.length - 1
        const inheritedItems = []
        const firstItem = this.createInheritedScenarioStationItem(0, cluster[0], hypocenter, firstWave, optionCache, triggerRankWeights)
        if(firstItem) inheritedItems.push(firstItem)
        else {
            stationResults[0] = this.addScenarioStationResult(
                cluster[0],
                hypocenter,
                firstWave,
                optionCache,
                triggerRankWeights,
                null,
                originEntries
            )
        }
        for(const i of this.createMiddleOutStationIndexes(1, lastStationIndex)) {
            const station = cluster[i]
            const previousWave = previousWaveMap.get(station.id)
            const item = this.createInheritedScenarioStationItem(i, station, hypocenter, previousWave, optionCache, triggerRankWeights)
            if(item) inheritedItems.push(item)
        }
        const outlierIndexes = this.findRemovableInheritedOutlierIndexes(inheritedItems)
        inheritedItems.forEach(item => {
            if(outlierIndexes.has(item.index)) return
            stationResults[item.index] = this.addScenarioStationResult(
                cluster[item.index],
                hypocenter,
                item.wave,
                optionCache,
                triggerRankWeights,
                null,
                originEntries,
                item.options
            )
        })
        for(const i of this.createMiddleOutStationIndexes(1, lastStationIndex)) {
            if(stationResults[i]) continue
            const station = cluster[i]
            const options = this.calcStationOriginOptions(station, hypocenter, optionCache)
            const selected = this.selectClosestOption(options, originEntries)
            stationResults[i] = this.addScenarioStationResult(
                station,
                hypocenter,
                selected?.wave ?? 'N',
                optionCache,
                triggerRankWeights,
                null,
                originEntries,
                options
            )
        }
        return this.createScenarioLikelihoodResult(
            cluster,
            hypocenter,
            firstWave,
            null,
            `${firstWave}_PREV`,
            optionCache,
            stationResults.filter(Boolean),
            originEntries
        )
    }

    createInheritedScenarioStationItem(index, station, hypocenter, wave, optionCache, triggerRankWeights) {
        if(wave !== 'P' && wave !== 'S') return null
        const options = this.calcStationOriginOptions(station, hypocenter, optionCache)
        const triggerRankWeight = triggerRankWeights.get(station.id) ?? 1
        const weight = this.getStationWeight(station, triggerRankWeight)
        if(weight <= 0) return null
        return {
            index,
            wave,
            options,
            originStamp: options[wave].originStamp,
            weight
        }
    }

    findRemovableInheritedOutlierIndexes(inheritedItems) {
        if(inheritedItems.length < minReliableStationCount) return new Set()
        const originEntries = inheritedItems.map(item => ({
            value: item.originStamp,
            weight: item.weight
        }))
        const originStamp = this.calcWeightedMean(originEntries)
        const meanResidual = this.calcMeanAbsResidual(originEntries, originStamp)
        const threshold = this.calcResidualOutlierThreshold(meanResidual)
        if(threshold === null) return new Set()
        const outlierIndexes = inheritedItems
            .filter(item => item.index > 0 && Math.abs(item.originStamp - originStamp) > threshold)
            .map(item => item.index)
        if(inheritedItems.length - outlierIndexes.length < minReliableStationCount) return new Set()
        return new Set(outlierIndexes)
    }

    createScenarioLikelihoodResult(cluster, hypocenter, firstWave, lastWave, scenario, optionCache, stationResults, originEntries) {
        if(this.calcWeightSum(originEntries) <= 0) {
            return this.createInvalidLikelihood(firstWave, lastWave, scenario)
        }
        const originStamp = this.calcWeightedMean(originEntries)
        const rmse = this.calcWeightedRmse(originEntries, originStamp) / 1000
        const effectiveStationCount = this.calcEffectiveStationCount(stationResults)
        const { penalty: inactivePenalty, exceeded } = this.calcInactiveStationPenalty(
            hypocenter,
            cluster,
            optionCache,
            effectiveStationCount
        )
        if(exceeded) {
            return this.createInvalidLikelihood(firstWave, lastWave, scenario)
        }
        const inactivePenaltyWeight = this.calcInactivePenaltyWeight(effectiveStationCount)
        const waveCountPenaltyMultiplier = this.calcWaveCountPenaltyMultiplier(stationResults)
        const score = (rmse + inactivePenalty * inactivePenaltyWeight) * waveCountPenaltyMultiplier
        return {
            score,
            rmse,
            inactivePenalty,
            inactivePenaltyWeight,
            waveCountPenaltyMultiplier,
            originStamp,
            firstWave,
            lastWave,
            scenario,
            stations: stationResults
        }
    }

    calcEffectiveStationCount(stationResults) {
        return stationResults.filter(result =>
            (result.wave === 'P' || result.wave === 'S') && result.weight > 0
        ).length
    }

    calcWaveCountPenaltyMultiplier(stationResults) {
        const pWaveCount = stationResults.filter(result => result.wave === 'P').length
        const sWaveCount = stationResults.filter(result => result.wave === 'S').length
        return sWaveCount > pWaveCount * sWaveCountPenaltyRatio ? sWaveCountPenaltyMultiplier : 1
    }

    addScenarioStationResult(station, hypocenter, wave, optionCache, triggerRankWeights, stationResults, originEntries, options = null) {
        options ??= this.calcStationOriginOptions(station, hypocenter, optionCache)
        const triggerRankWeight = triggerRankWeights.get(station.id) ?? 1
        if(wave === 'N' || this.getStationWeight(station, triggerRankWeight) <= 0) {
            const stationResult = {
                station: this.createStationResultSnapshot(station),
                wave: 'N',
                originStamp: null,
                reachTime: null,
                distance: options.distance,
                maxAscend: station.maxAscend,
                triggerRankWeight,
                weight: 0
            }
            stationResults?.push(stationResult)
            return stationResult
        }
        const selected = options[wave]
        const weight = this.getStationWeight(station, triggerRankWeight)
        const stationResult = {
            station: this.createStationResultSnapshot(station),
            wave: selected.wave,
            originStamp: selected.originStamp,
            reachTime: selected.reachTime,
            distance: options.distance,
            maxAscend: station.maxAscend,
            triggerRankWeight,
            weight
        }
        stationResults?.push(stationResult)
        originEntries.push({
            value: selected.originStamp,
            weight
        })
        return stationResult
    }

    calcTriggerRankWeights(cluster) {
        return new Map(cluster.map((station, index) => [
            station.id,
            this.calcTriggerRankWeight(index + 1, cluster.length)
        ]))
    }

    calcTriggerRankWeight(rank, clusterSize) {
        const ratio = rank / Math.max(clusterSize, minReliableStationCount)
        if(ratio <= 0.2) return 1
        else if(ratio <= 0.4) return 1.5 - ratio * 2.5
        else if(ratio <= 0.8) return 0.9 - ratio
        else return 0.1
    }

    createStationResultSnapshot(station) {
        return {
            id: station.id,
            latLng: station.latLng,
            triggerStamp: station.triggerStamp,
            updateStamp: station.updateStamp,
            maxAscend: station.maxAscend,
            maxLevel: station.maxLevel,
            densityWeight: station.densityWeight
        }
    }

    calcStationOriginOptions(station, hypocenter, optionCache) {
        const pOption = this.calcStationWaveOption(station, hypocenter, 'P', optionCache)
        const sOption = this.calcStationWaveOption(station, hypocenter, 'S', optionCache)
        return {
            distance: pOption.distance,
            P: pOption,
            S: sOption
        }
    }

    calcInactiveStationPenalty(hypocenter, cluster, optionCache, effectiveStationCount = cluster.length) {
        if(effectiveStationCount >= penaltyZeroWeightClusterSize) {
            return { penalty: 0, exceeded: false }
        }
        const referenceDistance = this.getInactivePenaltyReferenceDistance(cluster, hypocenter, optionCache)
        if(referenceDistance === null) {
            return { penalty: 0, exceeded: false }
        }
        const stations = this.getSortedInactiveStations(cluster, hypocenter, optionCache)
        if(stations.length === 0) {
            return { penalty: 0, exceeded: false }
        }

        const lastIndex = stations.length - 1
        if(Number.isFinite(effectiveStationCount) && stations.length > effectiveStationCount) {
            if(this.isInactiveStationPenalized(stations[effectiveStationCount], hypocenter, optionCache, referenceDistance)) {
                return { penalty: effectiveStationCount + 1, exceeded: true }
            }
            const penalty = this.findLastPenalizedStationIndex(stations, 0, effectiveStationCount - 1, hypocenter, optionCache, referenceDistance) + 1
            return { penalty: this.normalizeInactivePenalty(penalty, effectiveStationCount), exceeded: false }
        }

        const penalty = this.findLastPenalizedStationIndex(stations, 0, lastIndex, hypocenter, optionCache, referenceDistance) + 1
        return { penalty: this.normalizeInactivePenalty(penalty, effectiveStationCount), exceeded: false }
    }

    normalizeInactivePenalty(penalty, denominator) {
        return denominator > 0 ? penalty / denominator : 0
    }

    calcInactivePenaltyWeight(clusterSize) {
        if(clusterSize <= penaltyFullWeightClusterSize) return penaltyFullWeight
        if(clusterSize >= penaltyZeroWeightClusterSize) return 0
        const progress = (clusterSize - penaltyFullWeightClusterSize) / (penaltyZeroWeightClusterSize - penaltyFullWeightClusterSize)
        return penaltyFullWeight * (1 - progress)
    }

    getInactivePenaltyReferenceDistance(cluster, hypocenter, optionCache) {
        const referenceStations = cluster.filter(station => this.isPenaltyReferenceStation(station))
        if(referenceStations.length === 0) return null
        const distances = referenceStations
            .map(station => this.getStationOptionCache(station, hypocenter, optionCache).distance)
            .sort((a, b) => a - b)
        const referenceIndex = Math.ceil(distances.length * 0.9) - 1
        return distances[referenceIndex]
    }

    getSortedInactiveStations(cluster, hypocenter, optionCache) {
        const cachedStations = optionCache?.get(sortedInactiveStationsCacheKey)
        if(cachedStations) return cachedStations
        const stations = this.getInactivePenaltyCandidates(cluster)
            .filter(station => Number.isFinite(station?.updateStamp))
            .map(station => ({
                station,
                distance: this.getStationOptionCache(station, hypocenter, optionCache).distance
            }))
            .sort((a, b) => a.distance - b.distance)
            .map(item => item.station)
        optionCache?.set(sortedInactiveStationsCacheKey, stations)
        return stations
    }

    getInactivePenaltyCandidates(cluster) {
        const cached = this.inactivePenaltyCandidateCache.get(cluster)
        const clusterCount = this.clusters.length
        if(cached?.version === this.inactiveStationsVersion && cached.clusterCount === clusterCount) return cached.stations

        if(clusterCount === 1) {
            const stations = [...this.inactiveStationMap.values()]
                .filter(station => !this.activeStations.has(station.id))
            this.inactivePenaltyCandidateCache.set(cluster, {
                version: this.inactiveStationsVersion,
                clusterCount,
                stations
            })
            return stations
        }

        const candidateMap = new Map()
        cluster.forEach(station => {
            const neighborIds = this.adjStationIds?.[station.id] || []
            neighborIds.forEach(id => {
                if(this.activeStations.has(id)) return
                const inactiveStation = this.inactiveStationMap.get(id)
                if(inactiveStation) candidateMap.set(id, inactiveStation)
            })
        })
        const stations = [...candidateMap.values()]
        this.inactivePenaltyCandidateCache.set(cluster, {
            version: this.inactiveStationsVersion,
            clusterCount,
            stations
        })
        return stations
    }

    findLastPenalizedStationIndex(stations, low, high, hypocenter, optionCache, referenceDistance) {
        let result = low - 1
        while(low <= high) {
            const mid = Math.floor((low + high) / 2)
            if(this.isInactiveStationPenalized(stations[mid], hypocenter, optionCache, referenceDistance)) {
                result = mid
                low = mid + 1
            }
            else {
                high = mid - 1
            }
        }
        return result
    }

    isInactiveStationPenalized(station, hypocenter, optionCache, referenceDistance) {
        return this.getStationOptionCache(station, hypocenter, optionCache).distance <= referenceDistance
    }

    calcStationWaveOption(station, hypocenter, wave, optionCache) {
        const stationCache = this.getStationOptionCache(station, hypocenter, optionCache)
        if(!stationCache[wave]) {
            const isPWave = wave == 'P'
            const reachTime = calcReachTime(
                stationCache.travelTime,
                isPWave,
                stationCache.depth,
                stationCache.distance
            ) * 1000
            stationCache[wave] = {
                wave,
                reachTime,
                originStamp: station.triggerStamp - reachTime,
                distance: stationCache.distance
            }
        }
        return stationCache[wave]
    }

    getStationOptionCache(station, hypocenter, optionCache) {
        let stationCache = optionCache?.get(station)
        if(!stationCache) {
            const distance = calcDistanceKm([hypocenter.lat, hypocenter.lng], station.latLng)
            stationCache = {
                distance,
                travelTime: distance <= nearTravelTimeMaxDistance ? travelTimes.jma2001 : travelTimes.jb,
                depth: hypocenter.depth ?? 10
            }
            optionCache?.set(station, stationCache)
        }
        return stationCache
    }

    evaluateHypocenter(cluster, hypocenter, previousWaveMap = null) {
        const normalizedHypocenter = this.normalizeHypocenter(hypocenter)
        return this.createHypocenterResult(
            normalizedHypocenter,
            this.calcLikelihood(cluster, normalizedHypocenter, previousWaveMap)
        )
    }

    createNeighborHypocenters(hypocenter, degreeStep, depthStep) {
        const { lat, lng, depth } = hypocenter
        return [
            { lat, lng: lng + degreeStep, depth },
            { lat: lat - degreeStep, lng, depth },
            { lat, lng: lng - degreeStep, depth },
            { lat: lat + degreeStep, lng, depth },
            { lat, lng, depth: depth - depthStep },
            { lat, lng, depth: depth + depthStep }
        ].map(item => this.normalizeHypocenter(item))
    }

    normalizeHypocenter(hypocenter) {
        return {
            lat: Math.min(Math.max(hypocenter.lat, -90), 90),
            lng: ((hypocenter.lng + 540) % 360) - 180,
            depth: Math.min(Math.max(hypocenter.depth ?? 10, 0), 700)
        }
    }

    createHypocenterResult(hypocenter, likelihood) {
        return {
            hypocenter,
            ...likelihood
        }
    }

    createPublicHypocenterResult(result) {
        const { previousResults, ...publicResult } = result || {}
        return publicResult
    }

    createClusterResult(cluster, result) {
        return {
            cluster: cluster.stations.map(station => this.createStationResultSnapshot(station)),
            clusterId: cluster.id,
            reportNum: cluster.reportNum,
            final: cluster.final,
            ...result
        }
    }

    canMergeClusterResults(result1, result2) {
        if(!result1?.hypocenter || !result2?.hypocenter) return false
        if(!Number.isFinite(result1.originStamp) || !Number.isFinite(result2.originStamp)) return false
        const hypo1 = result1.hypocenter
        const hypo2 = result2.hypocenter
        return Math.abs(hypo1.lat - hypo2.lat) <= clusterMergeThreshold.lat &&
            calcLngDiff(hypo1.lng, hypo2.lng) <= clusterMergeThreshold.lng &&
            Math.abs(hypo1.depth - hypo2.depth) <= clusterMergeThreshold.depth &&
            Math.abs(result1.originStamp - result2.originStamp) <= clusterMergeThreshold.originStamp
    }

    selectClosestOption(options, originEntries) {
        const currentOriginStamp = this.calcWeightedMean(originEntries)
        if(this.isResidualOutlier(options, originEntries, currentOriginStamp)) return null
        return this.selectClosestOptionByOriginStamp(options, currentOriginStamp)
    }

    isResidualOutlier(options, originEntries, originStamp) {
        if(originEntries.length < minReliableStationCount) return false
        const meanResidual = this.calcMeanAbsResidual(originEntries, originStamp)
        const threshold = this.calcResidualOutlierThreshold(meanResidual)
        if(threshold === null) return false
        return Math.abs(options.P.originStamp - originStamp) > threshold &&
            Math.abs(options.S.originStamp - originStamp) > threshold
    }

    isWaveResidualOutlier(option, originEntries) {
        if(originEntries.length < minReliableStationCount) return false
        const originStamp = this.calcWeightedMean(originEntries)
        const meanResidual = this.calcMeanAbsResidual(originEntries, originStamp)
        const threshold = this.calcResidualOutlierThreshold(meanResidual)
        if(threshold === null) return false
        return Math.abs(option.originStamp - originStamp) > threshold
    }

    calcResidualOutlierThreshold(meanResidual) {
        if(!Number.isFinite(meanResidual) || meanResidual <= 0) return null
        return Math.max(meanResidual * residualOutlierToleranceRatio, minResidualThreshold)
    }

    selectClosestOptionByOriginStamp(options, originStamp) {
        const pDiff = Math.abs(options.P.originStamp - originStamp)
        const sDiff = Math.abs(options.S.originStamp - originStamp)
        return pDiff <= sDiff * 4 ? options.P : options.S
    }

    createMiddleOutStationIndexes(startIndex, endIndex) {
        if(startIndex > endIndex) return []
        const indexes = []
        const mid = Math.floor((startIndex + endIndex) / 2)
        indexes.push(mid)
        for(let offset = 1; mid - offset >= startIndex || mid + offset <= endIndex; offset++) {
            if(mid + offset <= endIndex) indexes.push(mid + offset)
            if(mid - offset >= startIndex) indexes.push(mid - offset)
        }
        return indexes
    }

    calcWeightedMean(entries) {
        const weightSum = this.calcWeightSum(entries)
        if(weightSum > 0) {
            return entries.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / weightSum
        }
        return entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length
    }

    calcWeightedRmse(entries, expectedValue) {
        const weightSum = this.calcWeightSum(entries)
        if(weightSum <= 0) return Infinity
        const mse = entries.reduce((sum, entry) => 
            sum + entry.weight * (entry.value - expectedValue) ** 2, 0
        ) / weightSum
        return Math.sqrt(mse)
    }

    calcMeanAbsResidual(entries, expectedValue) {
        if(entries.length === 0) return Infinity
        return entries.reduce((sum, entry) => 
            sum + Math.abs(entry.value - expectedValue), 0
        ) / entries.length
    }

    calcWeightSum(entries) {
        return entries.reduce((sum, entry) => sum + entry.weight, 0)
    }

    getStationWeight(station, triggerRankWeight = 1) {
        let ascendWeight
        if(station.maxAscend >= 4) ascendWeight = Math.min(0.2 * station.maxAscend, 2)
        // else if(station.maxAscend >= 4) ascendWeight = 0.8
        else if(station.maxAscend >= 3) ascendWeight = 0.3
        else if(station.maxAscend >= 2) ascendWeight = 0.1
        // else if(station.maxAscend >= 1) ascendWeight = 0.1
        else ascendWeight = 0
        return ascendWeight * (station.densityWeight ?? 1) * triggerRankWeight
    }

    isPenaltyReferenceStation(station) {
        return station.maxAscend >= 3 && station.maxLevel >= 4
    }

    hasValidTriggerStamp(station) {
        return Number.isFinite(station?.triggerStamp) && station.triggerStamp > 0
    }

    createInvalidLikelihood(firstWave = null, lastWave = null, scenario = null) {
        return {
            score: Infinity,
            rmse: Infinity,
            inactivePenalty: 0,
            inactivePenaltyWeight: 0,
            waveCountPenaltyMultiplier: 1,
            originStamp: null,
            firstWave,
            lastWave,
            scenario,
            stations: []
        }
    }

    run() {
        this.refreshClusterResults()
        this.mergeCloseClusters()
        return this.getResults()
    }
}
