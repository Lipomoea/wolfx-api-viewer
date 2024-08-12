import { onMounted } from 'vue'

const generateJmaEewMessage = (eqMessage)=>{
    onMounted(()=>{
        const time = new Date()
        time.setHours(time.getHours() + 1)
        const timeStr = time.toLocaleString()
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 1,
                reportNumText: '第1報',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（予報）',
                titleText: '緊急地震速報（予報）',
                hypocenter: '宮城県沖',
                hypocenterText: '震源地: 宮城県沖',
                lat: 38.5,
                lng: 142.5,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 4.3,
                magnitudeText: 'マグニチュード: 4.3',
                useShindo: true,
                maxIntensity: '1',
                maxIntensityText: '推定最大震度: 1',
                className: 'gray',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 4000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 2,
                reportNumText: '第2報',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（予報）',
                titleText: '緊急地震速報（予報）',
                hypocenter: '宮城県沖',
                hypocenterText: '震源地: 宮城県沖',
                lat: 38.4,
                lng: 142.6,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 4.9,
                magnitudeText: 'マグニチュード: 4.9',
                useShindo: true,
                maxIntensity: '2',
                maxIntensityText: '推定最大震度: 2',
                className: 'blue',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 5000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 3,
                reportNumText: '第3報',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（予報）',
                titleText: '緊急地震速報（予報）',
                hypocenter: '宮城県沖',
                hypocenterText: '震源地: 宮城県沖',
                lat: 38.3,
                lng: 142.7,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 5.9,
                magnitudeText: 'マグニチュード: 5.9',
                useShindo: true,
                maxIntensity: '3',
                maxIntensityText: '推定最大震度: 3',
                className: 'green',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 6000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 4,
                reportNumText: '第4報',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（予報）',
                titleText: '緊急地震速報（予報）',
                hypocenter: '宮城県沖',
                hypocenterText: '震源地: 宮城県沖',
                lat: 38.2,
                lng: 142.8,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 6.6,
                magnitudeText: 'マグニチュード: 6.6',
                useShindo: true,
                maxIntensity: '4',
                maxIntensityText: '推定最大震度: 4',
                className: 'yellow',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 7000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 5,
                reportNumText: '第5報',
                reportTime: '',
                isWarn: true,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（警報）',
                titleText: '緊急地震速報（警報）',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38,
                lng: 143,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 7.6,
                magnitudeText: 'マグニチュード: 7.6',
                useShindo: true,
                maxIntensity: '5弱',
                maxIntensityText: '推定最大震度: 5弱',
                className: 'orange',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 8000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 6,
                reportNumText: '第6報',
                reportTime: '',
                isWarn: true,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（警報）',
                titleText: '緊急地震速報（警報）',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 7.8,
                magnitudeText: 'マグニチュード: 7.8',
                useShindo: true,
                maxIntensity: '5強',
                maxIntensityText: '推定最大震度: 5強',
                className: 'orange',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 9000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 7,
                reportNumText: '第7報',
                reportTime: '',
                isWarn: true,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（警報）',
                titleText: '緊急地震速報（警報）',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 8.2,
                magnitudeText: 'マグニチュード: 8.2',
                useShindo: true,
                maxIntensity: '6弱',
                maxIntensityText: '推定最大震度: 6弱',
                className: 'red',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 10000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 8,
                reportNumText: '第8報',
                reportTime: '',
                isWarn: true,
                isFinal: false,
                isCanceled: false,
                title: '緊急地震速報（警報）',
                titleText: '緊急地震速報（警報）',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 8.6,
                magnitudeText: 'マグニチュード: 8.6',
                useShindo: true,
                maxIntensity: '6強',
                maxIntensityText: '推定最大震度: 6強',
                className: 'red',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 11000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: true,
                reportNum: 9,
                reportNumText: '第9報',
                reportTime: '',
                isWarn: true,
                isFinal: true,
                isCanceled: false,
                title: '緊急地震速報（警報）',
                titleText: '緊急地震速報（警報）',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 8.9,
                magnitudeText: 'マグニチュード: 8.9',
                useShindo: true,
                maxIntensity: '7',
                maxIntensityText: '推定最大震度: 7',
                className: 'purple',
                info: '',
            }
            Object.assign(eqMessage, message)
        }, 12000);
        // setTimeout(() => {
        //     const message = {
        //         id: '20110311144640',
        //         isEew: true,
        //         reportNum: 9,
        //         reportNumText: '第9報',
        //         reportTime: '',
        //         isWarn: true,
        //         isFinal: true,
        //         isCanceled: true,
        //         title: '緊急地震速報（警報）',
        //         titleText: '緊急地震速報（警報）（取消）',
        //         hypocenter: '三陸沖',
        //         hypocenterText: '震源地: 三陸沖',
        //         lat: 38.1,
        //         lng: 142.9,
        //         depth: 10,
        //         depthText: '深さ: 10km',
        //         originTime: timeStr,
        //         originTimeText: '発震時刻: ' + timeStr,
        //         magnitude: 8.9,
        //         magnitudeText: 'マグニチュード: 8.9',
        //         useShindo: true,
        //         maxIntensity: '7',
        //         maxIntensityText: '推定最大震度: 7',
        //         className: 'gray',
        //         info: '',
        //     }
        //     Object.assign(eqMessage, message)
        // }, 15000);
    })
}
const generateJmaEqlistMessage = (eqMessage)=>{
    onMounted(()=>{
        const time = new Date()
        time.setHours(time.getHours() + 1)
        const timeStr = time.toLocaleString()
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: false,
                reportNum: 0,
                reportNumText: '',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '震度速報',
                titleText: '日本気象庁震度速報',
                hypocenter: '',
                hypocenterText: '震源地: 調査中',
                lat: 0,
                lng: 0,
                depth: 0,
                depthText: '深さ: 調査中',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 0,
                magnitudeText: 'マグニチュード: 調査中',
                useShindo: true,
                maxIntensity: '6強',
                maxIntensityText: '最大震度: 6強',
                className: 'red',
                info: '今後の情報に注意してください。',
            }
            Object.assign(eqMessage, message)
        }, 16000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: false,
                reportNum: 0,
                reportNumText: '',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '震源に関する情報',
                titleText: '日本気象庁震源に関する情報',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 7.9,
                magnitudeText: 'マグニチュード: 7.9',
                useShindo: true,
                maxIntensity: '6強',
                maxIntensityText: '最大震度: 6強',
                className: 'red',
                info: '津波警報等（大津波警報・津波警報あるいは津波注意報）を発表中です。',
            }
            Object.assign(eqMessage, message)
        }, 20000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: false,
                reportNum: 0,
                reportNumText: '',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '震度速報',
                titleText: '日本気象庁震度速報',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 7.9,
                magnitudeText: 'マグニチュード: 7.9',
                useShindo: true,
                maxIntensity: '7',
                maxIntensityText: '最大震度: 7',
                className: 'purple',
                info: '津波警報等（大津波警報・津波警報あるいは津波注意報）を発表中です。',
            }
            Object.assign(eqMessage, message)
        }, 24000);
        setTimeout(() => {
            const message = {
                id: '20110311144640',
                isEew: false,
                reportNum: 0,
                reportNumText: '',
                reportTime: '',
                isWarn: false,
                isFinal: false,
                isCanceled: false,
                title: '震源・震度情報',
                titleText: '日本気象庁震源・震度情報',
                hypocenter: '三陸沖',
                hypocenterText: '震源地: 三陸沖',
                lat: 38.1,
                lng: 142.9,
                depth: 10,
                depthText: '深さ: 10km',
                originTime: timeStr,
                originTimeText: '発震時刻: ' + timeStr,
                magnitude: 7.9,
                magnitudeText: 'マグニチュード: 7.9',
                useShindo: true,
                maxIntensity: '7',
                maxIntensityText: '最大震度: 7',
                className: 'purple',
                info: '津波警報等（大津波警報・津波警報あるいは津波注意報）を発表中です。',
            }
            Object.assign(eqMessage, message)
        }, 28000);
    })
}

