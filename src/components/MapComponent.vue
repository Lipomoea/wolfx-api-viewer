<template>
    <div class="outer">
        <div class="container">
            <div id="map"></div>
        </div>
    </div>
</template>

<script setup>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Http from '@/utils/Http';
import { onMounted } from 'vue';
let map, crossMarker
let center = [30.3, 120.1]
let zoomLevel = 8
onMounted(()=>{
    map = L.map('map', {attributionControl: false})
    map.setView(center, zoomLevel)
    map.removeControl(map.zoomControl)
    Http.get('/json/global.geo.json')
    .then(data=>{
        L.geoJson(data).addTo(map)
    })
    let crossIcon = `<svg t="1719226920212" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2481" width="50" height="50"><path d="M602.512147 511.99738l402.747939-402.747939a63.999673 63.999673 0 0 0-90.509537-90.509537L512.00261 421.487843 109.254671 18.749904a63.999673 63.999673 0 0 0-90.509537 90.509537L421.493073 511.99738 18.755134 914.745319a63.999673 63.999673 0 0 0 90.509537 90.509537L512.00261 602.506917l402.747939 402.747939a63.999673 63.999673 0 0 0 90.509537-90.509537z" p-id="2482" fill="#d81e06"></path></svg>`
    var crossDivIcon = L.divIcon({
        html: crossIcon,
        className: 'crossDivIcon',
        iconAnchor: [25, 25],
    })
    crossMarker = L.marker(center, {icon: crossDivIcon})
})
const setBlink = ()=>{
    setInterval(() => {
        if(!map.hasLayer(crossMarker)){
            crossMarker.addTo(map)
        }
        else{
            map.removeLayer(crossMarker)
        }
    }, 500);
}
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    .container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin: 20px;
        #map{
            width: 100%;
            height: 600px;
        }
        .crossDivIcon{
            background: none;
            border: none;
        }
    }
}
</style>