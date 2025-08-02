import { calcPassedTime, calcWaveDistance, calcReachTime, playSound, sendMyNotification, getClassLevel, focusWindow, calcCsisLevel, calcJmaShindoLevel, shindoScale, timeToStamp, formatTimeZone } from '@/utils/Utils';
import travelTimes from '@/utils/TravelTimes';
import { chimeUrls, iconUrls } from '@/utils/Urls';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSettingsStore } from '@/stores/settings';

const eewCrossIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="5" y1="5" x2="35" y2="35" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <line x1="5" y1="5" x2="35" y2="35" stroke="#e21d1d" stroke-width="6" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#e21d1d" stroke-width="6" stroke-linecap="round"/>
</svg>
`
const eewCrossDivIcon = L.divIcon({
    html: eewCrossIcon,
    iconAnchor: [20, 20],
    className: '',
})
const eewCancelCrossIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" opacity="0.5">
  <line x1="5" y1="5" x2="35" y2="35" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <line x1="5" y1="5" x2="35" y2="35" stroke="#7f7f7f" stroke-width="6" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#7f7f7f" stroke-width="6" stroke-linecap="round"/>
</svg>
`
const eewCancelCrossDivIcon = L.divIcon({
    html: eewCancelCrossIcon,
    iconAnchor: [20, 20],
    className: '',
})
const eqlistCrossIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <line x1="5" y1="5" x2="35" y2="35" stroke="#fff1aa" stroke-width="10" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#fff1aa" stroke-width="10" stroke-linecap="round"/>
  <line x1="5" y1="5" x2="35" y2="35" stroke="#e21d1d" stroke-width="6" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="5" y2="35" stroke="#e21d1d" stroke-width="6" stroke-linecap="round"/>
</svg>
`
const eqlistCrossDivIcon = L.divIcon({
    html: eqlistCrossIcon,
    iconAnchor: [20, 20],
    className: '',
})
const eewCircleIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="17.5" stroke="#e21d1d" stroke-width="3"/>
  <circle cx="20" cy="20" r="19.5" stroke="#ffffff" stroke-width="1"/>
  <circle cx="20" cy="20" r="15.5" stroke="#ffffff" stroke-width="1"/>
</svg>
`
const eewCircleDivIcon = L.divIcon({
    html: eewCircleIcon,
    iconAnchor: [20, 20],
    className: '',
})
const eewCancelCircleIcon = `
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.5">
  <circle cx="20" cy="20" r="17.5" stroke="#7f7f7f" stroke-width="3"/>
  <circle cx="20" cy="20" r="19.5" stroke="#ffffff" stroke-width="1"/>
  <circle cx="20" cy="20" r="15.5" stroke="#ffffff" stroke-width="1"/>
</svg>
`
const eewCancelCircleDivIcon = L.divIcon({
    html: eewCancelCircleIcon,
    iconAnchor: [20, 20],
    className: '',
})

let settingsStore
export const ignoredIds = new Set()

