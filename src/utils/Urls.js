export const eqUrls = {
    scEew_http: 'https://api.wolfx.jp/sc_eew.json',
    jmaEew_http: 'https://api.wolfx.jp/jma_eew.json',
    fjEew_http: 'https://api.wolfx.jp/fj_eew.json',
    cwaEew_http: 'https://api.wolfx.jp/cwa_eew.json',
    cencEqlist_http: 'https://api.wolfx.jp/cenc_eqlist.json',
    jmaEqlist_http: 'https://api.p2pquake.net/v2/history?codes=551&limit=1',
    cencEqlistHistory: 'https://api.wolfx.jp/cenc_eqlist.json',
    jmaEqlistHistory: 'https://api.wolfx.jp/jma_eqlist.json',
    wolfx_ws: 'wss://ws-api.wolfx.jp/all_eew',
    p2pquake_ws: 'wss://api.p2pquake.net/v2/ws'
}
export const tsunamiUrls = {
    jmaTsunami_http: 'https://api.p2pquake.net/v2/history?codes=552&limit=1'
}
export const seisNetUrls = {
    nied: {
        stationList: 'https://weather-kyoshin.east.edge.storage-yahoo.jp/SiteList/sitelist.json',
        stationData: 'https://weather-kyoshin.east.edge.storage-yahoo.jp/RealTimeData'
    }
}
export const iconUrls = {
    info: '/icon/info.png',
    caution: '/icon/caution.png',
    warn: '/icon/warn.png',
}
export const shindoIconUrls = {
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
export const chimeUrls = {
    general: {
        countdown: '/sound/general/countdown.wav',
        ews: '/sound/general/ews.mp3',
    },
    srev: {
        issue: '/sound/srev/issue.mp3',
        caution: '/sound/srev/caution.mp3',
        warn: '/sound/srev/warn.mp3',
        update: '/sound/srev/update.mp3',
        final: '/sound/srev/final.mp3',
        cancel: '/sound/srev/cancel.mp3',
        prompt: '/sound/srev/prompt.mp3',
        hypocenter: '/sound/srev/hypocenter.mp3',
        detail: '/sound/srev/detail.mp3',
        shindo0:'/sound/srev/shindo0.mp3',
        shindo1:'/sound/srev/shindo1.mp3',
        shindo2:'/sound/srev/shindo2.mp3',
        shindo3:'/sound/srev/shindo3.mp3',
        shindo4:'/sound/srev/shindo4.mp3',
        shindo5:'/sound/srev/shindo5.mp3',
        shindo6:'/sound/srev/shindo6.mp3',
        shindo7:'/sound/srev/shindo6.mp3',
        tsunami1issue: '/sound/srev/tsunami1issue.mp3',
        tsunami1update: '/sound/srev/tsunami1update.mp3',
        tsunami1switch: '/sound/srev/tsunami1switch.mp3',
        tsunami1cancel: '/sound/srev/tsunami1cancel.mp3',
        tsunami2issue: '/sound/srev/tsunami2issue.mp3',
        tsunami2update: '/sound/srev/tsunami2update.mp3',
        tsunami2switch: '/sound/srev/tsunami2switch.mp3',
        tsunami2cancel: '/sound/srev/tsunami2cancel.mp3',
        tsunami3issue: '/sound/srev/tsunami3issue.mp3',
        tsunami3update: '/sound/srev/tsunami3update.mp3',
        tsunami3cancel: '/sound/srev/tsunami3cancel.mp3',
    },
    custom: {}
}
export const geojsonUrls = {
    global: '/json/medium.global.modified.geo.json',
    cn: '/json/cn.province.geo.json',
    cn_eew: '/json/cn.eew.geo.json',
    cn_fault: '/json/cn.fault.modified.geo.json',
    jp: '/json/jp.pref.geo.json',
    jp_eew: '/json/jp.eew.geo.json',
    jp_tsunami: '/json/jp.tsunami.geo.json'
}
export const utilUrls = {
    geoIp: 'https://api.wolfx.jp/geoip.php',
    ntpTime: 'https://api.wolfx.jp/ntp.json',
}