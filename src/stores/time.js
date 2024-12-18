import { defineStore } from 'pinia'
import { utilUrls } from '@/utils/Urls';
import Http from '@/classes/Http';

export const useTimeStore = defineStore('timeStore', {
    state: ()=>({
        currentTime: '',
        offset: 0,
        timeStamp: 0,
    }),
    actions: {
        updateTime() {
            this.currentTime = (new Date(Date.now() + this.offset)).toISOString();
            this.timeStamp = Date.now() + this.offset
        },
        startUpdatingTime() {
            this.stopUpdatingTime()
            this.calibrateOffset()
            this.updateTime()
            this.calibrateInterval = setInterval(this.calibrateOffset, 60000)
            this.updateInterval = setInterval(this.updateTime, 500)
        },
        stopUpdatingTime() {
            clearInterval(this.updateInterval);
            clearInterval(this.calibrateInterval);
        },
        calibrateOffset() {
            Http.get(utilUrls.ntpTime).then(res=>{
                if(res?.unixtime && res?.utc_datetime){
                    let ntpTimeStamp = res.unixtime * 1000 + Number(res.utc_datetime.split('.')[1].slice(0, 3))
                    let systemTimeStamp = Date.now()
                    this.offset = ntpTimeStamp - systemTimeStamp
                }
            })
        }
    }
})
