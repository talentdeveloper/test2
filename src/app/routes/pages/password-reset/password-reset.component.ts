import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { FormUtil } from '../../../util/FormUtil';
import { SettingsService } from '../../../core/settings/settings.service';
import { InputService } from '../../../core/input/input.service';


@Component({
    selector: '<app-password-reset></app-password-reset>',
    templateUrl: './password-reset.component.html'
    // stylesUrl: ['./password-reset.component.scss']
})

export class PasswordResetComponent implements OnInit {

    email: string;
    errorMessage: string;
    passwordForm: FormGroup;
    resetToken: string;
    showNavigationLinks = false;

    constructor(
        public settings: SettingsService,
        private activatedRoute: ActivatedRoute,
        private authService: AuthenticationService,
        private fb: FormBuilder,
        private router: Router
    ) { }

    ngOnInit() {
        this.activatedRoute.queryParams.subscribe((param: any) => {
            this.email = param['uid'];
            this.resetToken = param['token'];
            this.setErrorByToken( param['err'] );
        });

        this.passwordForm = this.fb.group({
            'password': [ null, Validators.compose([
                Validators.required,
                Validators.pattern(InputService.PASSWORD_STRENGTH_VALIDATION)
            ]) ],
            'confirmPassword': [ null ]
        });

        // need to have password control defined before we can set equalTo validator
        this.passwordForm.get('confirmPassword').setValidators(
            Validators.compose([
                Validators.required,
                CustomValidators.equalTo( this.passwordForm.get('password') )
            ])
        );
    }

    submitForm($ev, value: any) {
        $ev.preventDefault();

        FormUtil.markAllAsTouched( this.passwordForm );

        if (this.passwordForm.valid) {
            this.authService.updatePasswordWithResetToken(
                this.passwordForm.get('password').value,
                this.passwordForm.get('confirmPassword').value,
                this.resetToken
            ).subscribe(
                (result) => {
                    if (result) {
                        this.router.navigate(['']);
                    } else {
                        this.errorMessage = 'We were unable to update your password because of an unknown error.';
                    }
                },
                (error) => {
                    this.errorMessage = error['error'] ? error.error : error;
                }
            );
        }
    }

    setErrorByToken(token: string) {
        switch (token) {
            case 'user':
                this.errorMessage = 'This reset link is no longer valid or an unexpected error was found.';
                this.showNavigationLinks = true;
                break;
        }
    }
}
