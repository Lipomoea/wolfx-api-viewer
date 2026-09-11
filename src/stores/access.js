import { defineStore } from 'pinia';
import { parseSettings, restoreSettings } from '@/utils/SettingsRestore';

const capabilityKeys = ['iclEew', 'tremFunctions', 'gqEew', 'nmefcTsunamiMap', 'advancedHypoInf']
const createDefaultCapabilities = () => Object.fromEntries(capabilityKeys.map(key => [key, false]))
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
        capabilities: createDefaultCapabilities(),
    }),
    getters: {
        canUse: state => feature => Boolean(state.capabilities[feature]),
    },
    actions: {
        setAccessSettings(jsonString) {
            const restored = parseSettings(jsonString)
            this.capabilities = restoreSettings(createDefaultCapabilities(), restored)
            Object.entries(requiredLocalConfig).forEach(([capability, storageKey]) => {
                if(this.capabilities[capability] && !hasLocalConfig(storageKey)) {
                    this.capabilities[capability] = false
                }
            })
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
