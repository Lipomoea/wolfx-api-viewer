import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import axios from 'axios'
import { initSeismicWasm } from './utils/WasmSeismic'
import { preloadTravelTimeFallback } from './utils/SeismicCalculations'

axios.defaults.timeout = 30000
void initSeismicWasm().then(wasm => {
  if (!wasm) void preloadTravelTimeFallback()
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
