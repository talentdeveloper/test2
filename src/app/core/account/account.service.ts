import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DocTypeConstants } from '../../constants';
import { Account, AccountFactory } from '../../model/account/account';
import { AuthenticationService } from '../../core/authentication/authentication.service';
import { ConnectApiBaseService } from '../connect-api/connect-api-base.service';
import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { PortalAPIService } from '../../core/portal-api/portal-api.service';
import { SyncGatewayService, ACCOUNT_BUCKET } from '../../core/sync-gateway/sync-gateway.service';
import { UiEventService } from '../ui-event-service/ui-event-service';

@Injectable()
export class AccountService extends ConnectApiBaseService {
  private accounts: Account[] = null;
  private getAllAccountsObservable: Observable<Account[]> = null;
  private refreshCache = false;

  constructor(
    http: Http,
    private authenticationService: AuthenticationService,
    private portalAPIService: PortalAPIService,
    private syncGatewayService: SyncGatewayService,
    private uiEventService: UiEventService
  ) {
    super(http);

    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      if (clearCacheMessage.clearAllCaches || clearCacheMessage.bucket === ACCOUNT_BUCKET) {
        this.clearCache();
      }
    });
  }

  clearCache() {
    this.refreshCache = true;
    this.getAllAccountsObservable = null;
  }

  getAccount(accountId: string): Observable<Account> {
    return this.getAccounts().flatMap(() =>
      Observable.of(this.accounts.find(a => a._id === accountId))
    );
  }

  getRawAccount(accountId: string): Observable<Account> {
    return this.syncGatewayService
      .sendGetDocumentRequest(ACCOUNT_BUCKET, accountId)
      .flatMap((account: Account) => {
        return this.updateCache(
          accountId,
          this.createAccountFromCouchbaseResult(account),
          account._rev
        );
      });
  }

  getRawAccounts(): Observable<Account[]> {
    this.clearCache();
    return this.getAccounts();
  }

  getAccounts(): Observable<Account[]> {
    if (!this.refreshCache && this.accounts && this.accounts.length) {
      return Observable.of(this.accounts);
    }

    if (!this.refreshCache && this.getAllAccountsObservable) {
      return this.getAllAccountsObservable;
    }

    this.getAllAccountsObservable = this.syncGatewayService
      .getAll(ACCOUNT_BUCKET)
      .flatMap((results: any[]) => {
        this.refreshCache = false;

        this.accounts = results
          .filter(d => d.doc_type === DocTypeConstants.DOC_TYPES.ACCOUNT.ACCOUNT)
          .map(item => this.createAccountFromCouchbaseResult(item));

        this.getAllAccountsObservable = null;

        return Observable.of(this.accounts);
      })
      .share();

    return this.getAllAccountsObservable;
  }

  getAccountsWithIds(accountIds: string[]): Observable<Account[]> {
    return this.getAccounts().flatMap(() => {
      return Observable.of(this.accounts.filter(a => accountIds.includes(a._id)));
    });
  }

  createAccount(account: Account): Observable<Account> {
    const accountId = account.billing.id;
    account._id = accountId;

    account.created_date = SyncGatewayService.formatDateForCouchbase();
    account.created_by = this.authenticationService.getCurrentUserDocumentChangedByValue();
    account.modified_date = SyncGatewayService.formatDateForCouchbase();
    account.modified_by = this.authenticationService.getCurrentUserDocumentChangedByValue();

    return this.http
      .post(`${this.connectApiUrl}/portal/accounts`, account, this.getHttpOptions())
      .mergeMap((response: Response) => {
        const newAccount = new AccountFactory().createAccountFromFormValues(response.json());

        return this.updateCache(newAccount._id, newAccount, newAccount._rev);
      });
  }

  updateAccount(account: Account): Observable<Account> {
    // clean up existing ids that may have whitespace
    if (account.profile && account.profile.crm_id) {
      account.profile.crm_id = account.profile.crm_id.trim();
    }

    account.modified_date = SyncGatewayService.formatDateForCouchbase();
    account.modified_by = this.authenticationService.getCurrentUserDocumentChangedByValue();

    return this.syncGatewayService
      .sendUpdateDocumentRequest(ACCOUNT_BUCKET, account)
      .flatMap(result => {
        return this.updateCache(result.id, account, result.rev);
      });
  }

  updateCache(itemId: string, newItem: any, rev: string): Observable<Account> {
    if (this.accounts) {
      const oldItem = this.accounts.find(a => a._id === itemId) || new Account();

      const oldRev = Number((oldItem._rev || '0').split('-')[0]);
      const newRev = Number((rev || '0').split('-')[0]);
      const latestRev = newRev > oldRev ? rev : oldItem._rev;

      if (oldItem._id) {
        _.merge(oldItem, newItem);
        oldItem._rev = latestRev;
      } else {
        newItem._rev = latestRev;
        this.accounts.push(newItem);
      }
    }

    return this.getAccount(itemId);
  }

  corporateNames() {
    return [
      { id: null, name: 'Please Select' },
      { id: 1, name: 'Corporation 1' },
      { id: 2, name: 'Corporation 2' },
      { id: 3, name: 'Corporation 3' }
    ];
  }

  countryOptions() {
    return [
      { value: null, name: 'Please Select' },
      { value: 'United States', name: 'United States' },
      { value: 'Canada', name: 'Canada' }
    ];
  }

  stateOptions() {
    return [
      { name: 'Please Select', abbreviation: null },
      { name: 'Alabama', abbreviation: 'AL' },
      { name: 'Alaska', abbreviation: 'AK' },
      { name: 'Arizona', abbreviation: 'AZ' },
      { name: 'Arkansas', abbreviation: 'AR' },
      { name: 'California', abbreviation: 'CA' },
      { name: 'Colorado', abbreviation: 'CO' },
      { name: 'Connecticut', abbreviation: 'CT' },
      { name: 'Delaware', abbreviation: 'DE' },
      { name: 'District of Columbia', abbreviation: 'DC' },
      { name: 'Florida', abbreviation: 'FL' },
      { name: 'Georgia', abbreviation: 'GA' },
      { name: 'Hawaii', abbreviation: 'HI' },
      { name: 'Idaho', abbreviation: 'ID' },
      { name: 'Illinois', abbreviation: 'IL' },
      { name: 'Indiana', abbreviation: 'IN' },
      { name: 'Iowa', abbreviation: 'IA' },
      { name: 'Kansas', abbreviation: 'KS' },
      { name: 'Kentucky', abbreviation: 'KY' },
      { name: 'Louisiana', abbreviation: 'LA' },
      { name: 'Maine', abbreviation: 'ME' },
      { name: 'Maryland', abbreviation: 'MD' },
      { name: 'Massachusetts', abbreviation: 'MA' },
      { name: 'Michigan', abbreviation: 'MI' },
      { name: 'Minnesota', abbreviation: 'MN' },
      { name: 'Mississippi', abbreviation: 'MS' },
      { name: 'Missouri', abbreviation: 'MO' },
      { name: 'Montana', abbreviation: 'MT' },
      { name: 'Nebraska', abbreviation: 'NE' },
      { name: 'Nevada', abbreviation: 'NV' },
      { name: 'New Hampshire', abbreviation: 'NH' },
      { name: 'New Jersey', abbreviation: 'NJ' },
      { name: 'New Mexico', abbreviation: 'NM' },
      { name: 'New York', abbreviation: 'NY' },
      { name: 'North Carolina', abbreviation: 'NC' },
      { name: 'North Dakota', abbreviation: 'ND' },
      { name: 'Ohio', abbreviation: 'OH' },
      { name: 'Oklahoma', abbreviation: 'OK' },
      { name: 'Oregon', abbreviation: 'OR' },
      { name: 'Pennsylvania', abbreviation: 'PA' },
      { name: 'Rhode Island', abbreviation: 'RI' },
      { name: 'South Carolina', abbreviation: 'SC' },
      { name: 'South Dakota', abbreviation: 'SD' },
      { name: 'Tennessee', abbreviation: 'TN' },
      { name: 'Texas', abbreviation: 'TX' },
      { name: 'Utah', abbreviation: 'UT' },
      { name: 'Vermont', abbreviation: 'VT' },
      { name: 'Virginia', abbreviation: 'VA' },
      { name: 'Washington', abbreviation: 'WA' },
      { name: 'West Virginia', abbreviation: 'WV' },
      { name: 'Wisconsin', abbreviation: 'WI' },
      { name: 'Wyoming', abbreviation: 'WY' }
    ];
  }

  canadianProvinces() {
    return [
      { abbreviation: null, name: 'Please Select' },
      { abbreviation: 'AB', name: 'Alberta' },
      { abbreviation: 'BC', name: 'British Columbia' },
      { abbreviation: 'MB', name: 'Manitoba' },
      { abbreviation: 'NB', name: 'New Brunswick', country: 'CA' },
      { abbreviation: 'NL', name: 'Newfoundland and Labrador' },
      { abbreviation: 'NS', name: 'Nova Scotia' },
      { abbreviation: 'NU', name: 'Nunavut' },
      { abbreviation: 'NT', name: 'Northwest Territories' },
      { abbreviation: 'ON', name: 'Ontario' },
      { abbreviation: 'PE', name: 'Prince Edward Island' },
      { abbreviation: 'QC', name: 'Quebec' },
      { abbreviation: 'SK', name: 'Saskatchewan' },
      { abbreviation: 'YT', name: 'Yukon' }
    ];
  }

  // Billing Dropdown Values
  billingStatusOptions() {
    return [
      { value: null, name: 'Please Select' },
      { value: 'Active', name: 'Active' },
      { value: 'Inactive', name: 'Inactive' }
    ];
  }

  billingFrequencyOptions() {
    return [
      { value: null, name: 'Please Select' },
      { value: 'Monthly', name: 'Monthly' },
      { value: 'Quarterly', name: 'Quarterly' },
      { value: 'Semi-Annually', name: 'Semi-Annually' },
      { value: 'Annually', name: 'Annually' },
      { value: '2-Year', name: '2-Year' }
    ];
  }

  // Facility Methods
  facilityStatuses() {
    return [
      { name: 'Please Select', value: null },
      { name: 'Active', value: 'Active' },
      { name: 'Cancel', value: 'Cancel' },
      { name: 'On Hold', value: 'On Hold' },
      { name: 'Suspended', value: 'Suspended' }
    ];
  }

  private createAccountFromCouchbaseResult(result): Account {
    const account = new Account();
    if (result.id && result.value) {
      result.value._id = result.id;
      _.merge(account, result.value);
    } else {
      _.merge(account, result);
    }

    return account;
  }
}
