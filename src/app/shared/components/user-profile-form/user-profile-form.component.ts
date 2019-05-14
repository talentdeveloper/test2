import { Component, Input, Output, ViewChild, OnInit, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { CustomValidators } from 'ng2-validation';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { BaseFormComponent, FormUtil } from '../../../util/FormUtil';
import { ImageCropControlComponent } from '../../../shared/components/image-crop-control/image-crop-control.component';
import { InputService } from '../../../core/input/input.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { 
  IUser,
  USER_TYPE_FACILITY_ADMIN, USER_TYPE_FACILITY_USER,
  USER_TYPE_IN2L, USER_TYPE_IN2L_ADMIN,
  USER_RESIDENT_MODE_ALL, USER_RESIDENT_MODE_SELECT
} from '../../../model/user/user';
import { UserFactoryService } from '../../../core/user/user-factory.service';
import { UserService } from '../../../core/user/user.service';

const COMPONENT_NAME = 'user-profile-form';

@Component({
  selector: 'app-user-profile-form',
  templateUrl: './user-profile-form.component.html'
})
export class UserProfileFormComponent extends BaseFormComponent implements OnInit {
  @ViewChild('cropControl', undefined) cropControl: ImageCropControlComponent;

  // @Input() user: IUser; // generates angular-cli warnings
  // @see https://github.com/angular/angular-cli/issues/2034#issuecomment-260976971
  // @Input() user = <IUser> null; // alternate solution as recommend in link above, but adding '| undefined' also works
  @Input() user: IUser | undefined;

  existingImageSrc = '';
  profileForm: FormGroup;
  phoneMask = InputService.PHONE_MASK;

  residentNames: Array<{ id: string, text: string }>;
  selectedResidents: Array<{ id: string, text: string }>;

  removeProfileImage = false;

  constructor(
    private authenticationService: AuthenticationService,
    private formBuilder: FormBuilder,
    private loaderService : LoaderService,
    private location: Location,
    private residentService: ResidentService,
    private uiEventService: UiEventService,
    private userFactoryService: UserFactoryService,
    private userService: UserService
  ) {
    super();
  }

  ngOnInit() {
    this.profileForm = this.formBuilder.group({
      'first_name': [ this.user.first_name, Validators.required ],
      'last_name': [ this.user.last_name, Validators.required ],
      'title': [ this.user.title ]
    });

    // dynamically add phone control if user should collect it
    if ( this.user.shouldCollectPhoneNumber() ) {
      this.profileForm.addControl('phone', this.formBuilder.control(this.user.phone, Validators.pattern(InputService.PHONE_VALIDATION_PATTERN)));
    }

    if (this.isFacilityUser() || this.isFacilityAdmin()) {
      this.profileForm.addControl('pin', this.formBuilder.control(this.user.pin, Validators.pattern(/^[0-9]{5}$/)));
    }

    if (this.isFacilityUser()) {
      this.profileForm.addControl('email', this.formBuilder.control(this.user.email, CustomValidators.email));
      this.profileForm.addControl('resident_mode', this.formBuilder.control(this.user.resident_mode || USER_RESIDENT_MODE_ALL));
      this.profileForm.addControl('resident_ids', this.formBuilder.control(this.user.resident_ids || []));
    }

    this.existingImageSrc = this.userService.getUserProfileImagePath( this.user );

    if (this.isFacilityUser()) {
      this.residentService.getAllResidentsForFacility(this.user.facility_ids[0])
        .subscribe((residents: Resident[]) => {
          this.residentNames = residents.map(r => ({ id: r._id, text: `${r.first_name} ${r.last_name}`}));
          this.selectedResidents = this.residentNames.filter(r => this.user.resident_ids.includes(r.id));
        });
    }
  }

  isFacilityAdmin(): boolean {
    return this.user.type === USER_TYPE_FACILITY_ADMIN;
  }

