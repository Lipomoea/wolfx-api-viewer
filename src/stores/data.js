import { defineStore } from 'pinia'

export const useDataStore = defineStore('dataStore', {
    state: ()=>({
        geojson: {
            global: {},
            cn: {},
            jp_eew: {}
        },
    }),
    getters: {
        
    },
    actions: {
        saveData(type, name, data){
            this[type][name] = Object.assign({}, data)
        }
    }
})
