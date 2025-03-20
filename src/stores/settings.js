import { defineStore } from 'pinia'
import merge from 'lodash/merge'

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
                cencEqlist: true,
                jmaTsunami: true
            },
            displaySeisNet: {
                style: 'nied',
                hideNoData: false,
                delay: 0,
                nied: true,
                niedSensitivity: 2,
                displayNiedShindo: false,
                trem: false,
                tremApi: 'lb-1',
                displayTremShindo: false
            },
            actionCsis: 0,
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
            onTsunami: {
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
            hideDrawer: false,
            cinemaMode: false,
            eqlistsAsDefault: false,
            autoCheckNewVersion: false,
            checkPrerelease: true,
            autoRefresh: false
        },
        advancedSettings: {
            displayNiedShindoSwitch: false,
            enableCeaEew: false,
            enableIclEew: false,
            enableTremFunctions: false,
            forceCalcInt: false,
            preventFlickerMode: false
        }
    }),
    getters: {
        
    },
    actions: {
        setMainSettings(jsonString){
            if(jsonString){
                merge(this.mainSettings, JSON.parse(jsonString))
            }
        },
        setAdvancedSettings(jsonString){
            if(jsonString){
                merge(this.advancedSettings, JSON.parse(jsonString))
            }
        },
    }
})
