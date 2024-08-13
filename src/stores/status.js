import { defineStore } from 'pinia'

export const useStatusStore = defineStore('statusStore', {
    state: ()=>({
        map: null,
        isActive: {
            jmaEew: false,
            cwaEew: false,
            scEew: false,
            fjEew: false,
            jmaEqlist: false,
            cencEqlist: false,
            niedNet: false,
        }
    }),
    getters: {
        
    },
    actions: {
        setActive(source, isActive){
            this.isActive[source] = isActive
        }
    }
})
