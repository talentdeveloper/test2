import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AccountService } from '../../../core/account/account.service';
import { Resident } from '../../../model/resident/resident';
import { ResidentService } from '../../../core/resident/resident.service';
import { ROLE_MOVE_RESIDENT } from '../../../model/role/role';
import { RoleService, IPermissions } from '../../../core/role/role.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ISortColumn } from '../../../shared/components/sortable-report/sortable-report.component';


const COMPONENT_NAME = 'resident-list';

@Component({
  selector: 'app-resident-list',
  templateUrl: './resident-list.component.html',
  styles: [
    '.status-cell { width: 80px; cursor: pointer }',
    '.action-cell { width: 240px; cursor: pointer }',
    '.room-cell { cursor: pointer }',
    '.name-cell { cursor: pointer }'
  ]
})
export class ResidentListComponent implements OnInit {

  accountId: string;
  dataLoaded = false;
  facilityId: string;
  filteredResidents: Resident[] = [];
  permissions: IPermissions;
  residents: Resident[] = [];
  search = '';
  sort = {
    columnName: 'name',
    direction: 'asc'
  };



  constructor(
    protected accountService: AccountService,
    private route: ActivatedRoute,
    private residentService: ResidentService,
    private uiEventService: UiEventService,
    private loaderService: LoaderService,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((v: { id: string, facility_id: string }) => {
      this.accountId = v.id;
      this.facilityId = v.facility_id;

      this.loaderService.start(COMPONENT_NAME);

      this.permissions = this.roleService.currentUserPermissionsObject([
        { keyName: 'canMoveResident', role: ROLE_MOVE_RESIDENT }
      ]);

      this.residentService.getAllResidentsForFacility( this.facilityId )
        .subscribe(
          (residents) => {
            // store list of residents, sorted by last_name
            this.residents = residents.sort((a, b) => a.last_name.localeCompare(b.last_name));
            this.filteredResidents = residents;
            this.dataLoaded = true;
            this.loaderService.stop(COMPONENT_NAME);
          },
          (error) => {
            this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
            this.loaderService.stop(COMPONENT_NAME);
            this.dataLoaded = true;
          }
        );
    });

    this.route.params.last();
  }

  filterResidents() {
    if (this.search.length) {
      const searchPhrase = this.search.toLowerCase();

      this.filteredResidents = this.residents.filter(resident => {
        const textToSearch = `${resident.first_name} ${resident.last_name} ${resident.room_number} ${resident.status}`;
        return textToSearch.toLowerCase().includes(searchPhrase);
      });
    } else {
      this.filteredResidents = this.residents;
    }
  }

  changeSort(columnName: string) {
    // Check if we are sorting the currently sorted column
    if (this.sort.columnName === columnName) {
      // Change sort direction if the current column is already sorted
      this.sort.direction = this.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      // Change the sort direction back to asc if we changed the column being sorted
      this.sort.columnName = columnName;
      this.sort.direction = 'asc';
    }

    // Sort the data based on the sort.columnName and sort.direction properties
    this.residents.sort((a, b) => {
      const aValue =
        this.sort.columnName === 'name'
          ? `${a['last_name']}, ${a['first_name']}`
          : a[this.sort.columnName] || '';
      const bValue =
        this.sort.columnName === 'name'
          ? `${b['last_name']}, ${b['first_name']}`
          : b[this.sort.columnName] || '';
      return (this.sort.direction === 'asc' ? 1 : -1) * aValue.localeCompare(bValue);
    });
  }

  
  profileImageForResident(resident) {
    return this.residentService.getResidentProfileImagePath(resident);
  }
}
