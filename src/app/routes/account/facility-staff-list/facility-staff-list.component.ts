import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { IUser } from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserListComponent } from '../../../shared/components/user-list/user-list.component';
import { UserService } from '../../../core/user/user.service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'facility-staff-list';

@Component({
  selector: 'app-facility-staff-list',
  templateUrl: './facility-staff-list.component.html'
})
export class FacilityStaffListComponent implements OnInit {
  @ViewChild(UserListComponent)
  userListComponent: UserListComponent;

  account: Account;
  accountId: string;
  facility: Facility;
  facilityId: string;
  users: IUser[] = [];

  constructor(
    private accountService: AccountService,
    private breadcrumbService: BreadcrumbService,
    private facilityService: FacilityService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private uiEventService: UiEventService,
    private userService: UserService,
    private loaderService: LoaderService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(
      (params: { id: string; facility_id: string }) => {
        this.accountId = params.id;
        this.facilityId = params.facility_id;

        this.loadData();
      }
    );

    // trigger last value
    this.route.params.last();
  }

  onEditUser(user: IUser) {
    this.router.navigateByUrl(`${this.location.path()}/${user._id}/edit`);
  }

  onViewUser(user: IUser) {
    this.router.navigateByUrl(`${this.location.path()}/${user._id}`);
  }

  private loadData(): void {
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getFacility(this.facilityId),
    )
      .flatMap(([account, facility]) => {
        this.account = account;
        this.facility = facility;

        return this.userService.getUsersForFacility(
          this.accountId,
          this.facilityId
        );
      })
      .subscribe(
        (users: IUser[]) => {
          this.users = users;

          this.breadcrumbService.updateBreadcrumbs([
            {
              label: this.account.profile.account_name,
              url: '/account/' + this.account._id
            },
            {
              label: 'Facilities',
              url: '/account/' + this.account._id + '/facility/list'
            },
            {
              label: `${this.facility.profile.name}`,
              url:
                '/account/' +
                this.account._id +
                '/facility/' +
                this.facility._id
            },
            { label: 'Staff', url: '' }
          ]);

          this.loaderService.stop(COMPONENT_NAME);
        },
        error => {
          this.uiEventService.dispatch(
            new ToasterMessage({ body: error, type: 'error' })
          );
          this.loaderService.stop(COMPONENT_NAME);
        },
        () => {
          this.setDataLoaded();
        }
      );
  }

  private setDataLoaded(): void {
    this.userListComponent.dataIsLoaded();
  }
}
