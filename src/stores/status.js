import { defineStore } from 'pinia';
import Http from '@/classes/Http';
import WebSocketObj from '@/classes/WebSocket';
import { eqUrls, tsunamiUrls } from '@/utils/Urls';
import { setClassName, calcCsisLevel, stampToTime, getShindoFromInstShindo, shindoScaleKanji } from '@/utils/Utils';
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc';
import { useSettingsStore } from './settings';
import { isTauri } from '@tauri-apps/api/core';
import { getFEName } from '@/utils/FERegions';

export const defaultEqMessage = {
    source: '',
    type: 0,
    id: '',
    isEew: false,
    timeZone: 8,
    reportNum: 0,
    reportNumText: '',
    reportTime: '',
    isAssumption: false,
    isWarn: false,
    isFinal: false,
    isCanceled: false,
    title: '',
    titleText: '',
    hypocenter: '',
    hypocenterText: '',
    lat: 0,
    lng: 0,
    depth: 0,
    depthText: '',
    originTime: '',
    originTimeText: '',
    magnitude: 0,
    magnitudeText: '',
    useShindo: false,
    maxIntensity: '',
    maxIntensityText: '',
    warnArea: '[]',
    className: ''
}
export const defaultTsunamiMessage = {
    source: '',
    id: '',
    timeZone: 8,
    reportTime: '',
    title: '',
    titleText: '',
    status: 0,
    warnArea: '[]',
    className: ''
}

const wolfx2Source = {
    'jma_eew': 'jmaEew',
    'cwa_eew': 'cwaEew',
    'cenc_eew': 'ceaEew',
    'sc_eew': 'scEew',
    'fj_eew': 'fjEew',
    'cenc_eqlist': 'cencEqlist'
}

const source2Fan = {
    'iclEew': 'icl',
    'scEew': 'sichuan',
    'fjEew': 'fujian',
    'cencEqlist': 'cenc',
    'fssnEqlist': 'fssn',
    'nmefcTsunami': 'tsunami'
}
const fan2Source = {
    'icl': 'iclEew',
    'sichuan': 'scEew',
    'fujian': 'fjEew',
    'cenc': 'cencEqlist',
    'fssn': 'fssnEqlist',
    'tsunami': 'nmefcTsunami'
}

export const eewSources = ['jmaEew', 'cwaEew', 'ceaEew', 'iclEew', 'scEew', 'fjEew', 'gqEew']
export const eqlistSources = ['jmaEqlist', 'cwaEqlist', 'cencEqlist', 'fssnEqlist']
export const tsunamiSources = ['jmaTsunami', 'nmefcTsunami']
export const seisNetSources = ['niedNet', 'tremNet']

const useWolfxSocket = ['jmaEew', 'cwaEew', 'ceaEew', 'scEew', 'fjEew', 'cencEqlist']
const useFanSocket = ['ceaEew', 'iclEew', 'scEew', 'fjEew', 'cencEqlist', 'fssnEqlist', 'nmefcTsunami']
const useP2pquakeSocket = ['jmaEqlist', 'jmaTsunami']

