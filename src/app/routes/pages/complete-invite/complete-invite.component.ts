import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomValidators } from 'ng2-validation';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { FileUtilityService } from '../../../core/file/file-utility.service';
import { SettingsService } from '../../../core/settings/settings.service';
import { IUser, USER_STATUS_INVITED, USER_STATUS_ACTIVE } from '../../../model/user/user';
import { UserService } from '../../../core/user/user.service';
import { InputService } from '../../../core/input/input.service';

@Component({
  selector: 'app-complete-invite',
  templateUrl: './complete-invite.component.html'
})
export class CompleteInviteComponent implements OnInit {
  completeInviteForm: FormGroup;
  errorMessage = '';
  profileImageFile: File;
  invitePageError = '';
  inviteEmailAddress = '';

  constructor(
    private authenticationService: AuthenticationService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private settings: SettingsService,
    private userService: UserService
  ) {}

  ngOnInit() {
    Observable.combineLatest(
      this.route.params,
      this.route.queryParams,
      (params: { user_id: string }, queryParams: { email: string }) => ({
        params: params,
        queryParams: queryParams
      })
    ).subscribe(combinedParams => {
      this.inviteEmailAddress = combinedParams.queryParams.email;

      // logout any active users
      this.authenticationService
        .signOut()
        .flatMap(() => {
          // current user has been logged out, or skipped if no one was logged in
          // now get the requested user's status through a specific api endpoint
          // that only returns status to non-logged in anonymous users
          return this.userService.getPublicUserStatus(combinedParams.params.user_id);
        })
        .subscribe(
          (userStatus: string) => {
            if (userStatus !== USER_STATUS_INVITED) {
              this.invitePageError = 'We could not find an open invitation for this request.';
            }
          },
          error => {
            this.invitePageError =
              'There was an error locating this invitiation. Please try again later.';
          }
        );
    });

    // --- form setup ---

    this.completeInviteForm = this.formBuilder.group({
      first_name: [null, Validators.required],
      last_name: [null, Validators.required],
      password: [
        null,
        Validators.compose([
          Validators.required,
          Validators.pattern(InputService.PASSWORD_STRENGTH_VALIDATION)
        ])
      ],
      confirm_password: [null]
    });

    // need to have password control defined before we can set equalTo validator
    this.completeInviteForm
      .get('confirm_password')
      .setValidators(
        Validators.compose([
          Validators.required,
          CustomValidators.equalTo(this.completeInviteForm.get('password'))
        ])
      );
  }

  setFile($ev) {
    this.profileImageFile = $ev.target.files[0];
  }

  submitForm($ev, value: any) {
    $ev.preventDefault();

    for (const c in this.completeInviteForm.controls) {
      if (this.completeInviteForm.controls.hasOwnProperty(c)) {
        this.completeInviteForm.controls[c].markAsTouched();
      }
    }

    if (this.completeInviteForm.valid) {
      this.authenticationService
        .completeAccount(
          this.inviteEmailAddress,
          this.completeInviteForm.get('password').value,
          this.completeInviteForm.get('confirm_password').value
        )
        .flatMap(result => {
          return this.authenticationService
            .signIn({
              email: this.inviteEmailAddress,
              password: this.completeInviteForm.get('password').value,
              newUser: true
            })
            .take(1)
            .map(res => {
              return this.authenticationService.currentUser().getValue();
            });
        })
        .flatMap((user: IUser) => {
          // if account is registered successfully and signed in,
          // update user_profile_data record
          if (user) {
            user.first_name = this.completeInviteForm.get('first_name').value;
            user.last_name = this.completeInviteForm.get('last_name').value;

            user.status = USER_STATUS_ACTIVE;

            return this.userService.updateUser(user);
          }

          return Observable.throw('There was an error with account registration');
        })
        .flatMap(user => {
          // if user_profile is updated successfully, check to see if we need to
          // update their profile image
          // result will be a user object returned from updateUser()

          if (this.profileImageFile) {
            return FileUtilityService.convertBlobToDataURI(this.profileImageFile).flatMap(
              (imageBase64Data: string) => {
                return this.userService.updateProfileImage(user, imageBase64Data);
              }
            );
          }

          // if no file to upload, just pass along user
          return Observable.of(user);
        })
        // refresh current user to update data in authentication service
        .flatMap(() => {
          return this.authenticationService.refreshCurrentUser();
        })
        .subscribe(
          (user: IUser) => {
            this.router.navigate(['/home']);
          },
          error => {
            this.errorMessage = 'There was an error updating this account. ' + error;
          }
        );
    }
  }
}
