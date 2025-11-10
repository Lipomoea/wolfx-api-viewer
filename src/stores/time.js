import { defineStore } from 'pinia';
import { utilUrls } from '@/utils/Urls';
import Http from '@/classes/Http';

export const useTimeStore = defineStore('timeStore', {
    state: () => ({
        currentTimeStamp: 0,
        offset: 0,
    }),
    actions: {
        updateTime() {
            this.currentTimeStamp = this.getTimeStamp();
        },
        startUpdatingTime() {
            this.stopUpdatingTime()
            this.calibrateOffset()
            this.updateTime()
            setTimeout(() => {
                this.calibrateOffset()
                this.updateTime()
            }, 5000);
            this.calibrateInterval = setInterval(this.calibrateOffset, 600 * 1000)
            this.updateInterval = setInterval(this.updateTime, 500)
        },
        stopUpdatingTime() {
            clearInterval(this.updateInterval);
            clearInterval(this.calibrateInterval);
        },
        calibrateOffset() {
            Http.get(utilUrls.ntpTime).then(res=>{
                if(res?.unixtime_ms){
                    let ntpTimeStamp = res.unixtime_ms
                    let systemTimeStamp = Date.now()
                    this.offset = ntpTimeStamp - systemTimeStamp
                }
            })
        },
        getTimeStamp() {
            return Date.now() + this.offset
        }
    }
})
