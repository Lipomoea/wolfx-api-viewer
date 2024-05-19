import { defineStore } from 'pinia'

export const useTimeStore = defineStore('timeStore', {
    state: ()=>({
        currentTime: ''
    }),
    actions: {
        updateTime() {
            this.currentTime = (new Date()).toISOString();
        },
        startUpdatingTime() {
            this.updateTime();
            this.interval = setInterval(this.updateTime, 500);
        },
        stopUpdatingTime() {
            if(this.interval) clearInterval(this.interval);
        }
    }
})
