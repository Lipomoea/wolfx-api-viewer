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
const minInferenceClusterSize = 5
const penaltyFullWeightClusterSize = 0
const penaltyZeroWeightClusterSize = 50
const penaltyFullWeight = 10
const pickAssociationVelocity = 3.5
const pickAssociationPadding = 2000
const duplicatePickResidualTieTolerance = 1000
const maxEffectivePickSelectionIterations = 2
const stableHypocenterUpdateThreshold = 15
const floatPrecisionEpsilon = 1e-9
const minResidualThreshold = 5000
const residualOutlierToleranceRatio = 3
const defaultClusterMatchResidual = minResidualThreshold
const largeClusterMatchResidual = 7500
const largeClusterMatchSize = 50
const inheritedOutlierFilterStages = [
    { level: 3, minCount: 100, minRemainingInheritedRatio: 0.9, ratio: 2, minResidual: 3000, maxMeanResidual: 1500, pWaveBiasRatio: 1 },
    { level: 2, minCount: 30, minRemainingInheritedRatio: 0.8, ratio: 2.5, minResidual: 4000, maxMeanResidual: 2000, pWaveBiasRatio: 1.5 },
    { level: 1, minCount: 10, minRemainingInheritedRatio: 0.5, ratio: 3, minResidual: 5000, pWaveBiasRatio: 2 }
]
const minReliableStationCount = 100
const minGreedyOutlierStationCount = 30
const pWaveOriginStampBiasRatio = 2
const sWaveCountPenaltyRatio = 3
const sWaveCountPenaltyMaxMultiplier = 3
const qualityRankMinStationCounts = {
    S: 200,
    A: 100,
    B: 30,
    C: 10,
    D: 0
}
const sortedInactiveStationsCacheKey = Symbol('sortedInactiveStations')

export class FindNiedHypocenter {
    constructor(inactiveStations, adjStations) {
        this.picks = new Map()
        this.clusters = []
        this.pickClusterMap = new Map()
        this.stationPickMap = new Map()
        this.latestPickIdByStation = new Map()
        this.latestPickStampByStation = new Map()
        this.stationPickIndexVersion = 0
        this.inactiveStations = null
        this.inactiveStationMap = new Map()
        this.inactiveStationsKey = ''
        this.inactiveStationsVersion = 0
        this.inactivePenaltyCandidateCache = new WeakMap()
        this.adjStations = adjStations
        this.stationDensityWeights = this.calcStationDensityWeights(adjStations)
        this.nextClusterId = 1
        this.updateVersion = 0
        this.setInactiveStations(inactiveStations)
    }

    update(pickCandidates = [], inactiveStations = this.inactiveStations, stationUpdates = []) {
        this.updateVersion++
        this.setInactiveStations(inactiveStations)
        pickCandidates
            .slice()
            .sort((pick1, pick2) => this.comparePicks(pick1, pick2))
            .forEach(pick => this.upsertPickCandidate(pick))
        this.updateActivePickSources(stationUpdates)
        this.refreshClusterResults()
        this.mergeCloseClusters()
        this.removeFinishedClusters()
        return this.getResults()
    }

    upsertPickCandidate(pick) {
        if(!this.hasValidPickCandidate(pick)) return
        const existingPick = this.picks.get(pick.pickId)
        if(existingPick) {
            this.updatePickSnapshot(existingPick, pick)
            return
        }
        const pickSnapshot = this.createPickSnapshot(pick)
        this.picks.set(pickSnapshot.pickId, pickSnapshot)
        this.addPickToStationIndex(pickSnapshot)

        const neighborClusterSet = new Set(this.findNeighborClusters(pickSnapshot))
        const matchingCluster = this.findBestMatchingCluster(pickSnapshot)
        if(matchingCluster) neighborClusterSet.add(matchingCluster)
        const neighborClusters = [...neighborClusterSet]
        if(neighborClusters.length === 0) {
            this.createCluster([pickSnapshot], null, true)
        }
        else if(neighborClusters.length === 1) {
            this.addPickToCluster(pickSnapshot, neighborClusters[0])
        }
        else {
            this.mergeAdjacentClusters(pickSnapshot, neighborClusters)
        }
    }

    createPickSnapshot(pick) {
        return {
            pickId: pick.pickId,
            stationId: pick.stationId,
            latLng: [...pick.latLng],
            triggerStamp: pick.triggerStamp,
            createdStamp: pick.createdStamp ?? pick.updateStamp,
            updateStamp: pick.updateStamp,
            maxAscend: pick.ascend,
            maxLevel: pick.level,
            densityWeight: this.getStationDensityWeight(pick.stationId),
            activeForPenalty: pick.ascend >= 3 && pick.level >= 4
        }
    }

    addPickToStationIndex(pick) {
        let stationPicks = this.stationPickMap.get(pick.stationId)
        if(!stationPicks) {
            stationPicks = new Set()
            this.stationPickMap.set(pick.stationId, stationPicks)
            this.stationPickIndexVersion++
        }
        stationPicks.add(pick)
        const latestPickStamp = this.latestPickStampByStation.get(pick.stationId)
        const latestPickId = this.latestPickIdByStation.get(pick.stationId)
        if(
            latestPickStamp === undefined ||
            pick.triggerStamp > latestPickStamp ||
            (pick.triggerStamp === latestPickStamp && String(pick.pickId).localeCompare(String(latestPickId)) > 0)
        ) {
            this.latestPickIdByStation.set(pick.stationId, pick.pickId)
            this.latestPickStampByStation.set(pick.stationId, pick.triggerStamp)
        }
    }

