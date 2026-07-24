import { defineStore } from 'pinia';
import { utilUrls } from '@/utils/Urls';
import Http from '@/classes/Http';

let consecutiveCalibrationFailures = 0

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
            this.calibrateTimeout = setTimeout(() => {
                this.calibrateOffset()
                this.updateTime()
            }, 5000);
            this.calibrateInterval = setInterval(this.calibrateOffset, 600 * 1000)
            this.updateInterval = setInterval(this.updateTime, 500)
        },
        stopUpdatingTime() {
            clearInterval(this.updateInterval);
            clearInterval(this.calibrateInterval);
            clearTimeout(this.calibrateTimeout);
        },
        async calibrateOffset() {
            for(const source of utilUrls.ntpTime){
                const requestStart = performance.now()
                const res = await Http.get(`${source.url}?_=${Date.now()}`, { timeout: 2000 })
                const requestDuration = performance.now() - requestStart
                const systemTimeStamp = Date.now()
                if(!res) continue

                const serverTimeStamp = source.function(res)
                if(!Number.isFinite(serverTimeStamp)) continue

                consecutiveCalibrationFailures = 0
                this.offset = serverTimeStamp + requestDuration / 2 - systemTimeStamp
                return
            }

            consecutiveCalibrationFailures++
            if(consecutiveCalibrationFailures >= 3) this.offset = 0
        },
        getTimeStamp() {
            return Date.now() + this.offset
        }
    }
})
