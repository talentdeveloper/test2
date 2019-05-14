import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


@Component({
  selector: 'app-facility-list',
  templateUrl: './facility-list.component.html',
  styles: [
    '.id-cell { width: 80px }',
    '.region-cell { width: 160px }',
    '.action-cell { width: 125px }'
  ]
})
export class FacilityListComponent implements OnInit {

  facilityId: string;
  accountId: string;
  account: Account;
  dataLoaded = false;
  facility: Facility;
  facilities: Facility[];
  facilityStatusStyle: string;
  facilityFilter: string;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private breadcrumbService: BreadcrumbService,
    private facilityService: FacilityService,
    private uiEventService: UiEventService
  ) {}

  ngOnInit() {
    // resolves view refresh if only params update (no component instantiation)
    this.route.params.subscribe((v: { id: string, facility_id: string }) => {
      this.accountId = v.id;
      this.facilityId = v.facility_id;
    });

    this.route.params.last();

    Observable.forkJoin(
      this.accountService.getAccount(this.accountId),
      this.facilityService.getAllFacilities()
    ).subscribe(([account, facilities]: [Account, Facility[]]) => {
      this.account = account;
      this.facilities = facilities;

      this.dataLoaded = true;

      this.breadcrumbService.updateBreadcrumbs([
        { label: this.account.profile.account_name, url: '/account/' + this.account._id },
        { label: 'Facilities', url: '' }
      ]);
    }, (error) => {
      this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
    });
  }

  getAccountFacilities(): Facility[] {
    return this.facilities
      .filter(f => f.account_id === this.accountId)
      .sort((a: Facility, b: Facility) => a.profile.name.localeCompare(b.profile.name));
  }
}
