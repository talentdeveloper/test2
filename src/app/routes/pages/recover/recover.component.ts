import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomValidators } from 'ng2-validation';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { FormUtil } from '../../../util/FormUtil';
import { SettingsService } from '../../../core/settings/settings.service';

@Component({
    selector: 'app-recover',
    templateUrl: './recover.component.html'
})
export class RecoverComponent implements OnInit {

    disableButton = false;
    errorMessage: string;
    successMessage: string;
    valForm: FormGroup;

    constructor(
        public settings: SettingsService,
        private authService: AuthenticationService,
        private fb: FormBuilder,
        private router: Router
    ) { }

    ngOnInit() {
        this.valForm = this.fb.group({
            email: [ null, Validators.compose([ Validators.required, CustomValidators.email ]) ]
        });
    }

    submitForm($ev) {
        $ev.preventDefault();

        this.disableButton = true;
        this.successMessage = '';
        this.errorMessage = '';

        FormUtil.markAllAsTouched(this.valForm);

        if (this.valForm.valid) {
            this.authService.resetPassword( this.valForm.get('email').value ).subscribe(
                (result) => {
                    if ( result.success && result.message ) {
                        this.successMessage = `Instructions for reseting your password have been sent to 
                            ${this.valForm.get('email').value}.`;
                    } else {
                        this.errorMessage = 'We could not reset your password because of an unknown error.';
                    }
                },
                (error) => {
                    this.errorMessage = this.authService.processResetPasswordError(error);
                }
            );
        }
    }

    tryAgain() {
        this.valForm.reset();
        this.successMessage = '';
        this.errorMessage = '';
        this.disableButton = false;
    }
}
