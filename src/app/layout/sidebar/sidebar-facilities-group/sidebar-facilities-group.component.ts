import * as _ from 'lodash';

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AccountService } from '../../../core/account/account.service';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { SidebarResourceGroupComponent } from '../sidebar-resource-group/sidebar-resource-group.component';
import { SidebarService } from '../sidebar.service';
import {
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_ACCOUNT_ADMIN,
  USER_TYPE_IN2L_ADMIN
} from '../../../model/user/user';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

@Component({
  selector: 'app-sidebar-facilities-group',
  templateUrl: '../sidebar-resource-group/sidebar-resource-group.component.html',
  styleUrls: ['../sidebar-resource-group/sidebar-resource-group.component.scss']
})
export class SidebarFacilitiesGroupComponent extends SidebarResourceGroupComponent {
  constructor(
    private accountService: AccountService,
    private authenticationService: AuthenticationService,
    private facilityService: FacilityService,
    protected sidebarService: SidebarService,
    protected router: Router,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {
    super(sidebarService, router, uiEventService, loaderService);
  }

  resolveResource() {
    const currentUser = this.authenticationService.currentUser().getValue();
    if (
      !currentUser ||
      ![USER_TYPE_IN2L_ADMIN, USER_TYPE_ACCOUNT_ADMIN, USER_TYPE_FACILITY_ADMIN].includes(
        currentUser.type
      )
    ) {
      return Observable.of([]);
    }

    return this.facilityService
      .getAccountFacilities(this.dependentKey)
      .map((facilities: Facility[]) => {
        if (currentUser.type === USER_TYPE_FACILITY_ADMIN) {
          if (currentUser.facility_ids) {
            return facilities.filter(facility => currentUser.facility_ids.includes(facility._id));
          } else {
            // user of these types should have a facility id, if the data is missing for
            // some reason, fallback to an empty array instead of showing all facilities
            // which these users should not have access to
            return [];
          }
        }

        return (facilities || []).sort((a: Facility, b: Facility) => {
          const aName: string = _.get(a, 'profile.name', '')
            .trim()
            .toLowerCase();
          const bName: string = _.get(b, 'profile.name', '')
            .trim()
            .toLowerCase();
          return aName.localeCompare(bName);
        });
      });
  }
}
