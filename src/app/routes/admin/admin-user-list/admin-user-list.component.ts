import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { IUser, USER_STATUS_ACTIVE, USER_STATUS_INACTIVE } from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserListComponent } from '../../../shared/components/user-list/user-list.component';
import { UserService } from '../../../core/user/user.service';


@Component({
  selector: 'app-admin-user-list',
  templateUrl: './admin-user-list.component.html'
})
export class AdminUserListComponent implements OnInit {
  @ViewChild(UserListComponent) userListComponent: UserListComponent;

  accounts: Account[] = [];
  facilities: Facility[] = [];
  users: IUser[] = [];
  emails: IUser[] = [];

  constructor(
    private accountService: AccountService,
    private facilityService: FacilityService,
    private router: Router,
    private uiEventService: UiEventService,
    private userService: UserService
  ) { }

  ngOnInit() {
    // load all users
    Observable.forkJoin(
      this.accountService.getAccounts(),
      this.facilityService.getAllFacilities()
    ).flatMap(([accounts, facilities]) => {
      this.accounts = accounts;
      this.facilities = facilities;

      return this.userService.getUsersWithStatus(USER_STATUS_ACTIVE, USER_STATUS_INACTIVE);
    }).subscribe((users: IUser[]) => {
        this.users = users;
    },
    error => {
      this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
    },
    () => {
      this.userListComponent.dataIsLoaded();
    });
  }

  onEditUser(user: IUser): void {
    this.router.navigateByUrl( `/admin/user/${user._id}/edit` );
  }

  onViewUser(user: IUser): void {
    this.router.navigateByUrl( `/admin/user/${user._id}` );
  }
}
