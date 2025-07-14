class WebSocketObj {
    constructor(url, autoMessages = [], initMessages = [...autoMessages]) {
        this.url = url
        this.autoMessages = autoMessages
        this.initMessages = initMessages
        this.shouldConnect = true
        this.retryInterval = 3000
        this.socket = new WebSocket(this.url)
        this.setupWebSocket()
    }
    sendMessages(messages) {
        messages.forEach(msg => {
            this.send(msg)
        })
    }
    setupWebSocket() {
        clearInterval(this.msgTimer)
        this.socket.onopen = () => this.sendMessages(this.initMessages)
        if (this.autoMessages.length > 0) {
            this.msgTimer = setInterval(() => this.sendMessages(this.autoMessages), 10000)
        }
        this.socket.onerror = () => {
            // console.log(`${this.url} 连接失败`)
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                if (this.shouldConnect) this.reconnect()
            }, this.retryInterval);
        }
        this.socket.onclose = () => {
            // console.log(`${this.url} 断开连接`)
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                if (this.shouldConnect) this.reconnect()
            }, this.retryInterval);
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