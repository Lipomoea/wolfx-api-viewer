import L from 'leaflet'
import { shindoColorBand, shindoIconUrls } from './StationClasses'

const niedStationLevels = Array.from({ length: 22 }, (_, index) => index - 1)
const getNiedPaneLevel = level => level >= -1 && level <= 20 ? level : -1
const getIconRadius = zoom => 8 * 1.5 ** (Math.min(Math.max(zoom, 6), 10) / 2 - 3)
const resolveCssColor = color => {
    if(typeof color !== 'string') return color
    const match = color.match(/^var\((--[^)]+)\)$/)
    if(!match || typeof window === 'undefined') return color
    return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || color
}

export class NiedStationCanvasLayer extends L.Layer {
    constructor(stations, options = {}) {
        super()
        this.stations = stations
        this.options = {
            className: 'leaflet-nied-station-canvas',
            animationRedrawInterval: 50,
            ...options
        }
        this.canvases = new Map()
        this.contexts = new Map()
        this.images = {}
        this.redrawFrame = null
        this.animationRedrawTimer = null
        this.lastAnimationRedraw = 0
        this.zoomAnimating = false
        this.topLeft = L.point(0, 0)
    }

    onAdd(map) {
        this.map = map
        niedStationLevels.forEach(level => this.createCanvas(level))
        map.on('zoomstart', this.handleZoomStart, this)
        map.on('moveend zoomend resize viewreset', this.reset, this)
        map.on('move', this.scheduleAnimationRedraw, this)
        map.on('zoomanim', this.animateZoom, this)
        this.reset()
    }

    onRemove() {
        if(this.map) this.map.off('zoomstart', this.handleZoomStart, this)
        if(this.map) this.map.off('moveend zoomend resize viewreset', this.reset, this)
        if(this.map) this.map.off('move', this.scheduleAnimationRedraw, this)
        if(this.map) this.map.off('zoomanim', this.animateZoom, this)
        if(this.redrawFrame) cancelAnimationFrame(this.redrawFrame)
        if(this.animationRedrawTimer) clearTimeout(this.animationRedrawTimer)
        this.redrawFrame = null
        this.animationRedrawTimer = null
        this.canvases.forEach(canvas => canvas.remove())
        this.canvases.clear()
        this.contexts.clear()
        this.map = null
    }

    createCanvas(level) {
        const pane = this.map.getPane(`niedStationPane${level}`)
        if(!pane) return
        const canvas = L.DomUtil.create('canvas', this.options.className, pane)
        if(this.map.options.zoomAnimation && L.Browser.any3d) L.DomUtil.addClass(canvas, 'leaflet-zoom-animated')
        canvas.style.position = 'absolute'
        canvas.style.pointerEvents = 'none'
        this.canvases.set(level, canvas)
        this.contexts.set(level, canvas.getContext('2d'))
    }

    reset() {
        if(!this.map) return
        this.zoomAnimating = false
        const size = this.map.getSize()
        const ratio = window.devicePixelRatio || 1
        this.updateCanvasPosition()
        this.canvases.forEach(canvas => {
            canvas.width = Math.ceil(size.x * ratio)
            canvas.height = Math.ceil(size.y * ratio)
            canvas.style.width = `${size.x}px`
            canvas.style.height = `${size.y}px`
        })
        this.redraw()
    }

    handleZoomStart() {
        this.zoomAnimating = true
    }

    updateCanvasPosition() {
        this.topLeft = this.map.containerPointToLayerPoint([0, 0])
        this.canvases.forEach(canvas => {
            L.DomUtil.setPosition(canvas, this.topLeft)
        })
    }

    animateZoom(event) {
        if(!this.map) return
        const scale = this.map.getZoomScale(event.zoom)
        const offset = this.map._latLngToNewLayerPoint(this.map.containerPointToLatLng([0, 0]), event.zoom, event.center)
        this.canvases.forEach(canvas => {
            L.DomUtil.setTransform(canvas, offset, scale)
        })
    }

    scheduleAnimationRedraw() {
        if(!this.map) return
        if(this.zoomAnimating) return
        const now = performance.now()
        const wait = this.options.animationRedrawInterval - (now - this.lastAnimationRedraw)
        if(wait <= 0) {
            this.redrawDuringAnimation()
            return
        }
        if(this.animationRedrawTimer) return
        this.animationRedrawTimer = setTimeout(() => {
            this.animationRedrawTimer = null
            this.redrawDuringAnimation()
        }, wait)
    }

    redrawDuringAnimation() {
        if(!this.map) return
        this.lastAnimationRedraw = performance.now()
        this.updateCanvasPosition()
        this.redraw()
    }

    redraw() {
        if(!this.map) return this
        if(this.zoomAnimating) return this
        if(this.redrawFrame) return this
        this.redrawFrame = requestAnimationFrame(() => {
            this.redrawFrame = null
            this.draw()
        })
        return this
    }

    draw() {
        if(!this.map) return
        if(this.zoomAnimating) return
        const ratio = window.devicePixelRatio || 1
        const size = this.map.getSize()
        this.contexts.forEach(ctx => {
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
            ctx.clearRect(0, 0, size.x, size.y)
        })
        const zoom = this.map.getZoom()
        this.stations.forEach(station => this.drawStation(station, zoom, size))
    }

    drawStation(station, zoom, size) {
        const info = station.getCanvasDrawInfo(zoom)
        if(!info) return
        const level = getNiedPaneLevel(info.level)
        const ctx = this.contexts.get(level)
        if(!ctx) return
        const point = this.map.latLngToLayerPoint(info.latLng).subtract(this.topLeft)
        const margin = Math.max(info.radius * 4, 24)
        if(point.x < -margin || point.y < -margin || point.x > size.x + margin || point.y > size.y + margin) return
        switch(info.markerType) {
            case 2:
                this.drawShindoIcon(ctx, info.shindo, point, zoom)
                break
            case 1:
                this.drawSimpleShindo(ctx, info, point)
                break
            default:
                this.drawCircle(ctx, info, point)
                break
        }
    }

    drawCircle(ctx, info, point) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, info.radius, 0, Math.PI * 2)
        ctx.fillStyle = resolveCssColor(info.color)
        ctx.fill()
    }

    drawSimpleShindo(ctx, info, point) {
        const radius = Math.max(info.radius, 2) * 1.8
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = resolveCssColor(shindoColorBand[info.level])
        ctx.fill()
        ctx.lineWidth = Math.max(info.radius, 2) * 0.4
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()
    }

    drawShindoIcon(ctx, shindo, point, zoom) {
        const image = this.getShindoImage(shindo)
        if(!image?.complete || image.naturalWidth === 0) return
        const radius = getIconRadius(zoom)
        ctx.drawImage(image, point.x - radius, point.y - radius, radius * 2, radius * 2)
    }

    getShindoImage(shindo) {
        if(this.images[shindo]) return this.images[shindo]
        const url = shindoIconUrls[shindo]
        if(!url) return null
        const image = new Image()
        image.onload = () => this.redraw()
        image.src = url
        this.images[shindo] = image
        return image
    }
}