const generateCwaEewMessage = (eqMessage)=>{
    onMounted(()=>{
        const time = new Date()
        time.setHours(time.getHours())
        const timeStr = time.toLocaleString()
        setTimeout(() => {
            const message = {
                id: '20240403075800',
                isEew: true,
                reportNum: 1,
                reportNumText: '第1報',
                reportTime: '',
                isWarn: true,
                isFinal: false,
                isCanceled: false,
                titleText: '中央氣象署地震速報',
                hypocenter: '花蓮縣壽豐鄉',
                hypocenterText: '震央: 花蓮縣壽豐鄉',
                lat: 23.88,
                lng: 121.54,
                depth: 20,
                depthText: '深度: 20km',
                originTime: timeStr,
                originTimeText: '時間: ' + timeStr,
                magnitude: 6.8,
                magnitudeText: '規模: 6.8',
                useShindo: true,
                maxIntensity: '6弱',
                maxIntensityText: '預估最大震度: 6弱',
                className: 'red',
            }
            Object.assign(eqMessage, message)
        }, 6000);
        setTimeout(() => {
            const message = {
                id: '20240403075800',
                isEew: true,
                reportNum: 2,
                reportNumText: '第2報',
                reportTime: '',
                isWarn: true,
                isFinal: false,
                isCanceled: false,
                titleText: '中央氣象署地震速報',
                hypocenter: '花蓮縣壽豐鄉',
                hypocenterText: '震央: 花蓮縣壽豐鄉',
                lat: 23.89,
                lng: 121.56,
                depth: 20,
                depthText: '深度: 20km',
                originTime: timeStr,
                originTimeText: '時間: ' + timeStr,
                magnitude: 6.8,
                magnitudeText: '規模: 6.8',
                useShindo: true,
                maxIntensity: '6強',
                maxIntensityText: '預估最大震度: 6強',
                className: 'red',
            }
            Object.assign(eqMessage, message)
        }, 7000);
    })
}
export { generateJmaEewMessage, generateJmaEqlistMessage, generateCwaEewMessage }