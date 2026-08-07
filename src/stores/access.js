import { defineStore } from 'pinia';

// TODO(access-settings-migration): Remove the legacy keys, map, and fallback argument after all supported versions have migrated.
const legacyCapabilityMap = {
    enableIclEew: 'iclEew',
    enableTremFunctions: 'tremFunctions',
    enableGqEew: 'gqEew',
    enableNmefcTsunami: 'nmefcTsunamiMap',
    advancedHypoInf: 'advancedHypoInf',
}

export const legacyAccessSettingKeys = Object.keys(legacyCapabilityMap)
const capabilityKeys = Object.values(legacyCapabilityMap)
const requiredLocalConfig = {
    iclEew: 'iclUrl',
    tremFunctions: 'tremUrl',
    gqEew: 'gqUrl',
    nmefcTsunamiMap: 'nmefcTsunami',
}

const hasLocalConfig = key => {
    try {
        return Boolean(JSON.parse(localStorage.getItem(key)))
    }
    catch (_) {
        return false
    }
}

export const useAccessStore = defineStore('accessStore', {
    state: () => ({
        capabilities: Object.fromEntries(capabilityKeys.map(key => [key, false])),
    }),
    getters: {
        canUse: state => feature => Boolean(state.capabilities[feature]),
    },
    actions: {
        setAccessSettings(jsonString, legacyAdvancedSettings) {
            let restored = {}
            let migrated = false
            try {
                if(jsonString) {
                    restored = JSON.parse(jsonString)
                }
                else if(legacyAdvancedSettings) {
                    // Migrate once from advancedSettings when accessSettings does not exist yet.
                    const legacy = JSON.parse(legacyAdvancedSettings)
                    Object.entries(legacyCapabilityMap).forEach(([legacyKey, capability]) => {
                        restored[capability] = legacy[legacyKey]
                    })
                    migrated = true
                }
            }
            catch (_) {
                restored = {}
            }

            capabilityKeys.forEach(key => {
                this.capabilities[key] = Boolean(restored[key])
            })
            Object.entries(requiredLocalConfig).forEach(([capability, storageKey]) => {
                if(this.capabilities[capability] && !hasLocalConfig(storageKey)) {
                    this.capabilities[capability] = false
                }
            })

            if(migrated) {
                localStorage.setItem('accessSettings', JSON.stringify(this.capabilities))
            }
        },
        grant(feature) {
            if(!(feature in this.capabilities)) return false
            const storageKey = requiredLocalConfig[feature]
            if(storageKey && !hasLocalConfig(storageKey)) return false
            this.capabilities[feature] = true
            return true
        },
        revoke(feature) {
            if(!(feature in this.capabilities)) return false
            this.capabilities[feature] = false
            return true
        },
    },
})
