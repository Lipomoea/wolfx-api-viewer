<template>
    <div class="outer">
        <div class="container">
            <div class="title">设置</div>
            <div class="settings">
                <div class="sub-title">
                    预警/信息数据源&nbsp;
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
                    <el-switch v-model="settingsStore.mainSettings.source.jmaEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width">中央氣象署地震速報</div>
                    <el-switch v-model="settingsStore.mainSettings.source.cwaEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width" v-if="settingsStore.advancedSettings.enableCeaEew">中国地震局地震预警</div>
                    <el-switch v-if="settingsStore.advancedSettings.enableCeaEew" v-model="settingsStore.mainSettings.source.ceaEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width" v-if="settingsStore.advancedSettings.enableIclEew">成都高新所地震预警</div>
                    <el-switch v-if="settingsStore.advancedSettings.enableIclEew" v-model="settingsStore.mainSettings.source.iclEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width">四川地震局地震预警</div>
                    <el-switch v-model="settingsStore.mainSettings.source.scEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width">福建地震局地震预警</div>
                    <el-switch v-model="settingsStore.mainSettings.source.fjEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width" v-if="settingsStore.advancedSettings.enableGqEew">GlobalQuake预警</div>
                    <el-switch v-if="settingsStore.advancedSettings.enableGqEew" v-model="settingsStore.mainSettings.source.gqEew" @change="handleNeedReload"></el-switch>
                    <div class="full-width">日本気象庁地震情報</div>
                    <el-switch v-model="settingsStore.mainSettings.source.jmaEqlist" @change="handleNeedReload"></el-switch>
                    <div class="full-width" v-if="settingsStore.advancedSettings.enableTremFunctions">中央氣象署地震報告</div>
                    <el-switch v-if="settingsStore.advancedSettings.enableTremFunctions" v-model="settingsStore.mainSettings.source.cwaEqlist" @change="handleNeedReload"></el-switch>
                    <div class="full-width">中国地震台网测定</div>
                    <el-switch v-model="settingsStore.mainSettings.source.cencEqlist" @change="handleNeedReload"></el-switch>
                    <div class="full-width">日本気象庁津波情報</div>
                    <el-switch v-model="settingsStore.mainSettings.source.jmaTsunami" @change="handleNeedReload"></el-switch>
                </div>
                <div class="sub-title">地震监测网</div>
                <div class="group">
                    <div class="row">
                        <span class="group-title">数据源</span>
                        <div class="switch-group full-width">
                            <div class="switch">
                                <span>強震モニタ</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.nied"></el-switch>
                            </div>
                            <div class="switch">
                                <span>检知灵敏度: </span>
                                <el-select 
                                v-model="settingsStore.mainSettings.displaySeisNet.niedSensitivity"
                                size="small"
                                :disabled="!settingsStore.mainSettings.displaySeisNet.nied"
                                style="width: 50px;">
                                    <el-option label="关" :value="0"></el-option>
                                    <el-option label="低" :value="1"></el-option>
                                    <el-option label="中" :value="2"></el-option>
                                    <el-option label="高" :value="3"></el-option>
                                </el-select>
                            </div>
                            <div class="switch" v-if="settingsStore.advancedSettings.displayNiedShindoSwitch">
                                <el-checkbox v-model="settingsStore.mainSettings.displaySeisNet.displayNiedShindo" :disabled="!settingsStore.mainSettings.displaySeisNet.nied">解析震度阶</el-checkbox>
                            </div>
                        </div>
                        <div class="switch-group full-width" v-if="settingsStore.advancedSettings.enableTremFunctions">
                            <div class="switch">
                                <span>TREM-Net&nbsp;</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.trem"></el-switch>
                            </div>
                            <div class="switch" style="width: 100px;">
                                <span>API: </span>
                                <el-select 
                                v-model="settingsStore.mainSettings.displaySeisNet.tremApi"
                                size="small"
                                :disabled="!settingsStore.mainSettings.displaySeisNet.trem">
                                    <el-option label="api-1" value="api-1"></el-option>
                                    <el-option label="api-2" value="api-2"></el-option>
                                    <el-option label="lb-1" value="lb-1"></el-option>
                                    <el-option label="lb-2" value="lb-2"></el-option>
                                    <el-option label="lb-3" value="lb-3"></el-option>
                                    <el-option label="lb-4" value="lb-4"></el-option>
                                </el-select>
                            </div>
                            <div class="switch">
                                <el-checkbox v-model="settingsStore.mainSettings.displaySeisNet.displayTremShindo" :disabled="!settingsStore.mainSettings.displaySeisNet.trem">解析震度阶</el-checkbox>
                            </div>
                        </div>
                        <div class="group-title">通用设置</div>
                        <div class="switch-group full-width">
                            <div class="switch full-width">
                                <span>测站回放(min)</span>
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
                            <div class="switch">
                                <span>测站风格</span>
                                <el-select
                                style="width: 70px;"
                                v-model="settingsStore.mainSettings.displaySeisNet.style"
                                size="small">
                                    <el-option label="NIED" value="nied"></el-option>
                                    <el-option label="SREV" value="srev"></el-option>
                                    <el-option label="混合" value="mix"></el-option>
                                </el-select>
                            </div>
                            <div class="switch" v-show="settingsStore.mainSettings.displaySeisNet.style == 'nied'">
                                <el-checkbox v-model="settingsStore.mainSettings.displaySeisNet.hideNoData">隐藏无数据测站</el-checkbox>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sub-title">行为</div>
                <div class="group">
                    <div class="row">
                        <span class="full-width group-title">预警设置</span>
                        <div class="switch-group">
                            <div class="switch">
                                <span>本地烈度阈值
                                    <el-popover
                                        placement="top"
                                        :width="310"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em"></question-filled>
                                        </template>
                                        <p><strong>需要启用“强制估算烈度/震度”。</strong></p>
                                        <p>仅在预估本地烈度达到阈值时执行下方行为。</p>
                                        <p>对任意位置（不仅限于中国）生效。</p>
                                        <p>设置为“0”表示接收全部预警。</p>
                                    </el-popover>
                                </span>
                                <el-slider
                                v-model="settingsStore.mainSettings.actionCsis"
                                :disabled="!settingsStore.advancedSettings.forceCalcInt"
                                :min="0" :max="12"
                                :step="1"
                                size="small"
                                show-stops
                                style="width: 200px; margin-left: 10px;"></el-slider>
                                <div class="csis" :class="setClassName(settingsStore.mainSettings.actionCsis, false)">{{ settingsStore.mainSettings.actionCsis }}</div>
                            </div>
                            <div class="switch" v-if="settingsStore.advancedSettings.enableGqEew">
                                <span>GQ预警震级阈值</span>
                                <el-slider
                                v-model="settingsStore.mainSettings.gqActionMag"
                                :min="0" :max="9"
                                :step="0.1"
                                size="small"
                                style="width: 200px; margin-left: 10px;"></el-slider>
                                <div class="mag" :class="setClassName(settingsStore.mainSettings.gqActionMag * 4/3, false)">{{ settingsStore.mainSettings.gqActionMag.toFixed(1) }}</div>
                            </div>
                            <div class="switch" v-if="settingsStore.advancedSettings.enableGqEew">
                                <span>GQ预警烈度阈值</span>
                                <el-slider
                                v-model="settingsStore.mainSettings.gqActionCsis"
                                :disabled="!settingsStore.advancedSettings.forceCalcInt"
                                :min="0" :max="12"
                                :step="1"
                                size="small"
                                show-stops
                                style="width: 200px; margin-left: 10px;"></el-slider>
                                <div class="csis" :class="setClassName(settingsStore.mainSettings.gqActionCsis, false)">{{ settingsStore.mainSettings.gqActionCsis }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="full-width group-title">收到地震预警（警报）时</span>
                        <div class="switch-group">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.notification" :disabled="settingsStore.mainSettings.onEew.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.sound" :disabled="settingsStore.mainSettings.onEew.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="isTauri">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onEewWarn.focus" :disabled="settingsStore.mainSettings.onEew.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="full-width group-title">收到地震预警（全部）时</span>
                        <div class="switch-group">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="isTauri">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onEew.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="full-width group-title">收到地震信息时</span>
                        <div class="switch-group">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="isTauri">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onReport.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="full-width group-title">地震监测网检测到摇晃时</span>
                        <div class="switch-group">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="isTauri">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onShake.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="full-width group-title">收到海啸信息时</span>
                        <div class="switch-group">
                            <div class="switch" v-if="showNotifButton">
                                <span>发送通知</span>
                                <el-switch v-model="settingsStore.mainSettings.onTsunami.notification"></el-switch>
                            </div>
                            <div class="switch">
                                <span>播放声音</span>
                                <el-switch v-model="settingsStore.mainSettings.onTsunami.sound"></el-switch>
                            </div>
                            <div class="switch" v-if="isTauri">
                                <span>弹出窗口</span>
                                <el-switch v-model="settingsStore.mainSettings.onTsunami.focus"></el-switch>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sub-title">音效</div>
                <div class="group">
                    <div class="row">
                        <div class="switch-group">
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
                <div class="sub-title">显示</div>
                <div class="group">
                    <div class="row">
                        <span class="group-title">本地预警设置</span>
                        <div class="switch-group">
                            <div class="switch force-wrap">
                                <span class="full-width">
                                    <span style="margin-right: 5px;">所在地位置</span>
                                    <el-popover
                                        placement="top"
                                        :width="300"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em"></question-filled>
                                        </template>
                                        <strong>
                                            <p>需要同时设置经纬度方可生效。</p>
                                            <p>地震预警事件中更新位置不会立即生效。</p>
                                        </strong>
                                    </el-popover>
                                </span>
                                <span>纬度</span>
                                <el-input
                                class="lat-lng"
                                v-model="settingsStore.mainSettings.userLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat('userLatLng')"></el-input>
                                <span style="margin-left: 8px;">经度</span>
                                <el-input
                                class="lat-lng"
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
                        </div>
                        <div class="switch-group">
                            <div class="switch">
                                <span>显示所在地</span>
                                <el-switch v-model="settingsStore.mainSettings.displayUser"></el-switch>
                            </div>
                            <div class="switch">
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
                        <div class="switch-group">
                            <div class="switch">
                                <span>显示地图烈度图例</span>
                                <el-switch v-model="settingsStore.mainSettings.displayLegend"></el-switch>
                            </div>
                            <div class="switch">
                                <span>显示区域烈度列表</span>
                                <el-switch v-model="settingsStore.mainSettings.displayAreaIntensities"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <span class="group-title">默认视野设置</span>
                        <div class="switch-group">
                            <div class="switch force-wrap">
                                <span class="full-width">
                                    <span style="margin-right: 5px;">自定义视野</span>
                                    <el-popover
                                        placement="top"
                                        :width="300"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em"></question-filled>
                                        </template>
                                        <strong>
                                            <p>需要同时设置经纬度方可生效。</p>
                                            <p>若不设置默认使用所在地经纬度。</p>
                                        </strong>
                                    </el-popover>
                                </span>
                                <span>纬度</span>
                                <el-input
                                class="lat-lng"
                                v-model="settingsStore.mainSettings.viewLatLng[0]"
                                size="small"
                                maxlength="10"
                                @change="setLat('viewLatLng')"></el-input>
                                <span style="margin-left: 8px;">经度</span>
                                <el-input
                                class="lat-lng"
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
                        <span class="group-title">其他</span>
                        <div class="switch-group full-width">
                            <div class="switch">
                                <span>显示中国断层</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCnFault"></el-switch>
                            </div>
                        </div>
                        <div class="switch-group full-width">
                            <div class="switch">
                                <span>预警/信息页不展开侧边栏</span>
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em"></question-filled>
                                    </template>
                                    <p>当前处于预警/信息页面且地图处于自动缩放状态时，可再次点击对应菜单快速切换状态。</p>
                                </el-popover>
                                <el-switch v-model="settingsStore.mainSettings.hideDrawer"></el-switch>
                            </div>
                        </div>
                        <div class="switch-group">
                            <div class="switch">
                                <span>放映模式</span>
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em"></question-filled>
                                    </template>
                                    <p>收到新的信息时自动切换到对应的菜单页面。适合在不频繁操作此应用时使用。</p>
                                    <p>推荐同步启用“预警/信息页不展开侧边栏”。</p>
                                    <strong>
                                        <p>此模式下，收信时您的操作可能被打断。</p>
                                        <p>需重新加载页面后生效。</p>
                                    </strong>
                                </el-popover>
                                <el-switch v-model="settingsStore.mainSettings.cinemaMode"
                                @change="handleNeedReload"></el-switch>
                            </div>
                            <div class="switch">
                                <el-checkbox v-model="settingsStore.mainSettings.eqlistsAsDefault"
                                :disabled="!settingsStore.mainSettings.cinemaMode"
                                @change="handleNeedReload">将地震/海啸信息页面设为默认</el-checkbox>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sub-title">高级</div>
                <div class="group">
                    <div class="row" v-if="settingsStore.advancedSettings.displayMultiApi">
                        <div class="switch-group">
                            <div class="switch">
                                <span>融合数据源（实验性）</span>
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em"></question-filled>
                                    </template>
                                    <p>使得部分数据源支持同时接入多个API。</p>
                                    <strong>
                                        <p>能够在部分情况下降低数据延迟，但部分信息可能缺失。</p>
                                        <p>会轻微增加流量消耗。</p>
                                        <p>当前为实验性功能，可能导致意外的bug。</p>
                                        <p>需重新加载页面后生效。</p>
                                    </strong>
                                </el-popover>
                                <el-switch 
                                v-model="settingsStore.advancedSettings.multiApi"
                                @change="handleNeedReload"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switch-group">
                            <div class="switch">
                                <span>强制估算烈度/震度（低精度）</span>
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em"></question-filled>
                                    </template>
                                    <p>强制估算以下数据：</p>
                                    <p>-本地烈度/震度</p>
                                    <p>-中国各区划预警和信息下最大烈度</p>
                                    <p>-日本各区划预警下最大震度（融合数据源）</p>
                                    <p>估算结果与数据源显示可能有差异。</p>
                                    <strong>
                                        <p>低精度（尤其是深源地震）。</p>
                                        <p>此功能会消耗较多计算机资源。</p>
                                        <p>部分功能需重新加载页面后生效。</p>
                                    </strong>
                                </el-popover>
                                <el-switch 
                                v-model="settingsStore.advancedSettings.forceCalcInt"
                                @change="handleNeedReload"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switch-group">
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
                                @change="handleNeedReload"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switch-group">
                            <div class="switch">
                                <el-button @click="customizeAudio = true">自定义音效</el-button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switch-group">
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
                <div class="sub-title">关于</div>
                <div class="group">
                    <div class="row full-width" v-if="isTauri">
                        <div class="switch-group">
                            <div class="switch">
                                <span>开机自启动</span>
                                <el-switch v-model="isAutoStart" @change="handleAutoStart"></el-switch>
                            </div>
                            <div class="switch">
                                <span>最小化启动</span>
                                <el-switch v-model="settingsStore.mainSettings.minimizeOnLaunch"></el-switch>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switch-group">
                            <div class="switch">
                                <el-checkbox v-model="settingsStore.mainSettings.autoCheckNewVersion" @change="handleAutoCheckVersion">自动检查更新</el-checkbox>
                            </div>
                            <div class="switch" v-if="isTauri">
                                <el-checkbox v-model="settingsStore.mainSettings.checkPrerelease">检查预发布版本</el-checkbox>
                            </div>
                            <div class="switch" v-if="!isTauri">
                                <el-checkbox v-model="settingsStore.mainSettings.autoRefresh">自动应用更新</el-checkbox>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="switch-group">
                            <div class="switch">
                                <el-button
                                style="margin-top: 5px;"
                                @click="showAbout = true">帮助&关于</el-button>
                            </div>
                            <div class="switch">
                                <el-button
                                type="primary"
                                style="margin-top: 5px;"
                                @click="checkNewVersion(false)">检查更新</el-button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sub-title" v-if="needReload">需要重载</div>
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
        <el-dialog class="customize-audio" v-model="customizeAudio" width="60vw" :show-close="false">
            <div class="explanation">
                <div class="text">
                    <p><strong>Windows桌面应用程序版本支持自定义音效，请参考下列步骤。</strong></p>
                    <p>1. 点击“打开数据文件夹”按钮，Windows资源管理器会打开该应用程序的数据文件夹。</p>
                    <p>2. 在该目录下创建一个“audio”文件夹。</p>
                    <p>3. 将你想替换的音频文件（需要为mp3格式）放入该文件夹并重命名为“xxx.mp3”，具体名称请参照下方按钮显示的名称。</p>
                    <p>4. 点击“重新加载音频”按钮，或按“F5”刷新页面即完成替换。</p>
                    <p>替换完成后可点击下方按钮进行音效测试。如需恢复默认，删除对应的mp3文件并重载音频即可。</p>
                    <p><strong>如因此功能产生任何侵权行为将由您自行承担，开发者不承担任何责任。</strong></p>
                </div>
                <div class="buttons">
                    <el-button @click="openDataFolder">打开数据文件夹</el-button>
                    <el-button @click="loadAudio">重新加载音频</el-button>
                </div>
            </div>
            <div class="test">
                <div class="text">
                    <strong>点击下方按钮进行音效试听</strong>
                </div>
                <div class="buttons">
                    <el-button v-for="(type, index) of audioTypes" :key="index" @click="playSound(type)">{{ type }}</el-button>
                </div>
            </div>
            <template #footer>
                <el-button type="default" @click="customizeAudio = false">关闭</el-button>
            </template>
        </el-dialog>
        <el-dialog class="about-box" v-model="showAbout" width="60vw" :show-close="false">
            <div class="header">要石 v2.1.0-pre.1</div>
            <div class="title">最近更新</div>
            <div class="about">
                <p>v2.1.0 新增：区域烈度列表显示功能。</p>
                <p>v2.0.0 变更：版本号变更为正式版；优化：新增“混合”测站风格。</p>
                <p>v2.0.0-rc.9.5 变更：调整部分图层渲染方式，实现地图循环显示，但中国、日本以外地区地图不再支持地名提示；优化：地图配色。</p>
                <p>v2.0.0-rc.9.4 优化：根据Wolfx Open API最新修改，现已回退对福建地震局地震预警的反篡改（实际并未篡改）并同步中国地震台网地震信息的最新接口。</p>
                <p>v2.0.0-rc.9.3 优化：对福建地震局地震预警地名应用反篡改；优化：过时数据的激活逻辑。</p>
                <p>v2.0.0-rc.9.2 优化：各菜单下地图元素显示逻辑；优化：规范了时间和震度显示格式；优化：強震モニタ测站的更新逻辑；优化：更新报的更新逻辑；修复：強震モニタ测站列表可能加载失败的bug。</p>
                <p>v2.0.0-rc.9.1 优化：将“CSIS”（中国地震烈度）修改为“烈度”以便于理解；修复：自动返回主菜单时地图显示范围可能出现异常的问题。</p>
                <p>v2.0.0-rc.9 新增：Windows桌面版应用支持设置开机自启动和最小化启动；优化：调整部分代码结构；修复：日本气象厅远地地震情报默认深度错误的问题。</p>
            </div>
            <div class="title">使用方法</div>
            <div class="about">
                <p>主要功能：接收日本气象厅、台湾省中央气象署、四川省地震局、福建省地震局地震预警信息，日本气象厅、中国地震台网地震信息，日本气象厅海啸信息，NIED強震モニタ测站数据。</p>
                <p>Windows Chrome/Edge推荐设置（以Chrome为例，Edge方法类似）：</p>
                <ul style="list-style-position: inside;">
                    <li>保持后台刷新：浏览器访问chrome://flags - Calculate window occlusion on Windows - Disabled - 右下角重新启动</li>
                    <li>去除网页“不安全”提示（同时解除网页权限设置限制，但浏览器启动时会收到横幅提示）：chrome://flags - Insecure origins treated as secure - 启用 - 输入本网页的链接 - 右下角重新启动</li>
                    <li>作为网页应用安装：Chrome打开此页面，右上角三点 - 保存并分享 - 将网页作为应用安装。安装一次后刷新页面即可加载最新版本网页，无需重新安装。</li>
                </ul>
                <p>通知推送：需授予通知权限。Chrome：点击网页链接左侧按钮-网站设置-通知-允许，刷新页面。</p>
                <p>播放声音：需开启声音权限。Chrome：点击网页链接左侧按钮-网站设置-声音-允许，刷新页面。</p>
            </div>
            <div class="title">注意事项</div>
            <div class="about">
                <p>关于烈度：日本气象厅紧急地震速报（震度，预估值），台湾中央气象署（震度，预估值），四川地震局（烈度，预估值），福建地震局（烈度，预估值），日本气象厅地震情报（震度，测定值），中国地震台网地震信息（烈度，预估值）。</p>
                <p>关于时间：显示为发报机构当地时间。</p>
                <p>关于延迟：受API限制，部分资料具有延迟是正常现象。</p>
                <p>关于走时：目前所有地震波位置均采用jma2001走时表计算，对日本以外地区可能有较大误差。未知震源深度视为10km。</p>
                <p>关于地图：由于服务器带宽限制，进入页面后需要一定时间加载地图。如长时间未加载地图，请刷新页面。</p>
            </div>
            <div class="title">关于</div>
            <div class="about">
                <p>Windows 10及以上用户推荐使用应用程序：<a href="https://github.com/Lipomoea/kanameishi/releases" target="_blank">Windows应用程序下载</a>&nbsp;<a href="https://gitee.com/lipomoea/kanameishi/releases" target="_blank">备用链接</a></p>
                <p>本页面未针对移动端进行适配，建议使用Windows应用程序或电脑浏览器访问本网页。</p>
                <p>联系我：<a href="https://space.bilibili.com/316757498" target="_blank">リッポミャ</a>（哔哩哔哩）</p>
                <p>Github: <a href="https://github.com/Lipomoea/kanameishi" target="_blank">https://github.com/Lipomoea/kanameishi</a></p>
                <p>特别鸣谢：</p>
                <p>Wolfx Open API、P2P地震情報：接口支持。</p>
                <p>kotoho7：SREV音效支持。音效遵循<a href="https://creativecommons.org/licenses/by-sa/2.0/deed.zh-hans" target="_blank">CC BY-SA 2.0 DEED</a>许可协议，未进行二次加工。</p>
            </div>
            <template #footer>
                <el-button type="default" @click="showAbout = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { useSettingsStore } from '@/stores/settings';
import { useStatusStore } from '@/stores/status';
import { chimeUrls, utilUrls } from '@/utils/Urls';
import Http from '@/classes/Http';
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue';
import { playSound, setClassName } from '@/utils/Utils';
import { join, appDataDir } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { exists } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-shell";
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

const showNotifButton = 'Notification' in window
const isTauri = !!window.__TAURI_INTERNALS__

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
            settingsStore.mainSettings.displaySeisNet.displayNiedShindo = false
            settingsStore.advancedSettings.displayNiedShindoSwitch = false
            break
        }
        case 'enableCeaEew': {
            verifyType = 'enableCeaEew'
            verifyDialog.value = true
            break
        }
        case 'disableCeaEew': {
            if(settingsStore.mainSettings.source.ceaEew) handleNeedReload()
            settingsStore.advancedSettings.enableCeaEew = false
            settingsStore.mainSettings.source.ceaEew = false
            ElMessage({
                message: '功能已关闭',
                type: 'success'
            })
            break
        }
        case 'enableIclEew': {
            verifyType = 'enableIclEew'
            verifyDialog.value = true
            break
        }
        case 'disableIclEew': {
            if(settingsStore.mainSettings.source.iclEew) handleNeedReload()
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
            if(settingsStore.mainSettings.source.cwaEqlist) handleNeedReload()
            settingsStore.advancedSettings.enableTremFunctions = false
            settingsStore.mainSettings.source.cwaEqlist = false
            settingsStore.mainSettings.displaySeisNet.trem = false
            ElMessage({
                message: '功能已关闭',
                type: 'success'
            })
            break
        }
        case 'enableGqEew': {
            verifyType = 'enableGqEew'
            verifyDialog.value = true
            break
        }
        case 'disableGqEew': {
            if(settingsStore.mainSettings.source.gqEew) handleNeedReload()
            settingsStore.advancedSettings.enableGqEew = false
            settingsStore.mainSettings.source.gqEew = false
            ElMessage({
                message: '功能已关闭',
                type: 'success'
            })
            break
        }
        case 'enableMultiApi': {
            verifyType = 'enableMultiApi'
            verifyDialog.value = true
            break
        }
        case 'disableMultiApi': {
            if(settingsStore.advancedSettings.multiApi) handleNeedReload()
            settingsStore.advancedSettings.displayMultiApi = false
            settingsStore.advancedSettings.multiApi = false
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
        case 'enableCeaEew': {
            const res = await Http.post('http://124.70.142.213:8766/cea_url', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.enableCeaEew = true
                localStorage.setItem('ceaUrl', JSON.stringify(res.data))
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
            const res = await Http.post('http://124.70.142.213:8766/trem_url', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.enableTremFunctions = true
                localStorage.setItem('tremUrl', JSON.stringify(res.data))
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
        case 'enableGqEew': {
            const res = await Http.post('http://124.70.142.213:8766/gq_url', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.enableGqEew = true
                localStorage.setItem('gqUrl', JSON.stringify(res.data))
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
        case 'enableMultiApi': {
            const res = await Http.post('http://124.70.142.213:8766/multi_api', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.displayMultiApi = true
                localStorage.setItem('multiApi', JSON.stringify(res.data))
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
const handleNeedReload = () => {
    needReload.value = true
    ElMessage({
        message: '需要重载页面后生效',
        type: 'warning'
    })
}
const showAbout = ref(false)
const checkNewVersion = async (silent = false) => {
    const currentVersion = document.title.split('v')[1]
    try {
        const versionInfo = await Http.get('https://api.github.com/repos/Lipomoea/kanameishi/releases')
        let checkedVersion, downloadUrl
        if(settingsStore.mainSettings.checkPrerelease || !isTauri) {
            checkedVersion = versionInfo[0].tag_name.slice(1)
            downloadUrl = versionInfo[0].assets[0].browser_download_url
        }
        else {
            let i = 0
            while(i < versionInfo.length) {
                if(!versionInfo[i].prerelease) break
                i++
            }
            if(i == versionInfo.length) {
                ElMessage({
                    message: '未检测到可用版本',
                    type: 'info'
                })
                return
            }
            else {
                checkedVersion = versionInfo[i].tag_name.slice(1)
                downloadUrl = versionInfo[i].assets[0].browser_download_url
            }
        }
        if(compareVersion(currentVersion, checkedVersion)) {
            ElMessageBox.close()
            if(isTauri) {
                ElMessageBox.confirm(
                    `检查到新版本v${checkedVersion}，是否下载？`,
                    '检查更新',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'info',
                        showClose: false,
                    }
                ).then(()=>{
                    window.open(downloadUrl, '_blank')
                })
            }
            else {
                if(settingsStore.mainSettings.autoRefresh) {
                    ElMessage({
                        message: '发现新版本，即将自动刷新',
                        type: 'success'
                    })
                    setTimeout(() => {
                        handleReload()
                    }, 5000);
                }
                else {
                    ElMessageBox.confirm(
                        `检查到新版本v${checkedVersion}，是否刷新页面？`,
                        '检查更新',
                        {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'info',
                            showClose: false,
                        }
                    ).then(()=>{
                        handleReload()
                    })
                }
            }
        }
        else if(!silent) {
            ElMessage({
                message: '当前已经是最新版本',
                type: 'success'
            })
        }
    } catch (_) {
        ElMessage({
            message: '检查更新失败，请稍后重试！',
            type: 'error'
        })
    }
}
const compareArray = (arr1, arr2) => {
    arr1 = arr1.map(i => Number(i))
    arr2 = arr2.map(i => Number(i))
    const len1 = arr1.length
    const len2 = arr2.length
    const lenDiff = len1 - len2
    if(lenDiff > 0) {
        arr2.push(...new Array(lenDiff).fill(0))
    }
    else if(lenDiff < 0) {
        arr1.push(...new Array(-lenDiff).fill(0))
    }
    const len = arr1.length
    for(let i = 0; i < len; i++) {
        if(arr1[i] > arr2[i]) return true
        else if(arr1[i] < arr2[i]) return false
    }
    return false
}
const compareVersion = (currentVersion, checkedVersion) => {
    const splitCurrent = currentVersion.split('-')
    const splitChecked = checkedVersion.split('-')
    if(compareArray(splitChecked[0].split('.'), splitCurrent[0].split('.'))) return true
    else if(splitChecked.length < splitCurrent.length) return true
    else if(splitChecked.length > splitCurrent.length) return false
    else if(splitChecked.length == 1) return false
    else {
        const typeArr = ['pre', 'rc']
        const currentSuffixArr = splitCurrent[1].split('.')
        const checkedSuffixArr = splitChecked[1].split('.')
        if(typeArr.indexOf(currentSuffixArr[0]) > typeArr.indexOf(checkedSuffixArr[0])) return false
        else if(typeArr.indexOf(currentSuffixArr[0]) < typeArr.indexOf(checkedSuffixArr[0])) return true
        else {
            currentSuffixArr.shift()
            checkedSuffixArr.shift()
            if(compareArray(checkedSuffixArr, currentSuffixArr)) return true
            else return false
        }
    }
}
let autoCheckInterval
const handleAutoCheckVersion = (val) => {
    clearInterval(autoCheckInterval)
    if(val) {
        checkNewVersion(true)
        autoCheckInterval = setInterval(() => {
            checkNewVersion(true)
        }, 6 * 3600 * 1000);
    }
}
const audioTypes = Object.keys(chimeUrls.general).concat(Object.keys(chimeUrls.srev))
const customizeAudio = ref(false)
const loadAudio = () => {
    if(isTauri) {
        chimeUrls.custom = {}
        audioTypes.forEach(async type => {
            try {
                const fileName = type + '.mp3'
                const appDataPath = await appDataDir()
                const filePath = await join(appDataPath, 'audio', fileName)
                const isExist = await exists(filePath)
                if(isExist) {
                    const url = convertFileSrc(filePath)
                    chimeUrls.custom[type] = url
                }
            } catch (err) {
                console.log(err);
            }
        })
    }
}
const openDataFolder = async () => {
    const appDataPath = await appDataDir()
    open(appDataPath)
}
const isAutoStart = ref(false)
const handleAutoStart = async (value) => {
    if(isTauri) {
        value ? await enable() : await disable()
        isAutoStart.value = await isEnabled()
    }
}
onMounted(async () => {
    handleAutoCheckVersion(settingsStore.mainSettings.autoCheckNewVersion)
    if(isTauri) {
        loadAudio()
        isAutoStart.value = await isEnabled()
    }
})
onBeforeUnmount(() => {
    clearInterval(autoCheckInterval)
})
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
            .sub-title{
                font-size: 18px;
                font-weight: 700;
                display: flex;
                align-items: center;
            }
            .group{
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                row-gap: 5px;
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
            .group-title{
                width: 100%;
                font-weight: 700;
            }
            .switch-group{
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
            .lat-lng{
                width: 70px;
            }
        }
    }
    .about-box{
        padding: 20px;
        .header {
            width: 100%;
            text-align: center;
            font-size: 24px;
            font-weight: 700;
        }
        .title{
            font-size: 20px;
            font-weight: 700;
        }
        .about {
            font-size: 16px;
        }
        .about+.about{
            margin-top: 10px;
        }
        a,a:visited{
            color: blue;
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
    margin: 0px;
}
.csis {
    width: 22px;
    height: 22px;
    margin-left: 6px;
    border: #cfcfcf 1px solid;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    user-select: none;
}
.mag {
    width: 28px;
    height: 22px;
    margin-left: 6px;
    border: #cfcfcf 1px solid;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    user-select: none;
}
.customize-audio {
    display: flex;
    flex-direction: column;
    align-items: center;
    .explanation,.test {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        .text {
            font-size: 16px;
        }
        .buttons {
            width: 100%;
            display: flex;
            column-gap: 20px;
            row-gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            .el-button {
                width: 150px;
                margin: 0;
            }
        }
    }
    .test {
        margin-top: 20px;
    }
}
</style>