class WebSocketObj {
    constructor(url, autoMessages = []){
        this.url = url
        this.socket = new WebSocket(this.url)
        this.setupWebSocket()
        this.shouldConnect = true
        this.retryInterval = 5000
        this.messageHandler = null
        this.timer = null
        this.msgTimer = null
        if(autoMessages.length > 0) {
            this.msgTimer = setInterval(() => {
                autoMessages.forEach(msg => {
                    this.send(msg)
                })
            }, 10000);
        }
    }
    setupWebSocket(){
        this.socket.onopen = ()=>{
            // console.log(`${this.url} 连接成功`)
        }
        this.socket.onerror = ()=>{
            // console.log(`${this.url} 连接失败`)
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                if(this.shouldConnect) this.reconnect()
            }, this.retryInterval);
        }
        this.socket.onclose = ()=>{
            // console.log(`${this.url} 断开连接`)
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                if(this.shouldConnect) this.reconnect()
            }, this.retryInterval);
        }
    }
    setMessageHandler(handler){
        this.messageHandler = this.socket.onmessage = handler
    }
    reconnect(){
        clearTimeout(this.timer)
        if(this.socket){
            this.socket.onopen = null
            this.socket.onclose = null
            this.socket.onerror = null
            this.socket.onmessage = null
            this.socket.close()
        }
        this.socket = new WebSocket(this.url)
        this.setupWebSocket()
        if(this.messageHandler)
            this.socket.onmessage = this.messageHandler
    }
    close(){
        this.shouldConnect = false
        clearTimeout(this.timer)
        clearInterval(this.msgTimer)
        if(this.socket){
            this.socket.onopen = null
            this.socket.onclose = null
            this.socket.onerror = null
            this.socket.onmessage = null
            this.socket.close()
        }
    }
    send(msg){
        if(this.socket.readyState == 1){
            this.socket.send(msg)
        }
    }
}

export default WebSocketObj