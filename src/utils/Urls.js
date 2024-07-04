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

const stationUrls = {
    STATION_LIST_http: 'https://api.wolfx.jp/seis_list.json',
    ALL_PUSH_ws: 'wss://seis.wolfx.jp/all_seis',
}

const iconUrls = {
    info: '/icon/info.png',
    caution: '/icon/caution.png',
    warn: '/icon/warn.png',
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

export { eqUrls, stationUrls, iconUrls, chimeUrls, geojsonUrls }