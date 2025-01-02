import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settingsStore', {
    state: ()=>({
        mainSettings: {
            source: {
                jmaEew: true,
                cwaEew: true,
                ceaEew: false,
                iclEew: false,
                scEew: true,
                fjEew: true,
                jmaEqlist: true,
                cwaEqlist: false,
                cencEqlist: true
            },
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
            muteNotification: true,
            soundEffect: 'srev',
            displayCnFault: false,
            userLatLng: ['', ''],
            displayUser: false,
            displayLegend: true,
            displayCountdown: false,
            forceDisplayCountdown: false,
            playCountdownSound: false,
            viewLatLng: ['', ''],
            defaultZoom: 5,
            displaySeisNet: {
                hideNoData: false,
                delay: 0,
                nied: true,
                trem: false,
            },
        },
        advancedSettings: {
            displayNiedShindoSwitch: false,
            displayNiedShindo: false,
            enableCeaEew: false,
            enableIclEew: false,
            enableTremFunctions: false,
            forceCalcCsis: false,
            preventFlickerMode: false
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
