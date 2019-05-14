import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface IFacilityReport {
  id: string;
  name: string;
  residentCount: number;
  residentsWithUsageCount: number;
  deviceCount: number;
  devicesWithUsageCount: number;
  averageUsage: number;
}

interface ISortColumn {
  title: string;
  name: string;
  sort: string;
  sortType: string;
}

@Component({
  selector: 'app-account-facilities-usage-report',
  styleUrls: ['./account-facilities-usage-report.component.scss'],
  templateUrl: './account-facilities-usage-report.component.html'
})
export class AccountFacilitiesUsageReportComponent {
  @Input()
  reportData: IFacilityReport[] = [];

  columns: ISortColumn[] = [
    {
      title: 'Facility Name',
      name: 'name',
      sort: '',
      sortType: 'string'
    },
    {
      title: '# of User Profiles',
      name: 'residentCount',
      sort: '',
      sortType: 'number'
    },
    {
      title: '# of User Profiles with Usage',
      name: 'residentsWithUsageCount',
      sort: '',
      sortType: 'number'
    },
    {
      title: '# of Devices',
      name: 'deviceCount',
      sort: '',
      sortType: 'number'
    },
    {
      title: '# of Devices with Usage',
      name: 'devicesWithUsageCount',
      sort: '',
      sortType: 'number'
    },
    {
      title: 'Average Daily Usage Per Device (hrs)',
      name: 'averageUsage',
      sort: 'desc',
      sortType: 'number'
    }
  ];
  config = {
    sorting: { columns: this.columns }
  };

  displayFullList = false;
  shortListSize = 5;

  displayedList() {
    const data = this.reportData || [];
    return this.displayFullList ? data : data.slice(0, this.shortListSize);
  }

  toggleListSize() {
    this.displayFullList = !this.displayFullList;
  }

  changeSort(sortColumn) {
    this.columns.forEach(c => (c.sort = c.name === sortColumn.name ? c.sort || 'asc' : ''));
    this.sortData(sortColumn);
  }

  sortData(sortColumn?: ISortColumn) {
    // apply sorting
    if (sortColumn) {
      this.reportData.sort((a, b) => {
        const val1 =
          sortColumn.sortType === 'string' && a[sortColumn.name]
            ? (a[sortColumn.name] || '').toLowerCase()
            : Number(a[sortColumn.name] || 0);
        const val2 =
          sortColumn.sortType === 'string' && b[sortColumn.name]
            ? (b[sortColumn.name] || '').toLowerCase()
            : Number(b[sortColumn.name] || 0);
        if (val1 > val2) {
          return sortColumn.sort === 'desc' ? -1 : 1;
        } else if (val1 < val2) {
          return sortColumn.sort === 'asc' ? -1 : 1;
        }
        return 0;
      });
    }
  }
}
