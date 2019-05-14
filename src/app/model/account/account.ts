import * as _ from 'lodash';

import { DocTypeConstants } from '../../constants';
import { AccountBillingProfile, AccountBillingProfileFactory } from './account-billing-profile';
import { AccountProfile, AccountProfileFactory } from './account-profile';
import { ISyncGatewayModel, SyncGatewayModel } from '../sync-gateway/sync-gateway-model';

// --- define account model ---

export interface IAccount extends ISyncGatewayModel {
  billing?: AccountBillingProfile;
  profile?: AccountProfile;
  type?: string;
  doc_type?: string;
}

export class Account extends SyncGatewayModel implements IAccount {
  billing: AccountBillingProfile;
  profile: AccountProfile;
  doc_type = DocTypeConstants.DOC_TYPES.ACCOUNT.ACCOUNT;
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;

  constructor(data: IAccount = {}) {
    super(
      data._id,
      data._rev,
      null,
      data.created_by,
      data.created_date,
      data.modified_by,
      data.modified_date
    );
    this.billing = data.billing || new AccountBillingProfile();
    this.profile = data.profile || new AccountProfile();
    this.created_by = data.created_by || '';
    this.created_date = data.created_date || '';
    this.modified_by = data.modified_by || '';
    this.modified_date = data.modified_date || '';
  }
}

// --- create an account factory for building a new account --

export class AccountFactory {
  createAccountFromFormValues(form): Account {
    const account = new Account();

    if (!form) {
      return account;
    }

    if (form._id) {
      account._id = form._id;
    }

    if (form._rev) {
      account._rev = form._rev;
    }

    if (form.billing) {
      const accountBillingProfileFactory = new AccountBillingProfileFactory();
      const accountBilling = accountBillingProfileFactory.createAccountBillingProfileFromFormValues(
        form.billing
      );
      account.billing = accountBilling;
    }

    if (form.profile) {
      const accountProfileFactory = new AccountProfileFactory();
      const accountProfile = accountProfileFactory.createAccountProfileFromFormValues(form.profile);
      account.profile = accountProfile;
    }

    return account;
  }
}
