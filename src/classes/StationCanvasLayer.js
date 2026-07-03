import { CanvasLayer } from './CanvasLayer'
import { intIconUrls, kmaIntColorBand, shindoColorBand, shindoIconUrls } from './StationClasses'

const defaultStationLevels = Array.from({ length: 22 }, (_, index) => index - 1)
const getIconRadius = zoom => 8 * 1.5 ** (Math.min(Math.max(zoom, 6), 10) / 2 - 3)

export class StationCanvasLayer extends CanvasLayer {
    constructor(stations, options = {}) {
        const layerOptions = {
            className: 'leaflet-station-canvas',
            pane: 'stationPane',
            levels: defaultStationLevels,
            iconUrls: shindoIconUrls,
            simpleColorBand: shindoColorBand,
            ...options
        }
        super(layerOptions)
        this.stations = stations
        this.levelSet = new Set(this.options.levels)
        this.images = {}
    }

    draw() {
        if(!this.map || !this.context) return
        if(this.zoomAnimating) return
        const size = this.prepareDraw()
        if(!size) return
        const zoom = this.map.getZoom()
        this.getStations()
            .map(station => station?.getCanvasDrawInfo?.(zoom))
            .filter(Boolean)
            .sort((a, b) => this.getPaneLevel(a.paneLevel ?? a.level) - this.getPaneLevel(b.paneLevel ?? b.level))
            .forEach(info => this.drawStation(info, zoom, size))
    }

    getStations() {
        return Array.isArray(this.stations) ? this.stations : Object.values(this.stations || {})
    }

    getPaneLevel(level) {
        return this.levelSet.has(level) ? level : this.options.levels[0]
    }

    drawStation(info, zoom, size) {
        const ctx = this.context
        if(!ctx) return
        const point = this.map.latLngToLayerPoint(info.latLng).subtract(this.topLeft)
        const margin = Math.max(info.radius * 4, 24)
        if(point.x < -margin || point.y < -margin || point.x > size.x + margin || point.y > size.y + margin) return
        switch(info.markerType) {
            case 2:
                this.drawIcon(ctx, info.iconKey ?? info.shindo, point, zoom)
                break
            case 1:
                this.drawSimpleIcon(ctx, info, point)
                break
            default:
                this.drawCircle(ctx, info, point)
                break
        }
    }

    drawCircle(ctx, info, point) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, info.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.resolveCssColor(info.color)
        ctx.fill()
    }

    drawSimpleIcon(ctx, info, point) {
        const radius = Math.max(info.radius, 2) * 1.8
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = this.resolveCssColor(this.options.simpleColorBand[info.simpleColorLevel ?? info.level])
        ctx.fill()
        ctx.lineWidth = Math.max(info.radius, 2) * 0.4
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
    }

    drawIcon(ctx, iconKey, point, zoom) {
        const image = this.getIconImage(iconKey)
        if(!image?.complete || image.naturalWidth === 0) return
        const radius = getIconRadius(zoom)
        ctx.drawImage(image, point.x - radius, point.y - radius, radius * 2, radius * 2)
    }

    getIconImage(iconKey) {
        if(this.images[iconKey]) return this.images[iconKey]
        const url = this.options.iconUrls[iconKey]
        if(!url) return null
        const image = new Image()
        image.onload = () => this.redraw()
        image.src = url
        this.images[iconKey] = image
        return image
    }
}

export class NiedStationCanvasLayer extends StationCanvasLayer {
    constructor(stations, options = {}) {
        super(stations, {
            pane: 'niedStationPane0',
            levels: defaultStationLevels,
            ...options
        })
    }
}

export class TremStationCanvasLayer extends StationCanvasLayer {
    constructor(stations, options = {}) {
        super(stations, {
            pane: 'tremStationPane0',
            levels: defaultStationLevels,
            ...options
        })
    }
}

export class KmaStationCanvasLayer extends StationCanvasLayer {
    constructor(stations, options = {}) {
        super(stations, {
            pane: 'kmaStationPane0',
            levels: Array.from({ length: 15 }, (_, index) => index - 1),
            iconUrls: intIconUrls,
            simpleColorBand: kmaIntColorBand,
            ...options
        })
    }
}
