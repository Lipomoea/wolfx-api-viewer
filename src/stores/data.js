import { defineStore } from 'pinia'
import Http from '@/utils/Http'
import { geojsonUrls } from '@/utils/Urls'

export const useDataStore = defineStore('dataStore', {
    state: ()=>({
        geojson: {
            global: {},
            cn: {},
            cn_fault: {},
            jp: {},
            jp_eew: {},
        },
    }),
    getters: {
        
    },
    actions: {
        saveData(type, name, data){
            this[type][name] = Object.assign({}, data)
        },
        async getGeojson(){
            const promises = Object.keys(this.geojson).map(async name=>{
                const data = await Http.get(geojsonUrls[name])
                this.saveData('geojson', name, data)
            })
            await Promise.all(promises)
        }
    }
})
