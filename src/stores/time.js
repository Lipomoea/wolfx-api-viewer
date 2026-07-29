import { defineStore } from 'pinia';
import { utilUrls } from '@/utils/Urls';
import Http from '@/classes/Http';

let consecutiveCalibrationFailures = 0
let calibrationGeneration = 0

const normalCalibrationInterval = 600 * 1000
const fastCalibrationInterval = 60 * 1000
const fastCalibrationOffsetThreshold = 3 * 1000
const timeUpdateInterval = 500

export const useTimeStore = defineStore('timeStore', {
    state: () => ({
        currentTimeStamp: 0,
        offset: 0,
    }),
    actions: {
        updateTime() {
            clearTimeout(this.updateTimeout)
            const now = this.getTimeStamp()
            this.currentTimeStamp = now
            const delay = Math.ceil(timeUpdateInterval - now % timeUpdateInterval)
            this.updateTimeout = setTimeout(() => this.updateTime(), delay)
        },
        startUpdatingTime() {
            this.stopUpdatingTime()
            const generation = calibrationGeneration
            this.calibrateOffset()
            this.updateTime()
            this.scheduleCalibration(generation, 5000)
        },
        stopUpdatingTime() {
            calibrationGeneration++
            clearTimeout(this.updateTimeout);
            clearTimeout(this.calibrateTimeout);
        },
        scheduleCalibration(generation, interval) {
            this.calibrateTimeout = setTimeout(async () => {
                try {
                    await this.calibrateOffset()
                }
                finally {
                    if(generation === calibrationGeneration){
                        this.updateTime()
                        const nextInterval = Math.abs(this.offset) > fastCalibrationOffsetThreshold
                            ? fastCalibrationInterval
                            : normalCalibrationInterval
                        this.scheduleCalibration(generation, nextInterval)
                    }
                }
            }, interval)
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
                this.offset = Math.round(serverTimeStamp + requestDuration / 2 - systemTimeStamp)
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