export class EewEvent {
    constructor(map, eqMessage, activeEewList, handleTempEqlists, smartSetView){
        this.map = map
        if(!settingsStore) settingsStore = useSettingsStore()
        this.eqMessage = eqMessage
        this.activeEewList = activeEewList
        this.travelTime = travelTimes.jma2001
        this.userLatLng = settingsStore.numUserLatLng
        this.isValidUserLatLng = settingsStore.isValidUserLatLng
        this.userCsis = '?'
        this.userShindo = '?'
        this.nearestJmaLoc = settingsStore.nearestJmaLoc
        this.countdown = -1
        this.pCountdown = -1
        this.shouldAction = false
        this.mute = false
        this.showMenu = false
        this.showPCountdown = false
        this.flags = {
            firstSound: false,
            cautionSound: false,
            warnSound: false,
            focused: false,
            lastSecondsCount: settingsStore.mainSettings.countdownStart + 1
        }
        this.maxRadius = 2000
        this.handleTempEqlists = handleTempEqlists
        this.smartSetView = smartSetView
    }
    setMark(){
        if(this.hypoMarker && this.map.hasLayer(this.hypoMarker)) this.map.removeLayer(this.hypoMarker)
        if(this.hypoLatLng) {
            if(this.eqMessage.isCanceled){
                this.hypoMarker = L.marker(this.hypoLatLng, { icon: this.eqMessage.isAssumption?eewCancelCircleDivIcon:eewCancelCrossDivIcon, pane: 'eewMarkerPane' })
            }
            else{
                this.hypoMarker = L.marker(this.hypoLatLng, { icon: this.eqMessage.isAssumption?eewCircleDivIcon:eewCrossDivIcon, pane: 'eewMarkerPane' })
            }
            this.hypoMarker.bindTooltip(`
                <strong>${this.eqMessage.titleText}</strong><br>
                ${this.eqMessage.reportNumText}<br>
                ${this.eqMessage.hypocenter}(${this.eqMessage.lat},${this.eqMessage.lng})<br>
                ${this.eqMessage.depthText}<br>
                ${this.eqMessage.originTime} (${formatTimeZone(this.eqMessage.timeZone)})<br>
                M${this.eqMessage.magnitude.toFixed(1)}<br>
                ${this.eqMessage.maxIntensityText}
                `, { permanent: false, direction: 'top', className: 'custom-tooltip' })
            this.hypoMarker.addTo(this.map)
        }
    }
    clearWaves() {
        if(this.pWave && this.map.hasLayer(this.pWave)) {
            this.map.removeLayer(this.pWave)
            this.pWave = null
        }
        if(this.sWave && this.map.hasLayer(this.sWave)) {
            this.map.removeLayer(this.sWave)
            this.sWave = null
        }
        if(this.sWaveFill && this.map.hasLayer(this.sWaveFill)) {
            this.map.removeLayer(this.sWaveFill)
            this.sWaveFill = null
        }
    }
    drawWaves(updated = false){
        const passedTime = calcPassedTime(this.eqMessage.originTime, this.eqMessage.timeZone) / 1000
        this.handleCountdown(passedTime)
        if(this.hypoLatLng && !this.eqMessage.isAssumption){
            if(updated) this.clearWaves()
            this.switchDrawWaves(passedTime)
        }
        else{
            this.clearWaves()
        }
    }
    switchDrawWaves(passedTime){
        let p_reach, p_radius, s_reach, s_radius
        const maxRadius = this.maxRadius
        const travelTime = this.travelTime
        const p_info = calcWaveDistance(travelTime, true, this.eqMessage.depth, passedTime)
        p_reach = p_info.reach
        p_radius = p_info.radius
        const s_info = calcWaveDistance(travelTime, false, this.eqMessage.depth, passedTime)
        s_reach = s_info.reach
        s_radius = s_info.radius
        if(p_radius > 0 && p_radius <= maxRadius) {
            const opacityRatio = this.calcOpacityRatio(p_radius, maxRadius)
            if(!this.pWave) {
                this.pWave = L.circle(this.hypoLatLng, {
                    color: 'white',
                    weight: 2,
                    opacity: opacityRatio,
                    fill: false,
                    radius: p_radius * 1000,
                    pane: 'wavePane',
                    interactive: false
                }).addTo(this.map)    
            }
            else {
                this.pWave.setRadius(p_radius * 1000)
                this.pWave.setStyle({
                    opacity: opacityRatio
                })
            }
        }
        else {
            if(this.pWave && this.map.hasLayer(this.pWave)) {
                this.map.removeLayer(this.pWave)
                this.pWave = null
            }
        }
        if(s_radius > 0 && s_radius <= maxRadius) {
            const opacityRatio = this.calcOpacityRatio(s_radius, maxRadius)
            if(!this.sWave) {
                this.sWave = L.circle(this.hypoLatLng, {
                    color: this.eqMessage.isWarn ? 'red' : 'orange',
                    weight: 2,
                    opacity: opacityRatio,
                    fill: false,
                    radius: s_radius * 1000,
                    pane: 'wavePane',
                    interactive: false
                }).addTo(this.map)
            }
            else {
                this.sWave.setRadius(s_radius * 1000)
                this.sWave.setStyle({
                    opacity: opacityRatio
                })
            }
            if(!this.sWaveFill) {
                this.sWaveFill = L.circle(this.hypoLatLng, {
                    fillColor: this.eqMessage.isWarn ? 'red' : 'orange',
                    weight: 0,
                    opacity: 0,
                    fillOpacity: 0.25 * opacityRatio,
                    radius: s_radius * 1000,
                    pane: 'waveFillPane',
                    interactive: false
                }).addTo(this.map)    
            }
            else {
                this.sWaveFill.setRadius(s_radius * 1000)
                this.sWaveFill.setStyle({
                    fillOpacity: 0.25 * opacityRatio
                })
            }
        }
        else {
            if(this.sWave && this.map.hasLayer(this.sWave)) {
                this.map.removeLayer(this.sWave)
                this.sWave = null
            }
            if(this.sWaveFill && this.map.hasLayer(this.sWaveFill)) {
                this.map.removeLayer(this.sWaveFill)
                this.sWaveFill = null
            }
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
        this.clearWaves()
    }
    update(eqMessage, time, isFirst = false){
        if(isFirst || eqMessage.reportNum > this.eqMessage.reportNum || 
        eqMessage.reportNum == this.eqMessage.reportNum && eqMessage.isCanceled > this.eqMessage.isCanceled || 
        eqMessage.reportNum == this.eqMessage.reportNum && eqMessage.isCanceled == this.eqMessage.isCanceled && eqMessage.type < this.eqMessage.type) {
            const isAddition = eqMessage.reportNum == this.eqMessage.reportNum && eqMessage.isCanceled == this.eqMessage.isCanceled && eqMessage.type < this.eqMessage.type
            if(eqMessage.isCanceled) {
                const { isCanceled, title, titleText, reportNum, reportNumText, reportTime } = eqMessage
                Object.assign(this.eqMessage, { isCanceled, title, titleText, reportNum, reportNumText, reportTime })
                this.renderStop()
            }
            else {
                Object.assign(this.eqMessage, eqMessage)
                this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
                if(this.isValidUserLatLng) {
                    this.userDist = L.latLng(this.hypoLatLng).distanceTo(L.latLng(this.userLatLng)) / 1000
                    this.pReachTime = calcReachTime(this.userDist <= this.maxRadius ? travelTimes.jma2001 : travelTimes.jb, true, this.eqMessage.depth, this.userDist)
                    this.sReachTime = calcReachTime(this.userDist <= this.maxRadius ? travelTimes.jma2001 : travelTimes.jb, false, this.eqMessage.depth, this.userDist)
                    this.userCsis = settingsStore.advancedSettings.forceCalcInt && !this.eqMessage.isAssumption ? 
                        calcCsisLevel(this.eqMessage.magnitude, this.eqMessage.depth, this.userDist) : '?'
                    this.userShindo = 
                    this.nearestJmaLoc
                    ?
                        this.eqMessage.warnArea && JSON.parse(this.eqMessage.warnArea).find(item => item.name == this.nearestJmaLoc.sect)?.intensity.replace('強', '+').replace('弱', '-')
                        ||
                        (settingsStore.advancedSettings.forceCalcInt && !this.eqMessage.isAssumption
                        ? calcJmaShindoLevel(this.eqMessage.magnitude, this.eqMessage.depth, this.eqMessage.lat, this.eqMessage.lng, this.nearestJmaLoc)
                        : '?')
                    :
                        '?'
                }
                else {
                    this.userDist = undefined
                    this.pReachTime = -1
                    this.sReachTime = -1
                    this.userCsis = '?'
                    this.userShindo = '?'
                }
                this.drawWaves(true)
                clearInterval(this.drawWavesInterval)
                this.drawWavesInterval = setInterval(() => {
                    this.drawWaves()
                }, 100);
            }
            this.setMark()
            if(this.nearestJmaLoc
                ? (this.userShindo == '?' || shindoScale.indexOf(this.userShindo) >= settingsStore.mainSettings.actionShindo)
                : (this.userCsis == '?' || Number(this.userCsis) >= settingsStore.mainSettings.actionCsis)
            ) this.shouldAction = true
            if(this.shouldAction && !isAddition && !this.mute) this.handleActions()
            clearTimeout(this.terminateTimer)
            this.terminateTimer = setTimeout(() => {
                this.terminate()
            }, time);
        }
    }
    handleActions(){
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
                if(eqMessage.isCanceled) playSound("cancel")
                else{
                    if(!this.flags.firstSound){
                        playSound("issue")
                        this.flags.firstSound = true
                    }
                    else if(eqMessage.isFinal) playSound("final")
                    else playSound("update")
                    if(!this.flags.warnSound){
                        playSound("warn")
                        this.flags.cautionSound = true
                        this.flags.warnSound = true
                    }
                }
            }
            //弹窗
            if(settingsStore.mainSettings.onEew.focus || settingsStore.mainSettings.onEewWarn.focus){
                if(!this.flags.focused){
                    focusWindow()
                    this.flags.focused = true
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
                if(eqMessage.isCanceled) playSound("cancel")
                else{
                    if(!this.flags.firstSound){
                        playSound("issue")
                        this.flags.firstSound = true
                    }
                    else if(eqMessage.isFinal) playSound("final")
                    else playSound("update")
                    if(getClassLevel(eqMessage.className) >= getClassLevel('green')){
                        if(!this.flags.cautionSound){
                            playSound("caution")
                            this.flags.cautionSound = true
                        }
                    }
                }
            }
            //弹窗
            if(settingsStore.mainSettings.onEew.focus){
                if(!this.flags.focused){
                    focusWindow()
                    this.flags.focused = true
                }
            }
        }
        if(icon){
            sendMyNotification(`${eqMessage.titleText} ${eqMessage.reportNumText}`, 
                `${eqMessage.hypocenterText}\n${eqMessage.depthText}\n${eqMessage.magnitudeText}\n${eqMessage.maxIntensityText}`, 
                icon, 
                settingsStore.mainSettings.muteNotification)
        }
        this.handleTempEqlists(0)
        this.smartSetView()
    }
    handleCountdown(passedTime){
        if(settingsStore.mainSettings.displayCountdown && this.isValidUserLatLng && (this.userDist <= this.maxRadius && !this.eqMessage.isAssumption || settingsStore.mainSettings.forceDisplayCountdown)){
            this.countdown = Math.max(this.sReachTime - passedTime, 0)
            this.pCountdown = Math.max(this.pReachTime - passedTime, 0)
            if(settingsStore.mainSettings.playCountdownSound && this.shouldAction && !this.mute) {
                const secondsCount = Math.ceil(this.countdown)
                if(secondsCount < this.flags.lastSecondsCount){
                    playSound(settingsStore.mainSettings.countdownSpeech && (`${secondsCount}s` in chimeUrls.general) ? `${secondsCount}s` : "countdown")
                    this.flags.lastSecondsCount = secondsCount
                }
            }
        }
        else{
            this.countdown = -1
            this.pCountdown = -1
        }
    }
    terminate(force = false){
        if(force) ignoredIds.add(`${this.eqMessage.source}|${this.eqMessage.id}`)
        clearTimeout(this.terminateTimer)
        this.renderStop()
        const index = this.activeEewList.indexOf(this)
        if(index >= 0) this.activeEewList.splice(index, 1)
        this.map = null
        this.eqMessage = null
        this.activeEewList = null
    }
}
export class EqlistEvent {
    constructor(map, eqMessage, handleTempEqlists, smartSetView){
        this.map = map
        if(!settingsStore) settingsStore = useSettingsStore()
        this.eqMessage = eqMessage
        this.isActive = false
        this.showMenu = false
        this.handleTempEqlists = handleTempEqlists
        this.smartSetView = smartSetView
    }
    update(eqMessage, time, isFirst = false){
        if(isFirst || timeToStamp(eqMessage.reportTime, 0) > timeToStamp(this.eqMessage.reportTime, 0)
        || timeToStamp(eqMessage.reportTime, 0) == timeToStamp(this.eqMessage.reportTime, 0) && timeToStamp(eqMessage.originTime, 0) > timeToStamp(this.eqMessage.originTime, 0)) {
            Object.assign(this.eqMessage, eqMessage)
            this.hypoLatLng = [this.eqMessage.lat, this.eqMessage.lng]
            this.isValidHypo = this.hypoLatLng.some(item => !!item)
            this.setMark()
            if(time > 0){
                this.handleActions()
                this.isActive = true
                clearTimeout(this.deactivateTimer)
                this.deactivateTimer = setTimeout(() => {
                    this.isActive = false
                    this.showMenu = false
                }, time);
            }
        }
    }
    setMark(){
        this.removeMark()
        if(this.isValidHypo){
            this.hypoMarker = L.marker(this.hypoLatLng, { icon: eqlistCrossDivIcon, pane: 'eqlistMarkerPane' })
            this.hypoMarker.bindTooltip(`
                <strong>${this.eqMessage.titleText}</strong><br>
                ${this.eqMessage.hypocenter}(${this.eqMessage.lat},${this.eqMessage.lng})<br>
                ${this.eqMessage.depthText}<br>
                ${this.eqMessage.originTime} (${formatTimeZone(this.eqMessage.timeZone)})<br>
                M${this.eqMessage.magnitude == -1 ? '不明' : this.eqMessage.magnitude.toFixed(1)}<br>
                ${this.eqMessage.maxIntensityText}
                `, { permanent: false, direction: 'top', className: 'custom-tooltip' })
            this.hypoMarker.addTo(this.map)    
        }
    }
    removeMark(){
        if(this.hypoMarker && this.map.hasLayer(this.hypoMarker)) this.map.removeLayer(this.hypoMarker)
    }
    handleActions(){
        const eqMessage = this.eqMessage
        let icon = ''
        if(settingsStore.mainSettings.onReport.notification) icon = iconUrls.info
        if(settingsStore.mainSettings.onReport.sound){
            switch(eqMessage.source){
                case 'jmaEqlist':{
                    switch(eqMessage.title){
                        case '震度速報': {
                            playSound("prompt")
                            break
                        }
                        case '震源に関する情報': {
                            playSound("hypocenter")
                            break
                        }
                        default: {
                            playSound("detail")
                            break
                        }
                    }
                    break
                }
                case 'cwaEqlist':{
                    playSound("detail")
                    break
                }
                case 'cencEqlist':{
                    if(eqMessage.title == '中国地震台网自动测定'){
                        playSound("hypocenter")
                    }
                    else{
                        playSound("detail")
                    }
                    break
                }
            }
        }
        if(settingsStore.mainSettings.onReport.focus) focusWindow()
        if(icon){
            sendMyNotification(`${eqMessage.titleText}`, 
                `${eqMessage.hypocenterText}\n${eqMessage.depthText}\n${eqMessage.magnitudeText}\n${eqMessage.maxIntensityText}`, 
                icon, 
                settingsStore.mainSettings.muteNotification)
        }
        this.handleTempEqlists(6500, eqMessage.source)
        this.smartSetView()
    }
    deactivate() {
        clearTimeout(this.deactivateTimer)
        this.isActive = false
        this.showMenu = false
    }
}