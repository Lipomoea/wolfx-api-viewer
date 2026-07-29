import { FindNiedHypocenter } from '@/classes/NiedHypoInf'

let finder = null
let pendingUpdate = null
let processingScheduled = false
let workerVersion = 0

self.onmessage = event => {
    const message = event.data || {}
    const { type, requestId } = message

    if(type === 'reset') {
        workerVersion++
        finder = null
        pendingUpdate = null
        processingScheduled = false
        self.postMessage({ requestId, results: [] })
        return
    }

    if(type !== 'update') return

    pendingUpdate = mergePendingUpdate(pendingUpdate, message)
    schedulePendingUpdate()
}

const mergePendingUpdate = (previousUpdate, nextUpdate) => {
    if(!previousUpdate) return nextUpdate
    return {
        ...nextUpdate,
        pickCandidates: mergePicksById(previousUpdate.pickCandidates, nextUpdate.pickCandidates),
        activeStations: mergeActiveStationsById(previousUpdate.activeStations, nextUpdate.activeStations)
    }
}

const mergePicksById = (...pickLists) => {
    const pickMap = new Map()
    pickLists.flatMap(picks => picks || [])
        .forEach(pick => {
            if(!pick?.pickId) return
            const previousPick = pickMap.get(pick.pickId)
            pickMap.set(pick.pickId, previousPick ? {
                ...previousPick,
                ...pick,
                createdStamp: Math.min(
                    previousPick.createdStamp ?? previousPick.updateStamp,
                    pick.createdStamp ?? pick.updateStamp
                ),
                updateStamp: Math.max(previousPick.updateStamp || 0, pick.updateStamp || 0),
                ascend: Math.max(previousPick.ascend || 0, pick.ascend || 0),
                level: Math.max(previousPick.level ?? -1, pick.level ?? -1)
            } : pick)
        })
    return [...pickMap.values()]
}

const mergeActiveStationsById = (previousStations, nextStations) => {
    const previousStationMap = new Map(
        (previousStations || [])
            .filter(station => station?.id !== undefined)
            .map(station => [station.id, station])
    )
    return (nextStations || []).map(station => {
        const previousStation = previousStationMap.get(station.id)
        return previousStation?.triggerStamp === station.triggerStamp ? {
            ...previousStation,
            ...station,
            updateStamp: Math.max(previousStation.updateStamp || 0, station.updateStamp || 0),
            ascend: Math.max(previousStation.ascend || 0, station.ascend || 0),
            level: Math.max(previousStation.level ?? -1, station.level ?? -1)
        } : station
    })
}

const schedulePendingUpdate = () => {
    if(processingScheduled) return
    processingScheduled = true
    const scheduledVersion = workerVersion
    setTimeout(() => processPendingUpdate(scheduledVersion), 0)
}

const processPendingUpdate = scheduledVersion => {
    processingScheduled = false
    if(scheduledVersion !== workerVersion) return
    const message = pendingUpdate
    if(!message) return
    pendingUpdate = null

    const {
        requestId,
        pickCandidates = [],
        activeStations = [],
        inactiveStations = [],
        adjStations
    } = message

    if(!finder) {
        finder = new FindNiedHypocenter(inactiveStations, adjStations)
    }

    const results = finder.update(pickCandidates, inactiveStations, activeStations)
    if(scheduledVersion !== workerVersion) return
    self.postMessage({ requestId, results })

    if(pendingUpdate) schedulePendingUpdate()
}
