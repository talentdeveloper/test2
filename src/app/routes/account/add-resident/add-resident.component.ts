import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { FacilityService } from '../../../core/facility/facility.service';
import { Facility } from '../../../model/facility/facility';


@Component({
  selector: 'app-add-resident',
  templateUrl: './add-resident.component.html'
})
export class AddResidentComponent implements OnInit {
  accountId: string;
  facilityId: string;
  facility: Facility;

  constructor(
    private facilityService: FacilityService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params
      .flatMap((params: { id: string, facility_id: string }) => {
        this.accountId = params.id;
        this.facilityId = params.facility_id;

        return this.facilityService.getFacility(this.facilityId);
      })
      .subscribe((facility: Facility) => {
        this.facility = facility;
      });

    this.route.params.last();
  }
}
