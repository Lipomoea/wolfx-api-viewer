import { invoke, isTauri } from '@tauri-apps/api/core';

class Palert {
    static ensureAvailable() {
        if (!isTauri()) {
            throw new Error('P-Alert is only available in the Tauri app');
        }
    }

    static async getRealtimeData(type, recordTime = 0) {
        Palert.ensureAvailable();
        if (type !== 0 && type !== 1) {
            throw new RangeError('type must be 0 (PGA) or 1 (PGV)');
        }
        if (!Number.isFinite(recordTime) || recordTime < 0 || recordTime > Number.MAX_SAFE_INTEGER) {
            throw new RangeError('recordTime must be a finite non-negative number');
        }
        return invoke('fetch_palert_realtime_data', { dataType: type, recordTime });
    }

    static async getStationList() {
        Palert.ensureAvailable();
        return invoke('fetch_palert_station_list');
    }
}

export default Palert;
