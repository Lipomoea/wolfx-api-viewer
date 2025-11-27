import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLevelFromInstShindo, getShindoFromChar, getShindoFromInstShindo, shindoScale } from '@/utils/Utils';
import { useSettingsStore } from '@/stores/settings';
import { ref } from 'vue';
import '@/assets/background.css';
import shindo0 from '@/assets/icon/shindo/0.svg';
import shindo1 from '@/assets/icon/shindo/1.svg';
import shindo2 from '@/assets/icon/shindo/2.svg';
import shindo3 from '@/assets/icon/shindo/3.svg';
import shindo4 from '@/assets/icon/shindo/4.svg';
import shindo5l from '@/assets/icon/shindo/5-.svg';
import shindo5u from '@/assets/icon/shindo/5+.svg';
import shindo6l from '@/assets/icon/shindo/6-.svg';
import shindo6u from '@/assets/icon/shindo/6+.svg';
import shindo7 from '@/assets/icon/shindo/7.svg';

const shindoIconUrls = {
    '0': shindo0,
    '1': shindo1,
    '2': shindo2,
    '3': shindo3,
    '4': shindo4,
    '5-': shindo5l,
    '5+': shindo5u,
    '6-': shindo6l,
    '6+': shindo6u,
    '7': shindo7,
}

const colorBand = {
    nied: [
        '#0003cf', 
        '#0014da', '#0037f0', '#006cdc', '#00b3a2', '#12dc72', 
        '#31f049', '#64fb2a', '#9dfe17', '#ccff09', '#ebff03', 
        '#fff500', '#ffe500', '#ffca00', '#ffa600', '#ff7e00', 
        '#ff5900', '#fd3500', '#f81100', '#e50000', '#bd0000'
    ],
    srev: [
        '#ffffff00', 
        '#ffffff11', '#ffffff33', '#ffffff66', '#ffffffaa', '#ffffffff', 
        '#31f049', '#64fb2a', '#9dfe17', '#ccff09', '#ebff03', 
        '#fff500', '#ffe500', '#ffca00', '#ffa600', '#ff7e00', 
        '#ff5900', '#fd3500', '#f81100', '#e50000', '#bd0000'
    ],
    mix: [
        '#0003cf00', 
        '#0014da11', '#0037f033', '#006cdc66', '#00b3a2aa', '#12dc72ff', 
        '#31f049', '#64fb2a', '#9dfe17', '#ccff09', '#ebff03', 
        '#fff500', '#ffe500', '#ffca00', '#ffa600', '#ff7e00', 
        '#ff5900', '#fd3500', '#f81100', '#e50000', '#bd0000'
    ]
}

const shindoColorBand = [
    'var(--dark-gray)', 'var(--dark-gray)', 'var(--dark-gray)', 'var(--dark-gray)', 'var(--dark-gray)', 'var(--dark-gray)', 
    'var(--dark-gray)', 'var(--dark-gray)', 
    'var(--gray)', 'var(--gray)', 
    'var(--blue)', 'var(--blue)', 
    'var(--green)', 'var(--green)', 
    'var(--yellow)', 'var(--yellow)', 
    'var(--orange)', 'var(--dark-orange)', 
    'var(--red)', 'var(--dark-red)', 
    'var(--purple)'
]

export const simpleShindo = ref(false)

const shindoIcons = {}
for(let zoom = 6; zoom <= 10; zoom ++) {
    const icons = {}
    const radius = 8 * 1.5 ** (zoom / 2 - 3)
    shindoScale.forEach(shindo => {
        const shindoIcon = L.icon({
            iconUrl: shindoIconUrls[shindo],
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius]
        })
        icons[shindo] = shindoIcon
    })
    shindoIcons[zoom] = icons
}

let settingsStore

