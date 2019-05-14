import * as _ from 'lodash';

import { Attachment } from '../../model/attachment/attachment';
import {
  IUser,
  USER_TYPE_IN2L_ADMIN,
  USER_TYPE_IN2L,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_FACILITY_USER,
  USER_STATUS_INVITED,
  USER_STATUS_ACTIVE,
  USER_RESIDENT_MODE_ALL
} from '../../model/user/user';
import { IN2LAdminUser } from '../../model/user/in2l-admin-user';
import { IN2LUser } from '../../model/user/in2l-user';
import { AccountAdminUser } from '../../model/user/account-admin-user';
import { FacilityAdminUser } from '../../model/user/facility-admin-user';
import { FacilityUser } from '../../model/user/facility-user';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';

export class UserFactoryService {
  createNewEmptyUserByType(account_type: string): IUser {
    switch (account_type) {
      case USER_TYPE_ACCOUNT_ADMIN:
        return new AccountAdminUser();
      case USER_TYPE_IN2L_ADMIN:
        return new IN2LAdminUser();
      case USER_TYPE_IN2L:
        return new IN2LUser();
      case USER_TYPE_FACILITY_ADMIN:
        return new FacilityAdminUser();
      case USER_TYPE_FACILITY_USER:
        return new FacilityUser();
      default:
        return null;
    }
  }

  createInvitedUser(
    accountType: string,
    email: string = '',
    accountId: string = '',
    facilityIds: string[] = [],
    firstName: string = '',
    lastName: string = '',
    phone: string = '',
    title: string = '',
    pin: string = '',
    isTemporaryPin: boolean = false,
    residentIds: string[] = [],
    residentMode: string = USER_RESIDENT_MODE_ALL
  ) {
    const user = this.createNewEmptyUserByType(accountType);

    user.status =
      accountType === USER_TYPE_FACILITY_USER ? USER_STATUS_ACTIVE : USER_STATUS_INVITED;
    user.email = email;

    user.account_id = accountId;
    user.facility_ids = facilityIds;
    user.first_name = firstName;
    user.last_name = lastName;
    user.phone = phone;
    user.title = title;
    user.pin = pin;
    user.has_temporary_pin = isTemporaryPin;
    user.resident_ids = residentIds;
    user.resident_mode = residentMode;

    return user;
  }

  createUserFromCouchbaseResult(result: IUser): IUser {
    const user = this.createNewEmptyUserByType(result.type);
    if (!user) {
      return null;
    }

    _.merge(user, result);

    // convert attachments into a string => attachment Map
    if (result._attachments) {
      const attachmentMap = new Map<string, Attachment>();
      for (const key in result._attachments) {
        if (result._attachments.hasOwnProperty(key)) {
          attachmentMap.set(key, <Attachment>result._attachments[key]);
        }
      }

      user._attachments = attachmentMap;
    }

    return user;
  }

  updateUserFromFormValues(user: IUser, form): IUser {
    if (form.email) {
      user.email = form.email;
    }

    if (form.first_name) {
      user.first_name = form.first_name;
    }

    if (form.last_name) {
      user.last_name = form.last_name;
    }

    if (form.phone && user.shouldCollectPhoneNumber()) {
      user.phone = form.phone;
    }

    if (user.type === USER_TYPE_FACILITY_ADMIN || user.type === USER_TYPE_FACILITY_USER) {
      user.pin = form.pin;
    }

    // optional field, default to blank
    user.title = form.title || '';

    if (user.type === USER_TYPE_FACILITY_USER) {
      user.resident_mode = form.resident_mode;
      user.resident_ids = user.resident_mode === USER_RESIDENT_MODE_ALL ? [] : form.resident_ids;
    }

    return user;
  }
}
