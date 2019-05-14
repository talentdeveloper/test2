import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { Observable } from 'rxjs/Observable';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { Facility } from '../../../model/facility/facility';
import { FacilityService } from '../../../core/facility/facility.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'edit-resident';

@Component({
  selector: 'app-edit-resident',
  templateUrl: './edit-resident.component.html'
})
export class EditResidentComponent implements OnInit {
  residentId: string;
  resident: Resident;
  accountId: string;
  facility: Facility;
  facilityId: string;

  constructor(
    private facilityService: FacilityService,
    private breadcrumbService: BreadcrumbService,
    private route: ActivatedRoute,
    private residentService: ResidentService,
    private uiEventService: UiEventService,
    private loaderService: LoaderService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(
      (params: { id: string; facility_id: string; resident_id: string }) => {
        this.accountId = params.id;
        this.facilityId = params.facility_id;
        this.residentId = params.resident_id;

        this.loaderService.start(COMPONENT_NAME);

        Observable.forkJoin(
          this.facilityService.getFacility(this.facilityId),
          this.residentService.getResident(this.residentId)
        ).subscribe(
          ([facility, resident]: [Facility, Resident]) => {
            this.resident = resident;
            this.facility = facility;

            // update breadcrumb with accounnt information
            this.breadcrumbService.updateBreadcrumbs([
              {
                label: 'Residents',
                url: `/account/${this.accountId}/facility/${this.facility._id}/resident`
              },
              { label: `Edit ${this.resident.first_name} ${this.resident.last_name}`, url: '' }
            ]);

            this.loaderService.stop(COMPONENT_NAME);
          },
          error => {
            this.loaderService.stop(COMPONENT_NAME);
            this.uiEventService.dispatch(new ToasterMessage({ body: error, type: 'error' }));
          }
        );
      }
    );

    this.route.params.last();
  }
}
