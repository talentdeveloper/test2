import * as _ from 'lodash';

import { Component, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Account } from '../../../model/account/account';
import { Facility } from '../../../model/facility/facility';
import {
  IUser,
  USER_TYPE_IN2L_ADMIN,
  USER_TYPE_IN2L,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_FACILITY_USER,
  USER_STATUS_ACTIVE,
  USER_STATUS_INACTIVE,
  USER_STATUS_INVITED
} from '../../../model/user/user';
import { UserService } from '../../../core/user/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styles: [
    '.action-cell { width: 150px }',
    '.profile-img-cell { width: 60px; padding-right: 0 }',
    '.status-cell { width: 80px }',
    '.email-cell { width: 100px }',
    '.type-cell { width: 120px }'
  ]
})
export class UserListComponent implements OnChanges {
  @Input() users: IUser[];
  @Input() accounts: Account[] = [];
  @Input() facilities: Facility[] = [];
  @Input() showAccountColumn = false;
  @Input() showAccountStatusColumn = false;
  @Input() showEditButton = false;
  @Input() showFacilityColumn = false;
  @Input() showViewButton = false;
  @Output() onEditUser: EventEmitter<IUser> = new EventEmitter<IUser>();
  @Output() onViewUser: EventEmitter<IUser> = new EventEmitter<IUser>();
  @Input() showEmailColumn = false;

  dataLoaded = false;
  filteredUsers: IUser[] = [];
  search = '';

  constructor(private userService: UserService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['users']) {
      this.filteredUsers = this.users.sort((a, b) => a.last_name.localeCompare(b.last_name));
    }
  }

  dataIsLoaded() {
    this.dataLoaded = true;
  }

  filterUsers() {
    if (this.search.length) {
      const searchPhrase = this.search.toLowerCase();

      this.filteredUsers = this.users.filter(user => {
        const textToSearch = [
          `${user.last_name} ${user.first_name}`,
          `${user.first_name} ${user.last_name}`,
          user.accountTypeName().replace(' User', '')
        ];

        if (this.showAccountColumn) {
          const accountName = this.getAccountName(user);
          if (accountName) {
            textToSearch.push(accountName);
          }
        }

        if (this.showEmailColumn) {
          const userEmail = this.getEmailForUser(user);
          if (userEmail) {
            textToSearch.push(userEmail);
          }
        }

        if (this.showFacilityColumn) {
          const facilityNames = this.getFacilityNames(user);
          if (facilityNames) {
            textToSearch.push(facilityNames);
          }
        }

        if (this.showAccountStatusColumn) {
          textToSearch.push(user.status);
        }

        return textToSearch
          .join(' ')
          .toLowerCase()
          .includes(searchPhrase);
      });
    } else {
      this.filteredUsers = this.users;
    }
  }

  getAccountName(user: IUser): string {
    if (!user.account_id) {
      return '';
    }

    const usersAccount = this.getAccountForUser(user);
    return usersAccount && usersAccount.profile ? usersAccount.profile.account_name : '';
  }

  getFacilityNames(user: IUser): string {
    if (!user.facility_ids || !user.facility_ids.length) {
      return '';
    }

    const usersAccount = this.getAccountForUser(user);
    if (!usersAccount) {
      return '';
    }

    return this.facilities
      .filter(f => (user.facility_ids || []).includes(f._id))
      .map(f => _.get(f, 'profile.name', ''))
      .join(', ');
  }

  getAccountForUser(user: IUser): Account {
    if (user.account_id) {
      const usersAccount = this.accounts.find(account => account._id === user.account_id);

      if (usersAccount) {
        return usersAccount;
      }
    }

    return null;
  }

  getEmailForUser(user: IUser): string {
    return user.email || '';
  }

  profileImageForUser(user: IUser): string {
    return this.userService.getUserProfileImagePath(user);
  }

  userIsActive(user: IUser): boolean {
    return user.status === USER_STATUS_ACTIVE;
  }

  userIsInactive(user: IUser): boolean {
    return user.status === USER_STATUS_INACTIVE;
  }

  userIsInvited(user: IUser): boolean {
    return user.status === USER_STATUS_INVITED;
  }

  userTypeName(user: IUser): string {
    switch (user.type) {
      case USER_TYPE_IN2L_ADMIN:
        return 'iN2L Admin';
      case USER_TYPE_IN2L:
        return 'iN2L User';
      case USER_TYPE_ACCOUNT_ADMIN:
        return 'Account Admin';
      case USER_TYPE_FACILITY_ADMIN:
        return 'Community Admin';
      case USER_TYPE_FACILITY_USER:
        return 'Community User';
      default:
        return '';
    }
  }

  handleEditUserClick(e, user) {
    this.onEditUser.emit(user);
  }

  handleViewUserClick(e, user) {
    this.onViewUser.emit(user);
  }
}
