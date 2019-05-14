import * as _ from 'lodash';
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { SidebarResourceGroupComponent } from '../sidebar-resource-group/sidebar-resource-group.component';
import { SidebarService } from '../sidebar.service';
import {
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_IN2L_ADMIN
} from '../../../model/user/user';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

@Component({
  selector: 'app-sidebar-accounts-group',
  templateUrl: '../sidebar-resource-group/sidebar-resource-group.component.html',
  styleUrls: ['../sidebar-resource-group/sidebar-resource-group.component.scss']
})
export class SidebarAccountsGroupComponent extends SidebarResourceGroupComponent {
  singleAccountUserTypes = [USER_TYPE_ACCOUNT_ADMIN, USER_TYPE_FACILITY_ADMIN];

  constructor(
    private authenticationService: AuthenticationService,
    private accountService: AccountService,
    protected sidebarService: SidebarService,
    protected router: Router,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {
    super(sidebarService, router, uiEventService, loaderService);
  }

  resolveResource(): Observable<Account[]> {
    const currentUser = this.authenticationService.currentUser().getValue();

    if (
      !currentUser ||
      ![USER_TYPE_IN2L_ADMIN, USER_TYPE_ACCOUNT_ADMIN, USER_TYPE_FACILITY_ADMIN].includes(
        currentUser.type
      )
    ) {
      return Observable.of([]);
    }

    if (_.includes(this.singleAccountUserTypes, currentUser.type)) {
      if (currentUser.account_id) {
        return this.accountService
          .getAccount(currentUser.account_id)
          .flatMap(account => Observable.of([account]));
      } else {
        // user of these types should have an account id, if the data is missing for
        // some reason, fallback to an empty array instead of showing all accounts which
        // these users should not have access to
        return Observable.of([]);
      }
    }

    return this.accountService.getAccounts().flatMap((accounts: Account[]) => {
      const sortedAccounts = accounts.sort((a: Account, b: Account) => {
        const aName: string = _.get(a, 'profile.account_name', '')
          .trim()
          .toLowerCase();
        const bName: string = _.get(b, 'profile.account_name', '')
          .trim()
          .toLowerCase();
        return aName.localeCompare(bName);
      });
      return Observable.of(sortedAccounts);
    });
  }
}
