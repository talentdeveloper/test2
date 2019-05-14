import * as moment from 'moment';
import * as _ from 'lodash';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { allProducts } from './../../../model/content/base-content';
import {
  ISelectedRange,
  SELECTED_RANGE_FOR_NAMES
} from '../../../core/dashboard-api/dashboard-api.service';
import { DashboardService, IAccountDashboard } from '../../../core/dashboard/dashboard.service';
import { LoaderService } from '../../../core/loader/loader.service';
import { ISortColumn } from '../../../shared/components/sortable-report/sortable-report.component';

const COMPONENT_NAME = 'account-dashboard';

@Component({
  selector: 'app-account-dashboard',
  styleUrls: ['./account-dashboard.component.scss'],
  templateUrl: './account-dashboard.component.html'
})
export class AccountDashboardComponent implements OnDestroy, OnInit {
  accountDocsLoaded = false;
  updateInProgress = false;

  accountId: string;
  dashboardData: IAccountDashboard;
  emptyDashboardData: IAccountDashboard = {
    accountName: '',
    firstYear: moment().year(),
    accountProducts: {
      hasApolloData: false,
      hasEngageData: false,
      hasFocusData: false,
      hasRehabData: false
    },
    drillDownChart: { data: [] },
    facilitiesReport: [],
    contentPieChart: { data: [] },
    contentAccessedReport: { data: [] }
  };
  selectedRange: ISelectedRange = {
    for: 'year',
    date: moment(),
    productFilter: allProducts
  };
  title = 'Account Usage';
  chartDescription = '';

  // CommunityReport
  facilityReportColumns: ISortColumn[] = [
    {
      title: 'Community Name',
      key: 'name',
      sort: '',
      type: 'string'
    },
    {
      title: '# of User Profiles',
      key: 'residentCount',
      sort: '',
      type: 'number'
    },
    {
      title: '# of User Profiles with Usage',
      key: 'residentsWithUsageCount',
      sort: '',
      type: 'number'
    },
    {
      title: '# of Devices',
      key: 'deviceCount',
      sort: '',
      type: 'number'
    },
    {
      title: '# of Devices with Usage',
      key: 'devicesWithUsageCount',
      sort: '',
      type: 'number'
    },
    {
      title: 'Average Daily Usage Per Device (hrs)',
      key: 'averageUsage',
      sort: 'desc',
      type: 'number',
      toFixed: 2
    }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private loaderService: LoaderService
  ) {}

  ngOnInit() {
    this.dashboardData = this.emptyDashboardData;
    this.activatedRoute.params.subscribe((params: { id: string }) => {
      this.accountId = params.id;

      this.update();
    });
  }

  ngOnDestroy() {
    this.accountId = null;
    this.dashboardData = this.emptyDashboardData;
  }

  update() {
    if (!this.accountId || this.updateInProgress) {
      return;
    }

    this.updateInProgress = true;

    this.loaderService.start(COMPONENT_NAME);

    this.chartDescription =
      this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY
        ? 'Average Hourly Usage Per Device'
        : 'Average Daily Usage Per Device';

    this.dashboardService
      .getAccountDashboard(this.accountId, this.selectedRange)
      .subscribe((dashboardData: IAccountDashboard) => {
        this.dashboardData = dashboardData;
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
