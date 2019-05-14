import { UUID } from 'angular2-uuid';
import * as moment from 'moment';
import * as _ from 'lodash';

import { DocTypeConstants } from '../../constants';
import { ISyncGatewayModel, SyncGatewayModel } from '../sync-gateway/sync-gateway-model';
import { skillLevelMap, skillLevel } from '../content/content';

export type contentStatusType = 'qa' | 'approved';
export const CONTENT_MODE_QA: contentStatusType = 'qa';
export const CONTENT_MODE_APPROVED: contentStatusType = 'approved';

export const DEVICE_STATUS_ACTIVE = 'active';
export const DEVICE_STATUS_INACTIVE = 'inactive';

export const DEVICE_RESIDENT_MODE_ALL = 'all';
export const DEVICE_RESIDENT_MODE_SELECT = 'select';

export const deviceProduct = {
  ENGAGE: 'ENGAGE',
  FOCUS: 'FOCUS',
  REHAB: 'REHAB'
};

export interface IDevice extends ISyncGatewayModel {
  account_id?: string;
  facility_id?: string;
  content_mode?: contentStatusType;
  external_nickname?: string;
  nickname?: string;
  product?: string;
  resident_mode?: string;
  serial_number?: string;
  skill_level?: number;
  status?: string;
  terms_of_use_agreement?: [
    {
      created_date: string;
      acceptance_date?: string;
      account_id: string;
      facility_id: string;
    }
  ];
  doc_type?: string;
  _deleted?: boolean;
}

export class Device extends SyncGatewayModel implements IDevice {
  account_id;
  facility_id;
  content_mode;
  external_nickname;
  nickname;
  product;
  resident_mode;
  serial_number;
  skill_level;
  status;
  terms_of_use_agreement;
  doc_type = DocTypeConstants.DOC_TYPES.ACCOUNT.DEVICE;
  _deleted;

  constructor(data: IDevice = {}) {
    super(
      data._id,
      data._rev,
      null,
      data.created_by,
      data.created_date,
      data.modified_by,
      data.modified_date
    );

    this.account_id = data.account_id || '';
    this.facility_id = data.facility_id || '';
    this.content_mode = data.content_mode || CONTENT_MODE_APPROVED;
    this.external_nickname = data.external_nickname || '';
    this.nickname = data.nickname || '';
    this.product = data.product;
    this.resident_mode = data.resident_mode || '';
    this.serial_number = data.serial_number;
    this.skill_level = data.skill_level || skillLevel.LEVEL_THREE;
    this.status = data.status || '';
    this.terms_of_use_agreement = data.terms_of_use_agreement || [];
  }

  getSkillLevelName() {
    const skillLevel = skillLevelMap.find(level => level.value === this.skill_level);
    return skillLevel ? skillLevel.label : '';
  }

  getContentModeName() {
    return this.content_mode === CONTENT_MODE_QA ? 'QA Content' : 'Approved Content';
  }

  getResidentModeName() {
    switch (this.resident_mode) {
      case DEVICE_RESIDENT_MODE_ALL:
        return 'All Residents';
      case DEVICE_RESIDENT_MODE_SELECT:
        return 'Selected Residents';
    }

    return '';
  }

  isInAllResidentMode() {
    return this.resident_mode === DEVICE_RESIDENT_MODE_ALL;
  }

  isActive() {
    return this.status === DEVICE_STATUS_ACTIVE;
  }

  getTermsOfUseRecord(accountId, facilityId) {
    return this.terms_of_use_agreement.filter(
      tos => tos.account_id === accountId && tos.facility_id === facilityId
    )[0];
  }

  addTermsOfUseSigned(accountId, facilityId) {
    const existingEntry = this.getTermsOfUseRecord(accountId, facilityId);

    const created_date = moment.utc().format();

    // if nothing exists, just append it directly
    if (!existingEntry) {
      this.terms_of_use_agreement.push({
        created_date,
        account_id: accountId,
        facility_id: facilityId
      });
    } else {
      // remove property
      delete existingEntry.acceptance_date;
      // if exists, refresh created date
      existingEntry.created_date = created_date;
    }
  }
}

export class DeviceFactory {
  static create(
    account_id: string,
    facility_id: string,
    serial_number: string,
    content_mode: contentStatusType = 'approved',
    nickname: string = '',
    product: string,
    external_nickname: string = '',
    skill_level: number = skillLevel.LEVEL_THREE,
    resident_mode: string = ''
  ): Device {
    return new Device({
      _id: UUID.UUID(),
      account_id: account_id,
      facility_id: facility_id,
      serial_number,
      skill_level,
      content_mode,
      nickname,
      external_nickname,
      product,
      resident_mode,
      status: DEVICE_STATUS_ACTIVE
    });
  }

  static createFromDevice(device: Device): Device {
    const newDevice = new Device(device);
    newDevice._rev = device._rev;
    return newDevice;
  }

  static createFromForm(form: any): Device {
    return DeviceFactory.create(
      form.account_id,
      form.facility_id,
      form.serial_number,
      form.qa_content_mode_active ? CONTENT_MODE_QA : CONTENT_MODE_APPROVED,
      form.nickname || '',
      form.product,
      form.external_nickname || '',
      form.skill_level ? parseInt(form.skill_level, 10) : skillLevel.LEVEL_THREE,
      form.resident_mode
    );
  }

  static updateFromForm(device: Device, form: any): Device {
    device.content_mode = form.qa_content_mode_active ? CONTENT_MODE_QA : CONTENT_MODE_APPROVED;
    device.nickname = form.nickname || '';
    device.external_nickname = form.external_nickname || '';
    device.product = form.product;
    device.resident_mode = form.resident_mode || DEVICE_RESIDENT_MODE_ALL;
    device.serial_number = form.serial_number;
    device.skill_level = form.skill_level ? parseInt(form.skill_level, 10) : skillLevel.LEVEL_THREE;

    return device;
  }
}
