const formatNumber = (value, digit)=>{
    if(value){
        if(digit) return value.toFixed(digit)
        else return value
    }
    else {
        return 'N/A'
    }
}
const formatText = (text)=>{
    if(text){
        return text
    }
    else {
        return 'N/A'
    }
}
const msToTime = (duration)=>{
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
const calcPassedTime = (time, timeZone)=>{
    if(!time || !timeZone) return
    let date1 = Date.now()
    let isoTime = time.replace(' ', 'T').replace(/\//g, '-') + 'Z'
    let date2 = new Date(isoTime).getTime()
    date2 -= timeZone * 3600 * 1000
    return Math.abs(date1 - date2)
}
const compareTime = (time, timeZone, interval)=>{
    if(!time || !timeZone || !interval) return
    return calcPassedTime(time, timeZone) <= interval
}
const sendNotification = (title, body, icon, silent)=>{
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
const setClassName = (intensity, useShindo, isCanceled = false)=>{
    let className = 'gray'
    if(!isCanceled){
        if(useShindo){
            if(intensity >= '1' && intensity <= '7'){
                if(intensity >= '1') className = 'gray'
                if(intensity >= '2') className = 'blue'
                if(intensity >= '3') className = 'green'
                if(intensity >= '4') className = 'yellow'
                if(intensity >= '5') className = 'orange'
                if(intensity >= '6') className = 'red'
                if(intensity >= '7') className = 'purple'
            }
        }
        else{
            if(Number(intensity) >= 1 && Number(intensity) <= 12){
                if(Number(intensity) >= 1) className = 'gray'
                if(Number(intensity) >= 3) className = 'blue'
                if(Number(intensity) >= 5) className = 'green'
                if(Number(intensity) >= 6) className = 'yellow'
                if(Number(intensity) >= 7) className = 'orange'
                if(Number(intensity) >= 8) className = 'red'
                if(Number(intensity) >= 9) className = 'purple'
            }
        }
    }
    return className
}
const playSound = (url)=>{
    const audio = new Audio(url)
    audio.play()
}
const calcWaveDistance = (travelTime, isPWave, depth, time)=>{
    const { depths, distances } = travelTime
    let data
    if(isPWave) {
        data = travelTime.p_times
    }
    else {
        data = travelTime.s_times
    }
    let i = 0
    while(depths[i] < depth && i < depths.length - 1) i++
    if(i == 0) i = 1
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

export { formatNumber, formatText, msToTime, calcPassedTime, compareTime, sendNotification, setClassName, playSound, calcWaveDistance }