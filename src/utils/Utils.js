const formatNumber = (value, digit)=>{
    if(value){
        if(digit) return value.toFixed(digit)
        else return value
    }
    else {
        return 'N/A'
    }
}
const compareTime = (time1, time2, interval)=>{
    if(!time1 || !time2 || !interval) return
    time1 = time1.replace(' ', 'T')
    time2 = time2.replace(' ', 'T')
    const date1 = new Date(time1).getTime()
    const date2 = new Date(time2).getTime()
    return Math.abs(date1 - date2) < interval * 1000
}
export {formatNumber, compareTime}