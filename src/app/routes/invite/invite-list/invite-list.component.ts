import { Component, OnInit } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { InviteService } from '../../../core/invite/invite.service';
import { IUser, USER_STATUS_ACTIVE } from '../../../model/user/user';
import { LoaderService } from '../../../core/loader/loader.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserService } from '../../../core/user/user.service';

const COMPONENT_NAME = 'change-password';

@Component({
  selector: 'app-invite-list',
  templateUrl: './invite-list.component.html',
  styles: [ '.action-cell { width: 140px }' ]
})
export class InviteListComponent implements OnInit {

  accounts: Account[];
  facilities: Facility[];
  users: IUser[];
  dataLoaded = false;
  filteredUsers: IUser[] = [];
  search = '';

  constructor(
    private accountService: AccountService,
    private facilityService: FacilityService,
    private inviteService: InviteService,
    private uiEventService: UiEventService,
    private userService: UserService,
    private loaderService: LoaderService
  ) { }

  ngOnInit() {
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.accountService.getAccounts(),
      this.facilityService.getAllFacilities()
    ).flatMap(([accounts, facilities]) => {
      this.accounts = accounts;
      this.facilities = facilities;

      return this.userService.getInvitedUsers();
    }).subscribe((users: IUser[]) => {
      this.users = users.sort((a, b) => a.email.localeCompare(b.email));
      this.filteredUsers = this.users;
      this.loaderService.stop(COMPONENT_NAME);
      this.dataLoaded = true;
    },
    error => {
      this.loaderService.stop(COMPONENT_NAME);
      this.dataLoaded = true;
      this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
    });
  }

  accountNameForUser(user: IUser): string {
    if (!user.account_id) {
      return '';
    }

    const account = this.accounts.find(a => a._id === user.account_id);
    return account ? account.profile.account_name : '';
  }

  facilityNamesForUser(user: IUser): string {
    return this.facilities
      .filter(f => user.facility_ids && user.facility_ids.includes(f._id))
      .map(f => f.profile.name).join(', ');
  }

  filterUsers() {
    if (this.search.length) {
      const searchPhrase = this.search.toLowerCase();

      this.filteredUsers = this.users.filter(user => {
        const textToSearch = user.email;
        return textToSearch.toLowerCase().includes(searchPhrase);
      });
    } else {
      this.filteredUsers = this.users;
    }
  }

  handleDeleteInviteClick(e, user) {
    this.loaderService.start(COMPONENT_NAME);

    // let make sure user is not already an active user
    // this can happen is user complete's invitation in between page load time, and delete buton click
    this.userService.getUser( user._id )
      .flatMap((updatedUser: IUser) => {
        if (updatedUser.status === USER_STATUS_ACTIVE) {
          this.removeUserFromList(user);
          return Observable.throw(`Could not delete this invite because ${user.email} is now an active user`);
        }

        return this.inviteService.deleteInvite(user);
      })
      .subscribe(
        result => {
          if (result) {
            this.removeUserFromList(user);

            this.uiEventService.dispatch(
              new ToasterMessage({ body: `The invite for ${user.email} has been deleted`, type: 'success' })
            );
          } else {
            this.uiEventService.dispatch( new ToasterMessage({
              body: `The invite for ${user.email} was not deleted`,
              type: 'error'
            }) );
          }

          this.loaderService.stop(COMPONENT_NAME);
        },
        error => {
          this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
          this.loaderService.stop(COMPONENT_NAME);
        }
      );
  }

  cleanEmail(email): string {
    return email.replace(/[\.@+]/g, '_');
  }

  private removeUserFromList(user: IUser): void {
    // remove user from array
    const index = this.users.findIndex(findUser => findUser._id === user._id);
    this.users.splice(index, 1);

    // re-run filter users, will assign filterUsers properly based on search state
    this.filterUsers();
  }
}
