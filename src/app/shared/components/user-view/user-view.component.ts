import * as _ from 'lodash';

import {
  Component,
  AfterViewInit,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  EventEmitter
} from '@angular/core';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import {
  IUser,
  USER_STATUS_ACTIVE,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_FACILITY_USER
} from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserService } from '../../../core/user/user.service';
import { RoleService, IPermissions } from '../../../core/role/role.service';
import { ROLE_CHANGE_USER_TYPE } from '../../../model/role/role';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styles: ['.type-cell { width: 160px }', '.action-cell { width: 140px }']
})
export class UserViewComponent implements OnChanges {
  @Input() user: IUser | undefined; // needs to be defined this way to avoid WARNING: export 'IUser' was not found
  @Input() showChangePasswordButton = false;
  @Input() showEditButton = false;
  @Input() showSendResetButton = false;
  @Input() showUserStateButton = false;
  @Output() onChangePassword: EventEmitter<IUser> = new EventEmitter<IUser>();
  @Output() onEditUser: EventEmitter<IUser> = new EventEmitter<IUser>();
  @Output() onSendUserReset: EventEmitter<IUser> = new EventEmitter<IUser>();
  @Output() onUserStateChange: EventEmitter<IUser> = new EventEmitter<IUser>();

  accountName: string;
  facilityNames: string;
  permissions: IPermissions;

  userResidents: Resident[];

  dataLoaded = false;

  constructor(
    private accountService: AccountService,
    private authenticationService: AuthenticationService,
    private facilityService: FacilityService,
    private uiEventService: UiEventService,
    private residentService: ResidentService,
    private userService: UserService,
    private roleService: RoleService
  ) {
    this.permissions = this.roleService.currentUserPermissionsObject([
      { keyName: 'changeUserType', role: ROLE_CHANGE_USER_TYPE }
    ]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && this.user) {
      this.user.resident_ids = this.user.resident_ids || [];
      (this.user.resident_ids.length
        ? this.residentService.getAllResidents()
        : Observable.of([])
      ).subscribe((residents: Resident[]) => {
        this.userResidents = residents.filter(r => this.user.resident_ids.includes(r._id));
        this.loadUserAccountData();
      });
    }
  }

  dataIsLoaded() {
    this.dataLoaded = true;
  }

  userIsActive(): boolean {
    return this.user.status === USER_STATUS_ACTIVE;
  }

  hasPin(): boolean {
    return (
      (this.user.type === USER_TYPE_FACILITY_ADMIN || this.user.type === USER_TYPE_FACILITY_USER) &&
      !!this.user.pin
    );
  }

  isFacilityUser(): boolean {
    return this.user.type === USER_TYPE_FACILITY_USER;
  }

  handleChangePasswordClick(e, user) {
    this.onChangePassword.emit(user);
  }

  handleUserStateClick(e, user: IUser): void {
    if (user.status === USER_STATUS_ACTIVE) {
      this.disableUser(user);
    } else {
      this.activateUser(user);
    }
  }

  handleEditUserClick(e, user) {
    this.onEditUser.emit(user);
  }

  handleSendUserResetClick(e, user) {
    this.authenticationService.resetPassword(user.email).subscribe(
      result => {
        if (result.success && result.message) {
          this.uiEventService.dispatch(
            new ToasterMessage({
              body: `Instructions for password reset have been sent to ${user.email}`,
              type: 'success'
            })
          );
        } else {
          this.showErrorMessage('We could not reset your password because of an unknown error.');
        }
      },
      error => {
        this.showErrorMessage(this.authenticationService.processResetPasswordError(error));
      }
    );
    this.onSendUserReset.emit(user);
  }

  userImageSrc() {
    return this.userService.getUserProfileImagePath(this.user);
  }

  resetPin() {
    this.user.has_temporary_pin = true;
    this.user.pin = _.padStart(_.random(99999).toString(), 5, '0');
    this.userService.updateUser(this.user).subscribe(
      (updatedUser: IUser) => {
        this.user = updatedUser;
        this.onUserStateChange.emit(updatedUser);
        const message = `This Communit User's password has been reset to a temp password: ${
          this.user.pin
        }`;
        this.uiEventService.dispatch(
          new ToasterMessage({
            body: message,
            type: 'info'
          })
        );
      },
      error => {
        this.showErrorMessage(error);
      }
    );
  }

  private loadUserAccountData() {
    const hasAccountTypes = [USER_TYPE_ACCOUNT_ADMIN, USER_TYPE_FACILITY_ADMIN];

    if (hasAccountTypes.includes(this.user.type) && this.user.account_id) {
      this.accountService
        .getAccount(this.user.account_id)
        .subscribe(
          (account: Account) => (this.accountName = account.profile.account_name),
          error => this.showErrorMessage('Could not load account information.')
        );
    }

    // see if we should include community info
    if (this.user.type === USER_TYPE_FACILITY_ADMIN && this.user.facility_ids.length) {
      this.facilityService.getAllFacilities().subscribe(
        (facilities: Facility[]) => {
          this.facilityNames = facilities
            .filter(f => this.user.facility_ids.includes(f._id))
            .map(f => f.profile.name)
            .join(', ');
        },
        error => this.showErrorMessage('Could not load community information.')
      );
    }
  }

  private activateUser(user: IUser): void {
    this.userService.activateUser(user).subscribe(
      (updatedUser: IUser) => {
        this.user = updatedUser;
        this.onUserStateChange.emit(updatedUser);
        this.showSuccessMessage(
          `${this.user.first_name} ${this.user.last_name} has been activated`
        );
      },
      error => {
        this.showErrorMessage(error);
      }
    );
  }

  private disableUser(user: IUser): void {
    this.userService.disableUser(user).subscribe(
      (updatedUser: IUser) => {
        this.user = updatedUser;
        this.onUserStateChange.emit(updatedUser);
        this.showSuccessMessage(`${this.user.first_name} ${this.user.last_name} has been disabled`);
      },
      error => {
        this.showErrorMessage(error);
      }
    );
  }

  private showErrorMessage(message) {
    this.uiEventService.dispatch(new ToasterMessage({ body: message, type: 'error' }));
  }

  private showSuccessMessage(message): void {
    this.uiEventService.dispatch(new ToasterMessage({ body: message, type: 'success' }));
  }
}
