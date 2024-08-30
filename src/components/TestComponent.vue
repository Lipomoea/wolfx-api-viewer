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
                "WarnArea": [
                    {
                    "Chiiki": "宮崎県南部平野部",
                    "Shindo1": "6弱",
                    "Shindo2": "5強",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "宮崎県北部平野部",
                    "Shindo1": "5強",
                    "Shindo2": "5弱",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "宮崎県南部山沿い",
                    "Shindo1": "5強",
                    "Shindo2": "5強",
                    "Time": "164315",
                    "Type": "警報",
                    "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    },
                    {
                    "Chiiki": "鹿児島県大隅",
                    "Shindo1": "5強",
                    "Shindo2": "5強",
                    "Time": "164316",
                    "Type": "警報",
                    "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    },
                    {
                    "Chiiki": "宮崎県北部山沿い",
                    "Shindo1": "5弱",
                    "Shindo2": "5弱",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "鹿児島県薩摩",
                    "Shindo1": "5弱",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "大分県南部",
                    "Shindo1": "5弱",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "熊本県球磨",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "熊本県天草・芦北",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "熊本県熊本",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "大分県西部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "熊本県阿蘇",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "大分県中部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "高知県西部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "鹿児島県種子島",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "鹿児島県甑島",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "長崎県島原半島",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "福岡県筑後",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "愛媛県南予",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "大分県北部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "長崎県南西部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "佐賀県南部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "愛媛県中予",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "山口県中部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "佐賀県北部",
                    "Shindo1": "4",
                    "Shindo2": "4",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "山口県東部",
                    "Shindo1": "4",
                    "Shindo2": "3",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "福岡県福岡",
                    "Shindo1": "4",
                    "Shindo2": "3",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "福岡県北九州",
                    "Shindo1": "4",
                    "Shindo2": "3",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    },
                    {
                    "Chiiki": "長崎県北部",
                    "Shindo1": "4",
                    "Shindo2": "3",
                    "Time": "//////",
                    "Type": "警報",
                    "Arrive": "既に到達と予測"
                    }
                ],
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