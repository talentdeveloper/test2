import { Device, IDevice } from '../device/device';
import { Account } from '../account/account';
import { Facility } from '../facility/facility';

export interface IDeviceDetail extends IDevice {
    files_queued?: number;
    files_downloading?: number;
    files_downloaded?: number;
    files_errored?: number;
    account_id?: string;
    account_name?: string;
    facility_id?: string;
    facility_name?: string;
}

export class DeviceDetail extends Device implements IDeviceDetail {
    files_queued;
    files_downloading;
    files_downloaded;
    files_errored;
    account_id;
    account_name;
    facility_id;
    facility_name;
    loaded = false;

    constructor(data: IDeviceDetail = {}) {
        super(data);

        this.files_queued = data.files_queued || 0;
        this.files_downloading = data.files_downloading || 0;
        this.files_downloaded = data.files_downloaded || 0;
        this.files_errored = data.files_errored || 0;
        this.account_id = data.account_id || '';
        this.account_name = data.account_name || '';
        this.facility_id = data.facility_id || '';
        this.facility_name = data.facility_name || '';
    }
}