export const useStatusStore = defineStore('statusStore', {
    state: ()=>({
        map: null,
        isTauri: isTauri(),
        showMockDialog: false,
        httpRequest: null,
        wolfxSocket: null,
        fanSocket: null,
        p2pquakeSocket: null,
        gqSocket: null,
        enabledSource: [],
        multiApi: false,
        eqMessage: {
            jmaEew: Object.assign({}, defaultEqMessage),
            cwaEew: Object.assign({}, defaultEqMessage),
            ceaEew: Object.assign({}, defaultEqMessage),
            iclEew: Object.assign({}, defaultEqMessage),
            scEew: Object.assign({}, defaultEqMessage),
            fjEew: Object.assign({}, defaultEqMessage),
            gqEew: Object.assign({}, defaultEqMessage),
            mockEew: Object.assign({}, defaultEqMessage),
            jmaEqlist: Object.assign({}, defaultEqMessage),
            cwaEqlist: Object.assign({}, defaultEqMessage),
            cencEqlist: Object.assign({}, defaultEqMessage),
            fssnEqlist: Object.assign({}, defaultEqMessage),
        },
        tsunamiMessage: {
            jmaTsunami: Object.assign({}, defaultTsunamiMessage),
            nmefcTsunami: Object.assign({}, defaultTsunamiMessage),
        },
        isActive: {
            jmaEew: false,
            cwaEew: false,
            ceaEew: false,
            iclEew: false,
            scEew: false,
            fjEew: false,
            gqEew: false,
            mockEew: false,
            jmaEqlist: false,
            cwaEqlist: false,
            cencEqlist: false,
            fssnEqlist: false,
            jmaTsunami: false,
            nmefcTsunami: false,
            niedNet: false,
            tremNet: false,
        }
    }),
    getters: {
        activeWolfxSource: state => useWolfxSocket.filter(source => state.enabledSource.includes(source)),
        activeFanSource: state => useFanSocket.filter(source => state.enabledSource.includes(source)),
        activeP2pquakeSource: state => useP2pquakeSocket.filter(source => state.enabledSource.includes(source)),
    },
    actions: {
        setEqMessage(source, data, type = 0) {
            try{
                const eqMessage = this.eqMessage[source]
                eqMessage.source = source
                eqMessage.type = type
                switch(source){
                    case 'jmaEew':{
                        eqMessage.isEew = true
                        eqMessage.timeZone = 9
                        eqMessage.useShindo = true
                        switch(type) {
                            case 0: {
                                const trainingText = data.isTraining ? '訓練·' : ''
                                eqMessage.id = data.EventID
                                eqMessage.isCanceled = data.isCancel
                                eqMessage.reportNum = data.Serial
                                eqMessage.reportTime = data.AnnouncedTime.replace(/\//g, '-')
                                eqMessage.isAssumption = data.isAssumption
                                eqMessage.isWarn = data.isWarn
                                eqMessage.isFinal = data.isFinal
                                eqMessage.title = trainingText + data.Title
                                eqMessage.lat = data.Latitude
                                eqMessage.lng = data.Longitude
                                eqMessage.depth = data.Depth
                                eqMessage.depthText = '深さ: ' + data.Depth + 'km'
                                eqMessage.originTime = data.OriginTime.replace(/\//g, '-')
                                eqMessage.originTimeText = '発震時刻: ' + data.OriginTime.replace(/\//g, '-') + ' (JST)'
                                eqMessage.magnitude = data.Magunitude
                                eqMessage.magnitudeText = 'マグニチュード: ' + data.Magunitude.toFixed(1)
                                eqMessage.maxIntensity = data.MaxIntensity
                                if(data.isCancel){
                                    eqMessage.reportNumText = 'キャンセル報'
                                    eqMessage.titleText = trainingText + '緊急地震速報（取消）'
                                    eqMessage.hypocenter = trainingText + '取り消されました'
                                    eqMessage.hypocenterText = trainingText + '震源地: 取り消されました'
                                    eqMessage.maxIntensityText = '推定最大震度: なし'
                                    eqMessage.warnArea = '[]'
                                }
                                else{
                                    eqMessage.reportNumText = '第' + data.Serial + '報' + (data.isFinal?'（最終）':'')
                                    eqMessage.titleText = trainingText + data.Title
                                    eqMessage.hypocenter = trainingText + data.Hypocenter
                                    eqMessage.hypocenterText = trainingText + '震源地: ' + data.Hypocenter
                                    eqMessage.maxIntensityText = '推定最大震度: ' + data.MaxIntensity
                                    eqMessage.warnArea = JSON.stringify(data.WarnArea.map(item=>{
                                        return {
                                            name: item.Chiiki,
                                            intensity: item.Shindo1,
                                            className: setClassName(item.Shindo1, true)
                                        }
                                    }))
                                }
                                break
                            }
                            case 1: {
                                const trainingText = data.is_training ? '訓練·' : ''
                                eqMessage.id = data.report_id
                                eqMessage.isCanceled = data.is_cancel
                                eqMessage.reportNum = Number(data.report_num)
                                eqMessage.reportTime = data.report_time.replace(/\//g, '-')
                                eqMessage.isAssumption = false
                                eqMessage.isWarn = data.alertflg == '警報'
                                eqMessage.isFinal = data.is_final
                                eqMessage.title = trainingText + `緊急地震速報（${data.alertflg}）`
                                eqMessage.lat = Number(data.latitude)
                                eqMessage.lng = Number(data.longitude)
                                eqMessage.depth = Number(data.depth.replace('km', ''))
                                eqMessage.depthText = '深さ: ' + data.depth
                                eqMessage.originTime = data.origin_time.replace(
                                    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
                                    '$1-$2-$3 $4:$5:$6'
                                )
                                eqMessage.originTimeText = '発震時刻: ' + eqMessage.originTime + ' (JST)'
                                eqMessage.magnitude = Number(data.magunitude)
                                eqMessage.magnitudeText = 'マグニチュード: ' + eqMessage.magnitude.toFixed(1)
                                eqMessage.maxIntensity = data.calcintensity
                                if(data.is_cancel){
                                    eqMessage.reportNumText = 'キャンセル報'
                                    eqMessage.titleText = trainingText + '緊急地震速報（取消）'
                                    eqMessage.hypocenter = trainingText + '取り消されました'
                                    eqMessage.hypocenterText = trainingText + '震源地: 取り消されました'
                                    eqMessage.maxIntensityText = '推定最大震度: なし'
                                    eqMessage.warnArea = '[]'
                                }
                                else{
                                    eqMessage.reportNumText = '第' + data.report_num + '報' + (data.is_final?'（最終）':'')
                                    eqMessage.titleText = trainingText + `緊急地震速報（${data.alertflg}）`
                                    eqMessage.hypocenter = trainingText + data.region_name
                                    eqMessage.hypocenterText = trainingText + '震源地: ' + data.region_name
                                    eqMessage.maxIntensityText = '推定最大震度: ' + data.calcintensity
                                    eqMessage.warnArea = '[]'
                                }
                                break
                            }
                        }
                        break
                    }
                    case 'cwaEew':{
                        switch(type) {
                            case 0:
                                eqMessage.id = data.ID
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.ReportNum
                                eqMessage.reportNumText = '第' + data.ReportNum + '報'
                                eqMessage.reportTime = data.ReportTime
                                eqMessage.isWarn = data.MaxIntensity >= '5'
                                eqMessage.isCanceled = data.isCancel
                                eqMessage.titleText = '中央氣象署強震即時警報' + (data.isCancel?'（取消）':'')
                                eqMessage.hypocenter = data.HypoCenter
                                eqMessage.hypocenterText = '震央: ' + data.HypoCenter
                                eqMessage.lat = data.Latitude
                                eqMessage.lng = data.Longitude
                                eqMessage.depth = data.Depth
                                eqMessage.depthText = '深度: ' + data.Depth + 'km'
                                eqMessage.originTime = data.OriginTime
                                eqMessage.originTimeText = '時間: ' + data.OriginTime
                                eqMessage.magnitude = data.Magunitude
                                eqMessage.magnitudeText = '規模: ' + data.Magunitude.toFixed(1)
                                eqMessage.useShindo = true
                                eqMessage.maxIntensity = data.MaxIntensity
                                eqMessage.maxIntensityText = '預估最大震度: ' + data.MaxIntensity
                                break
                            case 1:
                                eqMessage.id = data.id
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.serial
                                eqMessage.reportNumText = '第' + data.serial + '報'
                                eqMessage.reportTime = stampToTime(data.time, 8)
                                eqMessage.isWarn = data.eq.max >= 5
                                eqMessage.isCanceled = false
                                eqMessage.titleText = '中央氣象署強震即時警報'
                                eqMessage.hypocenter = data.eq.loc
                                eqMessage.hypocenterText = '震央: ' + data.eq.loc
                                eqMessage.lat = data.eq.lat
                                eqMessage.lng = data.eq.lon
                                eqMessage.depth = data.eq.depth
                                eqMessage.depthText = '深度: ' + data.eq.depth + 'km'
                                eqMessage.originTime = stampToTime(data.eq.time, 8)
                                eqMessage.originTimeText = '時間: ' + eqMessage.originTime
                                eqMessage.magnitude = data.eq.mag
                                eqMessage.magnitudeText = '規模: ' + data.eq.mag.toFixed(1)
                                eqMessage.useShindo = true
                                eqMessage.maxIntensity = shindoScaleKanji[data.eq.max]
                                eqMessage.maxIntensityText = '預估最大震度: ' + eqMessage.maxIntensity
                                break
                        }
                        break
                    }
                    case 'ceaEew':{
                        switch(type) {
                            case 0:
                                eqMessage.id = data.EventID
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.ReportNum
                                eqMessage.reportNumText = '第' + data.ReportNum + '报'
                                eqMessage.reportTime = data.ReportTime || data.OriginTime
                                eqMessage.titleText = '中国地震局地震预警'
                                eqMessage.hypocenter = data.HypoCenter
                                eqMessage.hypocenterText = '震源: ' + data.HypoCenter
                                eqMessage.lat = data.Latitude
                                eqMessage.lng = data.Longitude
                                eqMessage.depth = data.Depth ?? 10
                                eqMessage.depthText = '深度: ' + (data.Depth == null ? '不明' : data.Depth + 'km')
                                eqMessage.originTime = data.OriginTime
                                eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                                eqMessage.magnitude = data.Magnitude
                                eqMessage.magnitudeText = '震级: ' + eqMessage.magnitude.toFixed(1)
                                eqMessage.maxIntensity = data.MaxIntensity ? data.MaxIntensity.toFixed(0) : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                                break
                            case 1:
                                eqMessage.id = data.eventId
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.updates
                                eqMessage.reportNumText = '第' + data.updates + '报'
                                eqMessage.reportTime = data.updateTime || data.shockTime
                                eqMessage.titleText = '中国地震局地震预警'
                                eqMessage.hypocenter = data.placeName
                                eqMessage.hypocenterText = '震源: ' + data.placeName
                                eqMessage.lat = data.latitude
                                eqMessage.lng = data.longitude
                                eqMessage.depth = data.depth ?? 10
                                eqMessage.depthText = '深度: ' + (data.depth == null ? '不明' : data.depth + 'km')
                                eqMessage.originTime = data.shockTime
                                eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                                eqMessage.magnitude = data.magnitude
                                eqMessage.magnitudeText = '震级: ' + eqMessage.magnitude.toFixed(1)
                                eqMessage.maxIntensity = data.epiIntensity ? data.epiIntensity.toFixed(0) : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                                break
                        }
                        break
                    }
                    case 'iclEew':{
                        switch(type) {
                            case 0: 
                                eqMessage.id = data.eventId
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.updates
                                eqMessage.reportNumText = '第' + data.updates + '报'
                                eqMessage.reportTime = stampToTime(data.updateAt, 8)
                                eqMessage.titleText = '成都高新减灾研究所地震预警'
                                eqMessage.hypocenter = data.epicenter
                                eqMessage.hypocenterText = '震源: ' + data.epicenter
                                eqMessage.lat = data.latitude
                                eqMessage.lng = data.longitude
                                eqMessage.depth = data.depth || 10
                                eqMessage.depthText = '深度: ' + (data.depth ? data.depth.toFixed(0) + 'km' : '不明')
                                eqMessage.originTime = stampToTime(data.startAt, 8)
                                eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                                eqMessage.magnitude = data.magnitude
                                eqMessage.magnitudeText = '震级: ' + data.magnitude.toFixed(1)
                                eqMessage.maxIntensity = data.epiIntensity ? data.epiIntensity.toFixed(0) : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                                break
                            case 1:
                                eqMessage.id = data.eventId
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.updates
                                eqMessage.reportNumText = '第' + data.updates + '报'
                                eqMessage.reportTime = data.updateTime
                                eqMessage.titleText = '成都高新减灾研究所地震预警'
                                eqMessage.hypocenter = data.placeName
                                eqMessage.hypocenterText = '震源: ' + data.placeName
                                eqMessage.lat = data.latitude
                                eqMessage.lng = data.longitude
                                eqMessage.depth = data.depth || 10
                                eqMessage.depthText = '深度: ' + (data.depth ? data.depth.toFixed(0) + 'km' : '不明')
                                eqMessage.originTime = data.shockTime
                                eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                                eqMessage.magnitude = data.magnitude
                                eqMessage.magnitudeText = '震级: ' + eqMessage.magnitude.toFixed(1)
                                eqMessage.maxIntensity = data.epiIntensity ? data.epiIntensity.toFixed(0) : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                                break
                        }
                        break
                    }
                    case 'scEew':{
                        switch(type) {
                            case 0:
                                eqMessage.id = data.EventID.split('_')[0]
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.ReportNum
                                eqMessage.reportNumText = '第' + data.ReportNum + '报'
                                eqMessage.reportTime = data.ReportTime
                                eqMessage.titleText = '四川地震局地震预警'
                                eqMessage.hypocenter = data.HypoCenter
                                eqMessage.hypocenterText = '震源: ' + data.HypoCenter
                                eqMessage.lat = data.Latitude
                                eqMessage.lng = data.Longitude
                                eqMessage.depth = data.Depth ?? 10
                                eqMessage.depthText = '深度: ' + (data.Depth == null ? '不明' : data.Depth + 'km')
                                eqMessage.originTime = data.OriginTime
                                eqMessage.originTimeText = '发震时间: ' + data.OriginTime
                                eqMessage.magnitude = data.Magunitude
                                eqMessage.magnitudeText = '震级: ' + data.Magunitude.toFixed(1)
                                eqMessage.maxIntensity = data.MaxIntensity ? data.MaxIntensity.toFixed(0) : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                                break
                            case 1:
                                eqMessage.id = data.eventId.split('_')[0]
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.updates
                                eqMessage.reportNumText = '第' + eqMessage.reportNum + '报'
                                eqMessage.reportTime = data.createTime
                                eqMessage.titleText = '四川地震局地震预警'
                                eqMessage.hypocenter = data.placeName
                                eqMessage.hypocenterText = '震源: ' + data.placeName
                                eqMessage.lat = data.latitude
                                eqMessage.lng = data.longitude
                                eqMessage.depth = 10
                                eqMessage.depthText = '深度: 不明'
                                eqMessage.originTime = data.shockTime
                                eqMessage.originTimeText = '发震时间: ' + data.shockTime
                                eqMessage.magnitude = data.magnitude
                                eqMessage.magnitudeText = '震级: ' + eqMessage.magnitude.toFixed(1)
                                eqMessage.maxIntensity = data.epiIntensity ? data.epiIntensity.toFixed(0) : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                                break
                        }
                        break
                    }
                    case 'fjEew':{
                        switch(type) {
                            case 0:
                                eqMessage.id = data.EventID.split('_')[0]
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.ReportNum
                                eqMessage.reportNumText = '第' + data.ReportNum + '报'
                                eqMessage.reportTime = data.ReportTime
                                eqMessage.titleText = '福建地震局地震预警'
                                eqMessage.hypocenter = data.HypoCenter
                                eqMessage.hypocenterText = '震源: ' + data.HypoCenter
                                eqMessage.lat = data.Latitude
                                eqMessage.lng = data.Longitude
                                eqMessage.depth = 10
                                eqMessage.depthText = '深度: 不明'
                                eqMessage.originTime = data.OriginTime
                                eqMessage.originTimeText = '发震时间: ' + data.OriginTime
                                eqMessage.magnitude = data.Magunitude
                                eqMessage.magnitudeText = '震级: ' + data.Magunitude.toFixed(1)
                                eqMessage.maxIntensity = calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 7.5
                                break
                            case 1:
                                eqMessage.id = data.eventId.split('_')[0]
                                eqMessage.isEew = true
                                eqMessage.reportNum = data.updates
                                eqMessage.reportNumText = '第' + eqMessage.reportNum + '报'
                                eqMessage.reportTime = data.sendtime.slice(0, 19)
                                eqMessage.titleText = '福建地震局地震预警'
                                eqMessage.hypocenter = data.placeName
                                eqMessage.hypocenterText = '震源: ' + data.placeName
                                eqMessage.lat = data.latitude
                                eqMessage.lng = data.longitude
                                eqMessage.depth = 10
                                eqMessage.depthText = '深度: 不明'
                                eqMessage.originTime = data.shockTime.slice(0, 19)
                                eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                                eqMessage.magnitude = data.magnitude
                                eqMessage.magnitudeText = '震级: ' + data.magnitude.toFixed(1)
                                eqMessage.maxIntensity = calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 7.5
                                break
                        }
                        break
                    }
                    case 'gqEew':{
                        const isNewEvent = eqMessage.id != data.Id
                        eqMessage.id = data.Id
                        eqMessage.type = data.Quality?.QualityLevel ?? 9
                        eqMessage.isEew = true
                        eqMessage.isCanceled = data.RevisionId < 0
                        if(!eqMessage.isCanceled || isNewEvent) {
                            eqMessage.reportNum = eqMessage.isCanceled ? Infinity : data.RevisionId
                            eqMessage.titleText = 'GlobalQuake地震预警'
                            eqMessage.lat = data.Latitude
                            eqMessage.lng = data.Longitude
                            eqMessage.depth = data.Depth
                            eqMessage.depthText = '深度: ' + (eqMessage.depth == null ? '不明' : eqMessage.depth.toFixed(0) + 'km')
                            let date = new Date(data.OriginTime)
                            date.setHours(date.getHours() + 8)
                            eqMessage.originTime = date.toISOString().replace('T', ' ').slice(0, -5)
                            eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                            eqMessage.magnitude = data.Magnitude
                            eqMessage.magnitudeText = '震级: ' + (eqMessage.magnitude == null ? '不明' : eqMessage.magnitude.toFixed(1))
                            eqMessage.maxIntensity = calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                            eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 7.5
                        }
                        if(eqMessage.isCanceled) {
                            let date = new Date()
                            date.setHours(date.getHours() + 8)
                            eqMessage.reportTime = date.toISOString().replace('T', ' ').slice(0, -5)
                            eqMessage.reportNumText = '取消报'
                            eqMessage.hypocenter = '已取消'
                            eqMessage.hypocenterText = '震源: 已取消'
                            eqMessage.maxIntensityText = '估计最大烈度: 无'
                        }
                        else{
                            let date = new Date(data.LastUpdatedTime)
                            date.setHours(date.getHours() + 8)
                            eqMessage.reportTime = date.toISOString().replace('T', ' ').slice(0, -5)
                            eqMessage.reportNumText = '第' + data.RevisionId + '报'
                            eqMessage.hypocenter = getFEName(data.Latitude, data.Longitude) || data.Region || '未知区域'
                            eqMessage.hypocenterText = '震源: ' + eqMessage.hypocenter
                            eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        }
                        break
                    }
                    case 'mockEew': {
                        Object.assign(eqMessage, data)
                        break
                    }
                    case 'jmaEqlist':{
                        const isNewEvent = eqMessage.id != data.earthquake.time.replace(/\//g, '-')
                        eqMessage.timeZone = 9
                        eqMessage.id = data.earthquake.time.replace(/\//g, '-')
                        eqMessage.useShindo = true
                        eqMessage.originTime = data.earthquake.time.replace(/\//g, '-')
                        eqMessage.originTimeText = '検知時刻: ' + data.earthquake.time.replace(/\//g, '-') + ' (JST)'
                        eqMessage.reportTime = data.issue.time.replace(/\//g, '-')
                        switch(data.issue.type) {
                            case 'ScalePrompt':
                                eqMessage.title = '震度速報'
                                eqMessage.titleText = '震度速報'
                                eqMessage.maxIntensity = getShindoFromInstShindo(data.earthquake.maxScale / 10, false)
                                eqMessage.maxIntensityText = '最大震度: ' + eqMessage.maxIntensity
                                eqMessage.warnArea = JSON.stringify(data.points.map(point => {
                                    const name = point.isArea ? point.addr : jmaSeisIntLoc[point.addr]?.sect
                                    const intensity = getShindoFromInstShindo(point.scale / 10, false)
                                    const className = setClassName(intensity, true)
                                    return {
                                        name,
                                        intensity,
                                        className
                                    }
                                }))
                                if(isNewEvent){
                                    eqMessage.hypocenter = ''
                                    eqMessage.hypocenterText = '震源地: 調査中'
                                    eqMessage.lat = null
                                    eqMessage.lng = null
                                    eqMessage.depth = -1
                                    eqMessage.depthText = '深さ: 調査中'
                                    eqMessage.magnitude = -1
                                    eqMessage.magnitudeText = 'マグニチュード: 調査中'
                                }
                                break
                            case 'Destination':
                                eqMessage.title = '震源に関する情報'
                                eqMessage.titleText = '震源に関する情報'
                                eqMessage.hypocenter = data.earthquake.hypocenter.name
                                eqMessage.hypocenterText = '震源地: ' + eqMessage.hypocenter
                                eqMessage.lat = data.earthquake.hypocenter.latitude
                                eqMessage.lng = data.earthquake.hypocenter.longitude
                                eqMessage.depth = data.earthquake.hypocenter.depth
                                eqMessage.depthText = '深さ: ' + (eqMessage.depth == 0 ? 'ごく浅い' : eqMessage.depth + 'km')
                                eqMessage.magnitude = data.earthquake.hypocenter.magnitude
                                eqMessage.magnitudeText = 'マグニチュード: ' + eqMessage.magnitude.toFixed(1)
                                if(isNewEvent){
                                    eqMessage.maxIntensity = '不明'
                                    eqMessage.maxIntensityText = '最大震度: 不明'
                                    eqMessage.warnArea = JSON.stringify(data.points.map(point => {
                                        const name = point.isArea ? point.addr : jmaSeisIntLoc[point.addr]?.sect
                                        const intensity = getShindoFromInstShindo(point.scale / 10, false)
                                        const className = setClassName(intensity, true)
                                        return {
                                            name,
                                            intensity,
                                            className
                                        }
                                    }))
                                }
                                break
                            default:
                                switch(data.issue.type) {
                                    case 'ScaleAndDestination':
                                        eqMessage.title = '震度・震源に関する情報'
                                        eqMessage.titleText = '震度・震源に関する情報'
                                        break
                                    case 'DetailScale':
                                        eqMessage.title = '各地の震度に関する情報'
                                        eqMessage.titleText = '各地の震度に関する情報'
                                        break
                                    case 'Foreign':
                                        eqMessage.title = '遠地地震に関する情報'
                                        eqMessage.titleText = '遠地地震に関する情報'
                                        break
                                    case 'Other':
                                        eqMessage.title = 'その他の情報'
                                        eqMessage.titleText = 'その他の情報'
                                        break
                                }
                                eqMessage.hypocenter = data.earthquake.hypocenter.name
                                eqMessage.hypocenterText = '震源地: ' + eqMessage.hypocenter
                                eqMessage.lat = data.earthquake.hypocenter.latitude
                                eqMessage.lng = data.earthquake.hypocenter.longitude
                                eqMessage.depth = data.earthquake.hypocenter.depth
                                eqMessage.depthText = '深さ: ' + (eqMessage.depth == -1 ? '不明' : eqMessage.depth == 0 ? 'ごく浅い' : eqMessage.depth + 'km')
                                eqMessage.magnitude = data.earthquake.hypocenter.magnitude
                                eqMessage.magnitudeText = 'マグニチュード: ' + (eqMessage.magnitude == -1 ? '不明' : eqMessage.magnitude.toFixed(1))
                                eqMessage.maxIntensity = data.earthquake.maxScale == -1 ? '不明' : getShindoFromInstShindo(data.earthquake.maxScale / 10, false)
                                eqMessage.maxIntensityText = '最大震度: ' + eqMessage.maxIntensity
                                eqMessage.warnArea = JSON.stringify(data.points.map(point => {
                                    const name = point.isArea ? point.addr : jmaSeisIntLoc[point.addr]?.sect
                                    const intensity = getShindoFromInstShindo(point.scale / 10, false)
                                    const className = setClassName(intensity, true)
                                    return {
                                        name,
                                        intensity,
                                        className
                                    }
                                }))
                                break
                        }
                        break
                    }
                    case 'cwaEqlist':{
                        eqMessage.id = data.id
                        eqMessage.reportTime = stampToTime(data.time + 300 * 1000, 8)
                        eqMessage.titleText = '中央氣象署地震報告'
                        const start = data.loc.indexOf('(位於')
                        const end = data.loc.indexOf(')')
                        eqMessage.hypocenter = start == -1 || end == -1 || start + 3 >= end ? data.loc : data.loc.slice(start + 3, end)
                        eqMessage.hypocenterText = '震央: ' + eqMessage.hypocenter
                        eqMessage.lat = data.lat
                        eqMessage.lng = data.lon
                        eqMessage.depth = data.depth
                        eqMessage.depthText = '深度: ' + data.depth.toFixed(0) + 'km'
                        eqMessage.originTime = stampToTime(data.time, 8)
                        eqMessage.originTimeText = '時間: ' + eqMessage.originTime
                        eqMessage.magnitude = data.mag
                        eqMessage.magnitudeText = '規模: ' + data.mag.toFixed(1)
                        eqMessage.useShindo = true
                        eqMessage.maxIntensity = shindoScaleKanji[data.int]
                        eqMessage.maxIntensityText = '最大震度: ' + eqMessage.maxIntensity
                        break
                    }
                    case 'cencEqlist':{
                        switch(type) {
                            case 0: 
                                eqMessage.id = data.No1.EventID
                                eqMessage.reportTime = data.No1.ReportTime
                                eqMessage.title = `中国地震台网${data.No1.type == 'reviewed' ? '正式' : '自动'}测定`
                                eqMessage.titleText = eqMessage.title
                                eqMessage.hypocenter = data.No1.placeName
                                eqMessage.hypocenterText = '震源: ' + data.No1.placeName
                                eqMessage.lat = Number(data.No1.latitude)
                                eqMessage.lng = Number(data.No1.longitude)
                                eqMessage.depth = Number(data.No1.depth)
                                eqMessage.depthText = '深度: ' + data.No1.depth + 'km'
                                eqMessage.originTime = data.No1.time
                                eqMessage.originTimeText = '发震时间: ' + data.No1.time
                                eqMessage.magnitude = Number(data.No1.magnitude)
                                eqMessage.magnitudeText = '震级: ' + data.No1.magnitude
                                eqMessage.maxIntensity = calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                break
                            case 1:
                                eqMessage.id = data.eventId
                                eqMessage.reportTime = data.createTime
                                const cedingIndex = data.infoTypeName.indexOf('测定')
                                eqMessage.title = `中国地震台网${data.infoTypeName.slice(cedingIndex - 2, cedingIndex)}测定`
                                eqMessage.titleText = eqMessage.title
                                eqMessage.hypocenter = data.placeName
                                eqMessage.hypocenterText = '震源: ' + data.placeName
                                eqMessage.lat = data.latitude
                                eqMessage.lng = data.longitude
                                eqMessage.depth = data.depth
                                eqMessage.depthText = '深度: ' + data.depth + 'km'
                                eqMessage.originTime = data.shockTime
                                eqMessage.originTimeText = '发震时间: ' + data.shockTime
                                eqMessage.magnitude = data.magnitude
                                eqMessage.magnitudeText = '震级: ' + data.magnitude.toFixed(1)
                                eqMessage.maxIntensity = calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                                eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                                break
                        }
                        break
                    }
                    case 'fssnEqlist': {
                        eqMessage.id = data.id
                        eqMessage.reportTime = data.createTime
                        let infoType
                        switch(data.infoTypeName) {
                            case '自动(未核实)':
                                infoType = '自动'
                                break
                            case '已确认':
                                infoType = '确认'
                                break
                            case '正式(已核实)':
                                infoType = '正式'
                                break
                            case '取消':
                                infoType = '取消'
                                break
                            default:
                                infoType = data.infoTypeName
                                break
                        }
                        eqMessage.isCanceled = infoType == '取消'
                        eqMessage.title = `FSSN地震测定（${infoType}）`
                        eqMessage.titleText = eqMessage.title
                        eqMessage.hypocenter = data.placeName_zh || data.placeName
                        eqMessage.hypocenterText = '震源: ' + eqMessage.hypocenter
                        eqMessage.lat = data.latitude
                        eqMessage.lng = data.longitude
                        eqMessage.depth = data.depth
                        eqMessage.depthText = '深度: ' + eqMessage.depth.toFixed(0) + 'km'
                        eqMessage.originTime = data.shockTime
                        eqMessage.originTimeText = '发震时间: ' + data.shockTime
                        eqMessage.magnitude = data.magnitude || -1
                        eqMessage.magnitudeText = '震级: ' + (eqMessage.magnitude == -1 ? '不明' : eqMessage.magnitude.toFixed(1))
                        eqMessage.maxIntensity = eqMessage.magnitude == -1 ? '不明' : calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0)
                        eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        break
                    }
                }
                eqMessage.className = setClassName(eqMessage.maxIntensity, eqMessage.useShindo, eqMessage.isCanceled)
            } catch(err) {
                console.log(err);
            }
        },
        setTsunamiMessage(source, data) {
            try{
                const tsunamiMessage = this.tsunamiMessage[source]
                tsunamiMessage.source = source
                switch(source){
                    case 'jmaTsunami': {
                        tsunamiMessage.id = data.issue.time.replace(/[^0-9]/g, '')
                        tsunamiMessage.timeZone = 9
                        tsunamiMessage.reportTime = data.issue.time.replace(/\//g, '-')
                        if(data.cancelled) {
                            tsunamiMessage.title = '津波警報・注意報なし'
                            tsunamiMessage.titleText = '津波警報・注意報なし'
                            tsunamiMessage.status = 0
                            tsunamiMessage.className = 'white'
                        }
                        else {
                            switch(data.areas[0].grade) {
                                case 'Watch':
                                    tsunamiMessage.title = '津波注意報'
                                    tsunamiMessage.titleText = '津波注意報発表中'
                                    tsunamiMessage.status = 1
                                    tsunamiMessage.className = 'yellow'
                                    break
                                case 'Warning':
                                    tsunamiMessage.title = '津波警報'
                                    tsunamiMessage.titleText = '津波警報発表中'
                                    tsunamiMessage.status = 2
                                    tsunamiMessage.className = 'red'
                                    break
                                case 'MajorWarning':
                                    tsunamiMessage.title = '大津波警報'
                                    tsunamiMessage.titleText = '大津波警報発表中'
                                    tsunamiMessage.status = 3
                                    tsunamiMessage.className = 'purple'
                                    break
                            }    
                        }
                        tsunamiMessage.warnArea = JSON.stringify(data.areas.map(item => {
                            let className = 'white'
                            switch(item.grade) {
                                case 'Watch':
                                    className = 'yellow'
                                    break
                                case 'Warning':
                                    className = 'red'
                                    break
                                case 'MajorWarning':
                                    className = 'purple'
                                    break
                            }
                            return {
                                name: item.name,
                                grade: item.grade,
                                height: item.maxHeight?.value,
                                description: item.maxHeight.description,
                                arrivalTime: item.firstHeight?.arrivalTime,
                                condition: item.firstHeight?.condition,
                                className
                            }
                        }))
                        this.isActive.jmaTsunami = !!tsunamiMessage.status
                        break
                    }
                    case 'nmefcTsunami': {
                        tsunamiMessage.id = data.timeInfo.updateDate.replace(/[^0-9]/g, '')
                        tsunamiMessage.reportTime = data.timeInfo.updateDate
                        switch(data.warningInfo.level) {
                            case '解除':
                                tsunamiMessage.title = '海啸预警已解除'
                                tsunamiMessage.titleText = '海啸预警已解除'
                                tsunamiMessage.status = 0
                                tsunamiMessage.className = 'white'
                                break        
                            case '黄色':
                                tsunamiMessage.title = '海啸注意报'
                                tsunamiMessage.titleText = '现正发布海啸注意报'
                                tsunamiMessage.status = 1
                                tsunamiMessage.className = 'yellow'
                                break
                            case '橙色':
                                tsunamiMessage.title = '海啸警报'
                                tsunamiMessage.titleText = '现正发布海啸警报'
                                tsunamiMessage.status = 2
                                tsunamiMessage.className = 'red'
                                break
                            case '红色':
                                tsunamiMessage.title = '大海啸警报'
                                tsunamiMessage.titleText = '现正发布大海啸警报'
                                tsunamiMessage.status = 3
                                tsunamiMessage.className = 'purple'
                                break
                        }    
                        tsunamiMessage.warnArea = JSON.stringify(data.forecasts.map(item => {
                            let className = 'white'
                            let height = 0
                            let description = ''
                            switch(item.warningLevel) {
                                case '黄色':
                                    className = 'yellow'
                                    height = 1
                                    description = '1m'
                                    break
                                case '橙色':
                                    className = 'red'
                                    height = 3
                                    description = '3m'
                                    break
                                case '红色':
                                    className = 'purple'
                                    height = 5
                                    description = '3m超'
                                    break
                            }
                            return {
                                name: item.forecastArea,
                                grade: item.warningLevel,
                                height,
                                description,
                                arrivalTime: item.estimatedArrivalTime,
                                className
                            }
                        }))
                        this.isActive.nmefcTsunami = !!tsunamiMessage.status
                        break
                    }
                }
            } catch(err) {
                console.log(err);
            }
        },
        connect(protocol){
            if(protocol == 'http'){
                clearInterval(this.httpRequest)
                this.httpRequest = setInterval(async () => {
                    const stamp = Date.now()
                    const status = Math.floor(stamp / 1000) % 10
                    const promises = this.enabledSource.map(async source=>{
                        if(source == 'jmaEqlist' && status % 2 == 0 && (!this.eqMessage[source].id || status == 0)) {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setEqMessage(source, data[0])
                        }
                        if(source == 'jmaTsunami' && status % 2 == 1 && (!this.tsunamiMessage[source].id || status == 1)) {
                            const data = await Http.get(tsunamiUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setTsunamiMessage(source, data[0])
                        }
                        if(source == 'cwaEqlist' && 'cwaEqlist_http' in eqUrls) {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setEqMessage(source, data[0])
                        }
                        if(source == 'jmaEew' && this.isTauri) {
                            const timeData = await Http.tauriGet(`${eqUrls.niedLatest}?time=${Date.now()}`)
                            if(timeData && timeData.result.status == 'success') {
                                const timeStr = timeData.latest_time.replace(/\D/g, '')
                                const data = await Http.tauriGet(`${eqUrls.jmaEew2_http}/${timeStr}.json`)
                                if(data && data.report_id) this.setEqMessage(source, data, 1)
                            }
                        }
                        if(this.multiApi) {
                            if(source == 'cwaEew' && 'cwaEew2_http' in eqUrls) {
                                const arr = await Http.get(`${eqUrls.cwaEew2_http}?time=${Date.now()}`)
                                if(arr && arr.length > 0) {
                                    const data = arr.find(item => item.author == 'cwa')
                                    if(data) this.setEqMessage(source, data, 1)
                                }
                            }
                            if(source == 'iclEew' && 'iclEew_http' in eqUrls) {
                                const data = await Http.get(eqUrls[source + '_http'] + `?time=${Date.now()}`)
                                if(data && Object.keys(data).length > 0) this.setEqMessage(source, data)
                            }
                        }
                    })
                    await Promise.all(promises)
                }, 1000);
            }
            else if(protocol == 'ws'){
                if(this.wolfxSocket) this.wolfxSocket.close()
                if(this.activeWolfxSource.length > 0) {
                    this.wolfxSocket = new WebSocketObj(eqUrls.wolfx_ws, this.activeWolfxSource.map(source => {
                        if(source == 'ceaEew') return 'query_cenceew'
                        else return `query_${source.toLowerCase()}`
                    }))
                    this.wolfxSocket.setMessageHandler((e)=>{
                        let data = JSON.parse(e.data)
                        if(data.type != 'heartbeat'){
                            const source = wolfx2Source[data.type]
                            if(source && this.activeWolfxSource.includes(source)) this.setEqMessage(source, data)
                        }
                    })
                }
                if(this.fanSocket) this.fanSocket.close()
                if(this.activeFanSource.length > 0) {
                    const settingsStore = useSettingsStore()
                    if(settingsStore.advancedSettings.provinceCeaEew) {
                        source2Fan['ceaEew'] = 'cea-pr'
                        fan2Source['cea'] = 'ceaEew'
                        fan2Source['cea-pr'] = 'ceaEew'
                    }
                    else {
                        source2Fan['ceaEew'] = 'cea'
                        fan2Source['cea'] = 'ceaEew'
                        delete fan2Source['cea-pr']
                    }
                    const initMsg = []
                    const token = settingsStore.advancedSettings.tokens.fan_dev
                    if(token) initMsg.push(`{"type":"auth","key":"${token}"}`)
                    this.fanSocket = new WebSocketObj(eqUrls.fan_ws, ['query'], initMsg)
                    this.fanSocket.setMessageHandler((e)=>{
                        let data = JSON.parse(e.data)
                        if(data.type == 'initial_all' || data.type == 'query_response') {
                            this.activeFanSource.forEach(source => {
                                const Data = data[source2Fan[source]]?.Data
                                if(Data)
                                    source.endsWith('Tsunami') ? this.setTsunamiMessage(source, Data) : this.setEqMessage(source, Data, 1)
                            })
                        }
                        else if(data.type == 'update'){
                            const source = fan2Source[data.source]
                            const Data = data?.Data
                            if(source && this.activeFanSource.includes(source) && Data)
                                source.endsWith('Tsunami') ? this.setTsunamiMessage(source, Data) : this.setEqMessage(source, Data, 1)
                        }
                    })
                }
                if(this.p2pquakeSocket) this.p2pquakeSocket.close()
                if(this.activeP2pquakeSource.length > 0) {
                    this.p2pquakeSocket = new WebSocketObj(eqUrls.p2pquake_ws, ['ping'])
                    this.p2pquakeSocket.setMessageHandler((e)=>{
                        let data = JSON.parse(e.data)
                        switch(data.code) {
                            case 551:
                                if(this.activeP2pquakeSource.includes('jmaEqlist')) this.setEqMessage('jmaEqlist', data)
                                break
                            case 552:
                                if(this.activeP2pquakeSource.includes('jmaTsunami')) this.setTsunamiMessage('jmaTsunami', data)
                                break
                        }
                    })
                }
                if(this.gqSocket) this.gqSocket.close()
                if(this.enabledSource.includes('gqEew') && 'gqEew_ws' in eqUrls) {
                    this.gqSocket = new WebSocketObj(eqUrls.gqEew_ws, ['ping'])
                    this.gqSocket.setMessageHandler((e)=>{
                        let data = JSON.parse(e.data)
                        if(data.RevisionId) this.setEqMessage('gqEew', data)
                    })
                }
            }
            else{
                console.log('Unrecognized protocol type.')
            }
        },
        disconnect(){
            clearInterval(this.httpRequest)
            if(this.wolfxSocket) this.wolfxSocket.close()
            if(this.fanSocket) this.fanSocket.close()
            if(this.p2pquakeSocket) this.p2pquakeSocket.close()
            if(this.gqSocket) this.gqSocket.close()
        },
        startUpdatingEqMessage(){
            this.connect('http')
            setTimeout(() => {
                this.connect('ws')
            }, 500);
        },
        setActive(source, isActive){
            this.isActive[source] = isActive
        }
    }
})
