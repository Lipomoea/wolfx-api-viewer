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
                        <span style="width: 100%;">显示地震监测网：</span>
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
const setNiedDelay = (val)=>{
    if(val > 10080) val = 10080
    if(val < 0) val = 0
    settingsStore.mainSettings.displaySeisNet.niedDelay = val
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
const handleAbout = ()=>{
    ElMessageBox.alert(
        `<div class="title">最近更新</div>
        <div class="about">
            <p>v2.0.0 pre9 修复：震度检出算法与预期不符的问题；修复（待验证）：测站回放异常触发震度检出的问题，网页置于后台时异常触发震度检出的问题。</p>
            <p>v2.0.0 pre1-pre8 变更：UI重排，使用新的中国和日本地图，暂时移除地震波倒计时功能；新增：NIED強震モニタ测站显示、震度检出功能，设置默认视野功能，鼠标悬浮提示区域名称，NIED测站回放功能。</p>
            <p>v1.0.0-1.1.2 新增：地图功能、自动打开地图功能、JMA地震情报列表查看详细、设置用户所在地、IP定位、地震波抵达倒计时等功能；优化：增加自动对时。</p>
        </div>
        <div class="title">已知问题</div>
        <div class="about">
            <p>置于后台后一段时间切回可能白屏。</p>
            <p>置于后台时部分连接可能中断。</p>
            <p>置于后台时震度检出可能出现异常。</p>
        </div>
        <div class="title">使用方法</div>
        <div class="about">
            <p>主要功能：接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息，日本气象厅、中国地震台网地震信息，NIED強震モニタ测站数据。</p>
            <p>通知推送：需授予通知权限。Chrome浏览器参考：<a href="https://tieba.baidu.com/p/7526026826" target="_blank">https://tieba.baidu.com/p/7526026826</a></p>
            <p>播放声音：需开启声音权限。Chrome：点击网页链接左侧按钮-网站设置-声音-允许，重新加载页面。若无法授予权限参照上一条。</p>
            <p>作为Chrome应用安装：Chrome打开此页面，右上角三点-保存并分享-将网页作为应用安装。安装一次后刷新页面即可加载最新版本网页，无需重新安装。</p>
        </div>
        <div class="title">注意事项</div>
        <div class="about">
            <p>关于烈度：日本气象厅紧急地震速报（气象厅震度，预估值），台湾中央气象署（CWA震度，预估值），四川地震局（CSIS，预估值），福建地震局（CSIS，预估值），日本气象厅地震情报（气象厅震度，测定值），中国地震台网地震信息（CSIS，预估值）。</p>
            <p>关于时间：显示为发报机构当地时间。</p>
            <p>关于延迟：受API限制，部分资料具有延迟是正常现象。</p>
            <p>关于走时：目前所有地震波位置均采用jma2001走时表计算，对日本以外地区可能有较大误差。未知震源深度视为0km。</p>
            <p>关于地图：由于服务器带宽限制，进入页面后需要一定时间加载地图。如长时间未加载地图，请刷新页面。</p>
        </div>
        <div class="title">关于</div>
        <div class="about">
            <p><a href="http://124.70.142.213:8080/">稳定版</a> <a href="http://124.70.142.213:8081/">尝鲜版</a></p>
            <p>本页面基于Wolfx Open API (<a href="https://api.wolfx.jp" target="_blank">api.wolfx.jp</a>) 开发，不属于Wolfx官方。</p>
            <p>本页面未针对移动端进行适配，建议使用电脑端浏览器访问本网页。</p>
            <p>联系我：<a href="https://space.bilibili.com/316757498" target="_blank">リッポミャ</a>（哔哩哔哩）</p>
            <p>Github: <a href="https://github.com/Lipomoea/wolfx-api-viewer" target="_blank">https://github.com/Lipomoea/wolfx-api-viewer</a></p>
            <p>特别鸣谢：
                <p>Wolfx Project：接口支持。</p>
                <p>kotoho7：SREV音效支持。音效遵循<a href="https://creativecommons.org/licenses/by-sa/2.0/deed.zh-hans" target="_blank">CC BY-SA 2.0 DEED</a>许可协议，未进行二次加工。</p>
            </p>
        </div>`,
        'wolfx-api-viewer v2.0.0 pre-9',
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