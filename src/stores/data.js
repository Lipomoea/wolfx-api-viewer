import { defineStore } from 'pinia'

export const useDataStore = defineStore('dataStore', {
    state: ()=>({
        geojson: {
            global: {},
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
