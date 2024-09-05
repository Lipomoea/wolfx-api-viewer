import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getShindoFromChar } from '@/utils/Utils';
import { useSettingsStore } from '@/stores/settings';
import { shindoIconUrls } from '@/utils/Urls';

let colorBand = [
    '#0003cf', 
    '#0014da', '#003cf2', '#006cdc', '#00b3a2', '#12dc72', 
    '#31f049', '#64fb2a', '#a3fe14', '#ccff09', '#ebff03', 
    '#fff500', '#ffe500', '#ffce00', '#ffa600', '#ff7e00', 
    '#ff5900', '#fd3500', '#f81100', '#e90000', '#c20000'
]

let settingsStore
class NiedStation {
    constructor(map, id, latLng, intensity){
        if(!settingsStore) settingsStore = useSettingsStore()
        this.map = map
        this.id = id
        this.latLng = latLng
        this.intensity = intensity
        this.shindo = getShindoFromChar(intensity)
        this.level = intensity.charCodeAt(0) - 100
        this.recentLevel = [this.level]
        this.activity = 0
        this.isActive = false
        this.color = '#cfcfcf'
        this.radius = (2 + this.level * 0.1) * 2 ** (Math.min(Math.max(this.map.getZoom(), 4), 10) / 2 - 3)
        this.marker = L.circleMarker(this.latLng, {
            radius: this.radius,
            fillOpacity: 1,
            color: this.color,
            fillColor: this.color,
            weight: 0,
            pane: `stationPane${this.level}`,
        })
        this.marker.addTo(this.map)
    }
    update(intensity){
        const level = intensity.charCodeAt(0) - 100
        if(intensity != this.intensity){
            this.intensity = intensity
            this.shindo = getShindoFromChar(intensity)
            this.level = level
            this.render()
        }
        const recentFilter = this.recentLevel.filter(val=>val != -1)
        let ascend = 0
        if(recentFilter.length > 0){
            const minRecent = Math.min(...recentFilter)
            ascend = level - minRecent
        }
        this.activity = this.calcActivity(level, ascend)
        this.recentLevel.unshift(level)
        if(this.recentLevel.length > 10) this.recentLevel.pop()
    }
    calcActivity(level, ascend){
        let levelActivity, ascendActivity
        if(level <= 6) levelActivity = 0
        else if(level <= 10) levelActivity = 2 ** (level - 7)
        else levelActivity = 4 * (level - 8)
        if(ascend <= 1) ascendActivity = 0
        else if(ascend <= 2) ascendActivity = 1
        else if(ascend <= 6) ascendActivity = 2 * (ascend - 2)
        else ascendActivity = 4 * (ascend - 4)
        return Math.max(levelActivity, ascendActivity)
    }
    render(){
        this.setColorRadius()
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        if(settingsStore.advancedSettings.displayNiedShindo && this.level >= 6 && this.map.getZoom() >= 4){
            const shindoIcon = L.icon({
                iconUrl: shindoIconUrls[this.shindo],
                iconSize: [this.radius * 2, this.radius * 2],
                iconAnchor: [this.radius, this.radius],
            })
            this.marker = L.marker(this.latLng, {
                icon: shindoIcon,
                pane: `stationPane${this.level}`,
            })
        }
        else{
            this.marker = L.circleMarker(this.latLng, {
                radius: this.radius,
                fillOpacity: 1,
                color: this.color,
                fillColor: this.color,
                weight: 0,
                pane: `stationPane${this.level}`,
            })
        }
        this.marker.addTo(this.map)
    }
    setColorRadius(){
        if(this.level < 0 || this.level >= colorBand.length){
            if(settingsStore.mainSettings.displaySeisNet.hideNoData) this.color = '#cfcfcf00'
            else this.color = '#cfcfcf'
        }
        else{
            this.color = colorBand[this.level]
        }
        const zoom = this.map.getZoom()
        if(settingsStore.advancedSettings.displayNiedShindo && this.level >= 6 && zoom >= 4){
            this.radius = 8 * 1.5 ** (Math.min(Math.max(zoom, 6), 10) / 2 - 3)
        }
        else{
            this.radius = (2 + this.level * 0.1) * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
        }
    }
    setActive(){
        this.isActive = true
        clearTimeout(this.activeTimer)
        this.activeTimer = setTimeout(() => {
            this.isActive = false
        }, 15000);
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        this.map = null
        this.marker = null
        clearTimeout(this.activeTimer)
    }
}
export { NiedStation }