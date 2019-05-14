import { Attachment } from '../attachment/attachment';
import { BaseUser, USER_TYPE_FACILITY_ADMIN } from './user';


export class FacilityAdminUser extends BaseUser {
  account_id: string;
  facility_ids: string[];
  has_temporary_pin: boolean;
  pin: string;
  phone: string;
  title: string;
  type: string = USER_TYPE_FACILITY_ADMIN;

  constructor(
    account_id: string = '',
    email: string = '',
    facility_ids: string[] = [],
    first_name: string = '',
    has_temporary_pin = false,
    last_name: string = '',
    pin: string = '',
    phone: string = '',
    status: string = '',
    title: string = '',
    _id?: string,
    _rev?: string,
    _attachments?: Map<string, Attachment>
  ) {
    super(email, first_name, last_name, status, USER_TYPE_FACILITY_ADMIN, _id, _rev, _attachments);
    
    this.account_id = account_id;
    this.facility_ids = facility_ids;
    this.has_temporary_pin = has_temporary_pin;
    this.pin = pin;
    this.phone = phone;
    this.title = title;
  }
}
