import { calcPassedTime, calcWaveDistance, calcReachTime } from '@/utils/Utils';
import travelTimes from '@/utils/TravelTimes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, reactive, computed } from 'vue';

const crossIcon = `<svg t="1719226920212" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2481" width="40" height="40"><path d="M602.512147 511.99738l402.747939-402.747939a63.999673 63.999673 0 0 0-90.509537-90.509537L512.00261 421.487843 109.254671 18.749904a63.999673 63.999673 0 0 0-90.509537 90.509537L421.493073 511.99738 18.755134 914.745319a63.999673 63.999673 0 0 0 90.509537 90.509537L512.00261 602.506917l402.747939 402.747939a63.999673 63.999673 0 0 0 90.509537-90.509537z" p-id="2482" fill="#d81e06"></path></svg>`
const crossDivIcon = L.divIcon({
    html: crossIcon,
    className: 'crossDivIcon',
    iconAnchor: [20, 20],
})

class EewEvent {
    constructor(source, map, eqMessage){
        this.source = source
        this.map = map
        this.eqMessage = reactive(eqMessage)
        this.useJst = this.source.includes('jma')
        this.hypoLatLng = computed(()=>[this.eqMessage.lat, this.eqMessage.lng])
    }
    setMark(){
        if(this.crossMarker && this.map.hasLayer(this.crossMarker)) this.map.removeLayer(this.crossMarker)
        this.crossMarker = L.marker(this.hypoLatLng.value, {icon: crossDivIcon, pane: 'eewMarkerPane'})
        this.crossMarker.addTo(this.map)
    }
    blinkOnce(){
        if(!this.map.hasLayer(this.crossMarker)){
            this.crossMarker.addTo(this.map)
        }
        else{
            this.map.removeLayer(this.crossMarker)
        }
    }
    drawWaves(){
        let time, travelTime
        if(this.useJst){
            time = calcPassedTime(this.eqMessage.originTime, 9) / 1000
            travelTime = travelTimes.jma2001
        }
        else{
            time = calcPassedTime(this.eqMessage.originTime, 8) / 1000
            travelTime = travelTimes.jma2001
        }
        this.switchDrawWaves(time, travelTime)
    }
    switchDrawWaves(time, travelTime){
        let p_reach, p_radius, s_reach, s_radius
        const maxRadius = 2000
        const p_info = calcWaveDistance(travelTime, true, this.eqMessage.depth, time)
        p_reach = p_info.reach
        p_radius = p_info.radius
        const s_info = calcWaveDistance(travelTime, false, this.eqMessage.depth, time)
        s_reach = s_info.reach
        s_radius = s_info.radius
        if(this.pWave && this.map.hasLayer(this.pWave)) this.map.removeLayer(this.pWave)
        if(p_radius > 0 && p_radius < maxRadius){
            this.pWave = L.circle(this.hypoLatLng.value, {
                color: 'white',
                weight: 1,
                fillOpacity: 0,
                radius: p_radius * 1000,
                pane: 'wavePane',
            })
            this.pWave.addTo(this.map)
        }
        if(this.sWave && this.map.hasLayer(this.sWave)) this.map.removeLayer(this.sWave)
        if(s_radius > 0 && s_radius < maxRadius){
            this.sWave = L.circle(this.hypoLatLng.value, {
                color: this.eqMessage.isWarn?'red':'orange',
                weight: 1,
                fillOpacity: 0.3,
                radius: s_radius * 1000,
                pane: 'wavePane',
            })
            this.sWave.addTo(this.map)
        }
    }
    renderStart(){
        this.setMark()
        this.drawWaves()
        this.drawWavesInterval = setInterval(() => {
            this.drawWaves()
        }, 100);
        this.blinkInterval = setInterval(() => {
            this.blinkOnce()
        }, 500);
    }
    renderStop(){
        clearInterval(this.drawWavesInterval)
        clearInterval(this.blinkInterval)
        if(this.crossMarker && this.map.hasLayer(this.crossMarker)) this.map.removeLayer(this.crossMarker)
        if(this.pWave && this.map.hasLayer(this.pWave)) this.map.removeLayer(this.pWave)
        if(this.sWave && this.map.hasLayer(this.sWave)) this.map.removeLayer(this.sWave)
    }
    update(eqMessage){
        Object.assign(this.eqMessage, eqMessage)
        this.setMark()
        this.drawWaves()
        clearInterval(this.drawWavesInterval)
        this.drawWavesInterval = setInterval(() => {
            this.drawWaves()
        }, 100);
        clearInterval(this.blinkInterval)
        this.blinkInterval = setInterval(() => {
            this.blinkOnce()
        }, 500);
    }
    handleCancel(eqMessage){
        Object.assign(this.eqMessage, eqMessage)
        clearInterval(this.drawWavesInterval)
        clearInterval(this.blinkInterval)
        if(this.pWave && this.map.hasLayer(this.pWave)) this.map.removeLayer(this.pWave)
        if(this.sWave && this.map.hasLayer(this.sWave)) this.map.removeLayer(this.sWave)
        this.setMark()
    }
}
class EqlistEvent {
    constructor(source, map, eqMessage){
        this.source = source
        this.map = map
        this.eqMessage = reactive(eqMessage)
        this.useJst = this.source.includes('jma')
        this.hypoLatLng = computed(()=>[this.eqMessage.lat, this.eqMessage.lng])
        this.isValidHypo = computed(()=>!this.hypoLatLng.value.every(item=>item == 0))
    }
    update(eqMessage){
        Object.assign(this.eqMessage, eqMessage)
    }
    setMark(){
        this.removeMark()
        if(this.isValidHypo.value){
            this.crossMarker = L.marker(this.hypoLatLng.value, {icon: crossDivIcon, pane: 'eqlistMarkerPane'})
            this.crossMarker.addTo(this.map)    
        }
    }
    removeMark(){
        if(this.crossMarker && this.map.hasLayer(this.crossMarker)) this.map.removeLayer(this.crossMarker)
    }
}

export { EewEvent, EqlistEvent }