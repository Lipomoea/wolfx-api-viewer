import { calcDistanceKm, calcReachTime, exactRound } from '@/utils/Utils'
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
    depth: 50,
    originStamp: 5000
}
const minInferenceClusterSize = 4
const penaltyFullWeightClusterSize = 20
const penaltyZeroWeightClusterSize = 120
const penaltyFullWeight = 5
const maxEmptyActiveUpdatesBeforeFinal = 15
const maxInactiveUpdatesBeforeRemove = 10
const maxClusterMatchResidual = 5000
const triggerRankDoubleWeightCount = 20
const triggerRankFullWeightCount = 100
const triggerRankMinWeightCount = 900
const triggerRankMinWeight = 0.2
const sWaveCountPenaltyRatio = 3
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
        cluster.final = false
        if(markUpdated) this.markClusterUpdated(cluster)
        else if(!cluster.final) cluster.dirty = true
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
                cluster.dirty = false
                return
            }
            const initialHypocenter = cluster.initialHypocenter || cluster.result?.hypocenter || null
            const previousWaveMap = this.createPreviousWaveMap(cluster.result)
            const result = this.findBestHypocenter(cluster.stations, initialHypocenter, previousWaveMap)
            cluster.result = this.createClusterResult(cluster, result)
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

    createPreviousWaveMap(result) {
        if(!Array.isArray(result?.stations)) return null
        const waveMap = new Map(
            result.stations
                .filter(item => item?.station?.id !== undefined && item.wave)
                .map(item => [item.station.id, item.wave])
        )
        return waveMap.size > 0 ? waveMap : null
    }

    calcLikelihood(cluster, hypocenter, previousWaveMap = null) {
        const optionCache = new Map()
        const scenarios = ['P', 'S'].flatMap(firstWave => ['P', 'S'].map(lastWave =>
            this.calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache, previousWaveMap)
        ))
        return scenarios.reduce((best, result) => result.score < best.score ? result : best)
    }

    findBestHypocenter(cluster, initialHypocenter = null, previousWaveMap = null) {
        if(!Array.isArray(cluster) || cluster.length === 0) {
            return this.createHypocenterResult(null, this.createInvalidLikelihood(null))
        }

        const { lat, lng } = this.calcInitialHypocenterLatLng(cluster)
        let currentResult = this.evaluateHypocenter(cluster, initialHypocenter || { lat, lng, depth: 10 }, previousWaveMap)
        let stepIndex = 0
        let iteration = 0
        while(stepIndex < hypocenterSearchSteps.length && iteration < maxHypocenterSearchIterations) {
            iteration++
            const { degree, depth } = hypocenterSearchSteps[stepIndex]
            const candidates = this.createNeighborHypocenters(currentResult.hypocenter, degree, depth)
                .map(hypocenter => this.evaluateHypocenter(cluster, hypocenter, previousWaveMap))
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
        // this.logFinalScenarioRmses(cluster, currentResult.hypocenter, previousWaveMap)
        return currentResult
    }

    logFinalScenarioRmses(cluster, hypocenter, previousWaveMap = null) {
        const optionCache = new Map()
        const scenarioResults = ['P', 'S'].flatMap(firstWave => ['P', 'S'].map(lastWave => {
                const key = `${firstWave}${lastWave}`
                const result = this.calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache, previousWaveMap)
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

    calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache, previousWaveMap = null) {
        if(!Array.isArray(cluster) || cluster.length === 0) {
            return this.createInvalidLikelihood(firstWave, lastWave)
        }
        if(!cluster.every(station => this.hasValidTriggerStamp(station))) {
            return this.createInvalidLikelihood(firstWave, lastWave)
        }

        const results = [
            this.calcGreedyScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache)
        ]
        if(previousWaveMap?.size) {
            results.push(
                this.calcPreviousWaveScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache, previousWaveMap)
            )
        }
        return results.reduce((best, result) => result.score < best.score ? result : best)
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
            this.addScenarioStationResult(station, hypocenter, selected.wave, optionCache, triggerRankWeights, stationResults, originEntries, options)
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

    calcPreviousWaveScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache, previousWaveMap) {
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
            const previousWave = previousWaveMap.get(station.id)
            const selected = previousWave ? options[previousWave] : this.selectClosestOption(options, originEntries)
            this.addScenarioStationResult(station, hypocenter, selected.wave, optionCache, triggerRankWeights, stationResults, originEntries, options)
        }
        if(lastStationResult) stationResults.push(lastStationResult)
        return this.createScenarioLikelihoodResult(
            cluster,
            hypocenter,
            firstWave,
            lastWave,
            `${firstWave}${lastWave}_PREV`,
            optionCache,
            stationResults,
            originEntries
        )
    }

    createScenarioLikelihoodResult(cluster, hypocenter, firstWave, lastWave, scenario, optionCache, stationResults, originEntries) {
        if(this.calcWeightSum(originEntries) <= 0) {
            return this.createInvalidLikelihood(firstWave, lastWave, scenario)
        }
        const originStamp = this.calcWeightedMean(originEntries)
        const rmse = this.calcWeightedRmse(originEntries, originStamp) / 1000
        const { penalty: inactivePenalty, exceeded } = this.calcInactiveStationPenalty(
            hypocenter,
            cluster,
            optionCache,
            cluster.length
        )
        if(exceeded) {
            return this.createInvalidLikelihood(firstWave, lastWave, scenario)
        }
        const inactivePenaltyWeight = this.calcInactivePenaltyWeight(cluster.length)
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

    calcWaveCountPenaltyMultiplier(stationResults) {
        const pWaveCount = stationResults.filter(result => result.wave === 'P').length
        const sWaveCount = stationResults.filter(result => result.wave === 'S').length
        return sWaveCount > pWaveCount * sWaveCountPenaltyRatio ? sWaveCountPenaltyMultiplier : 1
    }

    addScenarioStationResult(station, hypocenter, wave, optionCache, triggerRankWeights, stationResults, originEntries, options = null) {
        options ??= this.calcStationOriginOptions(station, hypocenter, optionCache)
        const selected = options[wave]
        const triggerRankWeight = triggerRankWeights.get(station.id) ?? 1
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
            this.calcTriggerRankWeight(index + 1)
        ]))
    }

    calcTriggerRankWeight(rank) {
        if(rank <= triggerRankDoubleWeightCount) return 2
        if(rank <= triggerRankFullWeightCount) return 1
        if(rank >= triggerRankMinWeightCount) return triggerRankMinWeight
        const progress = (rank - triggerRankFullWeightCount) / (triggerRankMinWeightCount - triggerRankFullWeightCount)
        return 1 - progress * (1 - triggerRankMinWeight)
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

    calcInactiveStationPenalty(hypocenter, cluster, optionCache, maxPenalty = Infinity) {
        if(cluster.length >= penaltyZeroWeightClusterSize) {
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
        if(Number.isFinite(maxPenalty) && stations.length > maxPenalty) {
            if(this.isInactiveStationPenalized(stations[maxPenalty], hypocenter, optionCache, referenceDistance)) {
                return { penalty: maxPenalty + 1, exceeded: true }
            }
            const penalty = this.findLastPenalizedStationIndex(stations, 0, maxPenalty - 1, hypocenter, optionCache, referenceDistance) + 1
            return { penalty: this.normalizeInactivePenalty(penalty, cluster.length), exceeded: false }
        }

        const penalty = this.findLastPenalizedStationIndex(stations, 0, lastIndex, hypocenter, optionCache, referenceDistance) + 1
        return { penalty: this.normalizeInactivePenalty(penalty, cluster.length), exceeded: false }
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
            this.calcLngDiff(hypo1.lng, hypo2.lng) <= clusterMergeThreshold.lng &&
            Math.abs(hypo1.depth - hypo2.depth) <= clusterMergeThreshold.depth &&
            Math.abs(result1.originStamp - result2.originStamp) <= clusterMergeThreshold.originStamp
    }

    calcLngDiff(lng1, lng2) {
        const diff = Math.abs(lng1 - lng2) % 360
        return Math.min(diff, 360 - diff)
    }

    selectClosestOption(options, originEntries) {
        const currentOriginStamp = this.calcWeightedMean(originEntries)
        return this.selectClosestOptionByOriginStamp(options, currentOriginStamp)
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

    calcWeightSum(entries) {
        return entries.reduce((sum, entry) => sum + entry.weight, 0)
    }

    getStationWeight(station, triggerRankWeight = 1) {
        let ascendWeight
        if(station.maxAscend >= 4) ascendWeight = 1
        else if(station.maxAscend >= 3) ascendWeight = 0.7
        else if(station.maxAscend >= 2) ascendWeight = 0.2
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
