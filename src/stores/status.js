import { defineStore } from 'pinia'
import Http from '@/classes/Http'
import WebSocketObj from '@/classes/WebSocket'
import { eqUrls } from '@/utils/Urls'
import { setClassName, calcCsisLevel, stampToTime } from '@/utils/Utils'

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
    className: '',
    info: '',
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
            iclEew: false,
            scEew: false,
            fjEew: false,
            jmaEqlist: false,
            cwaEqlist: false,
            cencEqlist: false,
            niedNet: false,
            tremNet: false
        },
        forceCalcCsis: false
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
                                    id: 0,
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
                    case 'iclEew':{
                        eqMessage.id = data.eventId
                        eqMessage.isEew = true
                        eqMessage.reportNum = data.updates
                        eqMessage.reportNumText = '第' + data.updates + '报'
                        eqMessage.reportTime = stampToTime(data.updateAt, 8)
                        eqMessage.titleText = 'ICL地震预警'
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
                        eqMessage.maxIntensity = data.epiIntensity?data.epiIntensity.toFixed(0):(this.forceCalcCsis?calcCsisLevel(data.magnitude, data.depth, 0):'不明')
                        eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        eqMessage.isWarn = Number(eqMessage.maxIntensity) >= 7
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
                        eqMessage.maxIntensity = this.forceCalcCsis?calcCsisLevel(data.Magunitude, 10, 0):'不明'
                        eqMessage.maxIntensityText = '估计最大烈度: ' + eqMessage.maxIntensity
                        break
                    }
                    case 'jmaEqlist':{
                        const isNewEvent = eqMessage.id != data.No1.EventID
                        eqMessage.id = data.No1.EventID
                        eqMessage.title = data.No1.Title
                        eqMessage.titleText = '日本気象庁' + data.No1.Title
                        eqMessage.useShindo = true
                        eqMessage.originTime = data.No1.time_full
                        eqMessage.originTimeText = '検知時刻: ' + data.No1.time_full + ' (JST)'
                        eqMessage.info = data.No1.info
                        switch(data.No1.Title){
                            case '震度速報':{
                                eqMessage.maxIntensity = data.No1.shindo
                                eqMessage.maxIntensityText = '最大震度: ' + data.No1.shindo
                                if(isNewEvent){
                                    eqMessage.hypocenter = data.No1.location
                                    eqMessage.hypocenterText = '震源地: 調査中'
                                    eqMessage.lat = Number(data.No1.latitude)
                                    eqMessage.lng = Number(data.No1.longitude)
                                    eqMessage.depth = Number(data.No1.depth.replace('km', ''))
                                    eqMessage.depthText = '深さ: 調査中'
                                    eqMessage.magnitude = Number(data.No1.magnitude)
                                    eqMessage.magnitudeText = 'マグニチュード: 調査中'
                                }
                                break
                            }
                            case '震源に関する情報':{
                                eqMessage.hypocenter = data.No1.location
                                eqMessage.hypocenterText = '震源地: ' + data.No1.location
                                eqMessage.lat = Number(data.No1.latitude)
                                eqMessage.lng = Number(data.No1.longitude)
                                eqMessage.depth = Number(data.No1.depth.replace('km', ''))
                                eqMessage.depthText = '深さ: ' + (data.No1.depth == '0km'?'ごく浅い':data.No1.depth)
                                eqMessage.magnitude = Number(data.No1.magnitude)
                                eqMessage.magnitudeText = 'マグニチュード: ' + data.No1.magnitude
                                if(isNewEvent){
                                    eqMessage.maxIntensity = data.No1.shindo
                                    eqMessage.maxIntensityText = '最大震度: ' + data.No1.shindo
                                }
                                break
                            }
                            default:{
                                eqMessage.hypocenter = data.No1.location
                                eqMessage.hypocenterText = '震源地: ' + data.No1.location
                                eqMessage.lat = Number(data.No1.latitude)
                                eqMessage.lng = Number(data.No1.longitude)
                                eqMessage.depth = Number(data.No1.depth.replace('km', ''))
                                eqMessage.depthText = '深さ: ' + (data.No1.depth == '0km'?'ごく浅い':data.No1.depth)
                                eqMessage.magnitude = Number(data.No1.magnitude)
                                eqMessage.magnitudeText = 'マグニチュード: ' + data.No1.magnitude
                                eqMessage.maxIntensity = data.No1.shindo
                                eqMessage.maxIntensityText = '最大震度: ' + data.No1.shindo
                                break
                            }
                        }
                        break
                    }
                    case 'cwaEqlist':{
                        eqMessage.id = data[0].id
                        eqMessage.titleText = '中央氣象署地震報告'
                        eqMessage.hypocenter = data[0].loc.split(' ').slice(-1)[0].slice(3, -1)
                        eqMessage.hypocenterText = '震央: ' + eqMessage.hypocenter
                        eqMessage.lat = data[0].lat
                        eqMessage.lng = data[0].lon
                        eqMessage.depth = data[0].depth
                        eqMessage.depthText = '深度: ' + data[0].depth + 'km'
                        eqMessage.originTime = stampToTime(data[0].time, 8)
                        eqMessage.originTimeText = '時間: ' + eqMessage.originTime
                        eqMessage.magnitude = data[0].mag
                        eqMessage.magnitudeText = '規模: ' + data[0].mag.toFixed(1)
                        eqMessage.useShindo = true
                        eqMessage.maxIntensity = shindoScale[data[0].int]
                        eqMessage.maxIntensityText = '最大震度: ' + shindoScale[data[0].int]
                        break
                    }
                    case 'cencEqlist':{
                        eqMessage.id = data.No1.EventID
                        eqMessage.reportTime = data.No1.ReportTime
                        eqMessage.title = data.No1.type
                        eqMessage.titleText = '中国地震台网' + (data.No1.type == 'reviewed'?'正式':'自动') + '测定'
                        eqMessage.hypocenter = data.No1.location
                        eqMessage.hypocenterText = '震源: ' + data.No1.location
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
                        if((source != 'iclEew' && source != 'cwaEqlist' && this.allEewSocketObj?.socket.readyState != 1) || 
                           (source == 'iclEew' && 'iclEew_http' in eqUrls) || 
                           (source == 'cwaEqlist')){
                            const data = await Http.get(eqUrls[source + '_http'] + `?t=${Date.now()}`)
                            this.setEqMessage(source, data)
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
                    else{
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
