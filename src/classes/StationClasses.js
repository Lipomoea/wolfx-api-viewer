import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCsisLevelFromCsis, getLevelFromInstShindo, getMmiFromKmaLevel, getShindoFromChar, getShindoFromInstShindo, intScale, shindoScale } from '@/utils/Utils';
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
import int0 from '@/assets/icon/intensity/0.svg';
import int1 from '@/assets/icon/intensity/1.svg';
import int2 from '@/assets/icon/intensity/2.svg';
import int3 from '@/assets/icon/intensity/3.svg';
import int4 from '@/assets/icon/intensity/4.svg';
import int5 from '@/assets/icon/intensity/5.svg';
import int6 from '@/assets/icon/intensity/6.svg';
import int7 from '@/assets/icon/intensity/7.svg';
import int8 from '@/assets/icon/intensity/8.svg';
import int9 from '@/assets/icon/intensity/9.svg';
import int10 from '@/assets/icon/intensity/10.svg';
import int11 from '@/assets/icon/intensity/11.svg';
import int12 from '@/assets/icon/intensity/12.svg';

export const shindoIconUrls = {
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

const intIconUrls = {
    '0': int0,
    '1': int1,
    '2': int2,
    '3': int3,
    '4': int4,
    '5': int5,
    '6': int6,
    '7': int7,
    '8': int8,
    '9': int9,
    '10': int10,
    '11': int11,
    '12': int12,
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

const kmaColorBand = {
    nied: [
        '#0003cf', '#004ff4', '#05d384', '#50fb30', '#ccff09', 
        '#fdfc00', '#ffca00', '#ff7900', '#ff4700', '#f91900', 
        '#e10000', '#af0000', '#ae0000', '#ad0000'
    ],
    srev: [
        '#ffffff00', '#ffffff44', '#ffffff99', '#ffffffff', '#ccff09', 
        '#fdfc00', '#ffca00', '#ff7900', '#ff4700', '#f91900', 
        '#e10000', '#af0000', '#ae0000', '#ad0000'
    ],
    mix: [
        '#0003cf00', '#004ff444', '#05d38499', '#50fb30ff', '#ccff09', 
        '#fdfc00', '#ffca00', '#ff7900', '#ff4700', '#f91900', 
        '#e10000', '#af0000', '#ae0000', '#ad0000'
    ]
}

export const shindoColorBand = [
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

const kmaIntColorBand = [
    'var(--dark-gray)', 'var(--dark-gray)', 'var(--dark-gray)', 'var(--dark-gray)', 
    'var(--gray)', 
    'var(--sky-blue)', 
    'var(--blue)', 
    'var(--green)', 
    'var(--yellow)', 
    'var(--orange)', 
    'var(--dark-orange)', 
    'var(--red)', 
    'var(--purple)',
    'var(--purple)'
]

export const simpleIcon = ref(false)

const shindoIcons = {}, intIcons = {}
for(let zoom = 6; zoom <= 10; zoom ++) {
    let icons = {}
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
    icons = {}
    intScale.forEach(int => {
        const intIcon = L.icon({
            iconUrl: intIconUrls[int],
            iconSize: [radius * 2, radius * 2],
            iconAnchor: [radius, radius]
        })
        icons[int] = intIcon
    })
    intIcons[zoom] = icons
}

let settingsStore
export const abnormalNiedStations = {}

const getNiedColorRadius = (level, zoom) => {
    const style = settingsStore.mainSettings.displaySeisNet.style
    let color, radius
    switch(style) {
        case 'nied':
            if(level < 0 || level >= colorBand.nied.length){
                if(settingsStore.mainSettings.displaySeisNet.hideNoData) color = '#cfcfcf00'
                else color = '#cfcfcf'
            }
            else{
                color = colorBand.nied[level]
            }
            radius = (level <= 5 ? 2 : 2.5) * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
            break
        case 'srev':
            if(level < 0 || level >= colorBand.srev.length){
                color = colorBand.srev[0]
            }
            else{
                color = colorBand.srev[level]
            }
            radius = 2.5 * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
            break
        case 'mix':
            if(level < 0 || level >= colorBand.mix.length){
                color = colorBand.mix[0]
            }
            else{
                color = colorBand.mix[level]
            }
            radius = 2.5 * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
            break
    }
    return { color, radius }
}
const getNiedMarkerType = (level, zoom) => {
    if(settingsStore.mainSettings.displaySeisNet.displayNiedShindo && level >= (settingsStore.mainSettings.displaySeisNet.displayShindo0 ? 6 : 8) && zoom >= 4){
        return simpleIcon.value ? 1 : 2
    }
    return 0
}

export class NiedStation {
    constructor(map, id, latLng, intensity, expireSeconds, useCanvasLayer = false){
        if(!settingsStore) settingsStore = useSettingsStore()
        this.map = map
        this.id = id
        this.latLng = latLng
        this.expireSeconds = expireSeconds
        this.useCanvasLayer = useCanvasLayer
        this.maxRecentLength = 60
        this.shindo = getShindoFromChar(intensity)
        this.level = intensity.charCodeAt(0) - 100
        this.updateStamp = 0
        this.triggerStamp = 0
        this.ascend = 0
        this.recentLevel = []
        this.activity = 0
        this.isActive = false
        this.markerType = null
        if(!this.useCanvasLayer) this.render()
    }
    update(intensity, updateStamp, render = true){
        this.updateStamp = updateStamp
        const originLevel = intensity.charCodeAt(0) - 100
        const level = originLevel == -1 ? this.recentLevel.slice(0, 4).find(val => val != -1) ?? -1 : originLevel
        if(level != this.level){
            this.shindo = getShindoFromChar(intensity)
            this.level = level
            render && !this.useCanvasLayer && this.render()
        }
        this.recentLevel.unshift(originLevel)
        this.recentLevel.splice(this.maxRecentLength)
        let ascend = 0
        let triggerStamp = 0
        if(this.isAbnormalStation()) {
            if(!(this.id in abnormalNiedStations))
                console.log(`已忽略异常NIED测站: id: ${this.id}, latLng: ${this.latLng}`);
            abnormalNiedStations[this.id] = 0
        }
        else {
            if(this.id in abnormalNiedStations) {
                abnormalNiedStations[this.id]++
                if(abnormalNiedStations[this.id] >= 600) {
                    delete abnormalNiedStations[this.id]
                }
            }
            else {
                const ascendResult = this.calcAscend()
                ascend = ascendResult.ascend
                triggerStamp = ascendResult.triggerStamp
            }
        }
        this.ascend = ascend
        this.triggerStamp = ascend > 0 ? triggerStamp : 0
        this.activity = this.calcActivity(level, ascend)
    }
    calcAscend() {
        const arr = [...this.recentLevel];
        if (arr.length === 0) {
            return { ascend: 0, triggerStamp: 0 };
        }
        let i = 0;
        fillNan: while (i < arr.length) {
            if (arr[i] === -1) {
                let nanCount = 1;
                let nextValidIndex = i + 1;
                while (nextValidIndex < arr.length && arr[nextValidIndex] === -1) {
                    nanCount++;
                    if (nanCount > this.expireSeconds) {
                        arr.splice(i);
                        break fillNan;
                    }
                    nextValidIndex++;
                }
                if (nextValidIndex < arr.length) {
                    arr[i] = arr[nextValidIndex];
                    i++;
                } else {
                    arr.splice(i);
                    break;
                }
            } else {
                i++;
            }
        }
        if (arr.length === 0) {
            return { ascend: 0, triggerStamp: 0 };
        }

        let latestMinVal = arr[0];
        let latestMinIndex = 0;
        let identicalCount = 1;
        for (let i = 0; i < arr.length - 1; i++) {
            const current = arr[i];
            const next = arr[i + 1];
            if (next < current) {
                latestMinVal = next;
                latestMinIndex = i + 1;
                identicalCount = 1;
            } else if (next > current) {
                break;
            } else {
                identicalCount++;
                if (identicalCount > this.expireSeconds) {
                    break;
                }
            }
        }
        const ascend = this.level - latestMinVal;
        const triggerStamp = ascend > 0 ? this.updateStamp - latestMinIndex * 1000 : 0;
        return { ascend, triggerStamp };
    }
    isAbnormalStation() {
        // 如果近期数据出现3个及以上的高峰视为异常数据
        const recentFilter = this.recentLevel.filter(val => val != -1);
        if (recentFilter.length < 3) {
            return false;
        }
        let peakCount = 0;
        let i = 1;
        const n = recentFilter.length;
        while (i < n) {
            while (i < n && recentFilter[i] <= recentFilter[i - 1]) {
                i++;
            }
            if (i >= n) break; 
            let leftBottom = recentFilter[i - 1]; 
            let top = recentFilter[i];
            while (i < n && recentFilter[i] >= recentFilter[i - 1]) {
                top = recentFilter[i];
                i++;
            }
            if (i >= n) break; 
            let rightBottom = recentFilter[i];
            while (i < n && recentFilter[i] <= recentFilter[i - 1]) {
                rightBottom = recentFilter[i];
                i++;
            }
            if (top - leftBottom >= 3 && top - rightBottom >= 3) {
                peakCount++;
            }
        }
        return peakCount >= 3;
    }
    calcActivity(level, ascend){
        let levelActivity, ascendActivity
        if(ascend > 0 || this.isActive) {
            if(level <= 5) levelActivity = 0
            else if(level <= 7) {
                if(this.isActive) levelActivity = 0.5 * (level - 5)
                else levelActivity = 0.25 * (level - 5)
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
        if(this.useCanvasLayer) return
        const oldMarkerType = this.markerType
        const oldColor = this.color
        const oldRadius = this.radius
        this.setColorRadius()
        const zoom = this.map.getZoom()
        if(settingsStore.mainSettings.displaySeisNet.displayNiedShindo && this.level >= (settingsStore.mainSettings.displaySeisNet.displayShindo0 ? 6 : 8) && zoom >= 4){
            this.markerType = simpleIcon.value ? 1 : 2
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
                    const radius = Math.max(this.radius, 2)
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
                    const radius = Math.max(this.radius, 2)
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
        const { color, radius } = getNiedColorRadius(this.level, zoom)
        this.color = color
        this.radius = radius
    }
    getCanvasDrawInfo(zoom = this.map.getZoom()){
        if(!settingsStore) settingsStore = useSettingsStore()
        const { color, radius } = getNiedColorRadius(this.level, zoom)
        return {
            latLng: this.latLng,
            level: this.level,
            shindo: this.shindo,
            color,
            radius,
            markerType: getNiedMarkerType(this.level, zoom)
        }
    }
    setActive(){
        this.isActive = true
        clearTimeout(this.activeTimer)
        this.activeTimer = setTimeout(() => {
            this.isActive = false
        }, 10500);
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        this.map = null
        this.marker = null
        clearTimeout(this.activeTimer)
    }
}
export class TremStation {
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
        if(settingsStore.mainSettings.displaySeisNet.displayTremShindo && this.level >= (settingsStore.mainSettings.displaySeisNet.displayShindo0 ? 6 : 8) && zoom >= 4){
            this.markerType = simpleIcon.value ? 1 : 2
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
                    const radius = Math.max(this.radius, 2)
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
                    const radius = Math.max(this.radius, 2)
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
                this.radius = (this.level <= 5 ? 2 : 2.5) * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'srev':
                if(this.level < 0 || this.level >= colorBand.srev.length){
                    this.color = colorBand.srev[0]
                }
                else{
                    this.color = colorBand.srev[this.level]
                }
                this.radius = 2.5 * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'mix':
                if(this.level < 0 || this.level >= colorBand.mix.length){
                    this.color = colorBand.mix[0]
                }
                else{
                    this.color = colorBand.mix[this.level]
                }
                this.radius = 2.5 * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
        }
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        this.map = null
        this.marker = null
    }
}
export class KmaStation {
    constructor(map, id, latLng, intensity, isActive){
        if(!settingsStore) settingsStore = useSettingsStore()
        this.map = map
        this.id = id
        this.latLng = latLng
        this.level = intensity + 2
        this.recentLevel = []
        this.recentSeconds = 60
        this.activityLevel = this.level
        this.activitySeconds = 12
        this.holdLevel = this.level
        this.ascend = false
        this.intensity = getMmiFromKmaLevel(this.holdLevel)
        this.isActive = isActive
        this.render()
    }
    update(intensity, render = true){
        this.level = intensity + 2
        this.recentLevel.unshift(this.level)
        this.recentLevel.splice(this.recentSeconds)
        const activityArr = this.recentLevel.slice(0, this.activitySeconds)
        const pastArr = this.recentLevel.slice(this.activitySeconds)
        this.activityLevel = Math.max(...activityArr, -1)
        const pastLevel = pastArr.filter(level => level >= 0).length >= this.activitySeconds * 3 ? Math.max(...pastArr, -1) : -1
        this.ascend = pastLevel >= 0 ? activityArr.filter(level => level > pastLevel).length : 0
        const holdLevel = Math.max(...this.recentLevel.slice(0, settingsStore.mainSettings.displaySeisNet.kmaIntHold), -1)
        if(holdLevel != this.holdLevel) {
            this.holdLevel = holdLevel
            this.intensity = getMmiFromKmaLevel(this.holdLevel)
            render && this.render()
        }
    }
    render(){
        const oldMarkerType = this.markerType
        const oldColor = this.color
        const oldRadius = this.radius
        this.setColorRadius()
        const zoom = this.map.getZoom()
        if(settingsStore.mainSettings.displaySeisNet.displayKmaInt && this.holdLevel >= (settingsStore.mainSettings.displaySeisNet.displayShindo0 ? 3 : 4) && zoom >= 4){
            this.markerType = simpleIcon.value ? 1 : 2
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
                    const intIcon = intIcons[iconZoom][this.intensity]
                    this.marker = L.marker(this.latLng, {
                        icon: intIcon,
                        pane: `kmaStationPane${this.holdLevel}`,
                        interactive: false
                    })
                    break
                case 1:
                    const color = kmaIntColorBand[this.holdLevel]
                    const radius = Math.max(this.radius, 2)
                    this.marker = L.circleMarker(this.latLng, {
                        radius: radius * 1.8,
                        opacity: 1,
                        fillOpacity: 1,
                        color: '#ffffff',
                        fillColor: color,
                        weight: radius * 0.4,
                        pane: `kmaStationPane${this.holdLevel}`,
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
                        pane: `kmaStationPane${this.holdLevel}`,
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
                    const intIcon = intIcons[iconZoom][this.intensity]
                    this.marker.setIcon(intIcon)
                    break
                case 1:
                    const color = kmaIntColorBand[this.holdLevel]
                    const radius = Math.max(this.radius, 2)
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
                if(this.holdLevel < 0 || this.holdLevel >= kmaColorBand.nied.length){
                    if(settingsStore.mainSettings.displaySeisNet.hideNoData) this.color = '#cfcfcf00'
                    else this.color = '#cfcfcf'
                }
                else{
                    this.color = kmaColorBand.nied[this.holdLevel]
                }
                this.radius = (this.holdLevel <= 2 ? 2 : 2.5) * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'srev':
                if(this.holdLevel < 0 || this.holdLevel >= kmaColorBand.srev.length){
                    this.color = kmaColorBand.srev[0]
                }
                else{
                    this.color = kmaColorBand.srev[this.holdLevel]
                }
                this.radius = 2.5 * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
                break
            case 'mix':
                if(this.holdLevel < 0 || this.holdLevel >= kmaColorBand.mix.length){
                    this.color = kmaColorBand.mix[0]
                }
                else{
                    this.color = kmaColorBand.mix[this.holdLevel]
                }
                this.radius = 2.5 * 1.8 ** (Math.min(Math.max(zoom, 4), 10) / 2 - 3)
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
export class intReportStation {
    constructor(map, id, latLng, detail){
        if(!settingsStore) settingsStore = useSettingsStore()
        this.map = map
        this.id = id
        this.latLng = latLng
        this.detail = detail
        this.intensity = getCsisLevelFromCsis(detail.INT)
        this.render()
    }
    render(){
        const zoom = this.map.getZoom()
        const iconZoom = Math.min(Math.max(zoom, 6), 10)
        const intIcon = intIcons[iconZoom][this.intensity]
        if(this.marker) {
            this.marker.setIcon(intIcon)
        }
        else {
            this.marker = L.marker(this.latLng, {
                icon: intIcon,
                pane: `intReportStationPane${this.intensity}`,
                interactive: true
            })
            this.marker.bindTooltip(`
                <strong>${this.detail.stName} (${this.detail.stID})</strong>
                <br>
                地点: ${this.detail.Province + this.detail.City + this.detail.County + this.detail.Town}
                <br>
                经纬度: ${this.detail.stla.toFixed(2)}°N, ${this.detail.stlo.toFixed(2)}°E
                <br>
                震中距: ${this.detail.Dist.toFixed(2)} km
                <br>
                仪器烈度: ${this.detail.INT.toFixed(1)} (I_PGA: ${this.detail.IPGA.toFixed(1)}, I_PGV: ${this.detail.IPGV.toFixed(1)})
                <br>
                PGA: ${this.detail.PGA.toFixed(1)} gal
                <br>
                PGV: ${this.detail.PGV.toFixed(1)} kine
            `, { permanent: false, direction: 'top', className: 'custom-tooltip' })
            this.marker.addTo(this.map)
        }
    }
    terminate(){
        if(this.marker && this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker)
        this.map = null
        this.marker = null
    }
}
