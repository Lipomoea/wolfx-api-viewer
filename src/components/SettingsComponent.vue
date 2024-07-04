<template>
    <div class="outer">
        <div class="container">
            <div class="title">设置</div>
            <div class="settings">
                <div class="subTitle">通知与声音</div>
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
                            <!-- <div class="switch">
                                <span>弹出界面</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.focus"></el-switch>
                            </div> -->
                        </div>
                    </div>
                    <div class="row">
                        <div class="switchGroup">
                            <div class="switch">
                                <span>关闭默认通知音</span>
                                <el-switch v-model="settingsStore.mainSettings.muteNotification"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switchGroup">
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
                                <span>自动打开地图</span>
                                <el-switch v-model="settingsStore.mainSettings.autoShowMap"></el-switch>
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

const settingsStore = useSettingsStore()
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