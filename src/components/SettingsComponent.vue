<template>
    <div class="outer">
        <div class="container">
            <div class="title">设置</div>
            <div class="settings">
                <div class="subTitle">行为</div>
                <div class="group">
                    <div class="row">
                        <span style="width: 100%;">收到地震预警（警报）时：</span>
                        <div class="switchGroup">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.notification" :disabled="settingsStore.mainSettings.onEew.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.sound" :disabled="settingsStore.mainSettings.onEew.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="showFocusButton">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.focus" :disabled="settingsStore.mainSettings.onEew.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span style="width: 100%;">收到地震预警（全部）时：</span>
                        <div class="switchGroup">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="showFocusButton">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span style="width: 100%;">收到地震信息时：</span>
                        <div class="switchGroup">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="showFocusButton">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span style="width: 100%;">地震监测网检测到摇晃时：</span>
                        <div class="switchGroup">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="showFocusButton">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="subTitle">音效</div>
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>关闭默认通知音</span>
                                <el-switch v-model="settingsStore.mainSettings.muteNotification"></el-switch>
                            </div>
                            <div class="switch" style="width: 180px;">
                                <span style="white-space: nowrap;">选择音效</span>
                                <el-select 
                                v-model="settingsStore.mainSettings.soundEffect"
                                size="small">
                                    <el-option label="SREV" value="srev"></el-option>
                                </el-select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="subTitle">地图</div>
                <div class="group">
                    <div class="row">
                        <span class="groupTitle">所在地设置</span>
                        <div class="switchGroup">
                            <div class="switch force-wrap">
                                <span style="width: 100%;">所在地经纬度（均设置时才生效）：</span>
                                <span>纬度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.userLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat('userLatLng')"></el-input>
                                <span style="margin-left: 10px;">经度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.userLatLng[1]"
                                size="small"
                                maxlength="10"
                                @change="setLng('userLatLng')"></el-input>
                                <el-button
                                style="margin-left: 10px;"
                                size="small"
                                @click="autoLocate">自动定位</el-button>
                                <el-button
                                size="small"
                                @click="clearUserLatLng">清除经纬度</el-button>
                            </div>
                            <div class="switch">
                                <span>显示所在地</span>
                                <el-switch v-model="settingsStore.mainSettings.displayUser"></el-switch>
                            </div>
                            <div class="switch">
                                <span>显示地图烈度图例</span>
                                <el-switch v-model="settingsStore.mainSettings.displayLegend"></el-switch>
                            </div>
                            <div class="switch">
                                <span>显示本地烈度和倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCountdown"></el-switch>
                            </div>
                            <div class="switch">
                                <el-checkbox v-model="settingsStore.mainSettings.forceDisplayCountdown" :disabled="!settingsStore.mainSettings.displayCountdown">强制计算倒计时（低精度）</el-checkbox>
                            </div>
                            <div class="switch">
                                <span>播放倒计时音效</span>
                                <el-switch v-model="settingsStore.mainSettings.playCountdownSound" :disabled="!settingsStore.mainSettings.displayCountdown"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="groupTitle">默认视野设置</span>
                        <div class="switchGroup">
                            <div class="switch force-wrap">
                                <span style="width: 100%;">自定义视野（均设置时才生效）：</span>
                                <span>纬度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.viewLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat('viewLatLng')"></el-input>
                                <span style="margin-left: 10px;">经度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.viewLatLng[1]"
                                size="small"
                                maxlength="10"
                                @change="setLng('viewLatLng')"></el-input>
                                <span style="margin-left: 10px;">缩放</span>
                                <el-input
                                v-model="settingsStore.mainSettings.defaultZoom"
                                type="number"
                                size="small"
                                maxlength="5"
                                style="width: 50px;"
                                @change="setDefaultZoom"></el-input>
                                <el-button
                                size="small"
                                @click="setCurrentViewAsDefault">设为当前视野</el-button>
                                <el-button
                                size="small"
                                @click="clearViewLatLng">清除经纬度</el-button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="groupTitle">地震监测网设置</span>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>隐藏无数据测站</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.hideNoData"></el-switch>
                            </div>
                        </div>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>強震モニタ（震度）</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.nied"></el-switch>
                            </div>
                            <div class="switch">
                                <span>回放(min)</span>
                                <el-input
                                v-model="settingsStore.mainSettings.displaySeisNet.niedDelay"
                                size="small"
                                type="number"
                                style="width: 70px;"
                                @input="setNiedDelay"></el-input>
                                <el-button
                                size="small"
                                @click="settingsStore.mainSettings.displaySeisNet.niedDelay = 0"
                                :disabled="settingsStore.mainSettings.displaySeisNet.niedDelay == 0">还原</el-button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="groupTitle">其他</span>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>显示中国断层</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCnFault"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="subTitle">高级</div>
                <div class="group" v-if="settingsStore.advancedSettings.displayNiedShindoSwitch">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>显示強震モニタ震度</span>
                                <el-switch v-model="settingsStore.advancedSettings.displayNiedShindo"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>输入指令</span>
                                <el-input
                                type="password"
                                v-model="advancedInput"
                                size="small"
                                style="width: 300px;"
                                @change="handleAdvance"></el-input>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="subTitle">关于</div>
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <el-button
                                style="margin-top: 5px;"
                                @click="handleAbout">帮助&关于</el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <el-dialog v-model="verifyDialog" width="300px" top="40vh" :show-close="false">
            <el-form :model="idForm">
                <el-form-item label="用户名" label-width="60px">
                    <el-input v-model="idForm.username" @keyup.enter="postVerify"></el-input>
                </el-form-item>
                <el-form-item label="密码" label-width="60px">
                    <el-input type="password" v-model="idForm.password" @keyup.enter="postVerify"></el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button type="default" @click="verifyDialog = false">取消</el-button>
                <el-button type="primary" @click="postVerify">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings';
