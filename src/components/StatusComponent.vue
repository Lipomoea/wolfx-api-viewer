<template>
    <div class="outer1">
        <div class="modal" @click="statusStore.showStatusPanel = false"></div>
        <div class="container">
            <div class="title">状态面板</div>
            <div class="grids">
                <div class="eqGrid">
                    <EqGrid v-for="(source, index) of eewList" :key="index" :source />
                    <EqGrid v-if="settingsStore.advancedSettings.mockEew" source="mockEew" />
                    <MockEew v-if="settingsStore.advancedSettings.mockEew" />
                </div>
                <el-divider />
                <div class="eqGrid">
                    <EqGrid v-for="(source, index) of eqlistList" :key="index" :source />
                </div>
                <div class="perfPanel">
                    <div class="perfHeader">
                        <span>性能</span>
                        <el-button size="small" @click="handleCopyPerf">复制JSON</el-button>
                    </div>
                    <div class="perfGrid">
                        <div>
                            <span>运行时间</span>
                            <b>{{ formatMs(perfSnapshot.uptimeMs) }}</b>
                        </div>
                        <div>
                            <span>WASM初始化</span>
                            <b>{{ formatMs(perfSnapshot.measures['wasm.seismic.init']?.lastMs) }}</b>
                        </div>
                        <div>
                            <span>WebGL波形</span>
                            <b>{{ formatBool(perfSnapshot.values['webgl.wave.available']) }}</b>
                        </div>
                        <div>
                            <span>WebGL测站</span>
                            <b>{{ perfSnapshot.values['webgl.station.totalCount'] ?? 0 }}</b>
                        </div>
                        <div>
                            <span>波形渲染</span>
                            <b>{{ formatMs(perfSnapshot.measures['webgl.wave.render']?.lastMs) }}</b>
                        </div>
                        <div>
                            <span>测站渲染</span>
                            <b>{{ formatMs(perfSnapshot.measures['webgl.station.render']?.lastMs) }}</b>
                        </div>
                        <div>
                            <span>长任务</span>
                            <b>{{ perfSnapshot.longTasks.count }}</b>
                        </div>
                    </div>
                </div>
                <SeisNetComponent v-show="false" />
            </div>
        </div>
    </div>
</template>

<script setup>
import EqGrid from "@/components/components/EqGrid.vue";
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import { eewSources, eqlistSources, useStatusStore } from "@/stores/status";
import { eqUrls } from "@/utils/Urls";
import SeisNetComponent from "./SeisNetComponent.vue";
import { copyPerfSnapshot, getPerfSnapshot } from "@/utils/PerfMetrics";

const MockEew = defineAsyncComponent(() => import("./components/MockEew.vue"));
const settingsStore = useSettingsStore();
const statusStore = useStatusStore();

if (settingsStore.advancedSettings.enableGqEew)
    Object.assign(eqUrls, JSON.parse(localStorage.getItem("gqUrl")));

const eewList = eewSources.filter(
    source => settingsStore.mainSettings.source[source]
);

if (settingsStore.advancedSettings.enableTremFunctions)
    Object.assign(eqUrls, JSON.parse(localStorage.getItem("tremUrl"))?.eqUrls);

const eqlistList = eqlistSources.filter(
    source => settingsStore.mainSettings.source[source]
);

const perfSnapshot = ref(getPerfSnapshot());
let perfTimer;
const refreshPerf = () => perfSnapshot.value = getPerfSnapshot();
const formatMs = value => Number.isFinite(value) ? `${Math.round(value * 10) / 10}ms` : 'N/A';
const formatBool = value => value ? '开启' : value === false ? '关闭' : 'N/A';
const handleCopyPerf = async () => {
    try {
        refreshPerf();
        await copyPerfSnapshot();
        ElMessage({ message: '性能快照已复制', type: 'success' });
    } catch {
        ElMessage({ message: '复制失败', type: 'error' });
    }
};

onMounted(() => {
    refreshPerf();
    perfTimer = setInterval(refreshPerf, 1000);
});
onBeforeUnmount(() => clearInterval(perfTimer));
</script>

<style lang="scss" scoped>
.outer1 {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: relative;

    .modal {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 0;
    }

    .container {
        width: 70%;
        height: 80%;
        background-color: #fff;
        border-radius: 20px;
        box-shadow: 0 0 20px 5px #0000003f;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 1;

        .title {
            font-size: 28px;
            font-weight: 700;
            margin: 10px 0;
        }

        .grids {
            width: 100%;
            height: 100%;
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            overflow: auto;
            border-top: #dcdfe6 1px solid;
            scrollbar-width: none;
            &::-webkit-scrollbar {
                display: none;
            }

            .eqGrid {
                width: 100%;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(375px, 1fr));
                justify-items: center;
                align-items: center;
                gap: 10px;
            }

            .mock {
                width: 100%;
                height: 50px;
                align-self: center;
                font-size: 16px;
                border-radius: 25px;
            }

            .perfPanel {
                width: 100%;
                padding: 12px;
                border: 1px solid #dcdfe6;
                border-radius: 8px;

                .perfHeader {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .perfGrid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 8px;

                    div {
                        padding: 8px;
                        border-radius: 6px;
                        background: #f5f7fa;
                        display: flex;
                        justify-content: space-between;
                        gap: 8px;
                    }

                    span {
                        color: #606266;
                    }
                }
            }
        }
    }
}
</style>
