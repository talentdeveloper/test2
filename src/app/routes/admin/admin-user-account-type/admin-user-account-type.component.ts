import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { IUser } from '../../../model/user/user';
import { LoaderService } from '../../../core/loader/loader.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserService } from '../../../core/user/user.service';

const COMPONENT_NAME = 'admin-user-account-type';

@Component({
  selector: 'app-admin-user-account-type',
  templateUrl: './admin-user-account-type.component.html'
})
export class AdminUserAccountTypeComponent implements OnInit {

  accountTypeForm: FormGroup;
  user: IUser;

  constructor(
    private breadcrumbService: BreadcrumbService,
    private formBuilder: FormBuilder,
    private loaderService: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private uiEventService: UiEventService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(( params: { user_id: string } ) => {
      this.loadData( params.user_id );
    });

    // blank form, app-account-type-select elements will add needed elements
    this.accountTypeForm = this.formBuilder.group({ });

    // trigger last value
    this.route.params.last();
  }

  submitForm(event) {
    this.loaderService.start(COMPONENT_NAME);

    // get updated user, then update
    this.userService.getUser( this.user._id )
      .flatMap((updateUser: IUser) => {
        // update user values and save
        updateUser.type = this.accountTypeForm.get('accountType').value;
        updateUser.account_id = this.accountTypeForm.get('accountId').value;
        updateUser.facility_ids = this.accountTypeForm.get('facilityIds').value;

        return this.userService.updateUser(updateUser);
      })
      .subscribe((updatedUser: IUser) => {
          this.router.navigateByUrl( `/admin/user/${this.user._id}` );
        },
        error => {
          this.uiEventService.dispatch(new ToasterMessage({
            body: 'The was an error updating this users account type: ' + error,
            type: 'error'
          }));
        },
        () => {
          this.loaderService.stop(COMPONENT_NAME);
        });
  }

  handleCancelClick() {
    this.router.navigateByUrl( `/admin/user/${this.user._id}` );
  }

  private loadData(user_id: string): void {
    this.userService.getUser( user_id )
      .subscribe(
        (user: IUser) => {
          this.user = user;

          this.breadcrumbService.updateBreadcrumbs([
            { label: 'User List', url: '/admin/user/list' },
            { label: `${this.user.first_name} ${this.user.last_name}`, url: `/admin/user/${user._id}` },
            { label: `Account Type`, url: '' }
          ]);
        },
        error => {
          this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        }
      );
  }
}
