<template>
    <div>

    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useStatusStore } from '@/stores/status';

const statusStore = useStatusStore()

const testJmaEew = true

onMounted(()=>{
    const time = new Date()
    time.setHours(time.getHours() + 1)
    const timeStr = time.toLocaleString()
    if(testJmaEew){
        const source = 'jmaEew'
        setTimeout(() => {
            const data = {
                "Title": "緊急地震速報（予報）",
                "CodeType": "",
                "Issue": {
                    "Source": "",
                    "Status": ""
                },
                "EventID": "20240808164303",
                "Serial": 1,
                "AnnouncedTime": "",
                "OriginTime": timeStr,
                "Hypocenter": "宮崎県南部平野部",
                "Latitude": 31.9,
                "Longitude": 131.4,
                "Magunitude": 1,
                "Depth": 10,
                "MaxIntensity": "3",
                "Accuracy": {
                    "Epicenter": "",
                    "Depth": "",
                    "Magnitude": ""
                },
                "MaxIntChange": {
                    "String": "",
                    "Reason": ""
                },
                "WarnArea": [],
                "isSea": false,
                "isTraining": false,
                "isAssumption": true,
                "isWarn": false,
                "isFinal": false,
                "isCancel": false,
                "OriginalText": "",
                "Pond": ""
            }
            statusStore.setEqMessage(source, data)
        }, 4100);
        setTimeout(() => {
            const data = {
                "Title": "緊急地震速報（警報）",
                "CodeType": "",
                "Issue": {
                    "Source": "",
                    "Status": ""
                },
                "EventID": "20240808164303",
                "Serial": 4,
                "AnnouncedTime": "",
                "OriginTime": timeStr,
                "Hypocenter": "日向灘",
                "Latitude": 31.8,
                "Longitude": 131.7,
                "Magunitude": 7.2,
                "Depth": 20,
                "MaxIntensity": "6強",
                "Accuracy": {
                    "Epicenter": "",
                    "Depth": "",
                    "Magnitude": ""
                },
                "MaxIntChange": {
                    "String": "",
                    "Reason": ""
                },
                "WarnArea": [],
                "isSea": false,
                "isTraining": false,
                "isAssumption": false,
                "isWarn": true,
                "isFinal": false,
                "isCancel": false,
                "OriginalText": "",
                "Pond": ""
            }
            statusStore.setEqMessage(source, data)
        }, 6700);
    }
})
</script>

<style lang="scss" scoped>

</style>