<template>
    <el-dialog
        v-model="visible"
        class="data-source-manager"
        title="数据源管理"
        width="min(900px, 94vw)"
        top="6vh"
        :show-close="false"
        append-to-body
    >
        <el-alert
            v-if="!hasFanApiKey"
            class="api-key-warning"
            type="warning"
            :closable="false"
            show-icon
        >
            <template #title>
                <span>尚未配置FAN Studio API Key，部分功能受限。</span>
                <el-button type="primary" link @click="emit('manage-api-key')">前往管理API Key</el-button>
            </template>
        </el-alert>
        <el-alert
            v-else-if="statusStore.fanAuthStatus == 0"
            class="api-key-warning"
            type="error"
            :closable="false"
            show-icon
        >
            <template #title>
                <span>FAN Studio API认证失败，部分功能受限。请检查您的API Key是否正确。</span>
                <el-button type="primary" link @click="emit('manage-api-key')">前往管理API Key</el-button>
            </template>
        </el-alert>
        <el-tabs v-model="activeCategory" stretch>
            <el-tab-pane
                v-for="category in dataSourceCategories"
                :key="category.key"
                :label="category.label"
                :name="category.key"
            >
                <div class="source-table-wrap">
                    <table class="source-table">
                        <thead>
                            <tr>
                                <th class="source-name">数据源</th>
                                <th>全部</th>
                                <th
                                    v-for="provider in providersFor(category.key)"
                                    :key="provider"
                                >
                                    {{ dataSourceProviders[provider] }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="source in sourcesFor(category.key)" :key="source">
                                <td class="source-name">{{ dataSourceCatalog[source].label }}</td>
                                <td>
                                    <el-checkbox
                                        :model-value="settingsStore.isDataSourceFullyEnabled(source)"
                                        :indeterminate="settingsStore.isDataSourcePartiallyEnabled(source)"
                                        :aria-label="`${dataSourceCatalog[source].label}全部API`"
                                        @change="toggleSource(source, $event)"
                                    />
                                </td>
                                <td
                                    v-for="provider in providersFor(category.key)"
                                    :key="provider"
                                >
                                    <div
                                        v-if="dataSourceCatalog[source].apis.includes(provider)"
                                        class="api-control"
                                    >
                                        <el-checkbox
                                            :model-value="settingsStore.mainSettings.dataSources[source]?.[provider]"
                                            :aria-label="`${dataSourceCatalog[source].label} ${dataSourceProviders[provider]}`"
                                            @change="toggleApi(source, provider, $event)"
                                        />
                                        <el-select
                                            v-if="source == 'ceaEew' && provider == 'fan'"
                                            v-model="settingsStore.mainSettings.provinceCeaEew"
                                            class="cea-fan-level"
                                            size="small"
                                            :disabled="!settingsStore.mainSettings.dataSources.ceaEew.fan"
                                            aria-label="中国地震局 FAN 级别"
                                            @change="emit('change')"
                                        >
                                            <el-option label="国家级" :value="false" />
                                            <el-option label="省级" :value="true" />
                                        </el-select>
                                    </div>
                                    <span v-else class="unsupported">-</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </el-tab-pane>
        </el-tabs>
        <template #footer>
            <el-button type="primary" @click="visible = false">完成</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useAccessStore } from '@/stores/access';
import { useStatusStore } from '@/stores/status';
import {
    dataSourceCatalog,
    dataSourceCategories,
    dataSourceProviders,
} from '@/utils/DataSources';

const visible = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['change', 'manage-api-key'])
const settingsStore = useSettingsStore()
const accessStore = useAccessStore()
const statusStore = useStatusStore()
const activeCategory = ref(dataSourceCategories[0].key)
const hasFanApiKey = computed(() => Boolean(settingsStore.mainSettings.apiKeys.fanApiKey?.trim()))

const visibleSources = computed(() => Object.keys(dataSourceCatalog).filter(source => {
    const requiredCapability = dataSourceCatalog[source].requiredCapability
    return !requiredCapability || accessStore.canUse(requiredCapability)
}))

