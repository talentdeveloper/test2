import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { USER_TYPE_FACILITY_ADMIN } from '../../../model/user/user';

const COMPONENT_NAME = 'add-facility-staff';

@Component({
    selector: 'app-add-facility-staff',
    templateUrl: './add-facility-staff.component.html'
})
export class AddFacilityStaffComponent implements OnInit {

    account: Account;
    accountId: string;
    dataLoaded = false;
    facility: Facility;
    facilities: Facility[];
    facilityId: string;

    constructor(
        private accountService: AccountService,
        private authenticationService: AuthenticationService,
        private breadcrumbService: BreadcrumbService,
        private facilityService: FacilityService,
        private loaderService: LoaderService,
        private route: ActivatedRoute,
        private uiEventService: UiEventService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(( params: { id: string, facility_id: string, user_id: string } ) => {
            this.accountId = params.id;
            this.facilityId = params.facility_id;

            this.loadData();
        });

        // trigger last value
        this.route.params.last();
    }


    // --- Private Functions ---

    private loadData(): void {
        this.loaderService.start(COMPONENT_NAME);

        const currentUser = this.authenticationService.currentUser().value;

        // load account information
        Observable.forkJoin(
            this.accountService.getAccount(this.accountId),
            this.facilityService.getFacility(this.facilityId),
            this.facilityService.getAccountFacilities(this.accountId)
        ).subscribe(([account, facility, facilities]) => {
            this.account = account;
            this.facility = facility;
            this.facilities = currentUser.type === USER_TYPE_FACILITY_ADMIN ? facilities.filter(f => currentUser.facility_ids.includes(f._id)) : facilities;

            this.breadcrumbService.updateBreadcrumbs([
                { label: this.account.profile.account_name, url: '/account/' + this.account._id },
                { label: 'Facilities', url: '/account/' + this.account._id + '/facility/list' },
                { label: this.facility.profile.name, url: '/account/' + this.account._id + '/facility/' + this.facility._id },
                { label: 'Staff', url: '/account/' + this.account._id + '/facility/' + this.facility._id + '/staff' },
                { label: 'Invite Staff', url: '' }
            ]);

            this.loaderService.stop(COMPONENT_NAME);
        },
        error => {
            this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
            this.loaderService.stop(COMPONENT_NAME);
        },
        () => {
            this.dataLoaded = true;
        });
    }
}
