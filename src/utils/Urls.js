const eqUrls = {
    scEew_http: 'https://api.wolfx.jp/sc_eew.json',
    scEew_ws: 'wss://ws-api.wolfx.jp/sc_eew',
    jmaEew_http: 'https://api.wolfx.jp/jma_eew.json',
    jmaEew_ws: 'wss://ws-api.wolfx.jp/jma_eew',
    fjEew_http: 'https://api.wolfx.jp/fj_eew.json',
    fjEew_ws: 'wss://ws-api.wolfx.jp/fj_eew',
    cwaEew_http: 'https://api.wolfx.jp/cwa_eew.json',
    cwaEew_ws: 'wss://ws-api.wolfx.jp/cwa_eew',
    cencEqlist_http: 'https://api.wolfx.jp/cenc_eqlist.json',
    cencEqlist_ws: 'wss://ws-api.wolfx.jp/cenc_eqlist',
    jmaEqlist_http: 'https://api.wolfx.jp/jma_eqlist.json',
    jmaEqlist_ws: 'wss://ws-api.wolfx.jp/jma_eqlist',
    cwaEqlist_http: 'https://api-2.exptech.dev/api/v2/eq/report?limit=50',
    allEew_ws: 'wss://ws-api.wolfx.jp/all_eew'
}
const seisNetUrls = {
    nied: {
        stationList: 'https://weather-kyoshin.east.edge.storage-yahoo.jp/SiteList/sitelist.json',
        stationData: 'https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData'
    },
    trem: {
        stationList: 'https://api-2.exptech.dev/api/v1/trem/station',
        stationData: 'https://api-2.exptech.dev/api/v1/trem/rts'
    }
}
const iconUrls = {
    info: '/icon/info.png',
    caution: '/icon/caution.png',
    warn: '/icon/warn.png',
}
const shindoIconUrls = {
    '0': '/icon/shindo/0.svg',
    '1': '/icon/shindo/1.svg',
    '2': '/icon/shindo/2.svg',
    '3': '/icon/shindo/3.svg',
    '4': '/icon/shindo/4.svg',
    '5-': '/icon/shindo/5-.svg',
    '5+': '/icon/shindo/5+.svg',
    '6-': '/icon/shindo/6-.svg',
    '6+': '/icon/shindo/6+.svg',
    '7': '/icon/shindo/7.svg',
}
const chimeUrls = {
    general: {
        countdown: '/sound/general/countdown.wav'
    },
    srev: {
        happyou: '/sound/srev/happyou.mp3',
        yohou: '/sound/srev/yohou.mp3',
        keihou: '/sound/srev/keihou.mp3',
        koushin: '/sound/srev/koushin.mp3',
        saisyuu: '/sound/srev/saisyuu.mp3',
        torikeshi: '/sound/srev/torikeshi.mp3',
        shindosokuhou: '/sound/srev/shindosokuhou.mp3',
        shingenzyouhou: '/sound/srev/shingenzyouhou.mp3',
        jishinzyouhou: '/sound/srev/jishinzyouhou.mp3',
        shindo0:'/sound/srev/shindo0.mp3',
        shindo1:'/sound/srev/shindo1.mp3',
        shindo2:'/sound/srev/shindo2.mp3',
        shindo3:'/sound/srev/shindo3.mp3',
        shindo4:'/sound/srev/shindo4.mp3',
        shindo5:'/sound/srev/shindo5.mp3',
        shindo6:'/sound/srev/shindo6.mp3',
        shindo7:'/sound/srev/shindo6.mp3',
    },
}
const geojsonUrls = {
    global: '/json/medium.global.modified.geo.json',
    cn: '/json/cn.province.geo.json',
    cn_eew: '/json/cn.eew.geo.json',
    cn_fault: '/json/cn.fault.modified.geo.json',
    jp: '/json/jp.pref.geo.json',
    jp_eew: '/json/jp.eew.geo.json',
}
const utilUrls = {
    geoIp: 'https://api.wolfx.jp/geoip.php',
    ntpTime: 'https://worldtimeapi.org/api/timezone/Asia/Hong_Kong',
}

export { eqUrls, seisNetUrls, iconUrls, shindoIconUrls, chimeUrls, geojsonUrls, utilUrls }