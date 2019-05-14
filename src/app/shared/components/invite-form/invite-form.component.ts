import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CustomValidators } from 'ng2-validation';

import { Account } from '../../../model/account/account';
import { Facility } from '../../../model/facility/facility';
import { FormUtil, BaseFormComponent } from '../../../util/FormUtil';
import { InviteService } from '../../../core/invite/invite.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { UserService } from '../../../core/user/user.service';
import { UserTypes, USER_TYPE_FACILITY_USER } from '../../../model/user/user';

const COMPONENT_NAME = 'invite-form';

@Component({
  selector: 'app-invite-form',
  templateUrl: './invite-form.component.html'
})
export class InviteFormComponent extends BaseFormComponent implements OnInit /* OnChanges */ {

  @Input() account: Account;
  @Input() facilities: Facility[];

  inviteForm: FormGroup;
  isFacilityUser: boolean;
  showFormSuccess = false;
  viewReady = false;

  constructor(
    private formBuilder: FormBuilder,
    private inviteService: InviteService,
    private loaderService: LoaderService,
    private residentService: ResidentService,
    private userService: UserService
  ) {
    super();
  }

  ngOnInit() {
    this.inviteForm = this.formBuilder.group({});

    this.viewReady = true;
  }

  submitForm($event, value: any) {
    $event.preventDefault();

    // reset messages
    this.resetErrorMessage();

    FormUtil.markAllAsTouched( this.inviteForm );

    if (this.inviteForm.valid) {

      this.loaderService.start(COMPONENT_NAME);

      // need to validate email address .. does it exist already in the system?
      this.userService.getUserByEmail( this.inviteForm.get('email').value )
        // see if email exists already in user_profiles,
        // if exists, throw error, if does not exist, create user_profile_data record
        .flatMap(result => {
          if (result) {
            return Observable.throw('Could not send invite because a user with this email already exists');
          } else {
            return this.userService.createInvitedUser(
              this.inviteForm.get('accountType').value,
              this.inviteForm.get('email').value,
              this.inviteForm.get('accountId').value,
              this.inviteForm.get('facilityIds').value,
              this.inviteForm.get('firstName').value,
              this.inviteForm.get('lastName').value,
              this.inviteForm.get('phone').value,
              this.inviteForm.get('title').value,
              this.inviteForm.get('pin').value,
              !!this.inviteForm.get('pin').value,
              this.inviteForm.get('residentIds').value,
              this.inviteForm.get('residentMode').value
            );
          }
        })
        // result will be created IUser
        // send invite request and get user id from portal api
        .flatMap(result => {
          // we need to capture the rails createInvite response
          // on error, we should re-delete the newly created IUser
          // to keep user_profile_data and user_auth_data sync'd
          // and prevent issues with users unable to complete invite
          this.isFacilityUser = result.type === USER_TYPE_FACILITY_USER;
          return this.isFacilityUser
            ? Observable.of(null)
            : this.inviteService.createInvite( result._id, result.email )
              .catch(error => {
                return this.userService.deleteUser(result)
                  .flatMap( (deleteResult: boolean) => {
                    return Observable.throw( 'Invite was not created due to an error. ' + error );
                  })
                  .catch(deleteError => {
                    return Observable.throw( 'Invite was not created due to an error. ' + error );
                  });
              });
        })
        // report results back to screen
        .subscribe(
          result => {
            this.showFormSuccess = true;
            this.loaderService.stop(COMPONENT_NAME);
          },
          error => {
            this.errorMessage = error;
            this.loaderService.stop(COMPONENT_NAME);
          }
        );
    }
  }

  invitedAccountType() {
    const accountType = UserTypes.find(type => type.type === this.inviteForm.get('accountType').value);
    return accountType ? accountType.name : '';
  }

  resetForm() {
    this.resetErrorMessage();
    this.inviteForm.reset({
      email: '',
      accountType: '',
      accountId: '',
      facilityIds: [],
      firstName: '',
      lastName: '',
      pin: '',
      phone: '',
      title: ''
    });

    this.showFormSuccess = false;
  }


  // --- Private Functions ---

  private resetErrorMessage() {
    this.errorMessage = '';
  }
}
