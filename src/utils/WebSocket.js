class WebSocketEew {
    constructor(url){
        this.url = url
        this.ws = new WebSocket(this.url)
        this.setupWebSocket()
    }
    setupWebSocket(){
        this.ws.onopen = ()=>{
            console.log(`${this.url} 连接成功`)
        }
        this.ws.onerror = ()=>{
            throw new Error(`${this.url} 连接失败`)
        }
        this.ws.onclose = (e)=>{
            console.log(`${this.url} 断开连接`)
        }
    }
    setMessageHandler(handler){
        this.ws.onmessage = handler
    }
}

export default WebSocketEew