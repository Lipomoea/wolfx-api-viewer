// Frozen calcActivity implementation before extracting the shared PGA/background statistics.
export function originalPalertActivity(recentData) {
    const recent = recentData.slice(0, 12)
    const maxLevel = Math.max(...recent.map(data => data.level), -1)
    let activity = maxLevel >= 10 ? 2 : maxLevel >= 8 ? 1 : 0
    const recentPga = recent.map(data => data.pga).filter(pga => Number.isFinite(pga) && pga >= 0)
    const backgroundPga = recentData.slice(12, 60).map(data => data.pga).filter(pga => Number.isFinite(pga) && pga >= 0)
    if(recentPga.length === 0 || backgroundPga.length < 24) return activity
    const backgroundAverage = backgroundPga.reduce((sum, pga) => sum + pga, 0) / backgroundPga.length
    if(Number.isFinite(backgroundAverage) && backgroundAverage > 0) {
        const maxPga = Math.max(...recentPga)
        if(maxPga >= backgroundAverage * 3) activity = Math.max(activity, 1)
    }
    return activity
}