    calcStationDensityWeights(adjStations) {
        return Object.fromEntries(
            Object.keys(adjStations || {}).map(id => {
                const localNeighborCount = Math.max(adjStations[id]?.length || 0, 1)
                return [id, 1 / Math.sqrt(localNeighborCount)]
            })
        )
    }

    getStationDensityWeight(stationId) {
        return this.stationDensityWeights[stationId] ?? 1
    }

    updateActivePickSources(stations) {
        stations.forEach(station => {
            if(!this.hasValidTriggerStamp(station)) return
            const pickId = this.createPickId(station.id, station.triggerStamp)
            const pick = this.picks.get(pickId)
            if(pick) this.updatePickSnapshot(pick, station)
        })
    }

    updatePickSnapshot(pickSnapshot, station) {
        if(this.latestPickIdByStation.get(pickSnapshot.stationId) !== pickSnapshot.pickId) return
        const oldMaxAscend = pickSnapshot.maxAscend
        const oldMaxLevel = pickSnapshot.maxLevel
        pickSnapshot.updateStamp = Math.max(pickSnapshot.updateStamp || 0, station.updateStamp || 0)
        pickSnapshot.maxAscend = Math.max(pickSnapshot.maxAscend || 0, station.ascend || 0)
        pickSnapshot.maxLevel = Math.max(pickSnapshot.maxLevel ?? -1, station.level ?? -1)
        pickSnapshot.activeForPenalty = this.isPenaltyReferenceStation(pickSnapshot)
        if(oldMaxAscend !== pickSnapshot.maxAscend || oldMaxLevel !== pickSnapshot.maxLevel) {
            const cluster = this.pickClusterMap.get(pickSnapshot.pickId)
            if(cluster) this.markClusterUpdated(cluster)
        }
    }

    findNeighborClusters(pick) {
        const clusterSet = new Set()
        const neighbors = this.adjStations?.[pick.stationId] || []
        neighbors.forEach(({ stationId, distance }) => {
            this.stationPickMap.get(stationId)?.forEach(neighborPick => {
                if(!this.arePicksAssociated(pick, neighborPick, distance)) return
                const cluster = this.pickClusterMap.get(neighborPick.pickId)
                if(cluster) clusterSet.add(cluster)
            })
        })
        return [...clusterSet]
    }

    arePicksAssociated(pick1, pick2, distance) {
        if(!Number.isFinite(distance)) return false
        const maxTriggerDiff = distance / pickAssociationVelocity * 1000 + pickAssociationPadding
        return Math.abs(pick1.triggerStamp - pick2.triggerStamp) < maxTriggerDiff
    }

    findBestMatchingCluster(station) {
        if(!this.hasValidTriggerStamp(station)) return null
        const bestMatch = this.clusters.reduce((best, cluster) => {
            const residual = this.calcClusterStationResidual(station, cluster)
            if(residual === null || residual > this.getClusterMatchResidualThreshold(cluster)) return best
            if(!best || residual < best.residual) return { cluster, residual }
            return best
        }, null)
        return bestMatch?.cluster || null
    }

