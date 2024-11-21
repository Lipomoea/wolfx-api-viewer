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
                "AnnouncedTime": timeStr,
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
                "AnnouncedTime": timeStr,
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
        setTimeout(() => {
            const data = {
                "Title": "緊急地震速報（警報）",
                "CodeType": "Ｍ、最大予測震度及び主要動到達予測時刻の緊急地震速報",
                "Issue": {
                    "Source": "東京",
                    "Status": "通常"
                },
                "EventID": "20240809195740",
                "Serial": 15,
                "AnnouncedTime": timeStr,
                "OriginTime": timeStr,
                "Hypocenter": "神奈川県西部",
                "Latitude": 35.4,
                "Longitude": 139.2,
                "Magunitude": 5.2,
                "Depth": 10,
                "MaxIntensity": "4",
                "Accuracy": {
                    "Epicenter": "IPF 法（5 点以上）",
                    "Depth": "IPF 法（5 点以上）",
                    "Magnitude": "全点全相"
                },
                "MaxIntChange": {
                    "String": "ほとんど変化なし",
                    "Reason": "不明、未設定時、キャンセル時"
                },
                "WarnArea": [
                    {
                        "Chiiki": "神奈川県西部",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "//////",
                        "Type": "警報",
                        "Arrive": "既に到達と予測"
                    },
                    {
                        "Chiiki": "神奈川県東部",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "//////",
                        "Type": "警報",
                        "Arrive": "既に到達と予測"
                    },
                    {
                        "Chiiki": "静岡県東部",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "//////",
                        "Type": "警報",
                        "Arrive": "既に到達と予測"
                    },
                    {
                        "Chiiki": "山梨県東部・富士五湖",
                        "Shindo1": "4",
                        "Shindo2": "3",
                        "Time": "//////",
                        "Type": "警報",
                        "Arrive": "既に到達と予測"
                    },
                    {
                        "Chiiki": "東京都多摩東部",
                        "Shindo1": "4",
                        "Shindo2": "3",
                        "Time": "//////",
                        "Type": "警報",
                        "Arrive": "既に到達と予測"
                    },
                    {
                        "Chiiki": "東京都多摩西部",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "195747",
                        "Type": "警報",
                        "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    },
                    {
                        "Chiiki": "静岡県伊豆",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "195746",
                        "Type": "警報",
                        "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    },
                    {
                        "Chiiki": "埼玉県南部",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "195750",
                        "Type": "警報",
                        "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    },
                    {
                        "Chiiki": "東京都２３区",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "195750",
                        "Type": "警報",
                        "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    },
                    {
                        "Chiiki": "山梨県中・西部",
                        "Shindo1": "4",
                        "Shindo2": "4",
                        "Time": "195752",
                        "Type": "警報",
                        "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
                    }
                ],
                "isSea": false,
                "isTraining": false,
                "isAssumption": false,
                "isWarn": true,
                "isFinal": true,
                "isCancel": false,
                "OriginalText": "37 03 00 240809195827 C11 240809195738 ND20240809195740 NCN915 JD////////////// JN/// 361 N354 E1392 010 52 04 RK44559 RT01/// RC0//// EBI 361 S0404 ////// 11 360 S0404 ////// 11 441 S0404 ////// 11 412 S0403 ////// 11 351 S0403 ////// 11 352 S0404 195747 19 440 S0404 195746 19 331 S0404 195750 19 350 S0404 195750 19 411 S0404 195752 19 9999=",
                "Pond": "15"
            }
            statusStore.setEqMessage(source, data)
        }, 5000);
    }
})
</script>

<style lang="scss" scoped>

</style>