import { useStatusStore } from '@/stores/status';
import { utilUrls } from '@/utils/Urls';
import Http from '@/utils/Http';
import { ref, reactive } from 'vue'

const showNotifButton = 'Notification' in window
const showFocusButton = !!window.__TAURI_INTERNALS__

const settingsStore = useSettingsStore()
const statusStore = useStatusStore()
const setLat = (type)=>(val)=>{
    if(val === '') return
    let number = Number(val)
    if(isNaN(number)){
        settingsStore.mainSettings[type][0] = ''
    }
    else{
        if(number > 90) number = 90
        if(number < -90) number = -90
        settingsStore.mainSettings[type][0] = number.toString()
    }
}
const setLng = (type)=>(val)=>{
    if(val === '') return
    let number = Number(val)
    if(isNaN(number)){
        settingsStore.mainSettings[type][1] = ''
    }
    else{
        if(number > 180) number = 180
        if(number < -180) number = -180
        settingsStore.mainSettings[type][1] = number.toString()
    }
}
const autoLocate = async ()=>{
    const res = await Http.get(utilUrls.geoIp)
    if(res.city_zh == null){
        ElMessage({
            message: '获取位置失败',
            type: 'error',
        })
    }
    else{
        ElMessageBox.confirm(
            `你的IP定位城市是${res.city_zh}，参考经纬度(${res.latitude}, ${res.longitude})。是否更新设置？`,
            '自动定位',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info',
                showClose: false,
            }
        ).then(()=>{
            setLat('userLatLng')(res.latitude)
            setLng('userLatLng')(res.longitude)
            ElMessage({
                message: '位置更新成功',
                type: 'success',
            })
        }).catch(()=>{
            ElMessage({
                message: '取消设置',
                type: 'info',
            })
        })
    }
}
const setDefaultZoom = (val)=>{
    if(val > 18) val = 18
    if(val < 0) val = 0
    settingsStore.mainSettings.defaultZoom = val
}
const setCurrentViewAsDefault = ()=>{
    const map = statusStore.map
    if(map == null){
        ElMessage({
            message: '地图未加载',
            type: 'error',
        })
    }
    else{
        ElMessageBox.confirm(
            '是否设定当前视野为默认视野？',
            '设定当前视野',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info',
                showClose: false,
            }
        ).then(()=>{
            const { lat, lng } = map.getCenter()
            const zoom = map.getZoom()
            setLat('viewLatLng')(lat)
            setLng('viewLatLng')(lng)
            setDefaultZoom(zoom)
            ElMessage({
                message: '设定成功',
                type: 'success',
            })
        }).catch(()=>{
            ElMessage({
                message: '取消设置',
                type: 'info',
            })
        })
    }
}
const clearViewLatLng = ()=>{
    settingsStore.mainSettings.viewLatLng[0] = ''
    settingsStore.mainSettings.viewLatLng[1] = ''
    ElMessage({
        message: '清除完成',
        type: 'success',
    })
}
const clearUserLatLng = ()=>{
    settingsStore.mainSettings.userLatLng[0] = ''
    settingsStore.mainSettings.userLatLng[1] = ''
    ElMessage({
        message: '清除完成',
        type: 'success',
    })
}
const setNiedDelay = (val)=>{
    // if(val > 10080) val = 10080
    if(val < 0) val = 0
    settingsStore.mainSettings.displaySeisNet.niedDelay = val
}
const advancedInput = ref('')
const verifyDialog = ref(false)
let verifyType = ''
const idForm = reactive({
    username: '',
    password: '',
})
const handleAdvance = (val)=>{
    switch(val){
        case 'displayNiedShindo': {
            settingsStore.advancedSettings.displayNiedShindoSwitch = true
            break
        }
        case 'hideNiedShindo': {
            settingsStore.advancedSettings.displayNiedShindo = false
            settingsStore.advancedSettings.displayNiedShindoSwitch = false
            break
        }
        case 'enableIclEew': {
            verifyType = 'enableIclEew'
            verifyDialog.value = true
            break
        }
        case 'disableIclEew': {
            settingsStore.advancedSettings.enableIclEew = false
            ElMessage({
                message: '功能已关闭，3秒后自动刷新网页',
                type: 'success'
            })
            setTimeout(() => {
                window.location.reload()
            }, 3000);
            break
        }
        case 'forceCalcCsis': {
            verifyType = 'forceCalcCsis'
            verifyDialog.value = true
            break
        }
        case 'cancelCalcCsis': {
            settingsStore.advancedSettings.forceCalcCsis = false
            ElMessage({
                message: '功能已关闭，3秒后自动刷新网页',
                type: 'success'
            })
            setTimeout(() => {
                window.location.reload()
            }, 3000);
            break
        }
    }
    advancedInput.value = ''
}
const postVerify = async ()=>{
    switch(verifyType){
        case 'enableIclEew': {
            const res = await Http.post('http://124.70.142.213:8766/icl_url', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.enableIclEew = true
                localStorage.setItem('iclUrl', JSON.stringify(res.data))
                verifyDialog.value = false
                ElMessage({
                    message: '认证成功，3秒后自动刷新网页',
                    type: 'success'
                })
                setTimeout(() => {
                    window.location.reload()
                }, 3000);
            }
            else{
                ElMessage({
                    message: '认证失败',
                    type: 'error'
                })
            }
            break
        }
        case 'forceCalcCsis':{
            const res = await Http.post('http://124.70.142.213:8766/calc_csis', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.forceCalcCsis = true
                localStorage.setItem('calcCsis', res.data)
                verifyDialog.value = false
                ElMessage({
                    message: '认证成功，3秒后自动刷新网页',
                    type: 'success'
                })
                setTimeout(() => {
                    window.location.reload()
                }, 3000);
            }
            else{
                ElMessage({
                    message: '认证失败',
                    type: 'error'
                })
            }
            break
        }
    }
}
const handleAbout = ()=>{
    ElMessageBox.alert(
        `<div class="title">最近更新</div>
        <div class="about">
            <p>v2.0.0-pre.22 新增：地震波倒计时提示音；优化：多重地震震度检出；优化：降低震度误检出概率；优化：调整部分UI质感；优化：代码逻辑；修复：异色地震波叠加闪烁的问题。</p>
            <p>v2.0.0-pre.21 新增：EEW显示地震波倒计时；新增：紧急地震速报本地预想震度功能；新增：EEW地图图例；优化：新增烈度配色。</p>
            <p>v2.0.0-pre.20 新增：首次推出Windows桌面版应用，新增桌面应用弹窗功能。</p>
            <p>v2.0.0-(pre.1-pre.19) 变更：升级Vue3版本，UI重排，WebSocket使用all_eew接口，使用新的中国和日本地图，暂时移除地震波倒计时功能；新增：同源多个EEW同时展示，适配假定震源，JMA紧急地震速报区域预想震度绘制，中国断层显示，NIED強震モニタ测站显示、震度检出功能，设置默认视野功能，鼠标悬浮提示区域名称，NIED测站回放功能。</p>
            <p>v1.0.0-1.1.2 新增：地图功能、自动打开地图功能、JMA地震情报列表查看详细、设置用户所在地、IP定位、地震波抵达倒计时等功能；优化：增加自动对时。</p>
        </div>
        <div class="title">使用方法</div>
        <div class="about">
            <p>主要功能：接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息，日本气象厅、中国地震台网地震信息，NIED強震モニタ测站数据。</p>
            <p>Windows Chrome/Edge推荐设置（以Chrome为例，Edge方法类似）：
                <ul style="list-style-position: inside;">
                    <li>保持后台刷新：浏览器访问chrome://flags - Calculate window occlusion on Windows - Disabled - 右下角重新启动</li>
                    <li>去除网页“不安全”提示（同时解除网页权限设置限制，但浏览器启动时会收到横幅提示）：chrome://flags - Insecure origins treated as secure - 启用 - 输入本网页的链接 - 右下角重新启动</li>
                    <li>作为网页应用安装：Chrome打开此页面，右上角三点 - 保存并分享 - 将网页作为应用安装。安装一次后刷新页面即可加载最新版本网页，无需重新安装。</li>
                </ul>
            </p>
            <p>通知推送：需授予通知权限。Chrome：点击网页链接左侧按钮-网站设置-通知-允许，刷新页面。</p>
            <p>播放声音：需开启声音权限。Chrome：点击网页链接左侧按钮-网站设置-声音-允许，刷新页面。</p>
        </div>
        <div class="title">注意事项</div>
        <div class="about">
            <p>关于烈度：日本气象厅紧急地震速报（气象厅震度，预估值），台湾中央气象署（CWA震度，预估值），四川地震局（CSIS，预估值），福建地震局（CSIS，预估值），日本气象厅地震情报（气象厅震度，测定值），中国地震台网地震信息（CSIS，预估值）。</p>
            <p>关于时间：显示为发报机构当地时间。</p>
            <p>关于延迟：受API限制，部分资料具有延迟是正常现象。</p>
            <p>关于走时：目前所有地震波位置均采用jma2001走时表计算，对日本以外地区可能有较大误差。未知震源深度视为10km。</p>
            <p>关于地图：由于服务器带宽限制，进入页面后需要一定时间加载地图。如长时间未加载地图，请刷新页面。</p>
        </div>
        <div class="title">关于</div>
        <div class="about">
            <p>Windows 10及以上用户推荐使用应用程序：<a href="https://github.com/Lipomoea/wolfx-api-viewer/releases" target="_blank">Windows应用程序下载</a></p>
            <p>本页面基于Wolfx Open API (<a href="https://api.wolfx.jp" target="_blank">api.wolfx.jp</a>) 开发，不属于Wolfx官方。</p>
            <p>本页面未针对移动端进行适配，建议使用Windows应用程序或电脑浏览器访问本网页。</p>
            <p>联系我：<a href="https://space.bilibili.com/316757498" target="_blank">リッポミャ</a>（哔哩哔哩）</p>
            <p>Github: <a href="https://github.com/Lipomoea/wolfx-api-viewer" target="_blank">https://github.com/Lipomoea/wolfx-api-viewer</a></p>
            <p>特别鸣谢：
                <p>Wolfx Project：接口支持。</p>
                <p>kotoho7：SREV音效支持。音效遵循<a href="https://creativecommons.org/licenses/by-sa/2.0/deed.zh-hans" target="_blank">CC BY-SA 2.0 DEED</a>许可协议，未进行二次加工。</p>
            </p>
        </div>`,
        'wolfx-api-viewer v2.0.0-pre.22',
        {
            confirmButtonText: 'OK',
            showClose: false,
            dangerouslyUseHTMLString: true,
            customStyle: {
                '--el-messagebox-width': '60vw',
                padding: '20px'
            },
            customClass: 'about-box'
        }
    )
}
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    .container{
        min-width: 430px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        .title{
            font-size: 24px;
            font-weight: 700;
        }
        .settings{
            display: flex;
            flex-direction: column;
            .subTitle{
                font-size: 18px;
                font-weight: 700;
            }
            .group{
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                row-gap: 5px;
                column-gap: 40px;
                margin-bottom: 5px;
                .row{
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    column-gap: 10px;
                    .groupTitle{
                        width: 100%;
                        font-weight: 700;
                    }
                    .switchGroup{
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        column-gap: 15px;
                        .switch{
                            display: flex;
                            align-items: center;
                            column-gap: 5px;
                            .latLng{
                                width: 70px;
                            }
                        }
                    }
                }
            }
            .el-switch{
                height: 24px;
            }
        }
    }
}
.force-wrap{
    flex-wrap: wrap;
    row-gap: 5px;
}
</style>
<style lang="scss">
.about-box{
    .title{
        font-size: 20px;
    }
    .about{
        font-size: 16px;
        margin-bottom: 10px;
    }
    a,a:visited{
        color: blue;
    }
}
</style>