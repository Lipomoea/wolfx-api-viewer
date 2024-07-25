import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getShindoFromChar } from '@/utils/Utils';

let colorBand = [
    '#0014da', '#0037f0', '#006cdc', '#00aca9', '#0cd87a', 
    '#2dee4d', '#5bfb2c', '#9dfe17', '#ccff09', '#ebff03', 
    '#fdfc00', '#ffe500', '#ffce00', '#ffa600', '#ff7e00', 
    '#ff5900', '#fd3500', '#f91500', '#e90000', '#c20000', 
    '#af0000'
]

class NiedStation {
    constructor(map, latLng, intensity){
        this.map = map
        this.latLng = latLng
        this.intensity = intensity
        this.shindo = getShindoFromChar(this.intensity)
        this.level = this.intensity.charCodeAt(0) - 100
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
        if(intensity != this.intensity){
            this.intensity = intensity
            this.shindo = getShindoFromChar(this.intensity)
            this.level = this.intensity.charCodeAt(0) - 100
            this.render()
        }
    }
    render(){
        this.setColorRadius()
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
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
    setColorRadius(){
        if(this.level < 0 || this.level >= colorBand.length){
            this.color = '#cfcfcf'
        }
        else{
            this.color = colorBand[this.level]
        }
        this.radius = (2 + this.level * 0.1) * 2 ** (Math.min(Math.max(this.map.getZoom(), 4), 10) / 2 - 3)
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
    }
}
export { NiedStation }