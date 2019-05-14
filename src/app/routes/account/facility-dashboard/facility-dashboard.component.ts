import * as moment from 'moment';
import * as _ from 'lodash';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ISelectedRange,
  SELECTED_RANGE_FOR_NAMES
} from './../../../core/dashboard-api/dashboard-api.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { allProducts } from '../../../model/content/base-content';
import { IFacilityDashboard, DashboardService } from '../../../core/dashboard/dashboard.service';
import { ISortColumn } from '../../../shared/components/sortable-report/sortable-report.component';

const COMPONENT_NAME = 'facility-dashboard';
const IN2L_SENIOR_LIVING_ACCOUNT_ID = '55-3345';

@Component({
  selector: 'app-facility-dashboard',
  styleUrls: ['./facility-dashboard.component.scss'],
  templateUrl: './facility-dashboard.component.html'
})
export class FacilityDashboardComponent implements OnDestroy, OnInit {
  updateInProgress = false;

  title = 'Community Usage';
  chartDescription = '';

  accountId: string;
  facilityId: string;
  dashboardData: IFacilityDashboard;
  emptyDashboardData: IFacilityDashboard = {
    accountName: '',
    facilityName: '',
    firstYear: moment().year(),
    facilityProducts: {
      hasApolloData: false,
      hasEngageData: false,
      hasFocusData: false,
      hasRehabData: false
    },
    drillDownChart: { data: [] },
    residentCount: 0,
    residentsReport: [],
    nonApolloDeviceCount: 0,
    devicesReport: [],
    contentPieChart: { data: [] },
    contentAccessedReport: { data: [] }
  };
  selectedRange: ISelectedRange = {
    for: 'year',
    date: moment(),
    productFilter: allProducts
  };

  residentsReportColumns: ISortColumn[] = [
    {
      title: 'Resident Name',
      key: 'name',
      sort: '',
      type: 'string'
    },
    {
      title: 'Current Status',
      key: 'status',
      sort: '',
      type: 'string',
      styled: true
    },
    {
      title: 'Room Number',
      key: 'roomNumber',
      sort: '',
      type: 'number'
    },
    {
      title: 'Average Daily Usage (hrs)',
      key: 'averageUsage',
      sort: 'desc',
      type: 'number',
      toFixed: 2
    }
  ];

  devicesReportColumns: ISortColumn[] = [
    {
      title: 'Serial Number',
      key: 'serialNumber',
      sort: '',
      type: 'string'
    },
    {
      title: 'Device ID',
      key: 'nickname',
      sort: '',
      type: 'string'
    },
    {
      title: 'Nickname',
      key: 'external_nickname',
      sort: '',
      type: 'string'
    },
    {
      title: 'Last Sync',
      key: 'lastSync',
      sort: '',
      type: 'number'
    },
    {
      title: 'Time Since Last Sync',
      key: 'timeSinceLastSync',
      sort: '',
      type: 'number',
      styled: true
    },
    {
      title: 'Average Daily Usage (hrs)',
      key: 'averageUsage',
      sort: 'desc',
      type: 'number',
      toFixed: 2
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private loaderService: LoaderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.dashboardData = this.emptyDashboardData;
    this.route.params.subscribe((params: { id: string; facility_id: string }) => {
      this.accountId = params.id;
      this.facilityId = params.facility_id;

      this.update();
    });
  }

  ngOnDestroy() {
    this.accountId = null;
    this.dashboardData = this.emptyDashboardData;
  }

  update() {
    if (!this.accountId || !this.facilityId || this.updateInProgress) {
      return;
    }

    this.updateInProgress = true;

    this.loaderService.start(COMPONENT_NAME);

    this.chartDescription =
      this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY
        ? 'Average Hourly Usage Per Device'
        : 'Average Daily Usage Per Device';

    this.residentsReportColumns[this.residentsReportColumns.length - 1].title =
      this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY
        ? 'Total Usage (hrs)'
        : 'Average Daily Usage (hrs)';

    this.devicesReportColumns[this.devicesReportColumns.length - 1].title =
      this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY
        ? 'Total Usage (hrs)'
        : 'Average Daily Usage (hrs)';

    this.dashboardService
      .getFacilityDashboard(this.accountId, this.facilityId, this.selectedRange)
      .subscribe((dashboardData: IFacilityDashboard) => {
        this.dashboardData = dashboardData;
        if (this.accountId === IN2L_SENIOR_LIVING_ACCOUNT_ID) {
          this.dashboardData.devicesReport.forEach(device => {
            if (device.id === 'Other') {
              return;
            }

            if (device['lastSync'] === 'Not Found') {
              device['lastSync'] = moment()
                .subtract(6, 'day')
                .format('MMMM Do, YYYY, H:m:s a');
              device['timeSinceLastSync'] = '6 days ago';
              device['timeSinceLastSyncStyle'] = 'text-warning';
            }
          });
        }
        this.loaderService.stop(COMPONENT_NAME);
        this.updateInProgress = false;
      });
  }

  rangeChanged(newRange: ISelectedRange) {
    if (
      newRange.for !== this.selectedRange.for ||
      !newRange.date.isSame(this.selectedRange.date) ||
      newRange.productFilter !== this.selectedRange.productFilter
    ) {
      this.selectedRange = newRange;
      this.update();
    }
  }
}
