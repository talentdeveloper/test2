import * as moment from 'moment';
import * as _ from 'lodash';

import { ActivatedRoute } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { BreadcrumbService } from './../../../core/breadcrumb/breadcrumb.service';
import { ResidentService } from './../../../core/resident/resident.service';
import {
  ISelectedRange,
  SELECTED_RANGE_FOR_NAMES
} from './../../../core/dashboard-api/dashboard-api.service';
import { allProducts } from './../../../model/content/base-content';
import { LoaderService } from '../../../core/loader/loader.service';
import { Resident } from '../../../model/resident/resident';
import { DashboardService, IResidentDashboard } from '../../../core/dashboard/dashboard.service';
import { ResidentContact } from '../../../model/resident/resident-contact';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';

const COMPONENT_NAME = 'view-resident';

@Component({
  selector: 'app-view-resident',
  styleUrls: ['./view-resident.component.scss'],
  templateUrl: './view-resident.component.html'
})
export class ViewResidentComponent implements OnDestroy, OnInit {
  updateInProgress = false;

  title = 'Resident Usage';
  chartDescription = '';

  accountId: string;
  facilityId: string;
  residentId: string;
  resident: Resident = new Resident();

  dashboardData: IResidentDashboard;
  emptyDashboardData: IResidentDashboard = {
    resident: new Resident(),
    firstYear: moment().year(),
    residentProducts: {
      hasApolloData: false,
      hasEngageData: false,
      hasFocusData: false,
      hasRehabData: false
    },
    quickUsage: { lastWeekUsage: 0, thisWeekUsage: 0, averageDailyUsage: 0 },
    drillDownChart: { data: [] },
    contentPieChart: { data: [] },
    contentAccessedReport: { data: [] }
  };
  selectedRange: ISelectedRange = {
    for: 'year',
    date: moment(),
    productFilter: allProducts
  };

