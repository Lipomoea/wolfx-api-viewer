import { defineStore } from 'pinia'

export const useEqMessageStore = defineStore('eqMessageStore', {
    state: ()=>({
        eqMessage: {
            jmaEew: {},
            cwaEew: {},
            scEew: {},
            fjEew: {},
            jmaEqlist: {},
            cencEqlist: {},
        }
    }),
    actions: {
        setEqMessage(source, eqMessage) {
            Object.assign(this.eqMessage[source], eqMessage)
        }
    }
})
