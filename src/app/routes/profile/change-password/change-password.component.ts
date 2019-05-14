import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { BaseFormComponent, FormUtil } from '../../../util/FormUtil';
import { IUser } from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { InputService } from '../../../core/input/input.service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'change-password';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent extends BaseFormComponent implements OnInit {

    passwordForm: FormGroup;
    submitEnabled = true;
    user: IUser;

    constructor(
        private authenticationService: AuthenticationService,
        private formBuilder: FormBuilder,
        private router: Router,
        private uiEventService: UiEventService,
        private loaderService: LoaderService
    ) {
        super();
    }

    ngOnInit() {
        this.passwordForm = this.formBuilder.group({
            currentPassword: [ '', Validators.required ],
            newPassword: [ '' ],  // validators set below
            confirmNewPassword: [ '' ] // validators set below
        });

        // need to have password control defined before we can set equalTo validator
        this.passwordForm.get('newPassword').setValidators( Validators.compose([
            Validators.required,
            Validators.pattern(InputService.PASSWORD_STRENGTH_VALIDATION),
            CustomValidators.notEqualTo( this.passwordForm.get('currentPassword') )
        ]) );

        this.passwordForm.get('confirmNewPassword').setValidators( Validators.compose([
            Validators.required,
            CustomValidators.equalTo( this.passwordForm.get('newPassword') )
        ]) );
    }

    submitForm($event, value) {
        $event.preventDefault();

        // reset form
        this.successMessage = '';
        this.errorMessage = '';

        this.submitEnabled = false;

        FormUtil.markAllAsTouched(this.passwordForm);

        if (this.passwordForm.valid) {
            this.loaderService.start(COMPONENT_NAME);

            this.authenticationService.updatePassword(
                this.passwordForm.get('newPassword').value,
                this.passwordForm.get('confirmNewPassword').value,
                this.passwordForm.get('currentPassword').value
            ).subscribe(
                updateResult => {
                    this.uiEventService.dispatch( new ToasterMessage({
                        body: 'Profile password has been updated',
                        type: 'success'
                    }) );
                    this.router.navigateByUrl('/profile');
                    this.submitEnabled = true;

                    this.loaderService.stop(COMPONENT_NAME);
                },
                error => {
                    this.errorMessage = error;
                    this.submitEnabled = true;

                    this.loaderService.stop(COMPONENT_NAME);
                }
            );
        }
    }
}
