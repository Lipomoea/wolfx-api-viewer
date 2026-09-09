import { FindHypocenter } from './FindHypocenter'
import { niedHypocenterProfile } from './NiedHypocenterProfile'

export class FindNiedHypocenter extends FindHypocenter {
    constructor(inactiveStations, adjStations) {
        super(inactiveStations, adjStations, niedHypocenterProfile)
    }
}
