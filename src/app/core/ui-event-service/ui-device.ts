import { IUiEventMessage, UiEventMessage } from './ui-event-service';
import { Device } from '../../model/device/device';
import { DeviceStatus } from '../../model/device/device-status';

export interface IDeviceMessage extends IUiEventMessage {
    device : Device;
    deviceStatus: DeviceStatus;
    accountId ?: string;
    facilityId ?: string;
}

export class DeleteDeviceMessage extends UiEventMessage implements IDeviceMessage {
    device;
    deviceStatus;
    accountId;
    facilityId;

    constructor(message : IDeviceMessage) {
        super();

        this.device = message.device;
        this.deviceStatus = message.deviceStatus;
        this.accountId = message.accountId;
        this.facilityId = message.facilityId;
    }
}

export class RefreshDeviceListMessage extends UiEventMessage {}
