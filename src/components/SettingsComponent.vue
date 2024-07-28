<template>
    <div class="outer">
        <div class="container">
            <div class="title">设置</div>
            <div class="settings">
                <div class="subTitle">行为</div>
                <div class="group">
                    <div class="row">
                        <span>收到地震预警（警报）时：</span>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.notification" :disabled="settingsStore.mainSettings.onEew.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.sound" :disabled="settingsStore.mainSettings.onEew.sound"></el-switch>
                            </div>
                            <div class="switch">
                                <span>切换菜单</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.switchMenu" :disabled="settingsStore.mainSettings.onEew.switchMenu"></el-switch>
                            </div>
                            <!-- <div class="switch">
                                <span>弹出界面</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.focus" :disabled="settingsStore.mainSettings.onEew.focus"></el-switch>
                            </div> -->
                        </div>
                    </div>
                    <div class="row">
                        <span>收到地震预警（全部）时：</span>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.sound"></el-switch>
                            </div>
                            <div class="switch">
                                <span>切换菜单</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.switchMenu"></el-switch>
                            </div>
                            <!-- <div class="switch">
                                <span>弹出界面</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.focus"></el-switch>
                            </div> -->
                        </div>
                    </div>
                    <div class="row">
                        <span>收到地震信息时：</span>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.sound"></el-switch>
                            </div>
                            <div class="switch">
                                <span>切换菜单</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.switchMenu"></el-switch>
                            </div>
                            <!-- <div class="switch">
                                <span>弹出界面</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.focus"></el-switch>
                            </div> -->
                        </div>
                    </div>
                    <div class="row">
                        <span>地震监测网检测到摇晃时：</span>
                        <div class="switchGroup">
                            <div class="switch">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.sound"></el-switch>
                            </div>
                            <!-- <div class="switch">
                                <span>弹出界面</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.focus"></el-switch>
                            </div> -->
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
                            </div>
                            <div class="switch">
                                <span>显示所在地</span>
                                <el-switch v-model="settingsStore.mainSettings.displayUser"></el-switch>
                            </div>
                            <!-- <div class="switch">
                                <span>显示地震波倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCountdown"></el-switch>
                            </div>
                            <div class="switch">
                                <span>地震波倒计时显示小数</span>
                                <el-switch v-model="settingsStore.mainSettings.decimalCountdown"></el-switch>
                            </div> -->
                        </div>
                    </div>
                    <div class="row">
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
                                <span style="margin-left: 10px;">默认缩放</span>
                                <el-input
                                v-model="settingsStore.mainSettings.defaultZoom"
                                type="number"
                                size="small"
                                maxlength="5"
                                style="width: 50px;"
                                @change="setDefaultZoom"></el-input>
                                <el-button
                                size="small"
                                @click="setCurrentViewAsDefault">设定当前视野</el-button>
                                <el-button
                                size="small"
                                @click="clearViewLatLng">清除经纬度</el-button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch force-wrap">
                                <span style="width: 100%;">显示地震监测网：</span>
                                <span>強震モニタ（即时震度）</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.nied"></el-switch>
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
                                v-model="advancedInput"
                                size="small"
                                style="width: 300px;"
                                @change="handleAdvance"></el-input>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- <div class="subTitle">关于</div>
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>显示关于页面</span>
                                <el-switch v-model="settingsStore.mainSettings.showAbout"></el-switch>
                            </div>
                        </div>
                    </div>
                </div> -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings';
import { useStatusStore } from '@/stores/status';
import { utilUrls } from '@/utils/Urls';
import Http from '@/utils/Http';
import { ref } from 'vue'

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
const advancedInput = ref('')
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
    }
    advancedInput.value = ''
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