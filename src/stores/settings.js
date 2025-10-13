import { defineStore } from 'pinia'
import merge from 'lodash/merge'
import { point, distance } from '@turf/turf'
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc'

export const useSettingsStore = defineStore('settingsStore', {
    state: ()=>({
        mainSettings: {
            source: {
                jmaEew: true,
                cwaEew: true,
                ceaEew: true,
                iclEew: false,
                scEew: true,
                fjEew: true,
                gqEew: false,
                jmaEqlist: true,
                cwaEqlist: false,
                cencEqlist: true,
                usgsEqlist: false,
                fssnEqlist: false,
                jmaTsunami: true,
                nmefcTsunami: false,
            },
            displaySeisNet: {
                style: 'nied',
                hideNoData: false,
                delay: 0,
                niedNet: true,
                niedSensitivity: 2,
                displayNiedShindo: false,
                tremNet: false,
                tremApi: 'lb-1',
                displayTremShindo: false
            },
            actionMag: 0.0,
            actionLocalCsis: 0,
            actionLocalShindo: 0,
            gqActionMag: 5.0,
            usgsActionMag: 5.0,
            fssnActionMag: 5.0,
            fssnActionType: 2,
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
            userLatLng: [0, 0],
            displayUser: false,
            displayLegend: true,
            displayCountdown: false,
            forceDisplayCountdown: false,
            playCountdownSound: false,
            countdownSpeech: true,
            countdownStart: 10,
            displayAreaIntensities: true,
            viewLatLng: [0, 0],
            defaultZoom: 5,
            uiScale: 1,
            displayPlaceName: false,
            placeNameOnHover: false,
            displayCnFault: false,
            displayTerminator: false,
            useRomanCsis: false,
            fillSWave: true,
            sWaveColorMode: 0,
            hideDrawer: false,
            cinemaMode: true,
            eqlistsAsDefault: false,
            eqlistsDisplayMode: 0,
            alwaysDisplayLatestInfo: false,
            disableEewBaseMap: false,
            mapSimplifyFactor: 0,
            maxWaveRenderRate: 10,
            minimizeOnLaunch: false,
            autoCheckNewVersion: false,
            checkPrerelease: false,
            autoRefresh: false
        },
        advancedSettings: {
            enableIclEew: false,
            enableTremFunctions: false,
            enableGqEew: false,
            enableFssnEqlist: false,
            enableNmefcTsunami: false,
            enableMultiApi: false,
            enableMockEew: false,
            provinceCeaEew: false,
            tokens: {
                fan_dev: ''
            },
            multiApi: false,
            displayApiType: false,
            forceCalcInt: false,
            useClassicMapLoader: false,
            preventFlickerMode: false,
            mockEew: false
        }
    }),
    getters: {
        isValidUserLatLng: (state) => state.mainSettings.userLatLng.some(item => !!item),
        isValidViewLatLng: (state) => state.mainSettings.viewLatLng.some(item => !!item),
        isDisplayUser(state) { return this.isValidUserLatLng && state.mainSettings.displayUser },
        nearestJmaLoc(state) {
            if(this.isValidUserLatLng) {
                const userCoord = [state.mainSettings.userLatLng[1], state.mainSettings.userLatLng[0]]
                const userPoint = point(userCoord)
                let nearestLoc = null
                let nearestDist = 30
                for(let loc in jmaSeisIntLoc) {
                    const locCoord = [jmaSeisIntLoc[loc].location[1], jmaSeisIntLoc[loc].location[0]]
                    if(Math.abs(userCoord[0] - locCoord[0]) >= 0.39 || Math.abs(userCoord[1] - locCoord[1]) >= 0.27) continue
                    const locPoint = point(locCoord)
                    const dist = distance(userPoint, locPoint, { units: 'kilometers' })
                    if(dist < nearestDist) {
                        nearestDist = dist
                        nearestLoc = jmaSeisIntLoc[loc]
                    }
                }
                return nearestLoc
            }
            else return null
        },
        displayTokenButton: (state) => state.advancedSettings.enableIclEew || state.advancedSettings.enableFssnEqlist
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
