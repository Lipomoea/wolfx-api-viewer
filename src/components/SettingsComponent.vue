<template>
    <div class="outer">
        <div class="container">
            <div class="title">设置</div>
            <div class="settings">
                <div class="subTitle">
                    数据源&nbsp;
                    <el-popover
                        placement="top"
                        :width="300"
                        trigger="hover"
                    >
                        <template #reference>
                            <question-filled width="1em" height="1em"></question-filled>
                        </template>
                        <strong>
                            <p>需重新加载页面后生效。</p>
                        </strong>
                    </el-popover>
                </div>
                <div class="grid-group" style="grid-template-columns: 3fr 1fr 3fr 1fr;">
                    <div class="full-width">緊急地震速報</div>
                    <el-switch v-model="settingsStore.mainSettings.source.jmaEew"></el-switch>
                    <div class="full-width">中央氣象署地震速報</div>
                    <el-switch v-model="settingsStore.mainSettings.source.cwaEew"></el-switch>
                    <div class="full-width" v-if="settingsStore.advancedSettings.enableIclEew">大陆地震预警</div>
                    <el-switch v-if="settingsStore.advancedSettings.enableIclEew" v-model="settingsStore.mainSettings.source.iclEew"></el-switch>
                    <div class="full-width">四川地震局地震预警</div>
                    <el-switch v-model="settingsStore.mainSettings.source.scEew"></el-switch>
                    <div class="full-width">福建地震局地震预警</div>
                    <el-switch v-model="settingsStore.mainSettings.source.fjEew"></el-switch>
                    <div class="full-width">日本気象庁地震情報</div>
                    <el-switch v-model="settingsStore.mainSettings.source.jmaEqlist"></el-switch>
                    <div class="full-width" v-if="settingsStore.advancedSettings.enableTremFunctions">中央氣象署地震報告</div>
                    <el-switch v-if="settingsStore.advancedSettings.enableTremFunctions" v-model="settingsStore.mainSettings.source.cwaEqlist"></el-switch>
                    <div class="full-width">中国地震台网测定</div>
                    <el-switch v-model="settingsStore.mainSettings.source.cencEqlist"></el-switch>
                </div>
                <div class="subTitle">行为</div>
                <div class="group">
                    <div class="row">
                        <span class="full-width">收到地震预警（警报）时：</span>
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
                        <span class="full-width">收到地震预警（全部）时：</span>
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
                        <span class="full-width">收到地震信息时：</span>
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
                        <span class="full-width">地震监测网检测到摇晃时：</span>
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
                                <span class="full-width">所在地经纬度（均设置时才生效）：</span>
                                <span>纬度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.userLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat('userLatLng')"></el-input>
                                <span style="margin-left: 8px;">经度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.userLatLng[1]"
                                size="small"
                                maxlength="10"
                                @change="setLng('userLatLng')"></el-input>
                                <el-button
                                style="margin-left: 8px;"
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
                            <div class="switch full-width">
                                <span>显示本地烈度和倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCountdown"></el-switch>
                            </div>
                            <div class="switch">
                                <el-checkbox v-model="settingsStore.mainSettings.forceDisplayCountdown" :disabled="!settingsStore.mainSettings.displayCountdown">强制计算倒计时（低精度）</el-checkbox>
                            </div>
                            <div class="switch">
                                <el-checkbox v-model="settingsStore.mainSettings.playCountdownSound" :disabled="!settingsStore.mainSettings.displayCountdown">播放倒计时音效</el-checkbox>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="groupTitle">默认视野设置</span>
                        <div class="switchGroup">
                            <div class="switch force-wrap">
                                <span class="full-width">自定义视野（均设置时才生效）：</span>
                                <span>纬度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.viewLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat('viewLatLng')"></el-input>
                                <span style="margin-left: 8px;">经度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.viewLatLng[1]"
                                size="small"
                                maxlength="10"
                                @change="setLng('viewLatLng')"></el-input>
                                <span style="margin-left: 8px;">缩放</span>
                                <el-input
                                v-model="settingsStore.mainSettings.defaultZoom"
                                type="number"
                                size="small"
                                maxlength="2"
                                min="3"
                                max="12"
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
                            <div class="switch">
                                <span>回放(min)</span>
                                <el-input
                                v-model="settingsStore.mainSettings.displaySeisNet.delay"
                                size="small"
                                type="number"
                                style="width: 70px;"
                                @input="setDelay"></el-input>
                                <el-button
                                size="small"
                                @click="settingsStore.mainSettings.displaySeisNet.delay = 0"
                                :disabled="settingsStore.mainSettings.displaySeisNet.delay == 0">还原</el-button>
                            </div>
                        </div>
                        <div class="switchGroup full-width">
                            <div class="switch">
                                <span>強震モニタ（震度）</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.nied"></el-switch>
                            </div>
                            <div class="switch" v-if="settingsStore.advancedSettings.displayNiedShindoSwitch">
                                <el-checkbox v-model="settingsStore.advancedSettings.displayNiedShindo" :disabled="!settingsStore.mainSettings.displaySeisNet.nied">解析震度阶</el-checkbox>
                            </div>
                        </div>
                        <div class="switchGroup full-width" v-if="settingsStore.advancedSettings.enableTremFunctions">
                            <div class="switch">
                                <span>TREM-Net （震度）</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.trem"></el-switch>
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
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>强制估算中国地震烈度（实验性）</span>
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em"></question-filled>
                                    </template>
                                    <p>本地烈度：日本地区优先使用气象厅提供的预想震度，否则估算中国地震烈度。</p>
                                    <p>区域烈度：计算中国地区各行政区的最大预估烈度。可能与数据源烈度不一致。</p>
                                    <p>行政区划分：台湾省为省级，直辖市、特别行政区为县级，其余为地级。</p>
                                    <strong>
                                        <p>该功能为实验性功能，精度较低。</p>
                                        <p>此功能会消耗较多计算机资源。</p>
                                        <p>部分功能需重新加载页面后生效。</p>
                                    </strong>
                                </el-popover>
                                <el-switch 
                                v-model="settingsStore.advancedSettings.forceCalcCsis"
                                @change="needReload = true"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>防闪烁模式</span>
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em"></question-filled>
                                    </template>
                                    <p><strong>如无异常，无需开启。</strong></p>
                                    <p>解决一部分因未知原因导致的频繁闪烁问题。</p>
                                    <p><strong>此功能需重新加载页面后生效。</strong></p>
                                </el-popover>
                                <el-switch 
                                v-model="settingsStore.advancedSettings.preventFlickerMode"
                                @change="needReload = true"></el-switch>
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
                <div class="subTitle" v-if="needReload">需要重载</div>
                <div class="group">
                    <el-button 
                    type="primary"
                    v-if="needReload"
                    @click="handleReload">重载以应用变更</el-button>
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
import Http from '@/classes/Http';
import { ref, reactive, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue';

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
    settingsStore.mainSettings.defaultZoom = Math.min(Math.max(val, 3), 12)
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
const setDelay = (val)=>{
    if(val < 0) val = 0
    settingsStore.mainSettings.displaySeisNet.delay = val
}
const needReload = ref(false)
const handleReload = () => {
    window.location.reload()
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
            settingsStore.mainSettings.source.iclEew = false
            ElMessage({
                message: '功能已关闭',
                type: 'success'
            })
            break
        }
        case 'enableTremFunctions': {
            verifyType = 'enableTremFunctions'
            verifyDialog.value = true
            break
        }
        case 'disableTremFunctions': {
            settingsStore.advancedSettings.enableTremFunctions = false
            settingsStore.mainSettings.source.cwaEqlist = false
            settingsStore.mainSettings.displaySeisNet.trem = false
            ElMessage({
                message: '功能已关闭',
                type: 'success'
            })
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
                    message: '认证成功',
                    type: 'success'
                })
            }
            else{
                ElMessage({
                    message: '认证失败',
                    type: 'error'
                })
            }
            break
        }
        case 'enableTremFunctions': {
            const res = await Http.post('http://124.70.142.213:8766/verify_admin', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.enableTremFunctions = true
                verifyDialog.value = false
                ElMessage({
                    message: '认证成功',
                    type: 'success'
                })
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
watch(()=>settingsStore.mainSettings.source, ()=>{
    needReload.value = true
}, { deep: true })
const handleAbout = ()=>{
    ElMessageBox.alert(
        `<div class="title">最近更新</div>
        <div class="about">
            <p>v2.0.0-rc.2 优化：震度检出算法；优化：测站回放时时间颜色变为黄色。</p>
            <p>v2.0.0-rc.1 新增：单独开关各数据源的功能；修复：部分情况下“隐藏无数据测站”无效的bug。</p>
            <p>v2.0.0-pre.24 新增：强制估算中国地震烈度功能；新增：防闪烁模式；优化：初始地图视野；优化：限制了地图缩放等级范围；修复：测站部分震度配色偏差问题；修复：适配紧急地震速报取消报。</p>
            <p>v2.0.0-pre.23 优化：重写震度检出算法，极大幅度降低了误检知的概率。</p>
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
        'wolfx-api-viewer v2.0.0-rc.2',
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
                display: flex;
                align-items: center;
            }
            .group{
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                row-gap: 5px;
                column-gap: 40px;
                margin-bottom: 5px;
            }
            .grid-group{
                display: grid;
                align-items: center;
                row-gap: 5px;
                margin-bottom: 5px;
            }
            .row{
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                column-gap: 10px;
            }
            .groupTitle{
                width: 100%;
                font-weight: 700;
            }
            .switchGroup{
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                column-gap: 15px;
            }
            .switch{
                display: flex;
                align-items: center;
                column-gap: 5px;
            }
            .el-switch{
                height: 24px;
            }
            .latLng{
                width: 70px;
            }
        }
    }
}
.force-wrap{
    flex-wrap: wrap;
    row-gap: 5px;
}
.full-width{
    width: 100%;
}
.el-button+.el-button{
    margin-left: 8px;
}
.el-checkbox{
    height: 24px;
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