import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settingsStore', {
    state: ()=>({
        mainSettings: {
            onEew: {
                notification: false,
                sound: false,
                focus:false,
            },
            onEewWarn: {
                notification: false,
                sound: false,
                focus:false,
            },
            onReport: {
                notification: false,
                sound: false,
                focus:false,
            },
            onShake: {
                notification: false,
                sound: false,
                focus:false,
            },
            muteNotification: false,
            soundEffect: 'srev',
            displayCnFault: false,
            userLatLng: ['', ''],
            displayUser: false,
            viewLatLng: ['', ''],
            defaultZoom: 5,
            displayCountdown: false,
            forceDisplayCountdown: false,
            displaySeisNet: {
                hideNoData: false,
                nied: true,
                niedDelay: 0,
            },
        },
        advancedSettings: {
            displayNiedShindoSwitch: false,
            displayNiedShindo: false,
            enableIclEew: false,
            forceCalcCsis: false
        }
    }),
    getters: {
        
    },
    actions: {
        setMainSettings(jsonString){
            if(jsonString){
                Object.assign(this.mainSettings, JSON.parse(jsonString))
            }
        },
        setAdvancedSettings(jsonString){
            if(jsonString){
                Object.assign(this.advancedSettings, JSON.parse(jsonString))
            }
        },
    }
})
