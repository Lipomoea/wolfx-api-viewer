import L from 'leaflet'

export class CanvasLayer extends L.Layer {
    constructor(options = {}) {
        super()
        this.options = {
            className: 'leaflet-canvas-layer',
            pane: 'overlayPane',
            pointerEvents: 'none',
            ...options
        }
        this.canvas = null
        this.context = null
        this.redrawFrame = null
        this.zoomAnimating = false
        this.topLeft = L.point(0, 0)
    }

    onAdd(map) {
        this.map = map
        this.createCanvas()
        map.on('zoomstart', this.handleZoomStart, this)
        map.on('moveend zoomend resize viewreset', this.reset, this)
        map.on('zoomanim', this.animateZoom, this)
        this.reset()
    }

    onRemove() {
        if(this.map) this.map.off('zoomstart', this.handleZoomStart, this)
        if(this.map) this.map.off('moveend zoomend resize viewreset', this.reset, this)
        if(this.map) this.map.off('zoomanim', this.animateZoom, this)
        if(this.redrawFrame) cancelAnimationFrame(this.redrawFrame)
        this.redrawFrame = null
        this.canvas?.remove()
        this.canvas = null
        this.context = null
        this.map = null
    }

    getPaneName() {
        return this.options.pane
    }

    createCanvas() {
        const pane = this.map.getPane(this.getPaneName())
        if(!pane) return
        const canvas = L.DomUtil.create('canvas', this.options.className, pane)
        if(this.map.options.zoomAnimation && L.Browser.any3d) L.DomUtil.addClass(canvas, 'leaflet-zoom-animated')
        canvas.style.position = 'absolute'
        canvas.style.pointerEvents = this.options.pointerEvents
        this.canvas = canvas
        this.context = canvas.getContext('2d')
    }

    reset() {
        if(!this.map || !this.canvas) return
        this.zoomAnimating = false
        const size = this.map.getSize()
        this.updateCanvasPosition()
        this.canvas.style.width = `${size.x}px`
        this.canvas.style.height = `${size.y}px`
        const ratio = this.getRenderRatio()
        this.canvas.width = Math.ceil(size.x * ratio)
        this.canvas.height = Math.ceil(size.y * ratio)
        this.redraw()
    }

    handleZoomStart() {
        this.zoomAnimating = true
    }

    updateCanvasPosition() {
        this.topLeft = this.map.containerPointToLayerPoint([0, 0])
        if(this.canvas) L.DomUtil.setPosition(this.canvas, this.topLeft)
    }

    animateZoom(event) {
        if(!this.map || !this.canvas) return
        const scale = this.map.getZoomScale(event.zoom)
        const offset = this.map._latLngToNewLayerPoint(this.map.containerPointToLatLng([0, 0]), event.zoom, event.center)
        L.DomUtil.setTransform(this.canvas, offset, scale)
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

    prepareDraw() {
        if(!this.map || !this.context) return null
        if(this.zoomAnimating) return null
        const ratio = this.getRenderRatio()
        const size = this.map.getSize()
        this.context.setTransform(ratio, 0, 0, ratio, 0, 0)
        this.context.clearRect(0, 0, size.x, size.y)
        return size
    }

    getRenderRatio() {
        const devicePixelRatio = window.devicePixelRatio || 1
        const cssWidth = this.canvas?.clientWidth || this.map?.getSize()?.x || 1
        const renderedWidth = this.canvas?.getBoundingClientRect?.().width || cssWidth
        const transformScale = renderedWidth > 0 && cssWidth > 0 ? renderedWidth / cssWidth : 1
        return Math.max(devicePixelRatio * transformScale, 1)
    }

    resolveCssColor(color) {
        if(typeof color !== 'string') return color
        const match = color.match(/^var\((--[^)]+)\)$/)
        if(!match || typeof window === 'undefined') return color
        return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || color
    }

    draw() {
        const size = this.prepareDraw()
        if(size) this.render(size)
    }

    render() {}
}
