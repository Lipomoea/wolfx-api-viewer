import { FindNiedHypocenter } from '@/classes/NiedHypoInf'

let finder = null

self.onmessage = event => {
    const {
        type,
        requestId,
        newActiveStations = [],
        activeStations = [],
        inactiveStations = [],
        adjStationIds
    } = event.data || {}

    if(type === 'reset') {
        finder = null
        self.postMessage({ requestId, results: [] })
        return
    }

    if(type !== 'update') return

    if(!finder) {
        finder = new FindNiedHypocenter(inactiveStations, adjStationIds)
    }

    const results = finder.update(newActiveStations, inactiveStations, activeStations)
    self.postMessage({ requestId, results })
}
