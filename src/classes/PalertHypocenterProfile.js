import { niedHypocenterProfile } from './NiedHypocenterProfile'

// Initial search/travel-time settings use the existing baseline until P-Alert replay calibration.
// Clone all nested parameters so tuning P-Alert cannot change NIED.
const parameters = structuredClone(niedHypocenterProfile.parameters)
const waveCountPenaltyConfigs = [
    { thresholdRatio: 8, maxPenalty: 2 },
    { thresholdRatio: 9, maxPenalty: 1.5 },
    { thresholdRatio: 10, maxPenalty: 1 },
    { thresholdRatio: 11, maxPenalty: 0.5 }
]
parameters.waveCountPenaltySlope = 0.5
parameters.defaultWaveCountPenaltyConfig = waveCountPenaltyConfigs[0]
parameters.inheritedOutlierFilterStages.forEach(stage => {
    stage.waveCountPenalty = waveCountPenaltyConfigs[stage.level]
})

export const palertHypocenterProfile = {
    ...niedHypocenterProfile,
    logPrefix: '[FindPalertHypocenter]',
    parameters,

    isValidStationId(id) {
        return typeof id === 'string' && id.length > 0
    },

    createPickMetrics(pick) {
        return { maxLevel: pick.maxLevel ?? -1, secondMaxLevel: pick.secondMaxLevel ?? -1 }
    },

    updatePickMetrics(pick, source) {
        const oldMaxLevel = pick.maxLevel
        const oldSecondMaxLevel = pick.secondMaxLevel
        // Each source is a cumulative episode snapshot, not another independent observation.
        pick.maxLevel = Math.max(pick.maxLevel ?? -1, source.maxLevel ?? -1)
        pick.secondMaxLevel = Math.max(pick.secondMaxLevel ?? -1, source.secondMaxLevel ?? -1)
        return oldMaxLevel !== pick.maxLevel || oldSecondMaxLevel !== pick.secondMaxLevel
    },

    getPickMetrics(pick) {
        return { maxLevel: pick.maxLevel, secondMaxLevel: pick.secondMaxLevel }
    },

    getEffectivePickStrength(item) {
        return item.pick?.maxLevel ?? -1
    },

    getPickBaseWeight({ maxLevel }) {
        if(maxLevel === 7) return 0.2
        if(maxLevel === 8) return 0.8
        return Number.isFinite(maxLevel) && maxLevel >= 8 ? Math.min(1 + (maxLevel - 8) * 0.2, 2) : 0
    },

    isPenaltyReferencePick(pick) {
        return Number.isFinite(pick.secondMaxLevel) && pick.secondMaxLevel >= 10
    },

    fallbackReferenceMetrics: [
        pick => pick.secondMaxLevel >= 0 ? pick.secondMaxLevel : null,
        pick => pick.maxLevel >= 0 ? pick.maxLevel : null
    ]
}
