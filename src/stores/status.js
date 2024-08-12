import { defineStore } from 'pinia'

export const useStatusStore = defineStore('statusStore', {
    state: ()=>({
        currentMap: '',
    }),
    getters: {
        
    },
    actions: {
        setCurrentMap(source){
            this.currentMap = source
        }
    }
})
