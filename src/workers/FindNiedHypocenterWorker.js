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
        newActiveStations: mergeStationsById(previousUpdate.newActiveStations, nextUpdate.newActiveStations)
    }
}

const mergeStationsById = (...stationLists) => {
    const stationMap = new Map()
    stationLists.flatMap(stations => stations || [])
        .forEach(station => {
            if(station?.id !== undefined) stationMap.set(station.id, station)
        })
    return [...stationMap.values()]
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
        newActiveStations = [],
        activeStations = [],
        inactiveStations = [],
        adjStationIds
    } = message

    if(!finder) {
        finder = new FindNiedHypocenter(inactiveStations, adjStationIds)
    }

    const results = finder.update(newActiveStations, inactiveStations, activeStations)
    if(scheduledVersion !== workerVersion) return
    self.postMessage({ requestId, results })

    if(pendingUpdate) schedulePendingUpdate()
}