  charts = {
    weekOverWeekChange: '',
    weekOverWeekBars: {
      plot: null,
      dataset: [{ data: [] }],
      options: {
        series: {
          bars: {
            show: true,
            align: 'center',
            barWidth: 0.75,
            fill: true,
            fillColor: {
              colors: ['#75A9E5', '#527598']
            },
            lineWidth: 0,
            topLabels: true,
            topLabelUnit: 'hrs'
          },
          lines: { show: false },
          points: { show: false },
          splines: { show: false },
          color: '#75A9E5'
        },
        grid: {
          borderColor: '#eee',
          borderWidth: 1,
          clickable: false,
          hoverable: false,
          backgroundColor: '#fcfcfc'
        },
        tooltip: false,
        xaxis: {
          tickColor: '#fcfcfc',
          mode: 'categories'
        },
        yaxis: {
          min: 0,
          tickColor: '#eee',
          tickFormatter: v => `${(v || 0).toFixed(1)} hrs`,
          ticks: axis => {
            // This code is modified from the default tick generator in the flot code
            const maxDec = axis.options.tickDecimals;
            let dec = -Math.floor(Math.log(axis.delta) / Math.LN10);

            if (maxDec != null && dec > maxDec) {
              dec = maxDec;
            }

            const magn = Math.pow(10, -dec);
            const norm = axis.delta / magn; // norm is between 1.0 and 10.0
            let size;
            const ticks = [];
            let start;
            let i = 0;
            let v = Number.NaN;
            let prev;

            if (norm < 1.5) {
              size = 1;
            } else if (norm < 3) {
              size = 2;
              // special case for 2.5, requires an extra decimal
              if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                size = 2.5;
                ++dec;
              }
            } else if (norm < 7.5) {
              size = 5;
            } else {
              size = 10;
            }

            size *= magn;

            if (axis.options.minTickSize != null && size < axis.options.minTickSize) {
              size = axis.options.minTickSize;
            }

            axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
            axis.tickSize = axis.options.tickSize || size;

            function floorInBase(n, base) {
              return base * Math.floor(n / base);
            }

            start = floorInBase(axis.min, axis.tickSize);

            do {
              prev = v;
              v = start + i * axis.tickSize;
              ticks.push(v);
              ++i;
            } while (v < axis.max && v !== prev);

            // if the largest tick value is less than 0.5 then set the ticks to 0 to 0.5
            if (ticks[ticks.length - 1] < 0.5) {
              return [0, 0.1, 0.2, 0.3, 0.4, 0.5];
            }

            return ticks;
          }
        },
        shadowSize: 0
      }
    },
    weekOverWeekLine: {
      plot: null,
      dataset: [{ data: [] }],
      options: {
        series: {
          bars: { show: false },
          lines: {
            show: true
          },
          points: {
            show: true,
            fill: true,
            fillColor: '#27c24c',
            radius: 2
          },
          splines: { show: false },
          color: '#27c24c'
        },
        grid: {
          borderColor: '#eee',
          borderWidth: 1,
          clickable: false,
          hoverable: false,
          backgroundColor: '#fcfcfc'
        },
        tooltip: false,
        xaxis: {
          ticks: [[0, ''], [1, '']],
          mode: 'categories'
        },
        yaxis: {
          min: 0,
          tickColor: '#eee',
          tickFormatter: v => `${(v || 0).toFixed(1)} hrs`,
          ticks: axis => {
            // This code is modified from the default tick generator in the flot code
            const maxDec = axis.options.tickDecimals;
            let dec = -Math.floor(Math.log(axis.delta) / Math.LN10);

            if (maxDec != null && dec > maxDec) {
              dec = maxDec;
            }

            const magn = Math.pow(10, -dec);
            const norm = axis.delta / magn; // norm is between 1.0 and 10.0
            let size;
            const ticks = [];
            let start;
            let i = 0;
            let v = Number.NaN;
            let prev;

            if (norm < 1.5) {
              size = 1;
            } else if (norm < 3) {
              size = 2;
              // special case for 2.5, requires an extra decimal
              if (norm > 2.25 && (maxDec == null || dec + 1 <= maxDec)) {
                size = 2.5;
                ++dec;
              }
            } else if (norm < 7.5) {
              size = 5;
            } else {
              size = 10;
            }

            size *= magn;

            if (axis.options.minTickSize != null && size < axis.options.minTickSize) {
              size = axis.options.minTickSize;
            }

            axis.tickDecimals = Math.max(0, maxDec != null ? maxDec : dec);
            axis.tickSize = axis.options.tickSize || size;

            function floorInBase(n, base) {
              return base * Math.floor(n / base);
            }

            start = floorInBase(axis.min, axis.tickSize);

            do {
              prev = v;
              v = start + i * axis.tickSize;
              ticks.push(v);
              ++i;
            } while (v < axis.max && v !== prev);

            // if the largest tick value is less than 0.5 then set the ticks to 0 to 0.5
            if (ticks[ticks.length - 1] < 0.5) {
              return [0, 0.1, 0.2, 0.3, 0.4, 0.5];
            }

            return ticks;
          }
        },
        shadowSize: 0
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dashboardService: DashboardService,
    private residentService: ResidentService,
    private loaderService: LoaderService,
    private uiEventService: UiEventService
  ) {}

  ngOnInit() {
    this.dashboardData = this.emptyDashboardData;
    this.route.params.subscribe((v: { id: string; facility_id: string; resident_id: string }) => {
      this.accountId = v.id;
      this.facilityId = v.facility_id;
      this.residentId = v.resident_id;

      this.update();
    });
  }

  ngOnDestroy() {
    this.accountId = null;
    this.facilityId = null;
    this.residentId = null;
    this.dashboardData = this.emptyDashboardData;
    this.resident = new Resident();
  }

  update() {
    if (!this.accountId || !this.facilityId || !this.residentId || this.updateInProgress) {
      return;
    }

    this.updateInProgress = true;
    this.loaderService.start(COMPONENT_NAME);

    this.dashboardService
      .getResidentDashboard(this.residentId, this.selectedRange)
      .subscribe((dashboardData: IResidentDashboard) => {
        this.dashboardData = dashboardData;
        this.resident = dashboardData.resident;
        // update breadcrumb with accounnt information
        this.breadcrumbService.updateBreadcrumbs([
          { label: 'Account', url: `/account/${this.accountId}` },
          { label: 'Community', url: `/account/${this.accountId}/facility/${this.facilityId}` },
          {
            label: 'Residents',
            url: `/account/${this.accountId}/facility/${this.facilityId}/resident`
          },
          { label: `${this.resident.first_name} ${this.resident.last_name}`, url: '' }
        ]);

        this.chartDescription =
          this.selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY
            ? 'Average Hourly Usage Per Device'
            : 'Average Daily Usage Per Device';

        const { thisWeekUsage, lastWeekUsage, averageDailyUsage } = this.dashboardData.quickUsage;

        this.charts.weekOverWeekBars.dataset = [
          {
            data: [
              ['Average Daily Usage', averageDailyUsage],
              ['This Week Usage', thisWeekUsage],
              ['Last Week Usage', lastWeekUsage]
            ]
          }
        ];

        this.charts.weekOverWeekLine.dataset = [
          {
            data: [[0, lastWeekUsage], [1, thisWeekUsage]]
          }
        ];

        const change = thisWeekUsage - lastWeekUsage;
        this.charts.weekOverWeekChange =
          change < 0 ? '- ' + (-change).toFixed(1) : '+ ' + change.toFixed(1);

        this.loaderService.stop(COMPONENT_NAME);
        this.updateInProgress = false;
      });
  }
  // // --- quick usage chart functions ---

  weekOverWeekBarChartReady(event: { plot: any }) {
    this.charts.weekOverWeekBars.plot = event.plot;
  }

  weekOverWeekLineChartReady(event: { plot: any }) {
    this.charts.weekOverWeekLine.plot = event.plot;
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
  residentImageSrc() {
    return this.residentService.getResidentProfileImagePath(this.resident);
  }

  contactImageSrc(resident: Resident, contact: ResidentContact): string {
    return this.residentService.getContactImagePath(resident, contact.phone);
  }

  handleResidentStateClick() {
    if (this.resident.isActive()) {
      this.disableResident();
    } else {
      this.activateResident();
    }
  }

  // --- private functions ---

  private activateResident(): void {
    this.loaderService.start('view-resident');

    this.residentService.activateResident(this.resident).subscribe(
      (updatedResident: Resident) => {
        this.resident = updatedResident;
        this.showSuccessMessage(
          `${this.resident.first_name} ${this.resident.last_name} has been activated`
        );
      },
      error => {
        this.showErrorMessage(error);
      },
      () => {
        this.loaderService.stop('view-resident');
      }
    );
  }

  private disableResident(): void {
    this.loaderService.start('view-resident');

    this.residentService.disableResident(this.resident).subscribe(
      (updatedResident: Resident) => {
        this.resident = updatedResident;
        this.showSuccessMessage(
          `${this.resident.first_name} ${this.resident.last_name} has been disabled`
        );
      },
      error => {
        this.showErrorMessage(error);
      },
      () => {
        this.loaderService.stop('view-resident');
      }
    );
  }

  private showErrorMessage(message): void {
    this.uiEventService.dispatch(new ToasterMessage({ body: message, type: 'error' }));
  }

  private showSuccessMessage(message): void {
    this.uiEventService.dispatch(new ToasterMessage({ body: message, type: 'success' }));
  }
}
