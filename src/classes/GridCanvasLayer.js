import L from 'leaflet'
import { CanvasLayer } from './CanvasLayer'

export class GridCanvasLayer extends CanvasLayer {
    constructor(grids = {}, options = {}) {
        super({
            className: 'leaflet-grid-canvas',
            pane: 'gridPane',
            pointerEvents: 'none',
            isGridCanvasLayer: true,
            gridRadius: 0.5,
            pixelInset: 0.5,
            weight: 2,
            colorOrder: ['green', 'yellow', 'red'],
            colors: {},
            defaultColor: 'green',
            ...options
        })
        this.grids = grids || {}
        this.bucketSignature = this.createBucketSignature(this.grids)
    }

    setGrids(grids = {}) {
        const nextGrids = grids || {}
        const nextBucketSignature = this.createBucketSignature(nextGrids)
        const shouldRedraw = nextBucketSignature !== this.bucketSignature
        this.grids = nextGrids
        this.bucketSignature = nextBucketSignature
        return shouldRedraw ? this.redraw() : this
    }

    getGridItems(grids = this.grids) {
        return Array.isArray(grids) ? grids : Object.values(grids || {})
    }

    hasGrid() {
        return this.getGridItems().some(grid => grid?.latLng)
    }

    render() {
        const ctx = this.context
        if(!ctx) return
        ctx.lineWidth = this.options.weight
        const buckets = this.createGridBuckets()
        buckets.forEach((grids, color) => {
            ctx.strokeStyle = this.resolveCssColor(this.options.colors[color] || color)
            grids.forEach(grid => this.drawGrid(ctx, grid))
        })
    }

    createColorBuckets() {
        return new Map(this.options.colorOrder.map(color => [color, []]))
    }

    createGridBuckets(grids = this.grids) {
        const buckets = this.createColorBuckets()
        this.getGridItems(grids).forEach(grid => {
            if(!grid?.latLng) return
            const color = this.getGridColor(grid)
            if(!buckets.has(color)) buckets.set(color, [])
            buckets.get(color).push(grid)
        })
        return buckets
    }

    createBucketSignature(grids = this.grids) {
        const buckets = this.createGridBuckets(grids)
        return [...buckets.entries()]
            .map(([color, grids]) => [
                color,
                grids
                    .map(grid => grid.latLng.join(','))
                    .sort()
                    .join('|')
            ])
            .filter(([, latLngs]) => latLngs)
            .map(([color, latLngs]) => `${color}:${latLngs}`)
            .join(';')
    }

    getGridColor(grid) {
        return grid.color || this.options.defaultColor
    }

    getGridLatLngBounds(grid) {
        const [lat, lng] = grid.latLng
        const radius = this.options.gridRadius
        return {
            south: lat - radius,
            west: lng - radius,
            north: lat + radius,
            east: lng + radius
        }
    }

    drawGrid(ctx, grid) {
        if(!grid?.latLng) return
        const { south, west, north, east } = this.getGridLatLngBounds(grid)
        const northWest = this.map.latLngToLayerPoint([north, west]).subtract(this.topLeft)
        const southEast = this.map.latLngToLayerPoint([south, east]).subtract(this.topLeft)
        const inset = this.options.pixelInset
        ctx.strokeRect(
            northWest.x + inset,
            northWest.y + inset,
            southEast.x - northWest.x - inset * 2,
            southEast.y - northWest.y - inset * 2
        )
    }

    getBounds() {
        const bounds = L.latLngBounds([])
        this.getGridItems().forEach(grid => {
            if(!grid?.latLng) return
            const { south, west, north, east } = this.getGridLatLngBounds(grid)
            bounds.extend([south, west])
            bounds.extend([north, east])
        })
        return bounds
    }
}

export class NiedGridCanvasLayer extends GridCanvasLayer {
    static getGridColorByLevel(level) {
        return level <= 7 ? 'green' : level <= 13 ? 'yellow' : 'red'
    }

    constructor(grids = {}, options = {}) {
        super(grids, {
            pane: 'niedGridPane',
            ...options
        })
    }

    getGridColor(grid) {
        return NiedGridCanvasLayer.getGridColorByLevel(grid.level)
    }
}

export class TremGridCanvasLayer extends GridCanvasLayer {
    static getGridColorByLevel(level) {
        return level <= 7 ? 'green' : level <= 13 ? 'yellow' : 'red'
    }

    constructor(grids = {}, options = {}) {
        super(grids, {
            pane: 'tremGridPane',
            ...options
        })
    }

    getGridColor(grid) {
        return TremGridCanvasLayer.getGridColorByLevel(grid.level)
    }
}

export class KmaGridCanvasLayer extends GridCanvasLayer {
    static getGridColorByLevel(level) {
        return level <= 3 ? 'green' : level <= 7 ? 'yellow' : 'red'
    }

    constructor(grids = {}, options = {}) {
        super(grids, {
            pane: 'kmaGridPane',
            ...options
        })
    }

    getGridColor(grid) {
        return KmaGridCanvasLayer.getGridColorByLevel(grid.level)
    }
}
