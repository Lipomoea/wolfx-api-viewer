export const dataSourceCategories = [
    { key: 'eew', label: '地震预警' },
    { key: 'eqlist', label: '地震信息' },
    { key: 'tsunami', label: '海啸信息' },
]

export const dataSourceProviders = {
    wolfx: 'Wolfx',
    fan: 'FAN',
    p2pquake: 'P2PQ',
    globalquake: 'GQ',
    usgs: 'USGS',
}

export const dataSourceCatalog = {
    jmaEew: {
        label: '日本気象庁: 緊急地震速報',
        category: 'eew',
        displayOrder: 5,
        apis: ['wolfx', 'fan'],
    },
    cwaEew: {
        label: '臺灣中央氣象署: 強震即時警報',
        category: 'eew',
        displayOrder: 4,
        apis: ['wolfx', 'fan'],
        defaultEnabled: true,
    },
    ceaEew: {
        label: '中国地震局: 地震预警',
        category: 'eew',
        displayOrder: 0,
        apis: ['wolfx', 'fan'],
        defaultEnabled: true,
    },
    iclEew: {
        label: '成都高新减灾研究所: 地震预警',
        category: 'eew',
        displayOrder: 1,
        apis: ['fan'],
        advancedSetting: 'enableIclEew',
    },
    scEew: {
        label: '四川地震局: 地震预警',
        category: 'eew',
        displayOrder: 2,
        apis: ['wolfx', 'fan'],
        defaultEnabled: true,
    },
    fjEew: {
        label: '福建地震局: 地震预警',
        category: 'eew',
        displayOrder: 3,
        apis: ['wolfx', 'fan'],
        defaultEnabled: true,
    },
    kmaEew: {
        label: '기상청: 지진 조기 경보',
        category: 'eew',
        displayOrder: 6,
        apis: ['fan'],
    },
    gqEew: {
        label: 'GlobalQuake: 地震预警',
        category: 'eew',
        displayOrder: 7,
        apis: ['globalquake'],
        advancedSetting: 'enableGqEew',
    },
    jmaEqlist: {
        label: '日本気象庁: 地震情報',
        category: 'eqlist',
        displayOrder: 2,
        apis: ['wolfx', 'p2pquake'],
    },
    cwaEqlist: {
        label: '臺灣中央氣象署: 地震報告',
        category: 'eqlist',
        displayOrder: 1,
        apis: ['fan'],
        defaultEnabled: true,
    },
    cencEqlist: {
        label: '中国地震台网: 地震测定',
        category: 'eqlist',
        displayOrder: 0,
        apis: ['wolfx', 'fan'],
        defaultEnabled: true,
    },
    kmaEqlist: {
        label: '기상청: 지진 정보',
        category: 'eqlist',
        displayOrder: 3,
        apis: ['fan'],
    },
    usgsEqlist: {
        label: 'USGS: 地震测定',
        category: 'eqlist',
        displayOrder: 4,
        apis: ['usgs', 'fan'],
    },
    fssnEqlist: {
        label: 'FSSN: 地震测定',
        category: 'eqlist',
        displayOrder: 5,
        apis: ['fan'],
    },
    jmaTsunami: {
        label: '日本気象庁: 津波情報',
        category: 'tsunami',
        displayOrder: 1,
        apis: ['p2pquake'],
    },
    nmefcTsunami: {
        label: '自然资源部: 海啸预警',
        category: 'tsunami',
        displayOrder: 0,
        apis: ['fan'],
        defaultEnabled: true,
    },
}

export const eewSources = Object.keys(dataSourceCatalog).filter(source => dataSourceCatalog[source].category == 'eew')
export const eqlistSources = Object.keys(dataSourceCatalog).filter(source => dataSourceCatalog[source].category == 'eqlist')
export const tsunamiSources = Object.keys(dataSourceCatalog).filter(source => dataSourceCatalog[source].category == 'tsunami')

export const wolfxSocketSources = Object.keys(dataSourceCatalog).filter(source => dataSourceCatalog[source].apis.includes('wolfx'))
export const fanSocketSources = Object.keys(dataSourceCatalog).filter(source => dataSourceCatalog[source].apis.includes('fan'))
export const p2pquakeSocketSources = Object.keys(dataSourceCatalog).filter(source => dataSourceCatalog[source].apis.includes('p2pquake'))

export const createDefaultDataSources = () => Object.fromEntries(
    Object.entries(dataSourceCatalog).map(([source, config]) => [
        source,
        Object.fromEntries(config.apis.map(api => [api, Boolean(config.defaultEnabled)])),
    ])
)

export const migrateLegacyDataSources = legacySources => {
    const dataSources = createDefaultDataSources()
    Object.entries(dataSources).forEach(([source, apis]) => {
        if(source in legacySources) {
            Object.keys(apis).forEach(api => {
                apis[api] = Boolean(legacySources[source])
            })
        }
    })
    return dataSources
}
