import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { IUser } from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserService } from '../../../core/user/user.service';
import { UserViewComponent } from '../../../shared/components/user-view/user-view.component';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'view-facility-staff';

@Component({
  selector: 'app-view-facility-staff',
  templateUrl: './view-facility-staff.component.html'
})
export class ViewFacilityStaffComponent implements OnInit {
  @ViewChild(UserViewComponent) userViewComponent: UserViewComponent;

  account: any;
  accountId: string;
  facility: any;
  facilityId: string;
  user: IUser;
  userId: string;

  constructor (
    private accountService: AccountService,
    private breadcrumbService: BreadcrumbService,
    private facilityService: FacilityService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private uiEventService: UiEventService,
    private userService: UserService,
    private loaderService: LoaderService,
  ) { }

  ngOnInit() {
    this.route.params.subscribe( ( params: { id: string, facility_id: string, user_id: string } ) => {
      this.accountId = params.id;
      this.facilityId = params.facility_id;
      this.userId = params.user_id;

      this.loadData();
    });

    // trigger last value
    this.route.params.last();
  }

  onEditUser(user: IUser) {
    this.router.navigateByUrl( `${this.location.path()}/edit` );
  }

  private loadData(): void {
    // load account information
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getFacility(this.facilityId)
    ).flatMap((results: any[]) => {
      this.account = results[0];
      this.facility = results[1];

      // load user for this facility
      return this.userService.getUser( this.userId );
    })
    .flatMap((user: IUser) => {
      // validate user belongs to account, if not throw an error
      if ( user.account_id !== this.accountId || !user.facility_ids.includes(this.facilityId)) {
        return Observable.throw('Attempted to edit user from another account or facility.');
      }

      return Observable.of( user );
    })
    .subscribe(
      (user: IUser) => {
        this.user = user;

        this.breadcrumbService.updateBreadcrumbs([
          { label: this.account.profile.account_name, url: '/account/' + this.account._id },
          { label: 'Facilities', url: '/account/' + this.account._id + '/facility/list' },
          { label: `${this.facility.profile.name}`, url: '/account/' + this.account._id + '/facility/' + this.facility._id },
          { label: 'Staff', url: '/account/' + this.account._id + '/facility/' + this.facility._id + '/staff' },
          { label: `${this.user.first_name} ${this.user.last_name}`, url: '' },
        ]);

        this.loaderService.stop(COMPONENT_NAME);
      },
      error => {
        this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
        this.loaderService.stop(COMPONENT_NAME);
      },
      () => {
        this.userViewComponent.dataIsLoaded();
      });
  }
}
