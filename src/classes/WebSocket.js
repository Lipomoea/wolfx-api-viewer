class WebSocketObj {
    constructor(urls, autoMessages = [], initMessages = [...autoMessages]) {
        this.urls = urls
        this.urlIndex = 0
        this.url = this.urls[this.urlIndex]
        this.autoMessages = autoMessages
        this.initMessages = initMessages
        this.shouldConnect = true
        this.minRetryInterval = 3000
        this.maxRetryInterval = 10000
        this.autoSendInterval = 10000
        this.retryInterval = this.minRetryInterval
        this.socket = new WebSocket(this.url)
        this.setupWebSocket()
    }
    async sendMessages(messages) {
        for(const msg of messages) {
            this.send(msg)
            await new Promise(resolve => setTimeout(resolve, Math.min(this.autoSendInterval / messages.length, 2000)))
        }
    }
    setupWebSocket() {
        clearInterval(this.msgTimer)
        this.socket.onopen = () => {
            this.sendMessages(this.initMessages)
            this.retryInterval = this.minRetryInterval
        }
        if (this.autoMessages.length > 0) {
            this.msgTimer = setInterval(() => this.sendMessages(this.autoMessages), this.autoSendInterval)
        }
        this.socket.onclose = () => {
            clearTimeout(this.timer)
            if(this.retryInterval == this.maxRetryInterval) {
                this.urlIndex = (this.urlIndex + 1) % this.urls.length
                this.url = this.urls[this.urlIndex]
            }
            this.timer = setTimeout(() => {
                if (this.shouldConnect) this.reconnect()
            }, this.retryInterval);
            this.retryInterval = Math.min(this.retryInterval + 1000, this.maxRetryInterval)
        }
        if (this.messageHandler)
            this.socket.onmessage = this.messageHandler
    }
    setMessageHandler(handler) {
        this.messageHandler = this.socket.onmessage = handler
    }
    reconnect() {
        clearTimeout(this.timer)
        if (this.socket) {
            this.socket.onopen = null
            this.socket.onclose = null
            this.socket.onerror = null
            this.socket.onmessage = null
            this.socket.close()
        }
        this.socket = new WebSocket(this.url)
        this.setupWebSocket()
    }
    close() {
        this.shouldConnect = false
        clearTimeout(this.timer)
        clearInterval(this.msgTimer)
        if (this.socket) {
            this.socket.onopen = null
            this.socket.onclose = null
            this.socket.onerror = null
            this.socket.onmessage = null
            this.socket.close()
        }
    }
    send(msg) {
        if (this.socket.readyState == 1) {
            this.socket.send(msg)
        }
    }
}

export default WebSocketObj