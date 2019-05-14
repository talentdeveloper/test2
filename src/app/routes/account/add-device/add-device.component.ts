import * as _ from 'lodash';

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Device } from '../../../model/device/device';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

const COMPONENT_NAME = 'add-device';

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html'
})
export class AddDeviceComponent implements OnInit {

  accountId: string;
  facilityId: string;

  account: Account;
  facility: Facility;

  constructor(
    protected accountService: AccountService,
    protected breadcrumbService: BreadcrumbService,
    protected facilityService: FacilityService,
    protected loaderService: LoaderService,
    protected route: ActivatedRoute,
    protected router: Router,
    protected uiEventService: UiEventService
  ) { }

  ngOnInit() {
    this.route.params.subscribe((v: { id: string, facility_id: string }) => {
      this.accountId = v.id;
      this.facilityId = v.facility_id;

      this.loadData();
    });

    this.route.params.last();
  }

  onSuccess({ device, previousDevice }) {
    this.router.navigateByUrl( `/account/${this.accountId}/facility/${this.facilityId}/devices` );
  }

  onCancel() {
    this.router.navigateByUrl( `/account/${this.accountId}/facility/${this.facilityId}/devices` );
  }

  private loadData() {
    this.loaderService.start(COMPONENT_NAME);

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getFacility(this.facilityId)
    )
    .subscribe((results: any[]) => {
      const account = results[0];
      const facility = results[1];
      this.breadcrumbService.updateBreadcrumbs([
        { label: _.get(account, 'profile.account_name', 'Account'), url: `/account/${account._id}` },
        { label: 'Facilities', url: `/account/${account._id}/facility/list` },
        { label: _.get(facility, 'profile.name', 'Facility'), url: `/account/${account._id}/facility/${facility._id}` },
        { label: 'Devices', url: `/account/${account._id}/facility/${facility._id}/devices` },
        { label: 'Add Device', url: '' }
      ]);

      this.loaderService.stop(COMPONENT_NAME);
    },
    error => {
      this.loaderService.stop(COMPONENT_NAME);
      this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
    });
  }
}
