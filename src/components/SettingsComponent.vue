<template>
    <div class="outer">
        <div class="container">
            <div class="title">设置</div>
            <div class="settings">
                <span class="sub-title">
                    预警/信息数据源
                    <el-popover
                        placement="top"
                        :width="300"
                        trigger="hover"
                    >
                        <template #reference>
                            <question-filled width="1em" height="1em" />
                        </template>
                        <strong>
                            <p>需重新加载页面后生效。</p>
                        </strong>
                    </el-popover>
                </span>
                <div class="group">
                    <div class="switch-group">
                        <span class="font-bold w-full">地震预警</span>
                        <div class="switch-full">
                            <div>中国地震局：地震预警</div>
                            <el-switch v-model="settingsStore.mainSettings.source.ceaEew" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableIclEew">
                            <div>成都高新减灾研究所：地震预警</div>
                            <el-switch v-model="settingsStore.mainSettings.source.iclEew" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <div>四川地震局：地震预警</div>
                            <el-switch v-model="settingsStore.mainSettings.source.scEew" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <div>福建地震局：地震预警</div>
                            <el-switch v-model="settingsStore.mainSettings.source.fjEew" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <div>臺灣中央氣象署：強震即時警報</div>
                            <el-switch v-model="settingsStore.mainSettings.source.cwaEew" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <div>日本気象庁：緊急地震速報</div>
                            <el-switch v-model="settingsStore.mainSettings.source.jmaEew" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableGqEew">
                            <div>GlobalQuake：地震预警</div>
                            <el-switch v-model="settingsStore.mainSettings.source.gqEew" @change="handleNeedReload" />
                        </div>
                    </div>
                    <div class="switch-group">
                        <span class="font-bold w-full">地震信息</span>
                        <div class="switch-full">
                            <div>中国地震台网：地震测定</div>
                            <el-switch v-model="settingsStore.mainSettings.source.cencEqlist" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableTremFunctions">
                            <div>臺灣中央氣象署：地震報告</div>
                            <el-switch v-model="settingsStore.mainSettings.source.cwaEqlist" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <div>日本気象庁：地震情報</div>
                            <el-switch v-model="settingsStore.mainSettings.source.jmaEqlist" @change="handleNeedReload" />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableFssnEqlist">
                            <div>FSSN：地震测定</div>
                            <el-switch v-model="settingsStore.mainSettings.source.fssnEqlist" @change="handleNeedReload" />
                        </div>
                    </div>
                    <div class="switch-group">
                        <span class="font-bold w-full">海啸信息</span>
                        <div class="switch-full">
                            <div>日本気象庁：津波情報</div>
                            <el-switch v-model="settingsStore.mainSettings.source.jmaTsunami" @change="handleNeedReload" />
                        </div>
                    </div>
                </div>
                <span class="sub-title">地震监测网</span>
                <div class="group">
                    <span class="font-bold w-full">数据源</span>
                    <div class="switch-group">
                        <div class="w-full">
                            <div class="switch-full">
                                <span>強震モニタ</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.nied" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>检知灵敏度</span>
                                <el-select 
                                v-model="settingsStore.mainSettings.displaySeisNet.niedSensitivity"
                                size="small"
                                :disabled="!settingsStore.mainSettings.displaySeisNet.nied"
                                style="width: 48px;"
                                >
                                    <el-option label="关" :value=0 />
                                    <el-option label="低" :value=1 />
                                    <el-option label="中" :value=2 />
                                    <el-option label="高" :value=3 />
                                </el-select>
                            </div>
                            <div class="switch-full pl-4">
                                <span>解析震度阶</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.displayNiedShindo" :disabled="!settingsStore.mainSettings.displaySeisNet.nied" />
                            </div>
                        </div>
                        <div class="w-full" v-if="settingsStore.advancedSettings.enableTremFunctions">
                            <div class="switch-full">
                                <span>TREM-Net</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.trem" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>API</span>
                                <el-select 
                                v-model="settingsStore.mainSettings.displaySeisNet.tremApi"
                                size="small"
                                :disabled="!settingsStore.mainSettings.displaySeisNet.trem"
                                style="width: 72px;"
                                >
                                    <el-option label="api-1" value="api-1" />
                                    <el-option label="api-2" value="api-2" />
                                    <el-option label="lb-1" value="lb-1" />
                                    <el-option label="lb-2" value="lb-2" />
                                    <el-option label="lb-3" value="lb-3" />
                                    <el-option label="lb-4" value="lb-4" />
                                </el-select>
                            </div>
                            <div class="switch-full pl-4">
                                <span>解析震度阶</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.displayTremShindo" :disabled="!settingsStore.mainSettings.displaySeisNet.trem" />
                            </div>
                        </div>
                    </div>
                    <div class="font-bold w-full">通用设置</div>
                    <div class="switch-group">
                        <div class="w-full">
                            <div class="switch-full">
                                <span>测站回放(min)</span>
                                <div class="flex gap-2">
                                    <el-input-number
                                    v-model="settingsStore.mainSettings.displaySeisNet.delay"
                                    size="small"
                                    :min="0"
                                    style="width: 108px;"
                                    />
                                    <el-button
                                    size="small"
                                    @click="settingsStore.mainSettings.displaySeisNet.delay = 0"
                                    :disabled="settingsStore.mainSettings.displaySeisNet.delay == 0"
                                    >还原</el-button>
                                </div>
                            </div>
                            <div class="switch-full pl-4">
                                <span>选择时间回放</span>
                                <div class="flex gap-2">
                                    <el-date-picker
                                    v-model="replayDateTime"
                                    type="datetime"
                                    size="small"
                                    style="width: 156px;"
                                    placeholder="选择日期时间(CST)"
                                    format="YYYY-MM-DD HH:mm:ss"
                                    value-format="YYYY-MM-DD HH:mm:ss"
                                    />
                                    <el-button
                                    size="small"
                                    @click="setReplayDateTime"
                                    :disabled="!replayDateTime"
                                    >回放</el-button>
                                </div>
                            </div>
                        </div>
                        <div class="w-full">
                            <div class="switch-full">
                                <span>测站风格</span>
                                <el-select
                                style="width: 72px;"
                                v-model="settingsStore.mainSettings.displaySeisNet.style"
                                size="small">
                                    <el-option label="NIED" value="nied" />
                                    <el-option label="SREV" value="srev" />
                                    <el-option label="混合" value="mix" />
                                </el-select>
                            </div>
                            <div class="switch-full pl-4" v-show="settingsStore.mainSettings.displaySeisNet.style == 'nied'">
                                <span>隐藏无数据测站</span>
                                <el-switch v-model="settingsStore.mainSettings.displaySeisNet.hideNoData" />
                            </div>
                        </div>
                    </div>
                </div>
                <span class="sub-title">行为</span>
                <div class="group">
                    <span class="font-bold w-full">
                        预警设置
                        <el-popover
                            placement="top"
                            :width="200"
                            trigger="hover"
                        >
                            <template #reference>
                                <question-filled width="1em" height="1em" />
                            </template>
                            <p><strong>以下所有条件关系为“与”。</strong></p>
                        </el-popover>
                    </span>
                    <div class="switch-group">
                        <div class="switch-full">
                            <div class="justify-between" style="width: 10rem;">
                                <span>
                                    震级阈值
                                    <el-popover
                                        placement="top"
                                        :width="310"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em" />
                                        </template>
                                        <p>仅在预估震级达到阈值时执行下方行为。</p>
                                        <p>设置为“0”表示不作筛选。</p>
                                    </el-popover>
                                </span>
                                <div class="mag" :class="setClassName(calcCsisLevel(settingsStore.mainSettings.actionMag, 10, 0), false)">
                                    {{ settingsStore.mainSettings.actionMag.toFixed(1) }}
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.actionMag"
                            :min="0" :max="9"
                            :step="0.1"
                            size="small"
                            />
                        </div>
                        <div class="switch-full" v-if="!settingsStore.nearestJmaLoc">
                            <div class="justify-between" style="width: 10rem;">
                                <span>
                                    本地烈度阈值
                                    <el-popover
                                        placement="top"
                                        :width="310"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em" />
                                        </template>
                                        <p><strong>需要启用“强制估算烈度/震度”。</strong></p>
                                        <p>仅在预估本地烈度达到阈值时执行下方行为。</p>
                                        <p>对日本以外地区生效。</p>
                                        <p>设置为“0”表示不作筛选。</p>
                                        <p>参考：</p>
                                        <p> - 1度及以下：基本无感</p>
                                        <p> - 2~3度：敏感或位于高层的人群静止下有感；悬挂物轻微晃动</p>
                                        <p> - 4~5度：绝大部分人群静止时有感，少部分人从睡梦中被唤醒；悬挂物显著晃动</p>
                                        <p> - 6~7度：所有人有感，大部分人从睡梦中被唤醒；稳定性差的摆件倾倒；抗震性差的房屋可能出现破坏</p>
                                        <p> - 8~9度：行走困难；家具倾倒；抗震性差的房屋可能倒塌，抗震性好的房屋可能损坏</p>
                                        <p> - 10度及以上：无法行走，有抛起感；房屋大规模倒塌；山崩地裂</p>
                                    </el-popover>
                                </span>
                                <div class="int" :class="setClassName(settingsStore.mainSettings.actionLocalCsis, false)">
                                    <div class="csis" :class="{
                                        'roman': settingsStore.mainSettings.useRomanCsis,
                                        'scale-9': settingsStore.mainSettings.actionLocalCsis == 8
                                    }">{{ formatCsis(settingsStore.mainSettings.actionLocalCsis.toString(), settingsStore.mainSettings.useRomanCsis) }}</div>
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.actionLocalCsis"
                            :disabled="!settingsStore.advancedSettings.forceCalcInt"
                            :min="0" :max="12"
                            :step="1"
                            size="small"
                            show-stops
                            />
                        </div>
                        <div class="switch-full" v-else>
                            <div class="justify-between" style="width: 10rem;">
                                <span>
                                    本地震度阈值
                                    <el-popover
                                        placement="top"
                                        :width="310"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em" />
                                        </template>
                                        <p><strong>需要启用“强制估算烈度/震度”。</strong></p>
                                        <p>仅在预估本地震度达到阈值时执行下方行为。</p>
                                        <p>对附近包含震度观测点的日本地区生效。</p>
                                        <p>设置为“0”表示不作筛选。</p>
                                        <p>参考：</p>
                                        <p> - 震度0：基本无感</p>
                                        <p> - 震度1：敏感人群静止时有感</p>
                                        <p> - 震度2：大部分人群静止时有感；悬挂物轻微晃动</p>
                                        <p> - 震度3：绝大部分人群静止时有感；一部分人从睡梦中被唤醒；悬挂物显著晃动</p>
                                        <p> - 震度4：所有人有感，大部分人从睡梦中被唤醒；稳定性差的摆件倾倒</p>
                                        <p> - 震度5弱~5强：大多数人有恐惧感；部分家具倾倒</p>
                                        <p> - 震度6弱~6强：行走困难；家具大规模倾倒；抗震性差的房屋出现损坏甚至倒塌</p>
                                        <p> - 震度7：无法行走，有抛起感；房屋大规模倒塌；山崩地裂</p>
                                    </el-popover>
                                </span>
                                <div class="int" :class="setClassName(shindoScale[settingsStore.mainSettings.actionLocalShindo], true)">
                                    <div class="shindo">{{ shindoScale[settingsStore.mainSettings.actionLocalShindo] }}</div>
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.actionLocalShindo"
                            :disabled="!settingsStore.advancedSettings.forceCalcInt"
                            :min="0" :max="9"
                            :step="1"
                            size="small"
                            show-stops
                            :format-tooltip="(value) => shindoScale[value]"
                            />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableGqEew">
                            <div class="justify-between" style="width: 10rem;">
                                <span>GQ预警震级阈值</span>
                                <div class="mag" :class="setClassName(calcCsisLevel(settingsStore.mainSettings.gqActionMag, 10, 0), false)">
                                    {{ settingsStore.mainSettings.gqActionMag.toFixed(1) }}
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.gqActionMag"
                            :min="0" :max="9"
                            :step="0.1"
                            size="small"
                            />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableGqEew">
                            <div class="justify-between" style="width: 10rem;">
                                <span>GQ预警烈度阈值</span>
                                <div class="int" :class="setClassName(settingsStore.mainSettings.gqActionCsis, false)">
                                    <div class="csis" :class="{
                                        'roman': settingsStore.mainSettings.useRomanCsis,
                                        'scale-9': settingsStore.mainSettings.gqActionCsis == 8
                                    }">{{ formatCsis(settingsStore.mainSettings.gqActionCsis.toString(), settingsStore.mainSettings.useRomanCsis) }}</div>
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.gqActionCsis"
                            :disabled="!settingsStore.advancedSettings.forceCalcInt"
                            :min="0" :max="12"
                            :step="1"
                            size="small"
                            show-stops
                            />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableFssnEqlist">
                            <span>FSSN事件接收类型</span>
                            <el-select
                                style="width: 120px;"
                                v-model="settingsStore.mainSettings.fssnActionType"
                                size="small">
                                    <el-option label="全部接收" :value=0 />
                                    <el-option label="仅确认和正式报" :value=1 />
                                    <el-option label="仅正式报" :value=2 />
                            </el-select>
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableFssnEqlist">
                            <div class="justify-between" style="width: 10rem;">
                                <span>FSSN震级阈值</span>
                                <div class="mag" :class="setClassName(calcCsisLevel(settingsStore.mainSettings.fssnActionMag, 10, 0), false)">
                                    {{ settingsStore.mainSettings.fssnActionMag.toFixed(1) }}
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.fssnActionMag"
                            :min="0" :max="9"
                            :step="0.1"
                            size="small"
                            />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableFssnEqlist">
                            <div class="justify-between" style="width: 10rem;">
                                <span>FSSN烈度阈值</span>
                                <div class="int" :class="setClassName(settingsStore.mainSettings.fssnActionCsis, false)">
                                    <div class="csis" :class="{
                                        'roman': settingsStore.mainSettings.useRomanCsis,
                                        'scale-9': settingsStore.mainSettings.fssnActionCsis == 8
                                    }">{{ formatCsis(settingsStore.mainSettings.fssnActionCsis.toString(), settingsStore.mainSettings.useRomanCsis) }}</div>
                                </div>
                            </div>
                            <el-slider
                            v-model="settingsStore.mainSettings.fssnActionCsis"
                            :disabled="!settingsStore.advancedSettings.forceCalcInt"
                            :min="0" :max="12"
                            :step="1"
                            size="small"
                            show-stops
                            />
                        </div>
                    </div>
                    <span class="font-bold w-full">收到地震预警（警报）时</span>
                    <div class="switch-group justify-between">
                        <div class="switch" v-if="showNotifButton">
                            <span>发送通知</span>
                            <el-switch v-model="settingsStore.mainSettings.onEewWarn.notification" :disabled="settingsStore.mainSettings.onEew.notification" />
                        </div>
                        <div class="switch">
                            <span>播放声音</span>
                            <el-switch v-model="settingsStore.mainSettings.onEewWarn.sound" :disabled="settingsStore.mainSettings.onEew.sound" />
                        </div>
                        <div class="switch" v-if="isTauri">
                            <span>弹出窗口</span>
                            <el-switch v-model="settingsStore.mainSettings.onEewWarn.focus" :disabled="settingsStore.mainSettings.onEew.focus" />
                        </div>
                    </div>
                    <span class="font-bold w-full">收到地震预警（全部）时</span>
                    <div class="switch-group justify-between">
                        <div class="switch" v-if="showNotifButton">
                            <span>发送通知</span>
                            <el-switch v-model="settingsStore.mainSettings.onEew.notification" />
                        </div>
                        <div class="switch">
                            <span>播放声音</span>
                            <el-switch v-model="settingsStore.mainSettings.onEew.sound" />
                        </div>
                        <div class="switch" v-if="isTauri">
                            <span>弹出窗口</span>
                            <el-switch v-model="settingsStore.mainSettings.onEew.focus" />
                        </div>
                    </div>
                    <span class="font-bold w-full">收到地震信息时</span>
                    <div class="switch-group justify-between">
                        <div class="switch" v-if="showNotifButton">
                            <span>发送通知</span>
                            <el-switch v-model="settingsStore.mainSettings.onReport.notification" />
                        </div>
                        <div class="switch">
                            <span>播放声音</span>
                            <el-switch v-model="settingsStore.mainSettings.onReport.sound" />
                        </div>
                        <div class="switch" v-if="isTauri">
                            <span>弹出窗口</span>
                            <el-switch v-model="settingsStore.mainSettings.onReport.focus" />
                        </div>
                    </div>
                    <span class="font-bold w-full">地震监测网检测到摇晃时</span>
                    <div class="switch-group justify-between">
                        <div class="switch" v-if="showNotifButton">
                            <span>发送通知</span>
                            <el-switch v-model="settingsStore.mainSettings.onShake.notification" />
                        </div>
                        <div class="switch">
                            <span>播放声音</span>
                            <el-switch v-model="settingsStore.mainSettings.onShake.sound" />
                        </div>
                        <div class="switch" v-if="isTauri">
                            <span>弹出窗口</span>
                            <el-switch v-model="settingsStore.mainSettings.onShake.focus" />
                        </div>
                    </div>
                    <span class="font-bold w-full">收到海啸信息时</span>
                    <div class="switch-group justify-between">
                        <div class="switch" v-if="showNotifButton">
                            <span>发送通知</span>
                            <el-switch v-model="settingsStore.mainSettings.onTsunami.notification" />
                        </div>
                        <div class="switch">
                            <span>播放声音</span>
                            <el-switch v-model="settingsStore.mainSettings.onTsunami.sound" />
                        </div>
                        <div class="switch" v-if="isTauri">
                            <span>弹出窗口</span>
                            <el-switch v-model="settingsStore.mainSettings.onTsunami.focus" />
                        </div>
                    </div>
                </div>
                <span class="sub-title">音效</span>
                <div class="group">
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>关闭默认通知音</span>
                            <el-switch v-model="settingsStore.mainSettings.muteNotification" />
                        </div>
                        <div class="switch-full">
                            <span>选择音效</span>
                            <el-select 
                            v-model="settingsStore.mainSettings.soundEffect"
                            size="small"
                            style="width: 72px;"
                            >
                                <el-option label="SREV" value="srev" />
                            </el-select>
                        </div>
                        <div class="switch-full">
                            <span>{{ isTauri ? '自定义音效' : '试听音效' }}</span>
                            <el-button size="small" @click="customizeAudio = true">{{ isTauri ? '自定义' : '试听' }}</el-button>
                        </div>
                    </div>
                </div>
                <span class="sub-title">显示</span>
                <div class="group">
                    <span class="font-bold w-full">
                        所在地设置
                        <el-popover
                            placement="top"
                            :width="300"
                            trigger="hover"
                        >
                            <template #reference>
                                <question-filled width="1em" height="1em" />
                            </template>
                            <strong>
                                <p>设置为(0,0)表示不生效。</p>
                                <p>地震预警事件中更新位置不会立即生效。</p>
                            </strong>
                        </el-popover>
                    </span>
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>纬度</span>
                            <el-input-number
                            class="lat-lng"
                            v-model="settingsStore.mainSettings.userLatLng[0]"
                            size="small"
                            :step="0.1"
                            :min="-90"
                            :max="90"
                            />
                        </div>
                        <div class="switch-full">
                            <span>经度</span>
                            <el-input-number
                            class="lat-lng"
                            v-model="settingsStore.mainSettings.userLatLng[1]"
                            size="small"
                            :step="0.1"
                            :min="-180"
                            :max="180"
                            />
                        </div>
                        <div class="switch-full">
                            <span>使用IP地址定位</span>
                            <el-button
                            size="small"
                            @click="autoLocate"
                            >自动定位</el-button>
                        </div>
                        <div class="switch-full">
                            <span>清除经纬度</span>
                            <el-button
                            size="small"
                            @click="clearUserLatLng">清除</el-button>
                        </div>
                        <div class="switch-full">
                            <span>显示所在地</span>
                            <el-switch v-model="settingsStore.mainSettings.displayUser" />
                        </div>
                    </div>
                    <span class="font-bold w-full">主震动倒计时</span>
                    <div class="switch-group">
                        <div class="w-full">
                            <div class="switch-full">
                                <span>显示本地预估烈度和横波抵达倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.displayCountdown" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>强制计算倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.forceDisplayCountdown" :disabled="!settingsStore.mainSettings.displayCountdown" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>播放倒计时音效</span>
                                <el-switch v-model="settingsStore.mainSettings.playCountdownSound" :disabled="!settingsStore.mainSettings.displayCountdown" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>语音播报倒计时</span>
                                <el-switch v-model="settingsStore.mainSettings.countdownSpeech" :disabled="!(settingsStore.mainSettings.displayCountdown && settingsStore.mainSettings.playCountdownSound)" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>剩余{{ settingsStore.mainSettings.countdownStart }}秒开始倒数</span>
                                <el-slider
                                v-model="settingsStore.mainSettings.countdownStart"
                                :disabled="!(settingsStore.mainSettings.displayCountdown && settingsStore.mainSettings.playCountdownSound)"
                                :min="5" :max="60"
                                :step="5"
                                size="small"
                                show-stops
                                />
                            </div>
                        </div>
                    </div>
                    <span class="font-bold w-full">地图烈度</span>
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>显示地图烈度图例</span>
                            <el-switch v-model="settingsStore.mainSettings.displayLegend" :disabled="settingsStore.mainSettings.disableEewBaseMap" />
                        </div>
                        <div class="switch-full">
                            <span>显示区域烈度列表</span>
                            <el-switch v-model="settingsStore.mainSettings.displayAreaIntensities" />
                        </div>
                    </div>
                    <span class="font-bold w-full">
                        默认视野设置
                        <el-popover
                            placement="top"
                            :width="300"
                            trigger="hover"
                        >
                            <template #reference>
                                <question-filled width="1em" height="1em" />
                            </template>
                            <strong>
                                <p>设置无可聚焦事件时地图的视野范围。</p>
                                <p>设置为(0,0)表示不生效。</p>
                                <p>若不设置默认使用所在地经纬度。</p>
                            </strong>
                        </el-popover>
                    </span>
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>纬度</span>
                            <el-input-number
                            class="lat-lng"
                            v-model="settingsStore.mainSettings.viewLatLng[0]"
                            size="small"
                            :step="0.1"
                            :min="-90"
                            :max="90"
                            />
                        </div>
                        <div class="switch-full">
                            <span>经度</span>
                            <el-input-number
                            class="lat-lng"
                            v-model="settingsStore.mainSettings.viewLatLng[1]"
                            size="small"
                            :step="0.1"
                            :min="-180"
                            :max="180"
                            />
                        </div>
                        <div class="switch-full">
                            <span>缩放</span>
                            <el-input-number
                            v-model="settingsStore.mainSettings.defaultZoom"
                            size="small"
                            :min="2"
                            :max="12"
                            :precision="0"
                            style="width: 84px;"
                            />
                        </div>
                        <div class="switch-full">
                            <span>设置为当前地图视野</span>
                            <el-button
                            size="small"
                            @click="setCurrentViewAsDefault">设置</el-button>
                        </div>
                        <div class="switch-full">
                            <span>清除经纬度</span>
                            <el-button
                            size="small"
                            @click="clearViewLatLng">清除</el-button>
                        </div>
                    </div>
                    <span class="font-bold w-full">其他</span>
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>UI缩放比例</span>
                            <el-select
                            style="width: 72px;"
                            v-model="settingsStore.mainSettings.uiScale"
                            size="small">
                                <el-option label="50%" :value=0.5 />
                                <el-option label="75%" :value=0.75 />
                                <el-option label="默认" :value=1 />
                                <el-option label="125%" :value=1.25 />
                                <el-option label="150%" :value=1.5 />
                                <el-option label="200%" :value=2 />
                            </el-select>
                        </div>
                        <div class="switch-full">
                            <span>显示地名</span>
                            <el-switch v-model="settingsStore.mainSettings.displayPlaceName"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>悬浮时显示地名</span>
                            <el-switch v-model="settingsStore.mainSettings.placeNameOnHover"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>显示中国断层</span>
                            <el-switch v-model="settingsStore.mainSettings.displayCnFault" />
                        </div>
                        <div class="switch-full">
                            <span>显示晨昏线</span>
                            <el-switch v-model="settingsStore.mainSettings.displayTerminator" />
                        </div>
                        <div class="switch-full">
                            <span>中国地震烈度使用罗马数字</span>
                            <el-switch v-model="settingsStore.mainSettings.useRomanCsis" />
                        </div>
                        <div class="switch-full">
                            <span>
                                预警/信息页不展开侧边栏
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em" />
                                    </template>
                                    <p>当前处于预警/信息页面且地图处于自动缩放状态时，可再次点击对应菜单快速切换状态。</p>
                                </el-popover>
                            </span>
                            <el-switch v-model="settingsStore.mainSettings.hideDrawer" />
                        </div>
                        <div class="w-full">
                            <div class="switch-full">
                                <span>
                                    放映模式
                                    <el-popover
                                        placement="top"
                                        :width="300"
                                        trigger="hover"
                                    >
                                        <template #reference>
                                            <question-filled width="1em" height="1em" />
                                        </template>
                                        <p>收到新的信息时自动切换到对应的菜单页面。适合在不频繁操作此应用时使用。</p>
                                        <p>推荐同步启用“预警/信息页不展开侧边栏”。</p>
                                        <strong>
                                            <p>此模式下，收信时您的操作可能被打断。</p>
                                            <p>需重新加载页面后生效。</p>
                                        </strong>
                                    </el-popover>
                                </span>
                                <el-switch v-model="settingsStore.mainSettings.cinemaMode"
                                @change="handleNeedReload" />
                            </div>
                            <div class="switch-full pl-4">
                                <span>将地震/海啸信息页面设为默认</span>
                                <el-switch v-model="settingsStore.mainSettings.eqlistsAsDefault"
                                :disabled="!settingsStore.mainSettings.cinemaMode" />
                            </div>
                        </div>
                        <div class="switch-full">
                            <span>地震信息显示模式</span>
                            <el-select
                            style="width: 192px;"
                            v-model="settingsStore.mainSettings.eqlistsDisplayMode"
                            size="small"
                            @change="handleNeedReload">
                                <el-option label="显示每个数据源的最新地震" :value=0 />
                                <el-option label="显示全部数据源中的最新地震" :value=1 />
                            </el-select>
                        </div>
                        <div class="switch-full">
                            <span>总是显示最新的地震信息框</span>
                            <el-switch v-model="settingsStore.mainSettings.alwaysDisplayLatestInfo" />
                        </div>
                    </div>
                </div>
                <span class="sub-title">性能</span>
                <div class="group">
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>
                                禁用预警区图层
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em" />
                                    </template>
                                    <p>完全移除地震预警区（染色）图层。</p>
                                    <p>不影响本地烈度计算。</p>
                                    <p>可大幅度提升性能。</p>
                                    <p><strong>需重新加载页面后生效。</strong></p>
                                </el-popover>
                            </span>
                            <el-switch v-model="settingsStore.mainSettings.disableEewBaseMap"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>
                                预警区地图简化
                                <el-popover
                                    placement="top"
                                    :width="350"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em" />
                                    </template>
                                    <p>通过简化预警区（染色图层）的形状来提升性能。</p>
                                    <p>简化程度越高，渲染压力越小，但图形失真越严重。</p>
                                    <p><strong>需重新加载页面后生效。</strong></p>
                                </el-popover>
                            </span>
                            <el-slider
                            v-model="settingsStore.mainSettings.mapSimplifyFactor"
                            :min="0" :max="4"
                            :step="1"
                            size="small"
                            show-stops
                            :show-tooltip="false"
                            :marks="simplifyMarks"
                            @change="handleNeedReload"
                            />
                        </div>
                    </div>
                </div>
                <span class="sub-title">高级</span>
                <div class="group">
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>中国地震局预警源</span>
                            <el-select
                            style="width: 72px;"
                            v-model="settingsStore.advancedSettings.ceaEewType"
                            size="small"
                            @change="handleNeedReload">
                                <el-option label="全国" :value=0 />
                                <el-option label="各省" :value=1 />
                            </el-select>
                        </div>
                        <div class="switch-full" v-if="settingsStore.displayTokenButton">
                            <span>管理Token</span>
                            <el-button size="small" @click="showTokenManager = true">管理</el-button>
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableMultiApi">
                            <span>同时接入更多API</span>
                            <el-switch 
                            v-model="settingsStore.advancedSettings.multiApi"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>显示API名称</span>
                            <el-switch v-model="settingsStore.advancedSettings.displayApiType" />
                        </div>
                        <div class="switch-full">
                            <span>
                                软件估算烈度/震度
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em" />
                                    </template>
                                    <p>在软件内部估算以下数据：</p>
                                    <p> - 本地烈度/震度</p>
                                    <p> - 中国各区划预警和信息下最大烈度</p>
                                    <p> - 日本各区划预警下最大震度（融合数据源）</p>
                                    <p>估算结果与数据源显示可能有差异。</p>
                                    <strong>
                                        <p>低精度（尤其是深源地震）。</p>
                                        <p>此功能会消耗较多计算机资源。</p>
                                        <p>部分功能需重新加载页面后生效。</p>
                                    </strong>
                                </el-popover>
                            </span>
                            <el-switch 
                            v-model="settingsStore.advancedSettings.forceCalcInt"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>
                                使用经典地图加载器
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em" />
                                    </template>
                                    <p>开启后：使用常规GeoJSON图层渲染底图，支持鼠标悬浮底图显示地名，部分情况下图形边缘更清晰；不支持拖动时加载，不支持循环显示地图。</p>
                                    <p>关闭后：使用VectorGrid图层渲染底图，支持拖动时加载，支持循环显示地图；不支持鼠标悬浮底图显示地名，部分情况下图形边缘可能模糊。</p>
                                    <p><strong>此功能需重新加载页面后生效。</strong></p>
                                </el-popover>
                            </span>
                            <el-switch 
                            v-model="settingsStore.advancedSettings.useClassicMapLoader"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>
                                防闪烁模式
                                <el-popover
                                    placement="top"
                                    :width="300"
                                    trigger="hover"
                                >
                                    <template #reference>
                                        <question-filled width="1em" height="1em" />
                                    </template>
                                    <p><strong>如无异常，无需开启。</strong></p>
                                    <p>解决一部分因未知原因导致的频繁闪烁问题。</p>
                                    <p><strong>此功能需重新加载页面后生效。</strong></p>
                                </el-popover>
                            </span>
                            <el-switch 
                            v-model="settingsStore.advancedSettings.preventFlickerMode"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full" v-if="settingsStore.advancedSettings.enableMockEew">
                            <span>模拟地震预警</span>
                            <el-switch 
                            v-model="settingsStore.advancedSettings.mockEew"
                            @change="handleNeedReload" />
                        </div>
                        <div class="switch-full">
                            <span>输入指令</span>
                            <el-input
                            type="password"
                            v-model="advancedInput"
                            size="small"
                            style="width: 192px;"
                            @change="handleAdvance" />
                        </div>
                    </div>
                </div>
                <span class="sub-title">关于</span>
                <div class="group">
                    <span class="font-bold w-full" v-if="isTauri">自启动</span>
                    <div class="switch-group" v-if="isTauri">
                        <div class="switch-full">
                            <span>开机自启动</span>
                            <el-switch v-model="isAutoStart" @change="handleAutoStart" />
                        </div>
                        <div class="switch-full" v-if="isWindows">
                            <span>最小化启动</span>
                            <el-switch v-model="settingsStore.mainSettings.minimizeOnLaunch" />
                        </div>
                    </div>
                    <span class="font-bold w-full">更新</span>
                    <div class="switch-group">
                        <div class="switch-full">
                            <span>自动检查更新</span>
                            <el-switch v-model="settingsStore.mainSettings.autoCheckNewVersion" @change="handleAutoCheckVersion" />
                        </div>
                        <div class="switch-full" v-if="isTauri">
                            <span>检查预发布版本</span>
                            <el-switch v-model="settingsStore.mainSettings.checkPrerelease" />
                        </div>
                        <div class="switch-full" v-if="!isTauri">
                            <span>自动应用更新</span>
                            <el-switch v-model="settingsStore.mainSettings.autoRefresh" />
                        </div>
                        <div class="switch-full">
                            <span>立即检查更新</span>
                            <el-button
                            type="primary"
                            size="small"
                            @click="checkNewVersion(false)">检查更新</el-button>
                        </div>
                    </div>
                    <span class="font-bold w-full">帮助&关于</span>
                    <div class="switch-group">
                        <el-button @click="showAbout = true">帮助&关于</el-button>
                    </div>
                </div>
                <span class="sub-title" v-if="needReload">需要重载</span>
                <div class="group">
                    <el-button 
                    type="warning"
                    v-if="needReload"
                    @click="handleReload">重载以应用变更</el-button>
                </div>
            </div>
        </div>
        <el-dialog v-model="verifyDialog" width="300px" top="20vh" :show-close="false" append-to-body>
            <el-form :model="idForm">
                <el-form-item label="用户名" label-width="60px">
                    <el-input v-model="idForm.username" @keyup.enter="postVerify()" />
                </el-form-item>
                <el-form-item label="密码" label-width="60px">
                    <el-input type="password" v-model="idForm.password" @keyup.enter="postVerify()" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button type="default" @click="verifyDialog = false">取消</el-button>
                <el-button type="primary" @click="postVerify()">确定</el-button>
            </template>
        </el-dialog>
        <el-dialog class="customize-audio" v-model="customizeAudio" width="60%" :show-close="false" append-to-body>
            <div class="explanation" v-if="isTauri">
                <div class="text">
                    <p><strong>应用程序版本支持自定义音效，请参考下列步骤。</strong></p>
                    <p>1. 点击“打开音频文件夹”按钮，系统的文件管理器会打开该应用程序的音频文件夹。</p>
                    <p>2. 将你想替换的音频文件（需要为mp3格式）放入该文件夹并重命名为“xxx.mp3”，具体名称请参照下方按钮显示的名称。</p>
                    <p>3. 点击“重新加载音频”按钮，或右键刷新页面即完成替换。</p>
                    <p>替换完成后可点击下方按钮进行音效测试。如需恢复默认，删除对应的mp3文件并重载音频即可。</p>
                    <p>Tips. 如需关闭某个音效，可以创建一个空白文本文件并重命名为“xxx.mp3”即可。</p>
                    <p><strong>如因此功能产生任何侵权行为将由您自行承担，开发者不承担任何责任。</strong></p>
                </div>
                <div class="buttons">
                    <el-button @click="openDataFolder">打开音频文件夹</el-button>
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
        <el-dialog v-model="showTokenManager" width="300px" top="20vh" :show-close="false" append-to-body>
            <el-form :model="idForm">
                <el-form-item v-if="settingsStore.advancedSettings.enableIclEew || settingsStore.advancedSettings.enableFssnEqlist" label="FAN:DEV" label-width="60px">
                    <el-input v-model="settingsStore.advancedSettings.tokens.fan_dev" @change="handleNeedReload" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button type="primary" @click="showTokenManager = false">完成</el-button>
            </template>
        </el-dialog>
        <el-dialog class="about-box" v-model="showAbout" width="60%" :show-close="false" append-to-body>
            <div class="header">要石 v2.2.0-pre.6</div>
            <div class="title">使用方法</div>
            <div class="about">
                <p>主要功能：接收日本气象厅、台湾省中央气象署、中国地震局、四川省地震局、福建省地震局地震预警信息，日本气象厅、中国地震台网地震信息，日本气象厅海啸信息，NIED強震モニタ测站数据。</p>
                <p>Chrome/Edge推荐设置（以Chrome为例，Edge方法类似）：</p>
                <ul>
                    <li>保持后台刷新：浏览器访问chrome://flags - Calculate window occlusion on Windows - Disabled - 右下角重新启动</li>
                    <li>去除网页“不安全”提示（同时解除网页权限设置限制，但浏览器启动时会收到横幅提示）：chrome://flags - Insecure origins treated as secure - 启用 - 输入本网页的链接 - 右下角重新启动</li>
                    <li>作为网页应用安装：Chrome打开此页面，右上角三点 - 保存并分享 - 将网页作为应用安装。安装一次后刷新页面即可加载最新版本网页，无需重新安装。</li>
                </ul>
                <p>通知推送：需授予通知权限。Chrome：点击网页链接左侧按钮-网站设置-通知-允许，刷新页面。</p>
                <p>播放声音：需开启声音权限。Chrome：点击网页链接左侧按钮-网站设置-声音-允许，刷新页面。</p>
            </div>
            <div class="title">快捷键</div>
            <div class="about">
                <ul>
                    <li>[A]uto：打开/关闭自动视野</li>
                    <li>[D]rawer：显示/隐藏侧边栏</li>
                    <li>[H]istory：打开/关闭历史地震</li>
                    <li v-if="settingsStore.advancedSettings.mockEew">[M]ock：打开/关闭模拟地震预警面板</li>
                    <li>Tab / Enter + Tab：轮询菜单</li>
                    <li>, / . ：存在多页信息框时轮询信息框</li>
                </ul>
            </div>
            <div class="title">注意事项</div>
            <div class="about">
                <p>关于烈度：日本气象厅紧急地震速报（震度），台湾中央气象署（震度），中国地震局（烈度），四川地震局（烈度），福建地震局（烈度），日本气象厅地震情报（震度），中国地震台网地震信息（烈度）。除日本气象厅地震情报外均为预估值。</p>
                <p>关于时间：显示为发报机构当地时间。</p>
                <p>关于延迟：受API限制，部分资料具有延迟是正常现象。</p>
                <p>关于地图：由于服务器带宽限制，进入页面后需要一定时间加载地图。如长时间未加载地图，请刷新页面。</p>
            </div>
            <div class="title">关于</div>
            <div class="about">
                <p>Windows 10（x64）、macOS（arm64）及以上用户推荐使用应用程序：<a href="https://github.com/Lipomoea/kanameishi/releases" target="_blank">应用程序下载</a>&nbsp;<a href="https://gitee.com/lipomoea/kanameishi/releases" target="_blank">备用链接</a></p>
                <p>联系我：<a href="https://space.bilibili.com/316757498" target="_blank">リッポミャ</a>（哔哩哔哩）</p>
                <p>Github：<a href="https://github.com/Lipomoea/kanameishi" target="_blank">https://github.com/Lipomoea/kanameishi</a></p>
                <p>特别鸣谢：</p>
                <p>Wolfx Open API、FAN Studio API、P2P地震情報：接口支持。</p>
                <p>kotoho7：SREV音效支持。音效遵循<a href="https://creativecommons.org/licenses/by-sa/2.0/deed.zh-hans" target="_blank">CC BY-SA 2.0 DEED</a>许可协议，未进行二次加工。</p>
                <p>地牛WakeUp：中文倒计时播报素材。台湾地区欢迎下载<a href="https://eew.earthquake.tw/" target="_blank">地牛Wake Up！</a>获得更稳定的预警体验。</p>
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
import { calcPassedTime, formatCsis, openUrl, playSound, setClassName, shindoScale, calcCsisLevel } from '@/utils/Utils';
import { join, appDataDir } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { exists, mkdir } from "@tauri-apps/plugin-fs";
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { platform } from '@tauri-apps/plugin-os';
import { isTauri as getIsTauri } from '@tauri-apps/api/core';