const sourcesFor = category => visibleSources.value
    .filter(source => dataSourceCatalog[source].category == category)
    .sort((sourceA, sourceB) => dataSourceCatalog[sourceA].displayOrder - dataSourceCatalog[sourceB].displayOrder)
const providersFor = category => [...new Set(
    sourcesFor(category).flatMap(source => dataSourceCatalog[source].apis)
)]

const confirmFssn = () => ElMessageBox.confirm(
    `FAN Studio Seismic Network (FSSN)是由FAN Studio提供支持，利用FDSN等地震仪网络进行全球地震测定的项目。
    该项目由地震学爱好者组织维护，不属于任何官方机构，测定结果仅供参考。
    请问您是否坚持使用？`,
    '启用FSSN地震测定',
    {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        showClose: false,
    }
)

const canEnable = async (source, wasEnabled) => {
    if(!settingsStore.isDataSourceAvailable(source)) return false
    if(source != 'fssnEqlist' || wasEnabled) return true
    try {
        await confirmFssn()
        return true
    }
    catch (_) {
        return false
    }
}

const toggleSource = async (source, enabled) => {
    const previousApis = { ...settingsStore.mainSettings.dataSources[source] }
    const wasEnabled = settingsStore.isDataSourceEnabled(source)
    settingsStore.setDataSourceEnabled(source, enabled)
    if(enabled && !await canEnable(source, wasEnabled)) {
        Object.assign(settingsStore.mainSettings.dataSources[source], previousApis)
        return
    }
    emit('change')
}

const toggleApi = async (source, api, enabled) => {
    const previousValue = settingsStore.mainSettings.dataSources[source][api]
    const wasEnabled = settingsStore.isDataSourceEnabled(source)
    settingsStore.mainSettings.dataSources[source][api] = enabled
    if(enabled && !await canEnable(source, wasEnabled)) {
        settingsStore.mainSettings.dataSources[source][api] = previousValue
        return
    }
    emit('change')
}
</script>

<style lang="scss">
.data-source-manager {
    max-height: 88vh;
    display: flex;
    flex-direction: column;

    .el-dialog__body {
        min-height: 0;
        padding-top: 4px;
        overflow: hidden;
    }

    .api-key-warning {
        margin-bottom: 8px;

        .el-alert__title {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 4px;
        }

        .el-button {
            height: auto;
            padding: 0;
        }
    }

    .el-tabs,
    .el-tabs__content,
    .el-tab-pane {
        min-height: 0;
    }

    .source-table-wrap {
        max-height: calc(88vh - 180px);
        overflow: auto;
        border: 1px solid var(--el-border-color);
        border-radius: 6px;
    }

    .source-table {
        width: 100%;
        min-width: 640px;
        border-collapse: collapse;
        table-layout: fixed;

        th,
        td {
            height: 44px;
            padding: 6px 10px;
            border-right: 1px solid var(--el-border-color-lighter);
            border-bottom: 1px solid var(--el-border-color-lighter);
            text-align: center;
            vertical-align: middle;
        }

        th {
            position: sticky;
            top: 0;
            z-index: 1;
            background: var(--el-bg-color);
            font-weight: 600;
        }

        th:last-child,
        td:last-child {
            border-right: 0;
        }

        tbody tr:last-child td {
            border-bottom: 0;
        }

        .source-name {
            width: 250px;
            text-align: left;
        }

        .api-control {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .cea-fan-level {
            width: 82px;
        }

        .el-checkbox {
            margin: 0;
            height: 24px;
        }

        .unsupported {
            color: var(--el-text-color-placeholder);
        }
    }
}

@media (max-width: 600px) {
    .data-source-manager {
        margin-top: 3vh;
        max-height: 94vh;

        .el-dialog__header,
        .el-dialog__body,
        .el-dialog__footer {
            padding-left: 12px;
            padding-right: 12px;
        }

        .source-table-wrap {
            max-height: calc(94vh - 170px);
        }
    }
}
</style>
