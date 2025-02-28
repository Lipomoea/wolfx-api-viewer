import { defineStore } from 'pinia'
import Http from '@/classes/Http'
import WebSocketObj from '@/classes/WebSocket'
import { eqUrls } from '@/utils/Urls'
import { setClassName, calcCsisLevel, stampToTime, formatChineseTaiwan, getShindoFromInstShindo } from '@/utils/Utils'

const defaultEqMessage = {
    source: '',
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
    warnArea: '',
    className: ''
}

const shindoScale = ['0', '1', '2', '3', '4', '5-', '5+', '6-', '6+', '7']

export const useStatusStore = defineStore('statusStore', {
    state: ()=>({
        map: null,
        httpRequest: null,
        allEewSocketObj: null,
        enabledSource: [],
        eqMessage: {
            jmaEew: Object.assign({}, defaultEqMessage),
            cwaEew: Object.assign({}, defaultEqMessage),
            ceaEew: Object.assign({}, defaultEqMessage),
            iclEew: Object.assign({}, defaultEqMessage),
            scEew: Object.assign({}, defaultEqMessage),
            fjEew: Object.assign({}, defaultEqMessage),
            jmaEqlist: Object.assign({}, defaultEqMessage),
            cwaEqlist: Object.assign({}, defaultEqMessage),
            cencEqlist: Object.assign({}, defaultEqMessage)
        },
        isActive: {
            jmaEew: false,
            cwaEew: false,
            ceaEew: false,
            iclEew: false,
            scEew: false,
            fjEew: false,
            jmaEqlist: false,
            cwaEqlist: false,
            cencEqlist: false,
            niedNet: false,
            tremNet: false
        },
        forceCalcInt: false
    }),
    getters: {
        
    },
    actions: {
        setEqMessage(source, data){
            try{
                const eqMessage = this.eqMessage[source]
                eqMessage.source = source
                switch(source){
                    case 'jmaEew':{
                        eqMessage.id = data.EventID
                        eqMessage.isEew = true
                        eqMessage.isCanceled = data.isCancel
                        eqMessage.useShindo = true
                        if(data.isCancel){
                            eqMessage.reportNum = data.Serial
                            eqMessage.reportNumText = 'キャンセル報'
                            eqMessage.reportTime = data.AnnouncedTime
                            eqMessage.isAssumption = data.isAssumption
                            eqMessage.isWarn = data.isWarn
                            eqMessage.isFinal = data.isFinal
                            eqMessage.title = data.Title
                            eqMessage.titleText = '緊急地震速報（取消）'
                            eqMessage.hypocenter = '取り消されました'
                            eqMessage.hypocenterText = '震源地: 取り消されました'
                            eqMessage.lat = data.Latitude
                            eqMessage.lng = data.Longitude
                            eqMessage.depth = data.Depth
                            eqMessage.depthText = '深さ: ' + data.Depth + 'km'
                            eqMessage.originTime = data.OriginTime
                            eqMessage.originTimeText = '発震時刻: ' + data.OriginTime + ' (JST)'
                            eqMessage.magnitude = data.Magunitude
                            eqMessage.magnitudeText = 'マグニチュード: ' + data.Magunitude.toFixed(1)
                            eqMessage.maxIntensity = data.MaxIntensity
                            eqMessage.maxIntensityText = '推定最大震度: なし'
                            eqMessage.warnArea = ''
                        }
                        else{
                            eqMessage.reportNum = data.Serial
                            eqMessage.reportNumText = '第' + data.Serial + '報' + (data.isFinal?'（最終）':'')
                            eqMessage.reportTime = data.AnnouncedTime
                            eqMessage.isAssumption = data.isAssumption
                            eqMessage.isWarn = data.isWarn
                            eqMessage.isFinal = data.isFinal
                            eqMessage.title = data.Title
                            eqMessage.titleText = data.Title
                            eqMessage.hypocenter = data.Hypocenter
                            eqMessage.hypocenterText = '震源地: ' + data.Hypocenter
                            eqMessage.lat = data.Latitude
                            eqMessage.lng = data.Longitude
                            eqMessage.depth = data.Depth
                            eqMessage.depthText = '深さ: ' + data.Depth + 'km'
                            eqMessage.originTime = data.OriginTime
                            eqMessage.originTimeText = '発震時刻: ' + data.OriginTime + ' (JST)'
                            eqMessage.magnitude = data.Magunitude
                            eqMessage.magnitudeText = 'マグニチュード: ' + data.Magunitude.toFixed(1)
                            eqMessage.maxIntensity = data.MaxIntensity
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
                    case 'cwaEew':{
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
                        eqMessage.depth = data.depth === null ? 10 : data.depth
                        eqMessage.depthText = '深度: ' + (data.depth === null ? '不明' : data.depth + 'km')
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
                        eqMessage.depthText = '深度: ' + data.depth.toFixed(1) + 'km'
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
                        eqMessage.depth = data.Depth === null?10:data.Depth
                        eqMessage.depthText = '深度: ' + (data.Depth === null?'不明':data.Depth + 'km')
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
                        break
                    }
                    case 'jmaEqlist':{
                        const isNewEvent = eqMessage.id != data.earthquake.time
                        eqMessage.id = data.earthquake.time
                        eqMessage.useShindo = true
                        eqMessage.originTime = data.earthquake.time
                        eqMessage.originTimeText = '検知時刻: ' + data.earthquake.time + ' (JST)'
                        eqMessage.reportTime = data.time.slice(0, -4)
                        switch(data.issue.type) {
                            case 'ScalePrompt':
                                eqMessage.title = '震度速報'
                                eqMessage.titleText = '震度速報'
                                eqMessage.maxIntensity = getShindoFromInstShindo(data.earthquake.maxScale / 10, false)
                                eqMessage.maxIntensityText = '最大震度: ' + eqMessage.maxIntensity
                                eqMessage.warnArea = JSON.stringify(data.points)
                                if(isNewEvent){
                                    eqMessage.hypocenter = data.earthquake.hypocenter.name
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
                                    eqMessage.maxIntensity = getShindoFromInstShindo(data.earthquake.maxScale / 10, false)
                                    eqMessage.maxIntensityText = '最大震度: ' + eqMessage.maxIntensity
                                    eqMessage.warnArea = JSON.stringify(data.points)
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
                                eqMessage.depthText = '深さ: ' + (eqMessage.depth == 0 ? 'ごく浅い' : eqMessage.depth + 'km')
                                eqMessage.magnitude = data.earthquake.hypocenter.magnitude
                                eqMessage.magnitudeText = 'マグニチュード: ' + eqMessage.magnitude.toFixed(1)
                                eqMessage.maxIntensity = getShindoFromInstShindo(data.earthquake.maxScale / 10, false)
                                eqMessage.maxIntensityText = '最大震度: ' + eqMessage.maxIntensity
                                eqMessage.warnArea = JSON.stringify(data.points)
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
                        eqMessage.maxIntensity = shindoScale[data.int]
                        eqMessage.maxIntensityText = '最大震度: ' + shindoScale[data.int]
                        break
                    }
                    case 'cencEqlist':{
                        eqMessage.id = data.No1.EventID
                        eqMessage.reportTime = data.No1.ReportTime
                        eqMessage.title = data.No1.type
                        eqMessage.titleText = '中国地震台网' + (data.No1.type == 'reviewed'?'正式':'自动') + '测定'
                        eqMessage.hypocenter = formatChineseTaiwan(data.No1.location)
                        eqMessage.hypocenterText = '震源: ' + formatChineseTaiwan(data.No1.location)
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
        connect(protocol){
            if(protocol == 'http'){
                clearInterval(this.httpRequest)
                this.httpRequest = setInterval(async () => {
                    const promises = this.enabledSource.map(async source=>{
                        if((source != 'ceaEew' && source != 'iclEew' && source != 'cwaEqlist' && source != 'jmaEqlist' && this.allEewSocketObj?.socket.readyState != 1) || 
                           (source == 'iclEew' && 'iclEew_http' in eqUrls)) {
                            const data = await Http.get(eqUrls[source + '_http'] + `?time=${Date.now()}`)
                            if(data && Object.keys(data).length > 0) this.setEqMessage(source, data)
                        }
                        else if(source == 'ceaEew' && 'ceaEew_http' in eqUrls) {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.Data) this.setEqMessage(source, data.Data)
                        }
                        else if(source == 'jmaEqlist' || source == 'cwaEqlist') {
                            const data = await Http.get(eqUrls[source + '_http'] + `&time=${Date.now()}`)
                            if(data && data.length > 0) this.setEqMessage(source, data[0])
                        }
                    })
                    await Promise.all(promises)
                }, 1000);
            }
            else if(protocol == 'ws'){
                if(this.allEewSocketObj) this.allEewSocketObj.close()
                this.allEewSocketObj = new WebSocketObj(eqUrls.allEew_ws)
                this.allEewSocketObj.setMessageHandler((e)=>{
                    let data = JSON.parse(e.data)
                    if(data.type == 'heartbeat'){
                        this.allEewSocketObj.ping()
                    }
                    else if(data.type == 'pong'){
                        // console.log('pong', props.source);
                    }
                    else if(data.type != 'jma_eqlist'){
                        const splitType = data.type.split('_')
                        const source = splitType[0] + splitType[1][0].toUpperCase() + splitType[1].slice(1)
                        this.setEqMessage(source, data)
                    }
                })
            }
            else{
                console.log('Unrecognized protocol type.')
            }
        },
        disconnect(){
            clearInterval(this.httpRequest)
            if(this.allEewSocketObj) this.allEewSocketObj.close()
        },
        startUpdatingEqMessage(){
            this.connect('http')
            setTimeout(() => {
                this.connect('ws')
            }, 3000);
        },
        setActive(source, isActive){
            this.isActive[source] = isActive
        }
    }
})