const showNotifButton = 'Notification' in window
const isTauri = getIsTauri()
const thisPlatform = isTauri ? platform() : ''
const isWindows = thisPlatform == 'windows'
const simplifyMarks = {
    0: '关闭',
    1: '轻微',
    2: '中等',
    3: '显著',
    4: '极致'
}
const settingsStore = useSettingsStore()
const statusStore = useStatusStore()
const replayDateTime = ref('')
const setReplayDateTime = () => {
    const passedTime = Math.max(Math.round(calcPassedTime(replayDateTime.value, 8) / 600) / 100, 0)
    settingsStore.mainSettings.displaySeisNet.delay = passedTime
}
const setLat = (type)=>(val)=>{
    if(!val) return
    let number = Number(val)
    if(isNaN(number)){
        settingsStore.mainSettings[type][0] = 0
    }
    else{
        if(number > 90) number = 90
        if(number < -90) number = -90
        settingsStore.mainSettings[type][0] = number
    }
}
const setLng = (type)=>(val)=>{
    if(!val) return
    let number = Number(val)
    if(isNaN(number)){
        settingsStore.mainSettings[type][1] = 0
    }
    else{
        if(number > 180) number = 180
        if(number < -180) number = -180
        settingsStore.mainSettings[type][1] = number
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
    settingsStore.mainSettings.defaultZoom = Math.min(Math.max(val, 2), 12)
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
    settingsStore.mainSettings.viewLatLng[0] = 0
    settingsStore.mainSettings.viewLatLng[1] = 0
    ElMessage({
        message: '清除完成',
        type: 'success',
    })
}
const clearUserLatLng = ()=>{
    settingsStore.mainSettings.userLatLng[0] = 0
    settingsStore.mainSettings.userLatLng[1] = 0
    ElMessage({
        message: '清除完成',
        type: 'success',
    })
}
const needReload = ref(false)
const handleReload = () => {
    window.location.reload()
}
const showTokenManager = ref(false)
const advancedInput = ref('')
const verifyDialog = ref(false)
let verifyType = ''
const idForm = reactive({
    username: '',
    password: '',
})
const handleAdvance = (val)=>{
    switch(val){
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
            settingsStore.advancedSettings.enableMultiApi = false
            settingsStore.advancedSettings.multiApi = false
            ElMessage({
                message: '功能已关闭',
                type: 'success'
            })
            break
        }
        case 'enableMockEew': {
            ElMessageBox.confirm(
                '此功能意在通过重现或模拟将来可能发生的地震，起到防灾减灾教育效果。因滥用此功能造成的任何后果均由您本人承担。',
                '启用模拟地震预警',
                {
                    confirmButtonText: '同意',
                    cancelButtonText: '不同意',
                    type: 'warning',
                    showClose: false,
                }
            ).then(()=>{
                settingsStore.advancedSettings.enableMockEew = true
            }).catch(()=>{
                if(settingsStore.advancedSettings.mockEew) handleNeedReload()
                settingsStore.advancedSettings.mockEew = false
                settingsStore.advancedSettings.enableMockEew = false
            })
            break
        }
        case 'disableMockEew': {
            if(settingsStore.advancedSettings.mockEew) handleNeedReload()
            settingsStore.advancedSettings.mockEew = false
            settingsStore.advancedSettings.enableMockEew = false
            break
        }
        case 'enableFssnEqlist': {
            ElMessageBox.confirm(
                `
                FAN Studio Seismic Network (FSSN)是由FAN Studio提供支持，利用FDSN地震仪网络进行全球地震测定的项目。
                该项目由地震学爱好者组织维护，不属于任何官方机构。
                该数据源的信息可能存在较多错误，请确认您是否坚持使用？
                `,
                '启用FSSN地震测定',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                    showClose: false,
                }
            ).then(()=>{
                settingsStore.advancedSettings.enableFssnEqlist = true
            }).catch(()=>{
                if(settingsStore.mainSettings.source.fssnEqlist) handleNeedReload()
                settingsStore.mainSettings.source.fssnEqlist = false
                settingsStore.advancedSettings.enableFssnEqlist = false
            })
            break
        }
        case 'disableFssnEqlist': {
            if(settingsStore.mainSettings.source.fssnEqlist) handleNeedReload()
            settingsStore.mainSettings.source.fssnEqlist = false
            settingsStore.advancedSettings.enableFssnEqlist = false
            break
        }
        case 'verifyAdmin': {
            verifyType = 'verifyAdmin'
            verifyDialog.value = true
            break
        }
    }
    advancedInput.value = ''
}
const postVerify = async (type = verifyType)=>{
    switch(type){
        case 'enableIclEew': {
            const res = await Http.post('https://api.lipomoea.tech/icl_url', idForm)
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
            const res = await Http.post('https://api.lipomoea.tech/trem_url', idForm)
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
            const res = await Http.post('https://api.lipomoea.tech/gq_url', idForm)
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
            const res = await Http.post('https://api.lipomoea.tech/multi_api', idForm)
            if(res && res.success){
                settingsStore.advancedSettings.enableMultiApi = true
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
        case 'verifyAdmin': {
            postVerify('enableIclEew')
            postVerify('enableTremFunctions')
            postVerify('enableGqEew')
            postVerify('enableMultiApi')
        }
    }
}
const handleNeedReload = () => {
    if(!needReload.value) {
        needReload.value = true
        ElMessage({
            message: '需要重载页面后生效！点击右侧关闭按钮立即重载',
            type: 'warning',
            duration: 0,
            showClose: true,
            onClose: handleReload
        })
    }
}
const showAbout = ref(false)
let hasNewVersion = false
const checkNewVersion = async (silent = false) => {
    const currentVersion = document.title.split('v')[1]
    try {
        const versionInfo = await Http.get('https://api.github.com/repos/Lipomoea/kanameishi/releases')
        let checkedVersion, downloadUrl, detail
        if(isTauri) {
            const fileType = isWindows ? '.exe' : '.dmg'
            let i = 0
            let asset = undefined
            while(i < versionInfo.length) {
                asset = versionInfo[i].assets.find(asset => asset.name.endsWith(fileType))
                if((!versionInfo[i].prerelease || settingsStore.mainSettings.checkPrerelease) && asset) break
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
                downloadUrl = asset.browser_download_url
                detail = versionInfo[i].body
            }
        }
        else {
            checkedVersion = versionInfo[0].tag_name.slice(1)
            downloadUrl = ''
            detail = versionInfo[0].body
        }
        if(compareVersion(currentVersion, checkedVersion)) {
            if(!hasNewVersion) {
                hasNewVersion = true
                ElMessage({
                    message: `检查到新版本v${checkedVersion}`,
                    type: 'success',
                    duration: 0,
                    showClose: true,
                    onClose: () => hasNewVersion = false
                })
            }
            ElMessageBox.close()
            if(isTauri) {
                if(!silent) {
                    ElMessageBox.confirm(
                        `检查到新版本v${checkedVersion}，是否下载？\r\n${detail}`,
                        '发现新版本',
                        {
                            confirmButtonText: '下载',
                            cancelButtonText: '关闭',
                            type: '',
                            showClose: false
                        }
                    ).then(()=>{
                        openUrl(downloadUrl)
                    })
                }
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
                    if(!silent) {
                        ElMessageBox.confirm(
                            `检查到新版本v${checkedVersion}，是否刷新页面？\r\n${detail}`,
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
    else if(compareArray(splitCurrent[0].split('.'), splitChecked[0].split('.'))) return false
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
    try {
        const appDataPath = await appDataDir()
        const audioPath = await join(appDataPath, 'audio')
        const isExist = await exists(audioPath)
        if(!isExist) await mkdir(audioPath, { recursive: true })
        openUrl(audioPath)
    } catch (e) {
        console.error(e)
    }
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
        width: 100%;
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
            width: 100%;
            .sub-title{
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 5px;
            }
            .group{
                display: flex;
                flex-direction: column;
                width: 100%;
                align-items: flex-start;
                row-gap: 5px;
                margin-bottom: 5px;
            }
            .switch-group{
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                row-gap: 5px;
                column-gap: 15px;
            }
            .switch{
                display: flex;
                align-items: center;
                column-gap: 5px;
            }
            .switch-full {
                display: flex;
                width: 100%;
                justify-content: space-between;
                align-items: center;
            }
            .el-switch{
                height: 24px;
            }
            .lat-lng{
                width: 120px;
            }
            span{
                display: flex;
                align-items: center;
            }
        }
    }
}
ul {
    list-style-position: inside;
}
.force-wrap{
    flex-wrap: wrap;
    row-gap: 5px;
}
.w-full{
    width: 100%;
}
.el-checkbox{
    height: 24px;
    margin: 0px;
}
.int {
    width: 22px;
    height: 22px;
    margin-left: 6px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    user-select: none;
    .csis {
        font-size: 16px;
    }
    .shindo {
        font-size: 12px;
    }
    .shindo::first-letter {
        font-size: 16px;
        vertical-align: top;
    }
    .roman.scale-9 {
        transform: scaleX(0.9);
    }
}
.mag {
    width: 28px;
    height: 22px;
    margin-left: 6px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
    user-select: none;
}
.el-slider {
    flex: 1;
    margin: 0 0.5rem 0 1rem;
}
.justify-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.flex {
    display: flex;
    align-items: center;
}
.ml-4 {
    margin-left: 1rem;
}
.mr-4 {
    margin-right: 1rem;
}
.pl-4 {
    padding-left: 1rem;
}
.pr-4 {
    padding-right: 1rem;
}
.gap-2 {
    gap: 0.5rem;
}
.font-bold {
    font-weight: 700;
}
</style>

<style lang="scss">
.about-box {
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