  isFacilityUser(): boolean {
    return this.user.type === USER_TYPE_FACILITY_USER;
  }

  isIn2lType(): boolean {
    return this.user.type === USER_TYPE_IN2L_ADMIN || this.user.type === USER_TYPE_IN2L;
  }

  isResidentModeAll(): boolean {
    return this.profileForm.get('resident_mode').value === USER_RESIDENT_MODE_ALL;
  }

  isResidentModeSelect(): boolean {
    return this.profileForm.get('resident_mode').value === USER_RESIDENT_MODE_SELECT;
  }

  setResidentModeAll() {
    this.profileForm.get('resident_mode').setValue(USER_RESIDENT_MODE_ALL);
  }

  setResidentModeSelect() {
    this.profileForm.get('resident_mode').setValue(USER_RESIDENT_MODE_SELECT);
  }

  handleAddResident(selected) {
    this.selectedResidents = this.selectedResidents.filter(f => f.id !== selected.id).concat(selected);
    this.profileForm.get('resident_ids').setValue(this.selectedResidents.map(f => f.id));
  }

  handleRemoveResident(selected) {
    this.selectedResidents = this.selectedResidents.filter(f => f.id !== selected.id);
    this.profileForm.get('resident_ids').setValue(this.selectedResidents.map(f => f.id));
  }

  hasPin(): boolean {
    return this.isFacilityAdmin() || this.isFacilityUser();
  }
  
  canShowPin(): boolean {
    return this.user._id === this.authenticationService.currentUser().value._id;
  }

  submitForm($event, value) {
    $event.preventDefault();

    // reset success and error messages
    this.resetMessages();

    FormUtil.markAllAsTouched(this.profileForm);

    // handle valid form submission
    if (this.profileForm.valid) {
      this.loaderService.start(COMPONENT_NAME);

      // first, reload user to make sure we have the most up to date version of the user data
      this.userService.getUser( this.user._id )
        .flatMap((user: IUser) => {
          const updatedUser = this.userFactoryService.updateUserFromFormValues(user, value);

          // for now, just return the updated user and skip the email address check
          return Observable.of( updatedUser );
        })
        .flatMap((updatedUser: IUser) => {
          // update user_profile_data record
          if (this.removeProfileImage) {
            return this.userService.updateUserRemoveProfileImage(updatedUser);
          }

          return this.userService.updateUser(updatedUser);
        })
        .flatMap((updatedUser: IUser) => {
          // see if a profile image update was made, if so update
          // otherwise just pass along updatedUser
          const profileImageBase64Data = this.cropControl.getCroppedImageBase64Data();

          if (profileImageBase64Data) {
            return this.userService.updateProfileImage(updatedUser, profileImageBase64Data);
          }

          return Observable.of( updatedUser );
        })
        .flatMap((updatedUser: IUser) => {
          // refresh image path in case it was updated
          this.existingImageSrc = this.userService.getUserProfileImagePath( updatedUser );

          // have authentication service reload user information to newly updated content
          return this.authenticationService.refreshCurrentUser().map((reloadedUser: IUser) => {
            // simply return updatedUser on success, do nothing with reloadedUser
            // returned from the reload call
            return updatedUser;
          });
        })
        .subscribe(
          (updatedUser: IUser) => {
            this.uiEventService.dispatch( new ToasterMessage({
              body: 'User profile has been updated',
              type: 'success'
            }) );

            this.profileForm.reset();

            if ( this.onSubmit ) {
              this.onSubmit.emit( updatedUser );
            }

            this.loaderService.stop(COMPONENT_NAME);
          },
          error => {
            this.loaderService.stop(COMPONENT_NAME);
            this.errorMessage = error;
          }
        );
    }
  }

  markRemoveProfileImage($event) {
    this.removeProfileImage = true;
    this.existingImageSrc = '';
  }

  handleCancelClick() {
    if (this.onCancel) {
      this.onCancel.emit();
    }
  }
}
