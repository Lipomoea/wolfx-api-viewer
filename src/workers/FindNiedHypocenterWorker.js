import { FindNiedHypocenter } from '@/classes/NiedHypoInf'
import { mergeNiedHypocenterUpdates } from '@/utils/NiedHypocenterUpdates'

let finder = null
let pendingUpdate = null
let processingScheduled = false
let workerVersion = 0
let adjStations = null

self.onmessage = event => {
    const message = event.data || {}
    const { type, requestId } = message

    if(type === 'init') {
        adjStations = message.adjStations
        return
    }

    if(type === 'reset') {
        workerVersion++
        finder = null
        pendingUpdate = null
        processingScheduled = false
        self.postMessage({ requestId, results: [] })
        return
    }

    if(type !== 'update') return

    pendingUpdate = mergeNiedHypocenterUpdates(pendingUpdate, message)
    schedulePendingUpdate()
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
        inactiveStations = []
    } = message

    if(!finder) {
        finder = new FindNiedHypocenter(inactiveStations, adjStations)
    }

    const results = finder.update(pickCandidates, inactiveStations, activeStations)
    if(scheduledVersion !== workerVersion) return
    self.postMessage({ requestId, results })

    if(pendingUpdate) schedulePendingUpdate()
}
