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
                                <span>打开地图</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.showMap" :disabled="settingsStore.mainSettings.onEew.showMap"></el-switch>
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
                                <span>打开地图</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.showMap"></el-switch>
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
                                <span>打开地图</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.showMap"></el-switch>
                            </div>
                            <!-- <div class="switch">
                                <span>弹出界面</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.focus"></el-switch>
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
                            <div class="switch">
                                <span>所在地经纬度（均设置时才生效）：</span>
                                <span>纬度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.userLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat"></el-input>
                                <span style="margin-left: 10px;">经度</span>
                                <el-input
                                class="latLng"
                                v-model="settingsStore.mainSettings.userLatLng[1]"
                                size="small"
                                maxlength="10"
                                @change="setLng"></el-input>
                                <el-button
                                style="margin-left: 10px;"
                                size="small"
                                @click="autoLocate">自动定位</el-button>
                            </div>
                            <div class="switch">
                                <span>显示所在地</span>
                                <el-switch v-model="settingsStore.mainSettings.displayUser"></el-switch>
                            </div>
                            <div class="switch">
                                <span>显示地震波倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCountdown"></el-switch>
                            </div>
                            <div class="switch">
                                <span>地震波倒计时显示小数</span>
                                <el-switch v-model="settingsStore.mainSettings.decimalCountdown"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="subTitle">关于</div>
                <div class="group">
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>显示关于页面</span>
                                <el-switch v-model="settingsStore.mainSettings.showAbout"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings';
import { utilUrls } from '@/utils/Urls';
import Http from '@/utils/Http';

const settingsStore = useSettingsStore()
const setLat = (val)=>{
    if(val === '') return
    let number = Number(val)
    if(isNaN(number)){
        settingsStore.mainSettings.userLatLng[0] = ''
    }
    else{
        if(number > 90) number = 90
        if(number < -90) number = -90
        settingsStore.mainSettings.userLatLng[0] = number.toString()
    }
}
const setLng = (val)=>{
    if(val === '') return
    let number = Number(val)
    if(isNaN(number)){
        settingsStore.mainSettings.userLatLng[1] = ''
    }
    else{
        if(number > 180) number = 180
        if(number < -180) number = -180
        settingsStore.mainSettings.userLatLng[1] = number.toString()
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
            setLat(res.latitude)
            setLng(res.longitude)
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
</script>

<style lang="scss" scoped>
.outer{
    width: 100%;
    .container{
        border: black 1px solid;
        border-radius: 10px;
        padding: 15px;
        margin: 0px 20px 20px;
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
                row-gap: 2px;
                column-gap: 40px;
                margin-bottom: 5px;
                .row{
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    .switchGroup{
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        .switch{
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            .latLng{
                                width: 60px;
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
</style>