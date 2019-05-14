import { Attachment } from '../attachment/attachment';
import { ISyncGatewayModel } from '../sync-gateway/sync-gateway-model';

// --- define user model interface ---

export interface IUser extends ISyncGatewayModel {
  account_id?: string;
  email: string;
  facility_ids?: string[];
  first_name: string;
  has_temporary_pin?: boolean;
  last_name: string;
  pin?: string;
  phone?: string;
  resident_ids?: Array<string>; // holds resident_ids as strings not resident objects
  resident_mode?: string;
  status: string;
  title?: string;
  type: string;
  _attachments?: Map<string, Attachment>;
  _id?: string;
  _rev?: string;

  hasProfileImage(): boolean;
  shouldCollectPhoneNumber(): boolean;
  accountTypeName(): string;
}

// --- define type constants ---

export const USER_STATUS_INVITED = 'invited';
export const USER_STATUS_ACTIVE = 'active';
export const USER_STATUS_INACTIVE = 'inactive';

export const USER_TYPE_IN2L_ADMIN = 'in2l-admin';
export const USER_TYPE_IN2L = 'in2l';
export const USER_TYPE_ACCOUNT_ADMIN = 'account-admin';
export const USER_TYPE_FACILITY_ADMIN = 'facility-admin';
export const USER_TYPE_FACILITY_USER = 'facility-user';

export const USER_RESIDENT_MODE_ALL = 'all';
export const USER_RESIDENT_MODE_SELECT = 'select';

export const UserTypes = [
  { name: 'iN2L Admin User', type: USER_TYPE_IN2L_ADMIN },
  { name: 'iN2L User', type: USER_TYPE_IN2L },
  { name: 'Account Admin User', type: USER_TYPE_ACCOUNT_ADMIN },
  { name: 'Community Admin User', type: USER_TYPE_FACILITY_ADMIN },
  { name: 'Community User', type: USER_TYPE_FACILITY_USER }
];

export const USER_PROFILE_IMAGE_FILENAME = 'profile_image';

// --- define abstract base user and base facility user models ---

export abstract class BaseUser implements IUser {
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  type: string;
  _id?: string;
  _rev?: string;
  _attachments?: Map<string, Attachment>;

  constructor(
    email: string = '',
    first_name: string = '',
    last_name: string = '',
    status: string = '',
    type: string = '',
    _id?: string,
    _rev?: string,
    _attachments?: Map<string, Attachment>
  ) {
    this.email = email;
    this.first_name = first_name;
    this.last_name = last_name;
    this.status = status;
    this.type = type;
    this._id = _id;
    this._rev = _rev;
    this._attachments = _attachments;
  }

  hasProfileImage(): boolean {
    return this._attachments && this._attachments.has(USER_PROFILE_IMAGE_FILENAME);
  }

  // in2l-admin and in2l users do not collect phone numbers, but the rest of user types
  // do, can use this method to determine if a phone should be collected for any user type
  shouldCollectPhoneNumber(): boolean {
    return this.type !== USER_TYPE_IN2L_ADMIN && this.type !== USER_TYPE_IN2L;
  }

  accountTypeName(): string {
    const userType = UserTypes.find(type => type.type === this.type);
    return userType.name;
  }

  isIn2lAdmin(): boolean {
    return this.type === USER_TYPE_IN2L_ADMIN;
  }
}
