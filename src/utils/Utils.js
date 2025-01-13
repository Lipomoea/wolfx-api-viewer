import { useTimeStore } from "@/stores/time";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { booleanPointInPolygon, point, polygonToLine, pointToLineDistance, area, distance, centroid } from "@turf/turf";

export const formatNumber = (value, digit)=>{
    if(value){
        if(digit) return value.toFixed(digit)
        else return value
    }
    else {
        return 'N/A'
    }
}
export const formatText = (text)=>{
    if(text){
        return text
    }
    else {
        return 'N/A'
    }
}
export const msToTime = (duration)=>{
    if(!duration) return
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    let days = Math.floor(duration / (1000 * 60 * 60 * 24))
  
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return days + "d " + hours + ":" + minutes + ":" + seconds;
}
export const timeToStamp = (time, timeZone)=>{
    let isoTime = time.replace(' ', 'T').replace(/\//g, '-') + 'Z'
    let splitIso = isoTime.split('-')
    if(splitIso[1].length == 1) splitIso[1] = '0' + splitIso[1]
    if(splitIso[2].split('T')[0].length == 1) splitIso[2] = '0' + splitIso[2]
    isoTime = splitIso.join('-')
    splitIso = isoTime.split('T')
    if(splitIso[1].split(':')[0].length == 1) splitIso[1] = '0' + splitIso[1]
    isoTime = splitIso.join('T')
    let stamp = new Date(isoTime).getTime()
    stamp -= timeZone * 3600 * 1000
    return stamp
}
export const stampToTime = (timeStamp, timeZone) => {
    return new Date(timeStamp + timeZone * 3600 * 1000).toISOString().replace('T', ' ').slice(0, -5)
}
export const calcPassedTime = (time, timeZone)=>{
    if(!time || !timeZone) return
    const timeStore = useTimeStore()
    let stamp1 = Date.now() + timeStore.offset
    let stamp2 = timeToStamp(time, timeZone)
    return stamp1 - stamp2
}
export const verifyUpToDate = (time, timeZone, interval)=>{
    if(!time || !timeZone || !interval) return
    return calcPassedTime(time, timeZone) <= interval
}
export const calcTimeDiff = (time1, timeZone1, time2, timeZone2)=>{
    if(!time1 || !timeZone1 || !time2 || !timeZone2) return
    let stamp1 = timeToStamp(time1, timeZone1)
    let stamp2 = timeToStamp(time2, timeZone2)
    return stamp1 - stamp2
}
export const sendMyNotification = (title, body, icon, silent)=>{
    if('Notification' in window){
        if(Notification.permission == 'granted'){
            const notification = new Notification(title, {
                body,
                icon,
                silent,
            })
            notification.onclick = ()=>{
                window.focus()
            }
        }
    }
}
export const setClassName = (intensity, useShindo, isCanceled = false)=>{
    let className = 'dark-gray'
    if(!isCanceled){
        if(useShindo){
            if(intensity >= '1' && intensity <= '7'){
                if(intensity == '1') className = 'gray'
                if(intensity == '2') className = 'blue'
                if(intensity == '3') className = 'green'
                if(intensity == '4') className = 'yellow'
                if(intensity == '5-' || intensity == '5弱') className = 'orange'
                if(intensity == '5+' || intensity == '5強') className = 'dark-orange'
                if(intensity == '6-' || intensity == '6弱') className = 'red'
                if(intensity == '6+' || intensity == '6強') className = 'dark-red'
                if(intensity == '7') className = 'purple'
            }
        }
        else{
            const numIntensity = Math.round(Number(intensity))
            if(numIntensity >= 1 && numIntensity <= 12){
                if(numIntensity == 1) className = 'dark-gray'
                if(numIntensity == 2) className = 'gray'
                if(numIntensity == 3) className = 'sky-blue'
                if(numIntensity == 4) className = 'blue'
                if(numIntensity == 5) className = 'green'
                if(numIntensity == 6) className = 'yellow'
                if(numIntensity == 7) className = 'orange'
                if(numIntensity == 8) className = 'dark-orange'
                if(numIntensity == 9) className = 'red'
                if(numIntensity >= 10) className = 'purple'
            }
        }
    }
    return className
}
export const classNameArray = ['dark-gray', 'gray', 'sky-blue', 'blue', 'green', 'yellow', 'orange', 'dark-orange', 'red', 'dark-red', 'purple']
export const csisArray = ['<1', '2', '3', '4', '5', '6', '7', '8', '9', '', '>10']
export const shindoArray = ['', '1', '', '2', '3', '4', '5-', '5+', '6-', '6+', '7']
export const getClassLevel = (className)=>{
    return classNameArray.indexOf(className)
}
export const playSound = (url)=>{
    const audio = new Audio(url)
    audio.play()
}
export const calcWaveDistance = (travelTime, isPWave, depth, time)=>{
    const { depths, distances } = travelTime
    let data
    if(isPWave) {
        data = travelTime.p_times
    }
    else {
        data = travelTime.s_times
    }
    let i = 1
    while(depths[i] < depth && i < depths.length - 1) i++
    if(depth <= (depths[i - 1] + depths[i]) / 2) i--
    const times = data[i]
    if(time <= times[0]) return { reach: times[0] - time, radius: 0 }
    let j = 1
    while(times[j] < time && j < times.length - 1) j++
    const k = (distances[j] - distances[j - 1]) / (times[j] - times[j - 1])
    const b = distances[j] - k * times[j]
    const distance = k * time + b
    return { reach: 0, radius: distance }
}
export const calcReachTime = (travelTime, isPWave, depth, distance)=>{
    const { depths, distances } = travelTime
    let data
    if(isPWave) {
        data = travelTime.p_times
    }
    else {
        data = travelTime.s_times
    }
    let i = 1
    while(depths[i] < depth && i < depths.length - 1) i++
    if(depth <= (depths[i - 1] + depths[i]) / 2) i--
    const times = data[i]
    let j = 1
    while(distances[j] < distance && j < distances.length - 1) j++
    const k = (times[j] - times[j - 1]) / (distances[j] - distances[j - 1])
    const b = times[j] - k * distances[j]
    const time = k * distance + b
    return time
}
export const extractNumbers = (str)=>{
    let numberString = ''
    for(let i = 0; i < str.length; i++){
        if(str[i] >= '0' && str[i] <= '9') numberString += str[i]
    }
    return numberString
}
export const getTimeNumberString = (timeZone, offset)=>{
    const timeStore = useTimeStore()
    const now = new Date(Date.now() + timeStore.offset + timeZone * 3600 * 1000 + offset);
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
export const getShindoFromChar = (char)=>{
    if(char >= 'd' && char <= 'k') return '0'
    if(char >= 'l' && char <= 'm') return '1'
    if(char >= 'n' && char <= 'o') return '2'
    if(char >= 'p' && char <= 'q') return '3'
    if(char >= 'r' && char <= 's') return '4'
    if(char == 't') return '5-'
    if(char == 'u') return '5+'
    if(char == 'v') return '6-'
    if(char == 'w') return '6+'
    if(char == 'x') return '7'
    return '?'
}
export const getShindoFromInstShindo = (instShindo) => {
    if(instShindo < -3.0) return '?'
    else if(instShindo < 0.5) return '0'
    else if(instShindo < 1.5) return '1'
    else if(instShindo < 2.5) return '2'
    else if(instShindo < 3.5) return '3'
    else if(instShindo < 4.5) return '4'
    else if(instShindo < 5.0) return '5-'
    else if(instShindo < 5.5) return '5+'
    else if(instShindo < 6.0) return '6-'
    else if(instShindo < 6.5) return '6+'
    else return '7'
}
export const getLevelFromInstShindo = (instShindo) => {
    if(instShindo < -3.0) return -1
    else if(instShindo == -3.0) return 0
    else if(instShindo >= 6.5) return 20
    else return Math.floor(instShindo * 2 + 7)
}
export const judgeSameEvent = (eqMessage1, eqMessage2)=>{
    if(eqMessage1.source == eqMessage2.source && eqMessage1.id == eqMessage2.id) return true
    else return false
}
export const focusWindow = async ()=>{
    if(window.__TAURI_INTERNALS__){
        await getCurrentWindow().show()
        await getCurrentWindow().unminimize()
        await getCurrentWindow().setFocus()
    }
}
export const pointDistToPolygon = (pointLatLng, feature)=>{
    const turfPoint = point([pointLatLng[1], pointLatLng[0]])
    if(booleanPointInPolygon(turfPoint, feature)){
        return 0
    }
    else{
        const features = polygonToLine(feature).features
        if(!features) {
            const turfCentroid = centroid(feature)
            const distToCent = distance(turfPoint, turfCentroid, { units: "kilometers" })
            const featArea = area(feature) / 10 ** 6
            const radius = Math.sqrt(featArea / Math.PI)
            const dist = Math.max(distToCent - radius, 0)
            return dist
        }
        const polygonLine = features[0]
        const dist = pointToLineDistance(turfPoint, polygonLine, { units: "kilometers" })
        return dist
    }
}
export const calcCsis = (m, dep, dis) => {
    if (isNaN(m) || isNaN(dep) || isNaN(dis)) return 0;
    if (dis > 10000) return 0;
    dep = dep >= 10 ? dep : (Math.max(dep, 0) + 10) / 2;
    const r = 6371;
    const theta = dis / r;
    const a = r - dep;
    const lineDis = Math.sqrt(a * a + r * r - 2 * a * r * Math.cos(theta));
    const k = 1 - 0.7 / Math.sqrt(dep / 10)
    const hypoDis = lineDis - k * dep;
    return (m * 1.363 + 2.941 - Math.log(hypoDis) * 1.494);
}
export const calcCsisLevel = (m, dep, dis) => Math.min(Math.max(calcCsis(m, dep, dis), 0), 12).toFixed(0)