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
                <SeisNetComponent v-show="false" />
                <TyphoonComponent v-if="settingsStore.mainSettings.displayTyphoon" />
            </div>
        </div>
    </div>
</template>

<script setup>
import EqGrid from "@/components/components/EqGrid.vue";
import MockEew from "./components/MockEew.vue";
import { useSettingsStore } from "@/stores/settings";
import { eewSources, eqlistSources, useStatusStore } from "@/stores/status";
import SeisNetComponent from "./SeisNetComponent.vue";
import TyphoonComponent from "./TyphoonComponent.vue";

const settingsStore = useSettingsStore();
const statusStore = useStatusStore();

const eewList = eewSources.filter(
    source => settingsStore.isDataSourceEnabled(source)
);

const eqlistList = eqlistSources.filter(
    source => settingsStore.isDataSourceEnabled(source)
);
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
        }
    }
}
</style>
