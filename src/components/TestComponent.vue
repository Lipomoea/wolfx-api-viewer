<template>
    <div>

    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStatusStore } from '@/stores/status';
import Http from '@/classes/Http';

const statusStore = useStatusStore()

const testJmaEew = true
const testCwaEew = true
const testIclEew = true
const testScEew = false
const testJmaEqlist = true

onMounted(async ()=>{
    if(testJmaEew){
        const time = new Date()
        time.setHours(time.getHours() + 1)
        const timeStr = time.toLocaleString()
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
        }, 3500);
        setTimeout(() => {
            const data = {
                "Title": "キャンセル時、未設定時",
                "CodeType": "",
                "Issue": {
                    "Source": "",
                    "Status": ""
                },
                "EventID": "20240808164303",
                "Serial": 0,
                "AnnouncedTime": timeStr,
                "OriginTime": timeStr,
                "Hypocenter": '',
                "Latitude": 0,
                "Longitude": 0,
                "Magunitude": 0,
                "Depth": 0,
                "MaxIntensity": "",
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
                "isCancel": true,
                "OriginalText": "",
                "Pond": ""
            }
            statusStore.setEqMessage(source, data)
        }, 5500);
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
        }, 8000);
        setTimeout(() => {
            const data = {
                "Title": "キャンセル時、未設定時",
                "CodeType": "",
                "Issue": {
                    "Source": "",
                    "Status": ""
                },
                "EventID": "20240808164303",
                "Serial": 0,
                "AnnouncedTime": timeStr,
                "OriginTime": timeStr,
                "Hypocenter": "",
                "Latitude": 0,
                "Longitude": 0,
                "Magunitude": 0,
                "Depth": 0,
                "MaxIntensity": "",
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
                "isCancel": true,
                "OriginalText": "",
                "Pond": ""
            }
            statusStore.setEqMessage(source, data)
        }, 10000);
        setTimeout(() => {
            const data = {
                "Title": "緊急地震速報（予報）",
                "CodeType": "",
                "Issue": {
                    "Source": "",
                    "Status": ""
                },
                "EventID": "20150530202300",
                "Serial": 1,
                "AnnouncedTime": timeStr,
                "OriginTime": timeStr,
                "Hypocenter": "小笠原諸島西方沖",
                "Latitude": 27.86,
                "Longitude": 140.68,
                "Magunitude": 8.1,
                "Depth": 680,
                "MaxIntensity": "不明",
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
                "isSea": true,
                "isTraining": false,
                "isAssumption": false,
                "isWarn": false,
                "isFinal": true,
                "isCancel": false,
                "OriginalText": "",
                "Pond": ""
            }
            statusStore.setEqMessage(source, data)
        }, 8000);
        // setTimeout(() => {
        //     const data = {
        //         "Title": "緊急地震速報（警報）",
        //         "CodeType": "Ｍ、最大予測震度及び主要動到達予測時刻の緊急地震速報",
        //         "Issue": {
        //             "Source": "東京",
        //             "Status": "通常"
        //         },
        //         "EventID": "20240809195740",
        //         "Serial": 15,
        //         "AnnouncedTime": timeStr,
        //         "OriginTime": timeStr,
        //         "Hypocenter": "神奈川県西部",
        //         "Latitude": 35.4,
        //         "Longitude": 139.2,
        //         "Magunitude": 5.2,
        //         "Depth": 10,
        //         "MaxIntensity": "4",
        //         "Accuracy": {
        //             "Epicenter": "IPF 法（5 点以上）",
        //             "Depth": "IPF 法（5 点以上）",
        //             "Magnitude": "全点全相"
        //         },
        //         "MaxIntChange": {
        //             "String": "ほとんど変化なし",
        //             "Reason": "不明、未設定時、キャンセル時"
        //         },
        //         "WarnArea": [
        //             {
        //                 "Chiiki": "神奈川県西部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "//////",
        //                 "Type": "警報",
        //                 "Arrive": "既に到達と予測"
        //             },
        //             {
        //                 "Chiiki": "神奈川県東部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "//////",
        //                 "Type": "警報",
        //                 "Arrive": "既に到達と予測"
        //             },
        //             {
        //                 "Chiiki": "静岡県東部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "//////",
        //                 "Type": "警報",
        //                 "Arrive": "既に到達と予測"
        //             },
        //             {
        //                 "Chiiki": "山梨県東部・富士五湖",
        //                 "Shindo1": "4",
        //                 "Shindo2": "3",
        //                 "Time": "//////",
        //                 "Type": "警報",
        //                 "Arrive": "既に到達と予測"
        //             },
        //             {
        //                 "Chiiki": "東京都多摩東部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "3",
        //                 "Time": "//////",
        //                 "Type": "警報",
        //                 "Arrive": "既に到達と予測"
        //             },
        //             {
        //                 "Chiiki": "東京都多摩西部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "195747",
        //                 "Type": "警報",
        //                 "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
        //             },
        //             {
        //                 "Chiiki": "静岡県伊豆",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "195746",
        //                 "Type": "警報",
        //                 "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
        //             },
        //             {
        //                 "Chiiki": "埼玉県南部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "195750",
        //                 "Type": "警報",
        //                 "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
        //             },
        //             {
        //                 "Chiiki": "東京都２３区",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "195750",
        //                 "Type": "警報",
        //                 "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
        //             },
        //             {
        //                 "Chiiki": "山梨県中・西部",
        //                 "Shindo1": "4",
        //                 "Shindo2": "4",
        //                 "Time": "195752",
        //                 "Type": "警報",
        //                 "Arrive": "主要動到達時刻の予測なし（PLUM 法による予測）"
        //             }
        //         ],
        //         "isSea": false,
        //         "isTraining": false,
        //         "isAssumption": false,
        //         "isWarn": true,
        //         "isFinal": true,
        //         "isCancel": false,
        //         "OriginalText": "37 03 00 240809195827 C11 240809195738 ND20240809195740 NCN915 JD////////////// JN/// 361 N354 E1392 010 52 04 RK44559 RT01/// RC0//// EBI 361 S0404 ////// 11 360 S0404 ////// 11 441 S0404 ////// 11 412 S0403 ////// 11 351 S0403 ////// 11 352 S0404 195747 19 440 S0404 195746 19 331 S0404 195750 19 350 S0404 195750 19 411 S0404 195752 19 9999=",
        //         "Pond": "15"
        //     }
        //     statusStore.setEqMessage(source, data)
        // }, 5000);
    }
    if(testCwaEew){
        const source = 'cwaEew'
        const time = new Date()
        const timeStr = time.toLocaleString()
        setTimeout(() => {
            const data = {
                "ID": 1130793,
                "ReportTime": "2024-04-03 07:58:24",
                "ReportNum": 1,
                "OriginTime": timeStr,
                "HypoCenter": "花蓮縣壽豐鄉",
                "Latitude": 23.89,
                "Longitude": 121.56,
                "Magunitude": 6.8,
                "Depth": 20,
                "MaxIntensity": "6強",
                "isCancel": false
            }
            statusStore.setEqMessage(source, data)
        }, 6000);
    }
    if(testIclEew){
        setTimeout(() => {
            statusStore.disconnect()
        }, 2000);
        const source = 'iclEew'
        const startAt = Date.now()
        // setTimeout(() => {
        //     const data = {
        //         "depth": 0,
        //         "epiIntensity": 0,
        //         "epicenter": "西藏墨竹工卡",
        //         "eventId": 84928653,
        //         "insideNet": 0,
        //         "latitude": 29.730461,
        //         "longitude": 92.168785,
        //         "magnitude": 6.0,
        //         "sations": 5,
        //         "sourceType": "meihuan",
        //         startAt,
        //         "updateAt": Date.now(),
        //         "updates": 4
        //     }
        //     statusStore.setEqMessage(source, data)
        // }, 3000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 1,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 0,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 4000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 2,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 5,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 5000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 3,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 10,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 6000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 4,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 20,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 7000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 5,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 30,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 8000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 6,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 40,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 9000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 7,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 60,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 10000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 8,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 80,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 11000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 9,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 100,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 12000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 10,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 120,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 13000);
        setTimeout(() => {
            const data = {
                "eventId": 84222641,
                "updates": 11,
                "latitude": 32.00443,
                "longitude": 117.68219,
                "depth": 160,
                "epicenter": "安徽肥东",
                startAt,
                "updateAt": Date.now(),
                "magnitude": 6.0,
                "insideNet": 0,
                "sations": 7,
                "sourceType": "meihuan",
                "epiIntensity": 0
            }
            statusStore.setEqMessage(source, data)
        }, 14000);
    }
    if(testScEew){
        const source = 'scEew'
        const time = new Date()
        const timeStr = time.toLocaleString()
        setTimeout(() => {
            const data = {
                "ID": 7800,
                "EventID": "20241022232024.0001_1",
                "ReportTime": "2024-10-22 23:20:40",
                "ReportNum": 1,
                "OriginTime": timeStr,
                "HypoCenter": "四川绵阳市北川县",
                "Latitude": 31.832,
                "Longitude": 104.353,
                "Magunitude": 3,
                "Depth": null,
                "MaxIntensity": 4
            }
            statusStore.setEqMessage(source, data)
        }, 4000);
    }
    if(testJmaEqlist){
        const source = 'jmaEqlist'
        setTimeout(() => {
            statusStore.disconnect()
        }, 2000);
        const limit = 20
        const res = await Http.get(`https://api.p2pquake.net/v2/jma/quake?limit=${limit}&order=1&since_date=20240101&until_date=20240101`)
        console.log(res);
        let i = -1
        setInterval(() => {
            i++
            if(i < limit) {
                const data = res[i]
                statusStore.setEqMessage(source, data)
            }
        }, 3000);
    }
})
</script>

<style lang="scss" scoped>

</style>