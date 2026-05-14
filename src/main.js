import { createApp } from 'vue'
import App from './App.vue'
import './assets/common.css'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(createPinia()).mount('#app')
