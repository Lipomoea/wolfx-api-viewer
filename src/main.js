import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import axios from 'axios'

axios.defaults.timeout = 30000

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
