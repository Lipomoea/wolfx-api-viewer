import { defineStore } from 'pinia';
import merge from 'lodash/merge';
import { point, distance } from '@turf/turf';
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc';

export const useSettingsStore = defineStore('settingsStore', {
    state: ()=>({
        mainSettings: {
            source: {
                jmaEew: false,
                cwaEew: true,
                ceaEew: true,
                iclEew: false,
                scEew: true,
                fjEew: true,
                gqEew: false,
                jmaEqlist: false,
                cwaEqlist: false,
                cencEqlist: true,
                kmaEqlist: false,
                usgsEqlist: false,
                fssnEqlist: false,
                jmaTsunami: false,
                nmefcTsunami: false,
            },
            displaySeisNet: {
                style: 'nied',
                hideNoData: false,
                displayShindo0: false,
                delay: 0,
                niedNet: false,
                niedSensitivity: 2,
                displayNiedShindo: false,
                tremNet: false,
                tremApi: 'lb-1',
                displayTremShindo: false,
                kmaNet: false,
                kmaSensitivity: 2,
                kmaIntHold: 1,
                displayKmaInt: false,
            },
            actionMag: 0.0,
            actionLocalCsis: 0,
            actionLocalShindo: 0,
            playIntenseSound: false,
            intenseLocalCsis: 5,
            intenseLocalShindo: 3,
            gqActionMag: 5.0,
            usgsActionMag: 5.0,
            fssnActionMag: 5.0,
            fssnActionType: 1,
            actionWhiteList: '',
            historyMagThres: 0.0,
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
            countdownOnlyIntense: false,
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
            useCanvasRenderer: false,
            minimizeOnLaunch: false,
            autoCheckNewVersion: false,
            checkPrerelease: false,
            autoRefresh: false
        },
        advancedSettings: {
            enableIclEew: false,
            enableTremFunctions: false,
            enableGqEew: false,
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
        isValidUserLatLng: (state) => state.mainSettings.userLatLng.every(item => item || item === 0) && !state.mainSettings.userLatLng.every(item => item === 0),
        isValidViewLatLng: (state) => state.mainSettings.viewLatLng.every(item => item || item === 0) && !state.mainSettings.viewLatLng.every(item => item === 0),
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
        displayTokenButton: (state) => state.advancedSettings.enableIclEew,
        actionWhiteListArr: (state) => state.mainSettings.actionWhiteList.split('|').filter(key => key)
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
