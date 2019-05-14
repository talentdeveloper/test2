import {
  IUser,
  USER_TYPE_IN2L_ADMIN,
  USER_TYPE_IN2L,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN
} from '../../model/user/user';

// -- define roles ---

export const ROLE_ADD_ACCOUNT = 'add_account';
export const ROLE_DELETE_ACCOUNT = 'delete_account';
export const ROLE_EDIT_ACCOUNT = 'edit_account';
export const ROLE_VIEW_ACCOUNT = 'view_account';

export const ROLE_ADD_FACILITY = 'add_facility';
export const ROLE_DELETE_FACILITY = 'delete_facility';
export const ROLE_EDIT_FACILITY = 'edit_facility';
export const ROLE_VIEW_FACILITY = 'view_facility';

export const ROLE_ADD_RESIDENT = 'add_resident';
export const ROLE_DELETE_RESIDENT = 'delete_resident';
export const ROLE_EDIT_RESIDENT = 'edit_resident';
export const ROLE_VIEW_RESIDENT = 'view_resident';
export const ROLE_MOVE_RESIDENT = 'move_resident';

export const ROLE_ADD_DEVICE = 'add_device';
export const ROLE_DELETE_DEVICE = 'delete_device';
export const ROLE_EDIT_DEVICE = 'edit_device';
export const ROLE_VIEW_DEVICE = 'view_device';
export const ROLE_ASSIGN_DEVICE = 'assign_device'; // assign to a resident
export const ROLE_EDIT_DEVICE_CONTENT_MODE = 'edit_device_content_mode'; // allow user to edit QA content
export const ROLE_EDIT_DEVICE_INTERNAL_NICKNAME = 'edit_device_internal_nickname'; // allow user to edit internal device nickname
export const ROLE_EDIT_DEVICE_SERIAL_NUMBER = 'edit_device_serial_number';
export const ROLE_EDIT_DEVICE_TERMS = 'edit_device_terms'; // allow user to edit QA content
export const ROLE_MOVE_DEVICE = 'move_device';

export const ROLE_ADD_FACILITY_STAFF = 'add_facility_staff';
export const ROLE_DELETE_FACILITY_STAFF = 'delete_facility_staff';
export const ROLE_EDIT_FACILITY_STAFF = 'edit_facility_staff';
export const ROLE_VIEW_FACILITY_STAFF = 'view_facility_staff';

export const ROLE_ADD_CONTENT = 'add_content';
export const ROLE_DELETE_CONTENT = 'delete_content';
export const ROLE_EDIT_CONTENT = 'edit_content';
export const ROLE_VIEW_CONTENT = 'view_content';

export const ROLE_NOTIFY_ACCOUNT_RESIDENTS = 'notify_account_residents';
export const ROLE_NOTIFY_FACILITY_RESIDENTS = 'notify_facility_residents';
export const ROLE_NOTIFY_RESIDENT = 'notify_resident';

export const ROLE_ADMIN_SEND_INVITES = 'send_invites'; // add users
export const ROLE_ADMIN_MANAGE_INVITES = 'manage_invites';

export const ROLE_ADMIN_USERS = 'admin_users'; // in2l-admin only
export const ROLE_VIEW_DEVICE_STATUS = 'view_device_status';
export const ROLE_CHANGE_USER_TYPE = 'change_user_type';

// --- build user roles array by user type ---

const userRoles = {};

userRoles[USER_TYPE_IN2L] = [
  ROLE_ADD_CONTENT,
  ROLE_DELETE_CONTENT,
  ROLE_EDIT_CONTENT,
  ROLE_VIEW_CONTENT
];

userRoles[USER_TYPE_ACCOUNT_ADMIN] = [
  ROLE_EDIT_ACCOUNT,
  ROLE_VIEW_ACCOUNT,
  ROLE_EDIT_FACILITY,
  ROLE_VIEW_FACILITY,
  ROLE_ADD_RESIDENT,
  ROLE_DELETE_RESIDENT,
  ROLE_EDIT_RESIDENT,
  ROLE_VIEW_RESIDENT,
  ROLE_ADD_FACILITY_STAFF,
  ROLE_DELETE_FACILITY_STAFF,
  ROLE_EDIT_FACILITY_STAFF,
  ROLE_VIEW_FACILITY_STAFF,
  ROLE_EDIT_DEVICE,
  ROLE_VIEW_DEVICE,
  ROLE_ASSIGN_DEVICE,
  ROLE_NOTIFY_ACCOUNT_RESIDENTS,
  ROLE_NOTIFY_FACILITY_RESIDENTS,
  ROLE_NOTIFY_RESIDENT,
  ROLE_MOVE_RESIDENT,
  ROLE_CHANGE_USER_TYPE
];

userRoles[USER_TYPE_FACILITY_ADMIN] = [
  ROLE_VIEW_FACILITY,
  ROLE_ADD_FACILITY_STAFF,
  ROLE_EDIT_FACILITY_STAFF,
  ROLE_VIEW_FACILITY_STAFF,
  ROLE_ADD_RESIDENT,
  ROLE_EDIT_RESIDENT,
  ROLE_VIEW_RESIDENT,
  ROLE_NOTIFY_FACILITY_RESIDENTS,
  ROLE_NOTIFY_RESIDENT,
  ROLE_EDIT_DEVICE,
  ROLE_VIEW_DEVICE,
  ROLE_ASSIGN_DEVICE,
  ROLE_NOTIFY_FACILITY_RESIDENTS,
  ROLE_NOTIFY_RESIDENT
];

export const UserTypeRoles = userRoles;
