import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settingsStore', {
    state: ()=>({
        mainSettings: {
            onEew: {
                notification: false,
                focus: false,
            },
            onEewWarn: {
                notification: false,
                focus: false,
            },
            onReport: {
                notification: false,
                focus: false,
            },
            showAbout: false,
        },
    }),
    getters: {
        requestNotification: (state)=>(
            state.mainSettings.onEew.notification || 
            state.mainSettings.onEewWarn.notification || 
            state.mainSettings.onReport.notification
        ),
    },
    actions: {
        setMainSettings(json){
            if(json){
                Object.assign(this.mainSettings.onEew, json.onEew)
                Object.assign(this.mainSettings.onEewWarn, json.onEewWarn)
                Object.assign(this.mainSettings.onReport, json.onReport)
                this.mainSettings.showAbout = json.showAbout
            }
        },
    }
})
