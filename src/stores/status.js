import { defineStore } from 'pinia'
import Http from '@/classes/Http'
import WebSocketObj from '@/classes/WebSocket'
import { eqUrls, tsunamiUrls } from '@/utils/Urls'
import { setClassName, calcCsisLevel, stampToTime, getShindoFromInstShindo, shindoScaleKanji } from '@/utils/Utils'
import { jmaSeisIntLoc } from '@/utils/JmaSeisIntLoc'

export const defaultEqMessage = {
    source: '',
    type: 0,
    id: '',
    isEew: false,
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
    reportTime: '',
    title: '',
    titleText: '',
    status: 0,
    warnArea: '[]',
    className: ''
}

export const useStatusStore = defineStore('statusStore', {
    state: ()=>({
        map: null,
        httpRequest: null,
        wolfxSocket: null,
        p2pquakeSocket: null,
        gqSocket: null,
        useWolfxSocket: ['jmaEew', 'cwaEew', 'scEew', 'fjEew', 'cencEqlist'],
        useP2pquakeSocket: ['jmaEqlist', 'jmaTsunami'],
        enabledSource: [],
        multiApi: false,
        forceCalcInt: false,
        eqMessage: {
            jmaEew: Object.assign({}, defaultEqMessage),
            cwaEew: Object.assign({}, defaultEqMessage),
            ceaEew: Object.assign({}, defaultEqMessage),
            iclEew: Object.assign({}, defaultEqMessage),
            scEew: Object.assign({}, defaultEqMessage),
            fjEew: Object.assign({}, defaultEqMessage),
            gqEew: Object.assign({}, defaultEqMessage),
            jmaEqlist: Object.assign({}, defaultEqMessage),
            cwaEqlist: Object.assign({}, defaultEqMessage),
            cencEqlist: Object.assign({}, defaultEqMessage)
        },
        tsunamiMessage: {
            jmaTsunami: Object.assign({}, defaultTsunamiMessage)
        },
        isActive: {
            jmaEew: false,
            cwaEew: false,
            ceaEew: false,
            iclEew: false,
            scEew: false,
            fjEew: false,
            gqEew: false,
            jmaEqlist: false,
            cwaEqlist: false,
            cencEqlist: false,
            niedNet: false,
            tremNet: false,
            jmaTsunami: false
        }
    }),
    getters: {
        
    },
    actions: {
        setEqMessage(source, data, type = 0) {
            try{
                const eqMessage = this.eqMessage[source]
                eqMessage.source = source
                eqMessage.type = type
                switch(source){
                    case 'jmaEew':{
                        switch(type) {
                            case 0:
                                eqMessage.id = data.EventID
                                eqMessage.isEew = true
                                eqMessage.isCanceled = data.isCancel
                                eqMessage.useShindo = true
                                eqMessage.reportNum = data.Serial
                                eqMessage.reportTime = data.AnnouncedTime.replace(/\//g, '-')
                                eqMessage.isAssumption = data.isAssumption
                                eqMessage.isWarn = data.isWarn
                                eqMessage.isFinal = data.isFinal
                                eqMessage.title = data.Title
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
                                    eqMessage.reportNumText = '第' + data.Serial + '報' + '（キャンセル）'
                                    eqMessage.titleText = '緊急地震速報（取消）'
                                    eqMessage.hypocenter = '取り消されました'
                                    eqMessage.hypocenterText = '震源地: 取り消されました'
                                    eqMessage.maxIntensityText = '推定最大震度: なし'
                                    eqMessage.warnArea = ''
                                }
                                else{
                                    eqMessage.reportNumText = '第' + data.Serial + '報' + (data.isFinal?'（最終）':'')
                                    eqMessage.titleText = data.Title
                                    eqMessage.hypocenter = data.Hypocenter
                                    eqMessage.hypocenterText = '震源地: ' + data.Hypocenter
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
                            case 1:
                                eqMessage.id = data.report_id
                                eqMessage.isEew = true
                                eqMessage.isCanceled = data.is_cancel
                                eqMessage.useShindo = true
                                eqMessage.reportNum = Number(data.report_num)
                                eqMessage.reportTime = data.report_time.replace(/\//g, '-')
                                eqMessage.isAssumption = false
                                eqMessage.isWarn = data.alertflg == '警報'
                                eqMessage.isFinal = data.is_final
                                eqMessage.title = `緊急地震速報（${data.alertflg}）`
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
                                    eqMessage.reportNumText = '第' + data.report_num + '報' + '（キャンセル）'
                                    eqMessage.titleText = '緊急地震速報（取消）'
                                    eqMessage.hypocenter = '取り消されました'
                                    eqMessage.hypocenterText = '震源地: 取り消されました'
                                    eqMessage.maxIntensityText = '推定最大震度: なし'
                                    eqMessage.warnArea = '[]'
                                }
                                else{
                                    eqMessage.reportNumText = '第' + data.report_num + '報' + (data.is_final?'（最終）':'')
                                    eqMessage.titleText = `緊急地震速報（${data.alertflg}）`
                                    eqMessage.hypocenter = data.region_name
                                    eqMessage.hypocenterText = '震源地: ' + data.region_name
                                    eqMessage.maxIntensityText = '推定最大震度: ' + data.calcintensity
                                    eqMessage.warnArea = '[]'
                                }
                                break
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
                                eqMessage.titleText = '中央氣象署地震速報' + (data.isCancel?'（取消）':'')
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
                                eqMessage.titleText = '中央氣象署地震速報'
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
                        eqMessage.id = data.eventId
                        eqMessage.isEew = true
                        eqMessage.reportNum = data.updates
                        eqMessage.reportNumText = '第' + data.updates + '报'
                        eqMessage.reportTime = data.updateTime
                        eqMessage.titleText = '中国地震局地震预警'
                        eqMessage.hypocenter = data.placeName
                        eqMessage.hypocenterText = '震源: ' + data.placeName
                        eqMessage.lat = data.latitude
                        eqMessage.lng = data.longitude
                        eqMessage.depth = data.depth ?? 10
                        eqMessage.depthText = '深度: ' + (data.depth == null ? '不明' : data.depth + 'km')
                        eqMessage.originTime = data.shockTime
                        eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                        eqMessage.magnitude = Number(data.magnitude)
                        eqMessage.magnitudeText = '震级: ' + eqMessage.magnitude.toFixed(1)
                        eqMessage.maxIntensity = data.epiIntensity.toFixed(0)
                        eqMessage.maxIntensityText = '估计最大烈度: ' + data.epiIntensity.toFixed(0)
                        eqMessage.isWarn = data.epiIntensity >= 6.5
                        break
                    }
                    case 'iclEew':{
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
                        eqMessage.depth = data.depth
                        eqMessage.depthText = '深度: ' + data.depth.toFixed(0) + 'km'
                        eqMessage.originTime = stampToTime(data.startAt, 8)
                        eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                        eqMessage.magnitude = data.magnitude
                        eqMessage.magnitudeText = '震级: ' + data.magnitude.toFixed(1)
                        eqMessage.maxIntensity = data.epiIntensity?data.epiIntensity.toFixed(0):(this.forceCalcInt?calcCsisLevel(data.magnitude, data.depth, 0):'不明')
                        eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 6.5
                        break
                    }
                    case 'scEew':{
                        eqMessage.id = data.EventID.split('_')[0]
                        eqMessage.isEew = true
                        eqMessage.reportNum = data.ReportNum
                        eqMessage.reportNumText = '第' + data.ReportNum + '报'
                        eqMessage.reportTime = data.ReportTime
                        eqMessage.isWarn = data.MaxIntensity >= 6.5
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
                        eqMessage.maxIntensity = data.MaxIntensity.toFixed(0)
                        eqMessage.maxIntensityText = '估计最大烈度: ' + data.MaxIntensity.toFixed(0)
                        break
                    }
                    case 'fjEew':{
                        eqMessage.id = data.EventID.split('_')[0]
                        eqMessage.isEew = true
                        eqMessage.reportNum = data.ReportNum
                        eqMessage.reportNumText = '第' + data.ReportNum + '报' + (data.isFinal?'（最终）':'')
                        eqMessage.reportTime = data.ReportTime
                        eqMessage.isFinal = data.isFinal
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
                        eqMessage.maxIntensity = this.forceCalcInt?calcCsisLevel(data.Magunitude, 10, 0):'不明'
                        eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 7.5
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
                            let date = new Date(data.LastUpdatedTime)
                            date.setHours(date.getHours() + 8)
                            eqMessage.reportTime = date.toISOString().replace('T', ' ').slice(0, -5)
                            eqMessage.titleText = 'GlobalQuake地震预警'
                            eqMessage.lat = data.Latitude
                            eqMessage.lng = data.Longitude
                            eqMessage.depth = data.Depth
                            eqMessage.depthText = '深度: ' + (eqMessage.depth == null ? '不明' : eqMessage.depth.toFixed(0) + 'km')
                            date = new Date(data.OriginTime)
                            date.setHours(date.getHours() + 8)
                            eqMessage.originTime = date.toISOString().replace('T', ' ').slice(0, -5)
                            eqMessage.originTimeText = '发震时间: ' + eqMessage.originTime
                            eqMessage.magnitude = data.Magnitude
                            eqMessage.magnitudeText = '震级: ' + (eqMessage.magnitude == null ? '不明' : eqMessage.magnitude.toFixed(1))
                            eqMessage.maxIntensity = this.forceCalcInt ? calcCsisLevel(eqMessage.magnitude, eqMessage.depth, 0) : '不明'
                            eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 7.5
                        }
                        if(eqMessage.isCanceled) {
                            eqMessage.reportNumText = '取消报'
                            eqMessage.hypocenter = '已取消'
                            eqMessage.hypocenterText = '震源: 已取消'
                            eqMessage.maxIntensityText = '估计最大烈度: 无'
                        }
                        else{
                            eqMessage.reportNumText = '第' + data.RevisionId + '报'
                            eqMessage.hypocenter = data.Region.split(',')[0] || '未知区域'
                            eqMessage.hypocenterText = '震源: ' + eqMessage.hypocenter
                            eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        }
                        break
                    }
                    case 'jmaEqlist':{
                        const isNewEvent = eqMessage.id != data.earthquake.time.replace(/\//g, '-')
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
                                    eqMessage.maxIntensity = '?'
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
                                eqMessage.maxIntensity = data.earthquake.maxScale == -1 ? '?' : getShindoFromInstShindo(data.earthquake.maxScale / 10, false)
                                eqMessage.maxIntensityText = '最大震度: ' + (data.earthquake.maxScale == -1 ? '不明' : eqMessage.maxIntensity)
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
                        eqMessage.titleText = '中央氣象署地震報告'
                        eqMessage.hypocenter = data.loc.split(' ').slice(-1)[0].slice(3, -1)
                        eqMessage.hypocenterText = '震央: ' + eqMessage.hypocenter
                        eqMessage.lat = data.lat
                        eqMessage.lng = data.lon
                        eqMessage.depth = data.depth
                        eqMessage.depthText = '深度: ' + data.depth + 'km'
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
                        eqMessage.id = data.No1.EventID
                        eqMessage.reportTime = data.No1.ReportTime
                        eqMessage.title = data.No1.type
                        eqMessage.titleText = '中国地震台网' + (data.No1.type == 'reviewed'?'正式':'自动') + '测定'
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
                        eqMessage.maxIntensity = data.No1.intensity
                        eqMessage.maxIntensityText = '估计最大烈度: ' + data.No1.intensity
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
                        tsunamiMessage.id = data.id
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
                }
            } catch(err) {
                console.log(err);
            }
        },
        connect(protocol){
            if(protocol == 'http'){
                clearInterval(this.httpRequest)
                this.httpRequest = setInterval(async () => {
                    const status = Date.now() % 2000 < 1000
                    const promises = this.enabledSource.map(async source=>{
                        if((this.useWolfxSocket.includes(source) && (this.wolfxSocket?.socket.readyState != 1 || !this.eqMessage[source].id)) || 
                            (source == 'iclEew' && 'iclEew_http' in eqUrls)) {
                            const data = await Http.get(eqUrls[source + '_http'] + `?time=${Date.now()}`)
                            if(data && Object.keys(data).length > 0) this.setEqMessage(source, data)
                        }
                        else if(source == 'jmaEqlist' && (this.p2pquakeSocket?.socket.readyState != 1 || !this.eqMessage[source].id) && status) {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setEqMessage(source, data[0])
                        }
                        else if(source == 'jmaTsunami' && (this.p2pquakeSocket?.socket.readyState != 1 || !this.tsunamiMessage[source].id) && !status) {
                            const data = await Http.get(tsunamiUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setTsunamiMessage(source, data[0])
                        }
                        else if(source == 'cwaEqlist' && 'cwaEqlist_http' in eqUrls) {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setEqMessage(source, data[0])
                        }
                        else if(source == 'ceaEew' && 'ceaEew_http' in eqUrls) {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.Data) this.setEqMessage(source, data.Data)
                        }
                        if(this.multiApi) {
                            if(source == 'jmaEew' && 'jmaEew2_http' in eqUrls && 'niedLatest' in eqUrls) {
                                const timeData = await Http.get(`${eqUrls.niedLatest}?time=${Date.now()}`)
                                if(timeData && timeData.result.status == 'success') {
                                    const timeStr = timeData.latest_time.replace(/\D/g, '')
                                    const data = await Http.get(`${eqUrls.jmaEew2_http}?time=${timeStr}`)
                                    if(data && data.report_id) this.setEqMessage(source, data, 1)
                                }
                            }
                            if(source == 'cwaEew' && 'cwaEew2_http' in eqUrls) {
                                const arr = await Http.get(`${eqUrls.cwaEew2_http}?time=${Date.now()}`)
                                if(arr && arr.length > 0) {
                                    const data = arr.find(item => item.author == 'cwa')
                                    if(data) this.setEqMessage(source, data, 1)
                                }
                            }
                        }
                    })
                    await Promise.all(promises)
                }, 1000);
            }
            else if(protocol == 'ws'){
                if(this.wolfxSocket) this.wolfxSocket.close()
                if(this.useWolfxSocket.some(source => this.enabledSource.includes(source))) {
                    this.wolfxSocket = new WebSocketObj(eqUrls.wolfx_ws)
                    this.wolfxSocket.setMessageHandler((e)=>{
                        let data = JSON.parse(e.data)
                        if(data.type == 'heartbeat'){
                            this.wolfxSocket.ping()
                        }
                        else if(data.type == 'pong'){
                            // console.log('pong', props.source);
                        }
                        else if(data.type != 'jma_eqlist'){
                            const splitType = data.type.split('_')
                            const source = splitType[0] + splitType[1][0].toUpperCase() + splitType[1].slice(1)
                            if(this.enabledSource.includes(source)) this.setEqMessage(source, data)
                        }
                    })
                }
                if(this.p2pquakeSocket) this.p2pquakeSocket.close()
                if(this.useP2pquakeSocket.some(source => this.enabledSource.includes(source))) {
                    this.p2pquakeSocket = new WebSocketObj(eqUrls.p2pquake_ws)
                    this.p2pquakeSocket.setMessageHandler((e)=>{
                        let data = JSON.parse(e.data)
                        switch(data.code) {
                            case 551:
                                if(this.enabledSource.includes('jmaEqlist')) this.setEqMessage('jmaEqlist', data)
                                break
                            case 552:
                                if(this.enabledSource.includes('jmaTsunami')) this.setTsunamiMessage('jmaTsunami', data)
                                break
                        }
                    })
                }
                if(this.gqSocket) this.gqSocket.close()
                if(this.enabledSource.includes('gqEew') && 'gqEew_ws' in eqUrls) {
                    this.gqSocket = new WebSocketObj(eqUrls.gqEew_ws, true)
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
            if(this.p2pquakeSocket) this.p2pquakeSocket.close()
            if(this.gqSocket) this.gqSocket.close()
        },
        startUpdatingEqMessage(){
            this.connect('http')
            setTimeout(() => {
                this.connect('ws')
            }, 1000);
        },
        setActive(source, isActive){
            this.isActive[source] = isActive
        }
    }
})
