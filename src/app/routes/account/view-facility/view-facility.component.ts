import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { ROLE_EDIT_FACILITY } from '../../../model/role/role';
import { RoleService } from '../../../core/role/role.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


@Component({
  selector: 'app-view-facility',
  templateUrl: './view-facility.component.html'
})
export class ViewFacilityComponent implements OnInit {

  currentUserCanEdit: boolean;
  accountId: string;
  facilityId: string;
  account: Account;
  facility: Facility;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private breadcrumbService: BreadcrumbService,
    private facilityService: FacilityService,
    private roleService: RoleService,
    private uiEventService: UiEventService
  ) { }

  ngOnInit() {
    this.accountId = this.route.snapshot.params['id'];
    this.facilityId = this.route.snapshot.params['facility_id'];

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getFacility(this.facilityId)
    ).subscribe((results: any[]) => {
        this.account = results[0];
        this.facility = results[1];

        this.breadcrumbService.updateBreadcrumbs([
          { label: this.account.profile.account_name, url: '/account/' + this.account._id },
          { label: 'Facilities', url: '/account/' + this.account._id + '/facility/list' },
          { label: this.facility.profile.name, url: '' }
        ]);
      },
      (error) => {
        this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
      }
    );

    this.currentUserCanEdit = this.roleService.currentUserHasRoles( ROLE_EDIT_FACILITY );
  }
}