    getClusterMatchResidualThreshold(cluster) {
        return this.getClusterStationCount(cluster) >= largeClusterMatchSize
            ? largeClusterMatchResidual
            : defaultClusterMatchResidual
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
            updates: 0,
            reportNum: 0,
            reportHypocenter: null,
            stableHypocenterUpdateCount: 0,
            stableHypocenter: null,
            stable: false,
            lastUpdateVersion: null,
            initialHypocenter
        }
        stations.forEach(station => this.addPickToCluster(station, cluster, markUpdated))
        this.clusters.push(cluster)
        return cluster
    }

    addPickToCluster(pick, cluster, markUpdated = true) {
        if(cluster.stations.some(item => item.pickId === pick.pickId)) return
        this.insertPickToCluster(pick, cluster)
        this.pickClusterMap.set(pick.pickId, cluster)
        if(markUpdated) this.markClusterUpdated(cluster)
        else cluster.dirty = true
    }

    insertPickToCluster(pick, cluster) {
        let low = 0
        let high = cluster.stations.length
        while(low < high) {
            const mid = Math.floor((low + high) / 2)
            if(this.comparePicks(cluster.stations[mid], pick) <= 0) {
                low = mid + 1
            }
            else {
                high = mid
            }
        }
        cluster.stations.splice(low, 0, pick)
    }

    comparePicks(pick1, pick2) {
        if(pick1.triggerStamp !== pick2.triggerStamp) return pick1.triggerStamp - pick2.triggerStamp
        return String(pick1.pickId).localeCompare(String(pick2.pickId))
    }

    markClusterUpdated(cluster) {
        if(cluster.lastUpdateVersion !== this.updateVersion) {
            cluster.updates++
            cluster.lastUpdateVersion = this.updateVersion
        }
        cluster.dirty = true
    }

    mergeAdjacentClusters(pick, clusters) {
        const baseCluster = clusters.reduce((best, cluster) => 
            this.selectMergeBaseCluster(best, cluster)
        )
        const initialHypocenter = this.getClusterInitialHypocenter(baseCluster)
        const stations = [pick]
        clusters.forEach(cluster => {
            stations.push(...cluster.stations)
            this.removeCluster(cluster)
        })
        const mergedCluster = this.createCluster(stations, initialHypocenter, false)
        mergedCluster.updates = baseCluster.updates
        mergedCluster.reportNum = baseCluster.reportNum
        mergedCluster.reportHypocenter = baseCluster.reportHypocenter ? { ...baseCluster.reportHypocenter } : null
        this.copyClusterStableState(mergedCluster, baseCluster)
        mergedCluster.previousResults = baseCluster.previousResults
        mergedCluster.lastUpdateVersion = baseCluster.lastUpdateVersion
        this.markClusterUpdated(mergedCluster)
        return mergedCluster
    }

    removeCluster(cluster) {
        this.clusters = this.clusters.filter(item => item !== cluster)
        cluster.stations.forEach(pick => {
            if(this.pickClusterMap.get(pick.pickId) === cluster) {
                this.pickClusterMap.delete(pick.pickId)
            }
        })
    }

    removeFinishedClusters() {
        const finishedClusters = this.clusters.filter(cluster => this.isClusterFinished(cluster))
        let stationIndexChanged = false
        finishedClusters.forEach(cluster => {
            const picks = [...cluster.stations]
            this.removeCluster(cluster)
            picks.forEach(pick => {
                if(this.removeKnownPick(pick)) stationIndexChanged = true
            })
        })
        if(stationIndexChanged) this.clusters.forEach(cluster => this.markClusterUpdated(cluster))
    }

    isClusterFinished(cluster) {
        return cluster.stations.length > 0 && cluster.stations.every(pick =>
            this.inactiveStationMap.has(pick.stationId) || this.isPickOutdated(pick)
        )
    }

    isPickOutdated(pick) {
        const latestPickStamp = this.latestPickStampByStation.get(pick.stationId)
        return Number.isFinite(latestPickStamp) && latestPickStamp > pick.triggerStamp
    }

    removeKnownPick(pick) {
        if(this.pickClusterMap.has(pick.pickId)) return false
        this.picks.delete(pick.pickId)
        const stationPicks = this.stationPickMap.get(pick.stationId)
        stationPicks?.delete(pick)
        if(!stationPicks || stationPicks.size > 0) return false
        this.stationPickMap.delete(pick.stationId)
        this.latestPickIdByStation.delete(pick.stationId)
        this.latestPickStampByStation.delete(pick.stationId)
        this.stationPickIndexVersion++
        return true
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

    refreshClusterResults() {
        this.clusters.forEach(cluster => {
            if(!cluster.dirty) return
            if(this.getClusterStationCount(cluster) < minInferenceClusterSize) {
                cluster.result = this.createClusterResult(cluster, this.createHypocenterResult(null, this.createInvalidLikelihood(null)))
                cluster.previousResults = { P: null, S: null }
                this.resetClusterStableHypocenterState(cluster)
                cluster.dirty = false
                return
            }
            const initialHypocenter = cluster.initialHypocenter || cluster.result?.hypocenter || null
            const previousWaveMaps = this.createPreviousWaveMaps(cluster.previousResults)
            const result = this.findBestHypocenterWithEffectivePicks(cluster.stations, initialHypocenter, previousWaveMaps)
            // this.logNewScenarioStations(result, previousWaveMaps)
            // this.logNextPreviousResults(result.previousResults)
            cluster.previousResults = this.mergeValidPreviousResults(cluster.previousResults, result.previousResults)
            this.refreshClusterHypocenterState(cluster, result)
            cluster.result = this.createClusterResult(cluster, this.createPublicHypocenterResult(result))
            cluster.initialHypocenter = result.hypocenter
            cluster.dirty = false
        })
    }

    // Classify every pick, cap each station-phase group, then refit with effective picks.
    findBestHypocenterWithEffectivePicks(picks, initialHypocenter, previousWaveMaps) {
        // this.logInferenceRound(1, picks)
        let classificationResult = this.findBestHypocenter(picks, initialHypocenter, previousWaveMaps)
        const weightedPhasePickIds = this.getWeightedPhasePickIds(classificationResult)
        let effectivePickIds = this.selectEffectivePickIds(classificationResult)
        if(this.areSetsEqual(weightedPhasePickIds, effectivePickIds)) {
            return classificationResult
        }
        let finalResult = classificationResult

        for(let i = 0; i < maxEffectivePickSelectionIterations; i++) {
            const effectivePicks = picks.filter(pick => effectivePickIds.has(pick.pickId))
            if(this.getDistinctStationCount(effectivePicks) < minInferenceClusterSize) {
                return this.createEffectivePickInvalidResult(picks, classificationResult, effectivePickIds)
            }
            // this.logInferenceRound(i + 2, effectivePicks)
            finalResult = this.findBestHypocenter(
                effectivePicks,
                finalResult?.hypocenter || initialHypocenter,
                previousWaveMaps
            )
            classificationResult = this.evaluateHypocenter(picks, finalResult.hypocenter, previousWaveMaps)
            const nextEffectivePickIds = this.selectEffectivePickIds(classificationResult)
            if(this.areSetsEqual(effectivePickIds, nextEffectivePickIds)) break
            if(i + 1 < maxEffectivePickSelectionIterations) effectivePickIds = nextEffectivePickIds
        }

        finalResult.stations = this.createAllPickStationResults(
            picks,
            classificationResult,
            finalResult,
            effectivePickIds
        )
        return finalResult
    }

    logInferenceRound(round, picks) {
        console.log('[FindNiedHypocenter] inference round', {
            round,
            pickCount: picks.length,
            stationCount: this.getDistinctStationCount(picks)
        })
    }

    getWeightedPhasePickIds(result) {
        return new Set(
            (result?.stations || [])
                .filter(item => item?.station && item.weight > 0 && (item.wave === 'P' || item.wave === 'S'))
                .map(item => item.station.pickId)
        )
    }

    selectEffectivePickIds(result) {
        const selectedByStationWave = new Map()
        const originStamp = result?.originStamp
        if(!Number.isFinite(originStamp)) return new Set()
        ;(result.stations || [])
            .filter(item => item?.station && (item.wave === 'P' || item.wave === 'S') && item.weight > 0)
            .forEach(item => {
                const key = `${item.station.stationId}:${item.wave}`
                const candidate = {
                    item,
                    residual: Math.abs(item.originStamp - originStamp)
                }
                const selected = selectedByStationWave.get(key)
                if(!selected || this.isPreferredEffectivePick(candidate, selected)) {
                    selectedByStationWave.set(key, candidate)
                }
            })
        return new Set([...selectedByStationWave.values()].map(candidate => candidate.item.station.pickId))
    }

    isPreferredEffectivePick(candidate, selected) {
        const residualDiff = candidate.residual - selected.residual
        if(Math.abs(residualDiff) > duplicatePickResidualTieTolerance) return residualDiff < 0
        const ascendDiff = (candidate.item.maxAscend || 0) - (selected.item.maxAscend || 0)
        if(ascendDiff !== 0) return ascendDiff > 0
        return String(candidate.item.station.pickId).localeCompare(String(selected.item.station.pickId)) < 0
    }

    createAllPickStationResults(picks, classificationResult, finalResult, effectivePickIds) {
        const classifiedResultMap = new Map(
            (classificationResult?.stations || []).map(item => [item.station?.pickId, item])
        )
        const effectiveResultMap = new Map(
            (finalResult?.stations || []).map(item => [item.station?.pickId, item])
        )
        return picks.map(pick => {
            if(effectivePickIds.has(pick.pickId) && effectiveResultMap.has(pick.pickId)) {
                return effectiveResultMap.get(pick.pickId)
            }
            const classifiedResult = classifiedResultMap.get(pick.pickId)
            if(!classifiedResult) return null
            if(classifiedResult.wave !== 'P' && classifiedResult.wave !== 'S') return classifiedResult
            return {
                ...classifiedResult,
                weight: 0,
                excludedReason: 'duplicate-phase'
            }
        }).filter(Boolean)
    }

    createEffectivePickInvalidResult(picks, classificationResult, effectivePickIds) {
        const result = this.createHypocenterResult(null, this.createInvalidLikelihood(null))
        const effectiveResults = (classificationResult?.stations || [])
            .filter(item => effectivePickIds.has(item.station?.pickId))
        result.stations = this.createAllPickStationResults(
            picks,
            classificationResult,
            { stations: effectiveResults },
            effectivePickIds
        )
        return result
    }

    areSetsEqual(set1, set2) {
        return set1.size === set2.size && [...set1].every(item => set2.has(item))
    }

    getClusterStationCount(cluster) {
        return this.getDistinctStationCount(cluster.stations)
    }

    getDistinctStationCount(picks) {
        return new Set((picks || []).map(pick => pick.stationId)).size
    }

    refreshClusterHypocenterState(cluster, result) {
        const hypocenter = Number.isFinite(result?.score) ? result.hypocenter : null
        this.refreshClusterReportState(cluster, hypocenter)
        this.refreshClusterStableHypocenterState(cluster, hypocenter)
    }

    refreshClusterReportState(cluster, hypocenter) {
        if(!hypocenter) return
        if(this.isSameHypocenter(cluster.reportHypocenter, hypocenter)) return
        cluster.reportNum++
        cluster.reportHypocenter = { ...hypocenter }
    }

    refreshClusterStableHypocenterState(cluster, hypocenter) {
        if(!hypocenter) {
            this.resetClusterStableHypocenterState(cluster)
            return
        }
        if(this.isSameHypocenter(cluster.stableHypocenter, hypocenter)) {
            cluster.stableHypocenterUpdateCount++
        }
        else {
            cluster.stableHypocenter = { ...hypocenter }
            cluster.stableHypocenterUpdateCount = 1
            cluster.stable = false
        }
        if(cluster.stableHypocenterUpdateCount >= stableHypocenterUpdateThreshold) {
            cluster.stable = true
        }
    }

    resetClusterStableHypocenterState(cluster) {
        cluster.stableHypocenter = null
        cluster.stableHypocenterUpdateCount = 0
        cluster.stable = false
    }

    isSameHypocenter(hypocenter1, hypocenter2) {
        if(!hypocenter1 || !hypocenter2) return false
        return Math.abs(hypocenter1.lat - hypocenter2.lat) <= floatPrecisionEpsilon &&
            calcLngDiff(hypocenter1.lng, hypocenter2.lng) <= floatPrecisionEpsilon &&
            Math.abs(hypocenter1.depth - hypocenter2.depth) <= floatPrecisionEpsilon
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
                        const stations = [...cluster1.stations, ...cluster2.stations]
                        const baseCluster = this.selectMergeBaseCluster(cluster1, cluster2)
                        const initialHypocenter = this.getClusterInitialHypocenter(baseCluster)
                        this.removeCluster(cluster1)
                        this.removeCluster(cluster2)
                        const mergedCluster = this.createCluster(stations, initialHypocenter, false)
                        mergedCluster.updates = baseCluster.updates
                        mergedCluster.reportNum = baseCluster.reportNum
                        mergedCluster.reportHypocenter = baseCluster.reportHypocenter ? { ...baseCluster.reportHypocenter } : null
                        this.copyClusterStableState(mergedCluster, baseCluster)
                        mergedCluster.previousResults = baseCluster.previousResults
                        mergedCluster.lastUpdateVersion = baseCluster.lastUpdateVersion
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

    selectMergeBaseCluster(cluster1, cluster2) {
        const stationCount1 = this.getClusterStationCount(cluster1)
        const stationCount2 = this.getClusterStationCount(cluster2)
        if(stationCount1 !== stationCount2) {
            return stationCount1 > stationCount2 ? cluster1 : cluster2
        }
        return cluster1.updates >= cluster2.updates ? cluster1 : cluster2
    }

    getClusterInitialHypocenter(cluster) {
        return cluster.result?.hypocenter || cluster.initialHypocenter || null
    }

    copyClusterStableState(targetCluster, sourceCluster) {
        targetCluster.stable = sourceCluster.stable
        targetCluster.stableHypocenter = sourceCluster.stableHypocenter ? { ...sourceCluster.stableHypocenter } : null
        targetCluster.stableHypocenterUpdateCount = sourceCluster.stableHypocenterUpdateCount
    }

    getResults() {
        return this.clusters
            .map(cluster => cluster.result && {
                ...cluster.result,
                updates: cluster.updates,
                reportNum: cluster.reportNum,
                stable: cluster.stable
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
                .filter(item => item?.station?.pickId && item.weight > 0 && (item.wave === 'P' || item.wave === 'S'))
                .map(item => [item.station.pickId, item.wave])
        )
        return waveMap.size > 0 ? waveMap : null
    }

    logNewScenarioStations(result, previousWaveMaps) {
        if(!Array.isArray(result?.stations)) return
        const previousWaveMap = previousWaveMaps?.[result.firstWave]
        const newStations = result.stations
            .filter(item => item?.station && !previousWaveMap?.has(item.station.pickId))
            .map(item => ({
                pickId: item.station.pickId,
                stationId: item.station.stationId,
                latLng: item.station.latLng,
                wave: item.wave
            }))
        if(newStations.length > 0) {
            console.log('[FindNiedHypocenter] new stations', result.scenario, newStations)
        }
    }

    logNextPreviousResults(previousResults) {
        const summary = Object.fromEntries(['P', 'S'].map(firstWave => {
            const result = previousResults?.[firstWave]
            return [
                firstWave,
                {
                    scenario: result?.scenario ?? null,
                    score: result?.score ?? null,
                    rmse: result?.rmse ?? null,
                    effectiveStationCount: result?.effectiveStationCount ?? null
                }
            ]
        }))
        console.log('[FindNiedHypocenter] next previous results', summary)
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
        // console.log(this.updateVersion, hypocenter, firstWave, results)
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
        // this.logFinalScenarioRmses(cluster, currentResult.hypocenter, previousWaveMaps)
        return currentResult
    }

    logFinalScenarioRmses(cluster, hypocenter, previousWaveMaps = null) {
        const optionCache = new Map()
        const greedyScenarioResults = ['P', 'S'].flatMap(firstWave => ['P', 'S'].map(lastWave => {
                const key = `${firstWave}${lastWave}`
                const result = this.calcScenarioLikelihood(cluster, hypocenter, firstWave, lastWave, optionCache)
                return { key: result.scenario || key, result }
            }))
        const previousScenarioResults = ['P', 'S']
            .map(firstWave => {
                const previousWaveMap = previousWaveMaps?.[firstWave]
                if(!previousWaveMap?.size) return null
                const result = this.calcPreviousWaveScenarioLikelihood(cluster, hypocenter, firstWave, optionCache, previousWaveMap)
                return { key: result.scenario || `${firstWave}_PREV`, result }
            })
            .filter(Boolean)
        const scenarioResults = [...greedyScenarioResults, ...previousScenarioResults]
        const rmses = Object.fromEntries(
            scenarioResults.map(({ key, result }) => [key, result.rmse])
        )
        const scores = Object.fromEntries(
            scenarioResults.map(({ key, result }) => [key, result.score])
        )
        console.log('[FindNiedHypocenter] cluster picks', cluster.map(pick => ({
            pickId: pick.pickId,
            stationId: pick.stationId
        })))
        console.log('[FindNiedHypocenter] final scenario RMSE', rmses)
        console.log('[FindNiedHypocenter] final scenario score', scores)
        scenarioResults.forEach(({ key, result }) => {
            console.log(`[FindNiedHypocenter] ${key} waves`, result.stations.map(item => ({
                pickId: item.station?.pickId,
                stationId: item.station?.stationId,
                wave: item.wave
            })))
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
        const stationResults = new Array(cluster.length)
        const originEntries = []
        const triggerRankWeights = this.calcTriggerRankWeights(cluster)
        const anchorIndexes = this.getScenarioAnchorIndexes(cluster, triggerRankWeights)
        if(!anchorIndexes) return this.createInvalidLikelihood(firstWave, lastWave)
        const { firstAnchorIndex, lastAnchorIndex } = anchorIndexes
        stationResults[firstAnchorIndex] = this.addScenarioStationResult(cluster[firstAnchorIndex], hypocenter, firstWave, optionCache, triggerRankWeights, null, originEntries)
        stationResults[lastAnchorIndex] = this.addScenarioStationResult(cluster[lastAnchorIndex], hypocenter, lastWave, optionCache, triggerRankWeights, null, originEntries)
        for(const i of this.createScenarioInferenceIndexes(cluster, firstAnchorIndex, lastAnchorIndex)) {
            const station = cluster[i]
            const options = this.calcStationOriginOptions(station, hypocenter, optionCache)
            const wave = this.selectScenarioWave(station, options, originEntries, triggerRankWeights)
            stationResults[i] = this.addScenarioStationResult(station, hypocenter, wave, optionCache, triggerRankWeights, null, originEntries, options)
        }
        return this.createScenarioLikelihoodResult(
            cluster,
            hypocenter,
            firstWave,
            lastWave,
            `${firstWave}${lastWave}`,
            optionCache,
            stationResults.filter(Boolean),
            originEntries
        )
    }

    calcPreviousWaveScenarioLikelihood(cluster, hypocenter, firstWave, optionCache, previousWaveMap) {
        const stationResults = new Array(cluster.length)
        const originEntries = []
        const triggerRankWeights = this.calcTriggerRankWeights(cluster)
        const weightedPickCount = this.calcWeightedPickCount(cluster, triggerRankWeights)
        const inheritedItems = []
        for(const i of this.createScenarioInferenceIndexes(cluster)) {
            const station = cluster[i]
            const previousWave = previousWaveMap.get(station.pickId)
            const item = this.createInheritedScenarioStationItem(i, station, hypocenter, previousWave, optionCache, triggerRankWeights)
            if(item) inheritedItems.push(item)
        }
        const inheritedFilterResult = this.calcInheritedOutlierFilterResult(inheritedItems, weightedPickCount)
        const { outlierIndexes, filterStage } = inheritedFilterResult
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
        if(this.calcWeightSum(originEntries) <= 0) {
            return this.createInvalidLikelihood(firstWave, null, `${firstWave}_PREV`)
        }
        for(const i of this.createScenarioInferenceIndexes(cluster)) {
            if(stationResults[i]) continue
            const station = cluster[i]
            const options = this.calcStationOriginOptions(station, hypocenter, optionCache)
            const wave = this.selectScenarioWave(station, options, originEntries, triggerRankWeights, filterStage?.pWaveBiasRatio ?? pWaveOriginStampBiasRatio, filterStage)
            stationResults[i] = this.addScenarioStationResult(
                station,
                hypocenter,
                wave,
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
            originEntries,
            filterStage?.level ?? 0
        )
    }

    getScenarioAnchorIndexes(cluster, triggerRankWeights) {
        if(!Array.isArray(cluster) || cluster.length < minInferenceClusterSize) return null
        const lastIndex = cluster.length - 1
        const preferredFirstAnchorIndex = Math.ceil(lastIndex * 0.25)
        const preferredLastAnchorIndex = Math.floor(lastIndex * 0.75)
        const firstAnchorIndex = this.findValidScenarioAnchorIndex(
            cluster,
            preferredFirstAnchorIndex,
            preferredLastAnchorIndex,
            1,
            triggerRankWeights,
            new Set()
        )
        if(firstAnchorIndex === null) return null
        const lastAnchorIndex = this.findValidScenarioAnchorIndex(
            cluster,
            preferredLastAnchorIndex,
            preferredFirstAnchorIndex,
            -1,
            triggerRankWeights,
            new Set([firstAnchorIndex])
        )
        if(lastAnchorIndex === null) return null
        return {
            firstAnchorIndex,
            lastAnchorIndex
        }
    }

    createScenarioInferenceIndexes(cluster, ...anchorIndexes) {
        const anchors = new Set(anchorIndexes.filter(index => Number.isInteger(index)))
        return this.createMiddleOutStationIndexes(0, cluster.length - 1)
            .filter(index => !anchors.has(index))
    }

    findValidScenarioAnchorIndex(cluster, preferredIndex, centerIndex, centerDirection, triggerRankWeights, usedIndexes) {
        const candidateIndexes = this.createScenarioAnchorCandidateIndexes(
            cluster.length,
            preferredIndex,
            centerIndex,
            centerDirection
        )
        return candidateIndexes.find(index =>
            !usedIndexes.has(index) &&
            this.getStationWeight(cluster[index], triggerRankWeights.get(cluster[index].pickId) ?? 1) > 0
        ) ?? null
    }

    createScenarioAnchorCandidateIndexes(clusterLength, preferredIndex, centerIndex, centerDirection) {
        const indexes = []
        const addIndex = index => {
            if(index >= 0 && index < clusterLength && !indexes.includes(index)) indexes.push(index)
        }
        const centerStep = centerDirection > 0 ? 1 : -1
        for(let index = preferredIndex; centerDirection > 0 ? index <= centerIndex : index >= centerIndex; index += centerStep) {
            addIndex(index)
        }
        for(let offset = 1; preferredIndex - offset >= 0 || preferredIndex + offset < clusterLength; offset++) {
            addIndex(preferredIndex - offset)
            addIndex(preferredIndex + offset)
        }
        return indexes
    }

    createInheritedScenarioStationItem(index, station, hypocenter, wave, optionCache, triggerRankWeights) {
        if(wave !== 'P' && wave !== 'S') return null
        const options = this.calcStationOriginOptions(station, hypocenter, optionCache)
        const triggerRankWeight = triggerRankWeights.get(station.pickId) ?? 1
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

    calcWeightedPickCount(cluster, triggerRankWeights) {
        return cluster.filter(station =>
            this.getStationWeight(station, triggerRankWeights.get(station.pickId) ?? 1) > 0
        ).length
    }

    calcInheritedOutlierFilterResult(inheritedItems, weightedPickCount) {
        const stages = inheritedOutlierFilterStages
            .filter(stage => inheritedItems.length >= stage.minCount)
        if(stages.length === 0) return { outlierIndexes: new Set(), filterStage: null }
        const originEntries = inheritedItems.map(item => ({
            value: item.originStamp,
            weight: item.weight
        }))
        const originStamp = this.calcWeightedMean(originEntries)
        const meanResidual = this.calcMeanAbsResidual(originEntries, originStamp)
        if(!Number.isFinite(meanResidual) || meanResidual <= 0) {
            return { outlierIndexes: new Set(), filterStage: null }
        }
        for(const stage of stages) {
            if(Number.isFinite(stage.maxMeanResidual) && meanResidual > stage.maxMeanResidual) continue
            const threshold = Math.max(meanResidual * stage.ratio, stage.minResidual)
            const outlierIndexes = new Set(
                inheritedItems
                    .filter(item => item.index > 0 && Math.abs(item.originStamp - originStamp) > threshold)
                    .map(item => item.index)
            )
            const remainingInheritedPickCount = inheritedItems.length - outlierIndexes.size
            if(
                remainingInheritedPickCount >= stage.minCount &&
                remainingInheritedPickCount >= weightedPickCount * stage.minRemainingInheritedRatio
            ) {
                return { outlierIndexes, filterStage: stage }
            }
        }
        return { outlierIndexes: new Set(), filterStage: null }
    }

    createScenarioLikelihoodResult(cluster, hypocenter, firstWave, lastWave, scenario, optionCache, stationResults, originEntries, filterStageLevel = 0) {
        if(this.calcWeightSum(originEntries) <= 0) {
            return this.createInvalidLikelihood(firstWave, lastWave, scenario)
        }
        const originStamp = this.calcWeightedMean(originEntries)
        const rmse = this.calcWeightedRmse(originEntries, originStamp) / 1000
        const effectivePickCount = this.calcEffectivePickCount(stationResults)
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
        const qualityScore = this.calcQualityScore(score, effectiveStationCount)
        const qualityRank = this.calcQualityRank(qualityScore, effectiveStationCount)
        return {
            score,
            rmse,
            inactivePenalty,
            inactivePenaltyWeight,
            waveCountPenaltyMultiplier,
            effectivePickCount,
            effectiveStationCount,
            qualityScore,
            qualityRank,
            originStamp,
            firstWave,
            lastWave,
            scenario,
            filterStageLevel,
            stations: stationResults
        }
    }

    calcEffectivePickCount(stationResults) {
        return stationResults.filter(result =>
            (result.wave === 'P' || result.wave === 'S') && result.weight > 0
        ).length
    }

    calcEffectiveStationCount(stationResults) {
        return new Set(
            stationResults
                .filter(result => (result.wave === 'P' || result.wave === 'S') && result.weight > 0)
                .map(result => result.station.stationId)
        ).size
    }

    calcQualityScore(score, effectiveStationCount) {
        return 3.8 + Math.sqrt(effectiveStationCount / 10) * 0.2 - score * 5 / 3
    }

    calcQualityRank(qualityScore, effectiveStationCount) {
        const scoreRank = this.calcQualityRankByScore(qualityScore)
        return ['S', 'A', 'B', 'C', 'D'].find(rank =>
            qualityRankMinStationCounts[rank] <= effectiveStationCount &&
            qualityRankMinStationCounts[rank] <= qualityRankMinStationCounts[scoreRank]
        ) || 'D'
    }

    calcQualityRankByScore(qualityScore) {
        if(qualityScore < 0) return 'D'
        if(qualityScore < 1) return 'C'
        if(qualityScore < 2) return 'B'
        if(qualityScore < 3) return 'A'
        return 'S'
    }

    calcWaveCountPenaltyMultiplier(stationResults) {
        const pWaveCount = stationResults.filter(result => result.wave === 'P' && result.weight > 0).length || 1
        const sWaveCount = stationResults.filter(result => result.wave === 'S' && result.weight > 0).length
        return Math.min(Math.max(sWaveCount / pWaveCount - sWaveCountPenaltyRatio + 1, 1), sWaveCountPenaltyMaxMultiplier)
    }

    selectScenarioWave(station, options, originEntries, triggerRankWeights, pWaveBiasRatio = pWaveOriginStampBiasRatio, outlierFilterStage) {
        const triggerRankWeight = triggerRankWeights.get(station.pickId) ?? 1
        if(this.getStationWeight(station, triggerRankWeight) <= 0) return 'L'
        const selected = this.selectClosestOption(options, originEntries, pWaveBiasRatio, outlierFilterStage)
        return selected?.wave ?? 'O'
    }

    addScenarioStationResult(station, hypocenter, wave, optionCache, triggerRankWeights, stationResults, originEntries, options = null) {
        options ??= this.calcStationOriginOptions(station, hypocenter, optionCache)
        const triggerRankWeight = triggerRankWeights.get(station.pickId) ?? 1
        const weight = this.getStationWeight(station, triggerRankWeight)
        if(weight <= 0 || wave === 'L' || wave === 'O') {
            const stationResult = {
                station: this.createStationResultSnapshot(station),
                wave: weight <= 0 ? 'L' : wave,
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
            station.pickId,
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
            pickId: station.pickId,
            stationId: station.stationId,
            latLng: station.latLng,
            triggerStamp: station.triggerStamp,
            createdStamp: station.createdStamp,
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
        const referenceStationMap = new Map()
        cluster
            .filter(station => this.isPenaltyReferenceStation(station))
            .forEach(station => referenceStationMap.set(station.stationId, station))
        const referenceStations = [...referenceStationMap.values()]
        if(referenceStations.length === 0) return null
        const distances = referenceStations
            .map(station => this.getStationOptionCache(station, hypocenter, optionCache).distance)
            .sort((a, b) => a - b)
        const referenceIndex = Math.max(Math.floor(distances.length * 0.9) - 1, 0)
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
        if(
            cached?.version === this.inactiveStationsVersion &&
            cached.pickIndexVersion === this.stationPickIndexVersion &&
            cached.clusterCount === clusterCount
        ) return cached.stations
        const clusterStationIds = new Set(cluster.map(station => station.stationId))

        if(clusterCount === 1) {
            const stations = [...this.inactiveStationMap.values()]
                .filter(station => !this.stationPickMap.has(station.id) && !clusterStationIds.has(station.id))
            this.inactivePenaltyCandidateCache.set(cluster, {
                version: this.inactiveStationsVersion,
                pickIndexVersion: this.stationPickIndexVersion,
                clusterCount,
                stations
            })
            return stations
        }

        const candidateMap = new Map()
        cluster.forEach(station => {
            const neighbors = this.adjStations?.[station.stationId] || []
            neighbors.forEach(({ stationId: id }) => {
                if(this.stationPickMap.has(id)) return
                if(clusterStationIds.has(id)) return
                const inactiveStation = this.inactiveStationMap.get(id)
                if(inactiveStation) candidateMap.set(id, inactiveStation)
            })
        })
        const stations = [...candidateMap.values()]
        this.inactivePenaltyCandidateCache.set(cluster, {
            version: this.inactiveStationsVersion,
            pickIndexVersion: this.stationPickIndexVersion,
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
            clusterStationCount: this.getClusterStationCount(cluster),
            clusterId: cluster.id,
            updates: cluster.updates,
            reportNum: cluster.reportNum,
            stable: cluster.stable,
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

    selectClosestOption(
        options,
        originEntries,
        pWaveBiasRatio = pWaveOriginStampBiasRatio,
        outlierFilterStage = {
            minCount: minGreedyOutlierStationCount,
            ratio: residualOutlierToleranceRatio,
            minResidual: minResidualThreshold
        }
    ) {
        const currentOriginStamp = this.calcWeightedMean(originEntries)
        if(this.isResidualOutlier(options, originEntries, currentOriginStamp, outlierFilterStage)) return null
        return this.selectClosestOptionByOriginStamp(options, currentOriginStamp, pWaveBiasRatio)
    }

    isResidualOutlier(options, originEntries, originStamp, outlierFilterStage = {
        minCount: minGreedyOutlierStationCount,
        ratio: residualOutlierToleranceRatio,
        minResidual: minResidualThreshold
    }) {
        if(!outlierFilterStage) return false
        if(originEntries.length < outlierFilterStage.minCount) return false
        const meanResidual = this.calcMeanAbsResidual(originEntries, originStamp)
        const threshold = this.calcResidualOutlierThreshold(
            meanResidual,
            outlierFilterStage.minResidual,
            outlierFilterStage.ratio
        )
        if(threshold === null) return false
        return Math.abs(options.P.originStamp - originStamp) > threshold &&
            Math.abs(options.S.originStamp - originStamp) > threshold
    }

    calcResidualOutlierThreshold(meanResidual, minThreshold = minResidualThreshold, ratio = residualOutlierToleranceRatio) {
        if(!Number.isFinite(meanResidual) || meanResidual <= 0) return null
        return Math.max(meanResidual * ratio, minThreshold)
    }

    selectClosestOptionByOriginStamp(options, originStamp, pWaveBiasRatio = pWaveOriginStampBiasRatio) {
        const pDiff = Math.abs(options.P.originStamp - originStamp)
        const sDiff = Math.abs(options.S.originStamp - originStamp)
        return pDiff <= sDiff * pWaveBiasRatio ? options.P : options.S
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

    createPickId(stationId, triggerStamp) {
        return `${stationId}:${triggerStamp}`
    }

    hasValidPickCandidate(pick) {
        return Number.isFinite(pick?.stationId) &&
            this.hasValidTriggerStamp(pick) &&
            pick.pickId === this.createPickId(pick.stationId, pick.triggerStamp)
    }

    createInvalidLikelihood(firstWave = null, lastWave = null, scenario = null) {
        return {
            score: Infinity,
            rmse: Infinity,
            inactivePenalty: 0,
            inactivePenaltyWeight: 0,
            waveCountPenaltyMultiplier: 1,
            effectivePickCount: 0,
            effectiveStationCount: 0,
            qualityScore: -Infinity,
            qualityRank: 'D',
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
