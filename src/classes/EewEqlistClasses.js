import { calcPassedTime, calcWaveDistance, calcReachTime, playSound, sendNotification, getClassLevel } from '@/utils/Utils';
import travelTimes from '@/utils/TravelTimes';
import { iconUrls, chimeUrls } from '@/utils/Urls';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSettingsStore } from '@/stores/settings';

const eewCrossIcon = `
<svg t="1724073690966" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1465" width="40" height="40">
<path d="M960 170.56L869.44 80 512 437.44 154.56 80 64 170.56 421.44 528 64 885.44l90.56 90.56L512 618.56 869.44 976 960 885.44 602.56 528 960 170.56z" p-id="1466" fill="#e21d1d" stroke="#ffffff" stroke-width="32"></path>
</svg>
`
const eewCrossDivIcon = L.divIcon({
    html: eewCrossIcon,
    iconAnchor: [20, 20],
    className: '',
})
const eqlistCrossIcon = `
<svg t="1724073690966" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1465" width="40" height="40">
<path d="M960 170.56L869.44 80 512 437.44 154.56 80 64 170.56 421.44 528 64 885.44l90.56 90.56L512 618.56 869.44 976 960 885.44 602.56 528 960 170.56z" p-id="1466" fill="#e21d1d" stroke="#fff1aa" stroke-width="32"></path>
</svg>
`
const eqlistCrossDivIcon = L.divIcon({
    html: eqlistCrossIcon,
    iconAnchor: [20, 20],
    className: '',
})
const circleIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="20" cy="20" r="17.5" stroke="#e21d1d" stroke-width="3"/>
<circle cx="20" cy="20" r="19.5" stroke="#ffffff" stroke-width="1"/>
<circle cx="20" cy="20" r="15.5" stroke="#ffffff" stroke-width="1"/>
</svg>
`
const circleDivIcon = L.divIcon({
    html: circleIcon,
    iconAnchor: [20, 20],
    className: '',
})

class EewEvent {
    constructor(map, eqMessage, activeEewList, time){
        this.map = map
        this.eqMessage = eqMessage
        this.activeEewList = activeEewList
        this.useJst = eqMessage.source.includes('jma')
        this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
        this.flags = {
            firstSound: false,
            cautionSound: false,
            warnSound: false,
        }
        this.update(eqMessage, time)
    }
    setMark(){
        if(this.hypoMarker && this.map.hasLayer(this.hypoMarker)) this.map.removeLayer(this.hypoMarker)
        this.hypoMarker = L.marker(this.hypoLatLng, {icon: this.eqMessage.isAssumption?circleDivIcon:eewCrossDivIcon, pane: 'eewMarkerPane'})
        this.hypoMarker.addTo(this.map)
    }
    drawWaves(){
        if(!this.eqMessage.isAssumption){
            let passedTime, travelTime
            if(this.useJst){
                passedTime = calcPassedTime(this.eqMessage.originTime, 9) / 1000
                travelTime = travelTimes.jma2001
            }
            else{
                passedTime = calcPassedTime(this.eqMessage.originTime, 8) / 1000
                travelTime = travelTimes.jma2001
            }
            this.switchDrawWaves(passedTime, travelTime)
        }
        else{
            clearInterval(this.drawWavesInterval)
            if(this.pWave && this.map.hasLayer(this.pWave)) this.map.removeLayer(this.pWave)
            if(this.sWave && this.map.hasLayer(this.sWave)) this.map.removeLayer(this.sWave)
            if(this.sWaveFill && this.map.hasLayer(this.sWaveFill)) this.map.removeLayer(this.sWaveFill)    
        }
    }
    switchDrawWaves(passedTime, travelTime){
        let p_reach, p_radius, s_reach, s_radius
        const maxRadius = 2000
        const p_info = calcWaveDistance(travelTime, true, this.eqMessage.depth, passedTime)
        p_reach = p_info.reach
        p_radius = p_info.radius
        const s_info = calcWaveDistance(travelTime, false, this.eqMessage.depth, passedTime)
        s_reach = s_info.reach
        s_radius = s_info.radius
        if(this.pWave && this.map.hasLayer(this.pWave)) this.map.removeLayer(this.pWave)
        if(p_radius > 0 && p_radius <= maxRadius){
            const opacityRatio = this.calcOpacityRatio(p_radius, maxRadius)
            this.pWave = L.circle(this.hypoLatLng, {
                color: 'white',
                weight: 2,
                opacity: opacityRatio,
                fillOpacity: 0,
                radius: p_radius * 1000,
                pane: 'wavePane',
            })
            this.pWave.addTo(this.map)
            L.DomUtil.addClass(this.pWave.getElement(), 'wave')
        }
        if(this.sWave && this.map.hasLayer(this.sWave)) this.map.removeLayer(this.sWave)
        if(this.sWaveFill && this.map.hasLayer(this.sWaveFill)) this.map.removeLayer(this.sWaveFill)
        if(s_radius > 0 && s_radius <= maxRadius){
            const opacityRatio = this.calcOpacityRatio(s_radius, maxRadius)
            this.sWave = L.circle(this.hypoLatLng, {
                color: this.eqMessage.isWarn?'red':'orange',
                weight: 2,
                opacity: opacityRatio,
                fillOpacity: 0,
                radius: s_radius * 1000,
                pane: 'wavePane',
            })
            this.sWave.addTo(this.map)
            this.sWaveFill = L.circle(this.hypoLatLng, {
                color: this.eqMessage.isWarn?'red':'orange',
                weight: 0,
                opacity: 0,
                fillOpacity: 0.3 * opacityRatio,
                radius: s_radius * 1000,
                pane: 'waveFillPane',
            })
            this.sWaveFill.addTo(this.map)
            L.DomUtil.addClass(this.sWave.getElement(), 'wave')
            L.DomUtil.addClass(this.sWaveFill.getElement(), 'wave')
        }
    }
    calcOpacityRatio(radius, maxRadius){
        if(radius <= maxRadius * 0.9) return 1
        else if(radius >= maxRadius) return 0
        else return 10 * (1 - radius / maxRadius)
    }
    renderStop(){
        clearInterval(this.drawWavesInterval)
        if(this.hypoMarker && this.map.hasLayer(this.hypoMarker)) this.map.removeLayer(this.hypoMarker)
        if(this.pWave && this.map.hasLayer(this.pWave)) this.map.removeLayer(this.pWave)
        if(this.sWave && this.map.hasLayer(this.sWave)) this.map.removeLayer(this.sWave)
        if(this.sWaveFill && this.map.hasLayer(this.sWaveFill)) this.map.removeLayer(this.sWaveFill)
    }
    update(eqMessage, time){
        Object.assign(this.eqMessage, eqMessage)
        this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
        this.setMark()
        this.drawWaves()
        clearInterval(this.drawWavesInterval)
        this.drawWavesInterval = setInterval(() => {
            this.drawWaves()
        }, 100);
        this.handleActions()
        clearTimeout(this.terminateTimer)
        this.terminateTimer = setTimeout(() => {
            this.terminate()
        }, time);
    }
    handleCancel(eqMessage, time){
        Object.assign(this.eqMessage, eqMessage)
        this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
        this.renderStop()
        this.handleActions()
        clearTimeout(this.terminateTimer)
        this.terminateTimer = setTimeout(() => {
            this.terminate()
        }, time);
    }
    handleActions(){
        const settingsStore = useSettingsStore()
        const soundEffect = settingsStore.mainSettings.soundEffect
        const eqMessage = this.eqMessage
        let icon = ''
        //是Warn
        if(eqMessage.isWarn){
            //通知
            if(settingsStore.mainSettings.onEew.notification || settingsStore.mainSettings.onEewWarn.notification){
                if(eqMessage.isCanceled) icon = iconUrls.info
                else icon = iconUrls.warn
            }
            //声音
            if(settingsStore.mainSettings.onEew.sound || settingsStore.mainSettings.onEewWarn.sound){
                if(eqMessage.isCanceled) playSound(chimeUrls[soundEffect].torikeshi)
                else{
                    if(!this.flags.firstSound){
                        playSound(chimeUrls[soundEffect].happyou)
                        this.flags.firstSound = true
                    }
                    else if(eqMessage.isFinal) playSound(chimeUrls[soundEffect].saisyuu)
                    else playSound(chimeUrls[soundEffect].koushin)
                    if(!this.flags.warnSound){
                        playSound(chimeUrls[soundEffect].keihou)
                        this.flags.cautionSound = true
                        this.flags.warnSound = true
                    }
                }
            }
        }
        //不是Warn
        else{
            //通知
            if(settingsStore.mainSettings.onEew.notification){
                if(eqMessage.isCanceled) icon = iconUrls.info
                else icon = iconUrls.caution
            }
            //声音
            if(settingsStore.mainSettings.onEew.sound){
                if(eqMessage.isCanceled) playSound(chimeUrls[soundEffect].torikeshi)
                else{
                    if(!this.flags.firstSound){
                        playSound(chimeUrls[soundEffect].happyou)
                        this.flags.firstSound = true
                    }
                    else if(eqMessage.isFinal) playSound(chimeUrls[soundEffect].saisyuu)
                    else playSound(chimeUrls[soundEffect].koushin)
                    if(getClassLevel(eqMessage.className) >= getClassLevel('green')){
                        if(!this.flags.cautionSound){
                            playSound(chimeUrls[soundEffect].yohou)
                            this.flags.cautionSound = true
                        }
                    }
                }
            }
        }
        if(icon){
            sendNotification(`${eqMessage.titleText} #${eqMessage.reportNum}`, 
                `${eqMessage.hypocenterText}\n${eqMessage.depthText}\n${eqMessage.magnitudeText}\n${eqMessage.maxIntensityText}`, 
                icon, 
                settingsStore.mainSettings.muteNotification)
        }
    }
    terminate(){
        this.renderStop()
        const index = this.activeEewList.indexOf(this)
        if(index >= 0) this.activeEewList.splice(index, 1)
        this.map = null
        this.eqMessage = null
        this.activeEewList = null
    }
}
class EqlistEvent {
    constructor(map, eqMessage){
        this.map = map
        this.eqMessage = eqMessage
        this.isActive = false
        this.useJst = eqMessage.source.includes('jma')
        this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
        this.isValidHypo = !this.hypoLatLng.every(item=>item == 0)
    }
    update(eqMessage, time){
        Object.assign(this.eqMessage, eqMessage)
        this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
        this.isValidHypo = !this.hypoLatLng.every(item=>item == 0)
        this.setMark()
        if(time > 0){
            this.handleActions()
            this.isActive = true
            clearTimeout(this.deactivateTimer)
            this.deactivateTimer = setTimeout(() => {
                this.isActive = false
            }, time);
        }
    }
    setMark(){
        this.removeMark()
        if(this.isValidHypo){
            this.hypoMarker = L.marker(this.hypoLatLng, {icon: eqlistCrossDivIcon, pane: 'eqlistMarkerPane'})
            this.hypoMarker.addTo(this.map)    
        }
    }
    removeMark(){
        if(this.hypoMarker && this.map.hasLayer(this.hypoMarker)) this.map.removeLayer(this.hypoMarker)
    }
    handleActions(){
        const settingsStore = useSettingsStore()
        const soundEffect = settingsStore.mainSettings.soundEffect
        const eqMessage = this.eqMessage
        let icon = ''
        if(settingsStore.mainSettings.onReport.notification) icon = iconUrls.info
        if(settingsStore.mainSettings.onReport.sound){
            switch(eqMessage.source){
                case 'jmaEqlist':{
                    switch(eqMessage.title){
                        case '震度速報':{
                            playSound(chimeUrls[soundEffect].shindosokuhou)
                            break
                        }
                        case '震源に関する情報':{
                            playSound(chimeUrls[soundEffect].shingenzyouhou)
                            break
                        }
                        case '震源・震度情報':{
                            playSound(chimeUrls[soundEffect].jishinzyouhou)
                            break
                        }
                        case '顕著な震源要素更新のお知らせ':{
                            playSound(chimeUrls[soundEffect].shingenzyouhou)
                            break
                        }
                        case '遠地地震に関する情報':{
                            playSound(chimeUrls[soundEffect].jishinzyouhou)
                            break
                        }
                    }
                    break
                }
                case 'cencEqlist':{
                    if(eqMessage.title != 'reviewed'){
                        playSound(chimeUrls[soundEffect].shingenzyouhou)
                    }
                    else{
                        playSound(chimeUrls[soundEffect].jishinzyouhou)
                    }
                    break
                }
            }
        }
        if(icon){
            sendNotification(`${eqMessage.titleText}`, 
                `${eqMessage.hypocenterText}\n${eqMessage.depthText}\n${eqMessage.magnitudeText}\n${eqMessage.maxIntensityText}`, 
                icon, 
                settingsStore.mainSettings.muteNotification)
        }
    }
}

export { EewEvent, EqlistEvent }