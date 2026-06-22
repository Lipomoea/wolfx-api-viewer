import { defineStore } from 'pinia';
import merge from 'lodash/merge';
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc';
import { calcDistanceKm } from '@/utils/Utils';

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
                kmaEew: false,
                gqEew: false,
                jmaEqlist: false,
                cwaEqlist: true,
                cencEqlist: true,
                kmaEqlist: false,
                usgsEqlist: false,
                fssnEqlist: false,
                jmaTsunami: false,
                nmefcTsunami: true,
            },
            displaySeisNet: {
                style: 'nied',
                hideNoData: false,
                displayShindo0: false,
                alwaysDisplayGrid: false,
                displayMaxInt: false,
                displayPeriodMaxInt: false,
                delay: 0,
                niedNet: false,
                niedSensitivity: 1,
                displayNiedShindo: false,
                niedHypoInf: false,
                niedHypoInfAlwaysOn: false,
                niedHypoInfTextInfo: 0,
                tremNet: false,
                tremApi: 'lb-1',
                displayTremShindo: false,
                kmaNet: false,
                kmaSensitivity: 1,
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
            historySources: ['CENC', 'CWA', 'JMA', 'USGS', 'FSSN'],
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
            masterVolume: 100,
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
            useRomanCsis: true,
            fillSWave: true,
            sWaveColorMode: 0,
            hideDrawer: false,
            defaultMenuId: 'main',
            disableLastingEqlists: false,
            tempEqlistDuration: 6.5,
            tempTsunamiDuration: 15,
            eqlistsDisplayMode: 0,
            alwaysDisplayLatestInfo: false,
            disableEewBaseMap: false,
            mapSimplifyFactor: 0,
            maxWaveRenderRate: 10,
            useCanvasRenderer: false,
            minimizeOnLaunch: false,
            autoCheckNewVersion: false,
            checkPrerelease: false,
            gameMode: false,
            autoRefresh: false,
            displayTyphoon: false
        },
        advancedSettings: {
            enableIclEew: false,
            enableTremFunctions: false,
            enableGqEew: false,
            enableNmefcTsunami: false,
            enableMultiApi: false,
            provinceCeaEew: false,
            defaultFanServer: 0,
            tokens: {
                fan_dev: ''
            },
            multiApi: false,
            displayApiType: false,
            forceCalcInt: false,
            useClassicMapLoader: false,
            preventFlickerMode: false,
            mockEew: false,
            mockOnReplay: false,
            advancedHypoInf: false
        }
    }),
    getters: {
        isValidUserLatLng: (state) => state.mainSettings.userLatLng.every(item => item || item === 0) && !state.mainSettings.userLatLng.every(item => item === 0),
        isValidViewLatLng: (state) => state.mainSettings.viewLatLng.every(item => item || item === 0) && !state.mainSettings.viewLatLng.every(item => item === 0),
        isDisplayUser(state) { return this.isValidUserLatLng && state.mainSettings.displayUser },
        nearestJmaLoc(state) {
            if(!this.isValidUserLatLng) return null
            const userLatLng = state.mainSettings.userLatLng
            const [userLat, userLng] = userLatLng
            let nearestLoc = null
            let nearestDist = 30
            for(let loc in jmaSeisIntLoc) {
                const candidate = jmaSeisIntLoc[loc]
                const [locLat, locLng] = candidate.location
                if(Math.abs(userLng - locLng) >= 0.39 || Math.abs(userLat - locLat) >= 0.27) continue
                const dist = calcDistanceKm(userLatLng, candidate.location)
                if(dist < nearestDist) {
                    nearestDist = dist
                    nearestLoc = candidate
                }
            }
            return nearestLoc
        },
        displayTokenButton: (state) => state.advancedSettings.enableIclEew,
        actionWhiteListArr: (state) => state.mainSettings.actionWhiteList.split('|').filter(key => key)
    },
    actions: {
        setMainSettings(jsonString){
            if(jsonString){
                const json = JSON.parse(jsonString)
                if(json.historySources) this.mainSettings.historySources = []
                merge(this.mainSettings, json)
            }
        },
        setAdvancedSettings(jsonString){
            if(jsonString){
                merge(this.advancedSettings, JSON.parse(jsonString))
            }
        },
    }
})
