import { Attachment } from '../attachment/attachment';
import { BaseUser, USER_TYPE_FACILITY_USER, USER_RESIDENT_MODE_ALL, USER_RESIDENT_MODE_SELECT } from './user';
import { FacilityAdminUser } from './facility-admin-user';

export class FacilityUser extends FacilityAdminUser {
  type: string = USER_TYPE_FACILITY_USER;
  resident_ids: string[] = [];
  resident_mode: string = USER_RESIDENT_MODE_ALL;

  constructor(
    account_id: string = '',
    email: string = '',
    facility_ids: string[] = [],
    first_name: string = '',
    has_temporary_pin: boolean = false,
    last_name: string = '',
    pin: string = '',
    phone: string = '',
    resident_ids: string[] = [],
    resident_mode: string = USER_RESIDENT_MODE_ALL,
    status: string = '',
    title: string = '',
    _id?: string,
    _rev?: string,
    _attachments?: Map<string, Attachment>
  ) {
    super(account_id, email, facility_ids, first_name, has_temporary_pin, last_name, pin, phone, status, title, _id, _rev, _attachments);
    this.resident_ids = resident_ids || [];
    this.resident_mode = resident_mode || USER_RESIDENT_MODE_ALL;
  }

  getResidentModeName() {
    switch (this.resident_mode) {
      case USER_RESIDENT_MODE_ALL:
        return 'All Residents';
      case USER_RESIDENT_MODE_SELECT:
        return 'Selected Residents';
    }

    return '';
  }
}