class NiedStation {
    constructor(map, id, latLng, intensity, expireSeconds){
        if(!settingsStore) settingsStore = useSettingsStore()
        this.map = map
        this.id = id
        this.latLng = latLng
        this.defaultExpireSeconds = this.expireSeconds = expireSeconds
        this.shindo = getShindoFromChar(intensity)
        this.level = intensity.charCodeAt(0) - 100
        this.ascend = 0
        this.recentLevel = [this.level]
        this.activity = 0
        this.isActive = false
        this.markerType = null
        this.render()
    }
    update(intensity, render = true){
        const originLevel = intensity.charCodeAt(0) - 100
        const level = originLevel == -1 ? this.recentLevel.slice(0, 4).find(val => val != -1) ?? -1 : originLevel
        if(level > this.level && this.level != -1) this.expireSeconds ++
        else if(level < this.level || level == -1) this.expireSeconds = this.defaultExpireSeconds
        if(level != this.level){
            this.shindo = getShindoFromChar(intensity)
            this.level = level
            render && this.render()
        }
        let recentFilter = this.recentLevel.filter(val => val != -1)
        let ascend = 0
        if(recentFilter.length > 0){
            const minRecent = Math.min(...recentFilter)
            ascend = level - minRecent
        }
        this.ascend = ascend
        this.activity = this.calcActivity(level, ascend)
        this.recentLevel.unshift(originLevel)
        this.recentLevel.splice(this.expireSeconds)
        if(this.expireSeconds > this.defaultExpireSeconds && !this.isActive) {
            recentFilter = this.recentLevel.filter(val => val != -1)
            if(recentFilter.every(val => val == recentFilter[0])) {
                this.expireSeconds = this.defaultExpireSeconds
                this.recentLevel.splice(this.expireSeconds)
            }
        }
    }
    calcActivity(level, ascend){
        let levelActivity, ascendActivity
        if(ascend > 0 || this.isActive) {
            if(level <= 5) levelActivity = 0
            else if(level <= 7) {
                if(this.isActive) levelActivity = 0.5 * (level - 5)
                else levelActivity = 0
            }
            else if(level <= 11) levelActivity = 2 * (level - 7)
            else levelActivity = 6 * (level - 10)
        }
        else {
            levelActivity = 0
        }
        if(ascend <= 0) ascendActivity = 0
        else if(ascend <= 1) {
            if(this.isActive) ascendActivity = 0.5
            else ascendActivity = 0.25
        }
        else if(ascend <= 6) ascendActivity = 2 * (ascend - 2) + 1
        else ascendActivity = 6 * (ascend - 5)
        return levelActivity + ascendActivity
    }
    render(){
        const oldMarkerType = this.markerType
        const oldColor = this.color
        const oldRadius = this.radius
        this.setColorRadius()
        const zoom = this.map.getZoom()
        if(settingsStore.mainSettings.displaySeisNet.displayNiedShindo && this.level >= 6 && zoom >= 4){
            if(simpleShindo.value && zoom <= 8) {
                this.markerType = 1
            }
            else {
                this.markerType = 2
            }
        }
        else{
            this.markerType = 0
        }
        if(this.markerType == oldMarkerType && this.color == oldColor && this.radius == oldRadius) return
        if((this.markerType == 2) != (oldMarkerType == 2) || this.color != oldColor) {
            if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
            switch(this.markerType) {
                case 2:
                    const iconZoom = Math.min(Math.max(zoom, 6), 10)
                    const shindoIcon = shindoIcons[iconZoom][this.shindo]
                    this.marker = L.marker(this.latLng, {
                        icon: shindoIcon,
                        pane: `niedStationPane${this.level}`,
                        interactive: false
                    })
                    break
                case 1:
                    const color = shindoColorBand[this.level]
                    const radius = Math.min(Math.max(this.radius, 2), 4)
                    this.marker = L.circleMarker(this.latLng, {
                        radius: radius * 1.8,
                        opacity: 1,
                        fillOpacity: 1,
                        color: '#ffffff',
                        fillColor: color,
                        weight: radius * 0.4,
                        pane: `niedStationPane${this.level}`,
                        interactive: false
                    })
                    break
                case 0:
                    this.marker = L.circleMarker(this.latLng, {
                        radius: this.radius,
                        opacity: 1,
                        fillOpacity: 1,
                        color: this.color,
                        fillColor: this.color,
                        weight: 0,
                        pane: `niedStationPane${this.level}`,
                        interactive: false
                    })
                    break
            }
            this.marker.addTo(this.map)
        }
        else {
            switch(this.markerType) {
                case 2:
                    const iconZoom = Math.min(Math.max(zoom, 6), 10)
                    const shindoIcon = shindoIcons[iconZoom][this.shindo]
                    this.marker.setIcon(shindoIcon)
                    break
                case 1:
                    const color = shindoColorBand[this.level]
                    const radius = Math.min(Math.max(this.radius, 2), 4)
                    this.marker.setStyle({
                        color: '#ffffff',
                        fillColor: color,
                        weight: radius * 0.4,
                    }).setRadius(radius * 1.8)
                    break
                case 0:
                    this.marker.setStyle({
                        color: this.color,
                        fillColor: this.color,
                        weight: 0,
                    }).setRadius(this.radius)
                    break
            }
        }
    }
    setColorRadius(){
        const zoom = this.map.getZoom()
        switch(settingsStore.mainSettings.displaySeisNet.style) {
            case 'nied':
                if(this.level < 0 || this.level >= colorBand.nied.length){
                    if(settingsStore.mainSettings.displaySeisNet.hideNoData) this.color = '#cfcfcf00'
                    else this.color = '#cfcfcf'
                }
                else{
                    this.color = colorBand.nied[this.level]
                }
                this.radius = (this.level <= 5 ? 2 : 2.5) * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'srev':
                if(this.level < 0 || this.level >= colorBand.srev.length){
                    this.color = colorBand.srev[0]
                }
                else{
                    this.color = colorBand.srev[this.level]
                }
                this.radius = 2.5 * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'mix':
                if(this.level < 0 || this.level >= colorBand.mix.length){
                    this.color = colorBand.mix[0]
                }
                else{
                    this.color = colorBand.mix[this.level]
                }
                this.radius = 2.5 * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
        }
    }
    setActive(){
        this.isActive = true
        clearTimeout(this.activeTimer)
        this.activeTimer = setTimeout(() => {
            this.isActive = false
        }, 12500);
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        this.map = null
        this.marker = null
        clearTimeout(this.activeTimer)
    }
}
class TremStation {
    constructor(map, id, latLng, intensity, isActive){
        if(!settingsStore) settingsStore = useSettingsStore()
        this.map = map
        this.id = id
        this.latLng = latLng
        this.intensity = intensity
        this.shindo = getShindoFromInstShindo(intensity)
        this.level = getLevelFromInstShindo(intensity)
        this.isActive = isActive
        this.markerType = null
        this.render()
    }
    update(intensity, isActive, render = true){
        this.intensity = intensity
        const level = getLevelFromInstShindo(intensity)
        if(level != this.level){
            this.shindo = getShindoFromInstShindo(intensity)
            this.level = level
            render && this.render()
        }
        this.isActive = isActive
    }
    render(){
        const oldMarkerType = this.markerType
        const oldColor = this.color
        const oldRadius = this.radius
        this.setColorRadius()
        const zoom = this.map.getZoom()
        if(settingsStore.mainSettings.displaySeisNet.displayTremShindo && this.level >= 6 && zoom >= 4){
            if(simpleShindo.value && zoom <= 8) {
                this.markerType = 1
            }
            else {
                this.markerType = 2
            }
        }
        else{
            this.markerType = 0
        }
        if(this.markerType == oldMarkerType && this.color == oldColor && this.radius == oldRadius) return
        if((this.markerType == 2) != (oldMarkerType == 2) || this.color != oldColor) {
            if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
            switch(this.markerType) {
                case 2:
                    const iconZoom = Math.min(Math.max(zoom, 6), 10)
                    const shindoIcon = shindoIcons[iconZoom][this.shindo]
                    this.marker = L.marker(this.latLng, {
                        icon: shindoIcon,
                        pane: `tremStationPane${this.level}`,
                        interactive: false
                    })
                    break
                case 1:
                    const color = shindoColorBand[this.level]
                    const radius = Math.min(Math.max(this.radius, 2), 4)
                    this.marker = L.circleMarker(this.latLng, {
                        radius: radius * 1.8,
                        opacity: 1,
                        fillOpacity: 1,
                        color: '#ffffff',
                        fillColor: color,
                        weight: radius * 0.4,
                        pane: `tremStationPane${this.level}`,
                        interactive: false
                    })
                    break
                case 0:
                    this.marker = L.circleMarker(this.latLng, {
                        radius: this.radius,
                        opacity: 1,
                        fillOpacity: 1,
                        color: this.color,
                        fillColor: this.color,
                        weight: 0,
                        pane: `tremStationPane${this.level}`,
                        interactive: false
                    })
                    break
            }
            this.marker.addTo(this.map)
        }
        else {
            switch(this.markerType) {
                case 2:
                    const iconZoom = Math.min(Math.max(zoom, 6), 10)
                    const shindoIcon = shindoIcons[iconZoom][this.shindo]
                    this.marker.setIcon(shindoIcon)
                    break
                case 1:
                    const color = shindoColorBand[this.level]
                    const radius = Math.min(Math.max(this.radius, 2), 4)
                    this.marker.setStyle({
                        color: '#ffffff',
                        fillColor: color,
                        weight: radius * 0.4,
                    }).setRadius(radius * 1.8)
                    break
                case 0:
                    this.marker.setStyle({
                        color: this.color,
                        fillColor: this.color,
                        weight: 0,
                    }).setRadius(this.radius)
                    break
            }
        }
    }
    setColorRadius(){
        const zoom = this.map.getZoom()
        switch(settingsStore.mainSettings.displaySeisNet.style) {
            case 'nied':
                if(this.level < 0 || this.level >= colorBand.nied.length){
                    if(settingsStore.mainSettings.displaySeisNet.hideNoData) this.color = '#cfcfcf00'
                    else this.color = '#cfcfcf'
                }
                else{
                    this.color = colorBand.nied[this.level]
                }
                this.radius = (this.level <= 5 ? 2 : 2.5) * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'srev':
                if(this.level < 0 || this.level >= colorBand.srev.length){
                    this.color = colorBand.srev[0]
                }
                else{
                    this.color = colorBand.srev[this.level]
                }
                this.radius = 2.5 * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'mix':
                if(this.level < 0 || this.level >= colorBand.mix.length){
                    this.color = colorBand.mix[0]
                }
                else{
                    this.color = colorBand.mix[this.level]
                }
                this.radius = 2.5 * 2 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
        }
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        this.map = null
        this.marker = null
    }
}
export { NiedStation, TremStation }