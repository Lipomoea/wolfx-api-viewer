const isSettingsObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

export const parseSettings = jsonString => {
    try {
        const value = JSON.parse(jsonString)
        return isSettingsObject(value) ? value : {}
    }
    catch (_) {
        return {}
    }
}

// Defaults define the accepted fields at every depth. Arrays need an explicit reader.
export const restoreSettings = (defaults, saved, arrayReaders = {}) => {
    const restoreValue = (fallback, value, path) => {
        if(fallback === null) return null
        if(Array.isArray(fallback)) {
            return Object.hasOwn(arrayReaders, path)
                ? arrayReaders[path](value, fallback)
                : fallback.slice()
        }
        if(isSettingsObject(fallback)) {
            const source = isSettingsObject(value) ? value : {}
            return Object.fromEntries(Object.entries(fallback).map(([key, defaultValue]) => [
                key,
                restoreValue(defaultValue, Object.hasOwn(source, key) ? source[key] : undefined,
                    path ? `${path}.${key}` : key),
            ]))
        }
        if(typeof value !== typeof fallback) return fallback
        if(typeof fallback === 'number' && !Number.isFinite(value)) return fallback
        return value
    }
    return restoreValue(defaults, saved, '')
}
