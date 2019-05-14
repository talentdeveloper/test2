import { UUID } from 'angular2-uuid';
import * as moment from 'moment';
import * as _ from 'lodash';

import { DocTypeConstants } from '../../constants';
import { Device } from './device';
import { ISyncGatewayModel, SyncGatewayModel } from '../sync-gateway/sync-gateway-model';

export interface IDeviceStatus extends ISyncGatewayModel {
  device_id?: string;
  serial_number?: string;
  last_online?: string;
  last_sync?: string;
  last_used?: string;
  doc_type?: string;
  _deleted?: boolean;
}

export class DeviceStatus extends SyncGatewayModel implements IDeviceStatus {
  _id: string;
  device_id: string;
  serial_number: string;
  last_online: string;
  last_sync: string;
  last_used: string;
  doc_type = DocTypeConstants.DOC_TYPES.ACCOUNT.DEVICE_STATUS;
  _deleted: boolean;

  constructor(data: IDeviceStatus = {}) {
    super(
      data._id,
      data._rev,
      null,
      data.created_by,
      data.created_date,
      data.modified_by,
      data.modified_date
    );

    this._id = data._id || '';
    this.device_id = data.device_id || '';
    this.serial_number = data.serial_number || '';
    this.last_online = data.last_online || '';
    this.last_sync = data.last_sync || '';
    this.last_used = data.last_used || '';
  }
}

export class DeviceStatusFactory {
  static create(
    device_id: string,
    serial_number: string = '',
    last_online: string = '',
    last_sync: string = '',
    last_used: string = ''
  ): DeviceStatus {
    return new DeviceStatus({
      _id: UUID.UUID(),
      serial_number,
      last_online,
      last_sync,
      last_used
    });
  }

  static createFromDeviceStatus(deviceStatus: DeviceStatus): DeviceStatus {
    const newDeviceStatus = new DeviceStatus(deviceStatus);
    newDeviceStatus._rev = deviceStatus._rev;
    return newDeviceStatus;
  }

  static createFromDevice(device: Device): DeviceStatus {
    return new DeviceStatus({
      _id: UUID.UUID(),
      device_id: device._id,
      serial_number: device.serial_number || '',
      last_online: '',
      last_sync: '',
      last_used: ''
    });
  }
}
