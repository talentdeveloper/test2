import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { SettingsService } from '../../../core/settings/settings.service';
import { SidebarService } from '../../../layout/sidebar/sidebar.service';
import { IUser } from '../../../model/user/user';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { UserLoggedInMessage } from '../../../core/ui-event-service/ui-user-logged-in';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
  // styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  valForm: FormGroup;
  userEmail: string;
  errorMessage: string;
  responseCode: number;

  constructor(
    public settings: SettingsService,
    public fb: FormBuilder,
    private router: Router,
    private sidebarService: SidebarService,
    private authenticationService: AuthenticationService,
    private uiEventService: UiEventService
  ) {}

  submitForm($ev, value: any) {
    $ev.preventDefault();
    this.errorMessage = '';

    for (const c in this.valForm.controls) {
      if (this.valForm.controls.hasOwnProperty(c)) {
        this.valForm.controls[c].markAsTouched();
      }
    }

    if (this.valForm.valid) {
      // empty any previously define sidebar selected parms on login
      this.sidebarService.selectedParams.next({ navigateToDefault: true });

      this.authenticationService.signIn(value).subscribe(
        (result: BehaviorSubject<IUser>) => {
          if (result) {
            this.router.navigate(['']);
          }
        },
        error => {
          this.errorMessage = <any>error;
        }
      );
    }
  }

  ngOnInit() {
    this.valForm = this.fb.group({
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      password: ['', Validators.required]
    });
  }
}
