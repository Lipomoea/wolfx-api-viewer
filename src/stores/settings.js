import { defineStore } from 'pinia';
import merge from 'lodash/merge';
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc';
import { calcDistanceKm } from '@/utils/Utils';
import { createDefaultDataSources, migrateLegacyDataSources } from '@/utils/DataSources';

export const useSettingsStore = defineStore('settingsStore', {
    state: ()=>({
        mainSettings: {
            dataSources: createDefaultDataSources(),
            provinceCeaEew: false,
            apiKeys: {
                fanApiKey: ''
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
            displayClock: false,
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
            defaultFanServer: 0,
            displayApiType: false,
            forceCalcInt: false,
            useClassicMapLoader: false,
            preventFlickerMode: false,
            mockEew: false,
            mockOnReplay: false,
            advancedHypoInf: false,
            fallbackSvgStationRender: false
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
        actionWhiteListArr: (state) => state.mainSettings.actionWhiteList.split('|').filter(key => key),
        isDataSourceEnabled: state => source => Object.values(state.mainSettings.dataSources[source] || {}).some(Boolean),
        isDataSourceFullyEnabled: state => source => {
            const apis = Object.values(state.mainSettings.dataSources[source] || {})
            return apis.length > 0 && apis.every(Boolean)
        },
        isDataSourcePartiallyEnabled: state => source => {
            const apis = Object.values(state.mainSettings.dataSources[source] || {})
            return apis.some(Boolean) && !apis.every(Boolean)
        },
        enabledDataSources: state => Object.entries(state.mainSettings.dataSources)
            .filter(([, apis]) => Object.values(apis).some(Boolean))
            .map(([source]) => source),
    },
    actions: {
        setDataSourceEnabled(source, enabled) {
            const apis = this.mainSettings.dataSources[source]
            if(!apis) return
            Object.keys(apis).forEach(api => {
                apis[api] = enabled
            })
        },
        setMainSettings(jsonString){
            if(jsonString){
                const json = JSON.parse(jsonString)
                if(!json.dataSources && json.source) {
                    json.dataSources = migrateLegacyDataSources(json.source)
                }
                delete json.dataSources?.cwaEqlist?.trem
                delete json.dataSources?.iclEew?.lipo
                delete json.source
                if(json.historySources) this.mainSettings.historySources = []
                merge(this.mainSettings, json)
            }
        },
        setAdvancedSettings(jsonString){
            if(jsonString){
                const json = JSON.parse(jsonString)
                let migrated = false
                if('provinceCeaEew' in json) {
                    this.mainSettings.provinceCeaEew = Boolean(json.provinceCeaEew)
                    delete json.provinceCeaEew
                    migrated = true
                }
                if('tokens' in json) {
                    delete json.tokens
                    migrated = true
                }
                if('enableMultiApi' in json || 'multiApi' in json) {
                    delete json.enableMultiApi
                    delete json.multiApi
                    localStorage.removeItem('multiApi')
                    migrated = true
                }
                if(migrated) localStorage.setItem('advancedSettings', JSON.stringify(json))
                merge(this.advancedSettings, json)
            }
        },
    }
})
