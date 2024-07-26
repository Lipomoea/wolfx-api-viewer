const eqUrls = {
    scEew_http: 'https://api.wolfx.jp/sc_eew.json',
    scEew_ws: 'wss://ws-api.wolfx.jp/sc_eew',
    jmaEew_http: 'https://api.wolfx.jp/jma_eew.json',
    jmaEew_ws: 'wss://ws-api.wolfx.jp/jma_eew',
    fjEew_http: 'https://api.wolfx.jp/fj_eew.json',
    fjEew_ws: 'wss://ws-api.wolfx.jp/fj_eew',
    cwaEew_http: 'https://api.wolfx.jp/cwa_eew.json',
    cencEqlist_http: 'https://api.wolfx.jp/cenc_eqlist.json',
    cencEqlist_ws: 'wss://ws-api.wolfx.jp/cenc_eqlist',
    jmaEqlist_http: 'https://api.wolfx.jp/jma_eqlist.json',
    jmaEqlist_ws: 'wss://ws-api.wolfx.jp/jma_eqlist',
}
const seisNetUrls = {
    nied: {
        stationList: 'https://weather-kyoshin.east.edge.storage-yahoo.jp/SiteList/sitelist.json',
        stationData: 'https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData',
    },
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
    },
}
const geojsonUrls = {
    global: '/json/medium.global.geo.json',
    cn: '/json/cn.geo.json',
}
const utilUrls = {
    geoIp: 'https://api.wolfx.jp/geoip.php',
    ntpTime: 'https://worldtimeapi.org/api/timezone/Asia/Hong_Kong',
}

export { eqUrls, seisNetUrls, iconUrls, shindoIconUrls, chimeUrls, geojsonUrls, utilUrls }