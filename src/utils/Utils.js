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
export {formatNumber, formatText, calcPassedTime, compareTime}