import { defineStore } from 'pinia'

export const useStatusStore = defineStore('statusStore', {
    state: ()=>({
        map: null,
        eqMessages: {
            jmaEew: {},
            cwaEew: {},
            scEew: {},
            fjEew: {},
            jmaEqlist: {},
            cencEqlist: {},
        },
        isActive: {
            jmaEew: false,
            cwaEew: false,
            scEew: false,
            fjEew: false,
            jmaEqlist: false,
            cencEqlist: false,
        }
    }),
    getters: {
        
    },
    actions: {
        setEqMessage(source, eqMessage){
            this.eqMessages[source] = Object.assign({}, eqMessage)
        },
        setActive(source, isActive){
            this.isActive[source] = isActive
        }
    }
})
