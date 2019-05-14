import * as _ from 'lodash';
import * as moment from 'moment';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { IApolloDevice } from './../../model/device/apollo-devices';
import { ApolloDevices } from '../../model/device/apollo-devices';
import { allProducts } from '../../model/content/base-content';
import { Account } from '../../model/account/account';
import { AccountService } from '../account/account.service';
import { Device } from '../../model/device/device';
import { DeviceService } from '../device/device.service';
import { Facility } from '../../model/facility/facility';
import { FacilityService } from '../facility/facility.service';
import { Resident, RESIDENT_STATUS_ACTIVE } from '../../model/resident/resident';
import { ResidentService } from '../resident/resident.service';
import {
  DashboardApiService,
  IAccountFacilitiesWithUsage,
  IHasProducts,
  IAccountFacilitiesTotalUsage,
  ISelectedRange,
  IChartData,
  IContentReport,
  IPieChartData,
  IResidentQuickUsage,
  SELECTED_RANGE_FOR_NAMES
} from '../dashboard-api/dashboard-api.service';
import { ISortableReport } from '../../shared/components/sortable-report/sortable-report.component';
import { DeviceStatus, DeviceStatusFactory } from '../../model/device/device-status';

export interface IAccountDashboard {
  accountName: string;
  firstYear: number;
  accountProducts: IHasProducts;
  drillDownChart: IChartData;
  facilitiesReport: ISortableReport[];
  contentPieChart: IPieChartData;
  contentAccessedReport: IContentReport;
}

export interface IFacilityDashboard {
  accountName: string;
  facilityName: string;
  firstYear: number;
  facilityProducts: IHasProducts;
  drillDownChart: IChartData;
  residentCount: number;
  residentsReport: ISortableReport[];
  nonApolloDeviceCount: number;
  devicesReport: ISortableReport[];
  contentPieChart: IPieChartData;
  contentAccessedReport: IContentReport;
}

export interface IResidentDashboard {
  resident: Resident;
  firstYear: number;
  residentProducts: IHasProducts;
  quickUsage: IResidentQuickUsage;
  drillDownChart: IChartData;
  contentPieChart: IPieChartData;
  contentAccessedReport: IContentReport;
}

interface IFacilityReport {
  id: string;
  name: string;
  nameLink: string[];
  residentCount: number;
  residentsWithUsageCount: number;
  deviceCount: number;
  devicesWithUsageCount: number;
  averageUsage: number;
}

interface IResidentReport {
  id: string;
  name: string;
  nameLink?: string[];
  status: string;
  roomNumber: string;
  averageUsage: number;
  statusStyle: string;
}

interface IDeviceReport {
  id: string;
  serialNumber: string;
  serialNumberLink?: string[];
  nickname: string;
  external_nickname: string;
  lastSync: string;
  timeSinceLastSync: string;
  timeSinceLastSyncStyle: string;
  averageUsage: number;
}

@Injectable()
export class DashboardService {
  private cache = {};
  private observableCache = {};

  constructor(
    private accountService: AccountService,
    private dashboardApiService: DashboardApiService,
    private deviceService: DeviceService,
    private facilityService: FacilityService,
    private residentService: ResidentService
  ) {}

  getAccountDashboard(
    accountId: string,
    selectedRange: ISelectedRange
  ): Observable<IAccountDashboard> {
    const cacheKey = this.buildCacheKey('getAccountDashboard', accountId, selectedRange);

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const docsObservable = Observable.forkJoin(
      this.accountService.getAccount(accountId),
      this.facilityService.getAccountFacilities(accountId),
      this.deviceService.getDevicesByAccountId(accountId),
      this.residentService.getAllResidents()
    ).flatMap(
      ([account, facilities, devices, residents]: [Account, Facility[], Device[], Resident[]]) => {
        return Observable.of({
          account,
          facilities,
          residents,
          devices
        });
      }
    );

    const analyticsObservable1 = Observable.forkJoin(
      this.dashboardApiService.getFirstYear(accountId),
      this.dashboardApiService.getProducts(accountId),
      this.dashboardApiService.getDrillDownChartUsageData(accountId, selectedRange),
      this.dashboardApiService.getAccountFacilitiesWithUsage(accountId, selectedRange),
      this.dashboardApiService.getAccountFacilitiesTotalUsage(accountId, selectedRange)
    ).flatMap(
      ([
        firstYear,
        accountProducts,
        drillDownChartData,
        accountFacilitiesWithUsage,
        accountFacilitiesTotalUsage
      ]: [
        number,
        IHasProducts,
        IChartData,
        IAccountFacilitiesWithUsage,
        IAccountFacilitiesTotalUsage
      ]) => {
        return Observable.of({
          firstYear,
          accountProducts,
          drillDownChartData,
          accountFacilitiesWithUsage,
          accountFacilitiesTotalUsage
        });
      }
    );

    const analyticsObservable2 = Observable.forkJoin(
      this.dashboardApiService.getContentPieChartData(accountId, selectedRange),
      this.dashboardApiService.getContentReportData(accountId, selectedRange)
    ).flatMap(([contentPieChartData, contentReportData]: [IPieChartData, IContentReport]) => {
      return Observable.of({ contentPieChartData, contentReportData });
    });

    this.observableCache[cacheKey] = Observable.forkJoin(
      docsObservable,
      analyticsObservable1,
      analyticsObservable2
    )
      .flatMap(
        ([accountData, analytics1, analytics2]: [
          { account: Account; facilities: Facility[]; devices: Device[]; residents: Resident[] },
          {
            firstYear: number;
            accountProducts: IHasProducts;
            drillDownChartData: IChartData;
            accountFacilitiesWithUsage: IAccountFacilitiesWithUsage;
            accountFacilitiesTotalUsage: IAccountFacilitiesTotalUsage;
          },
          {
            contentPieChartData: IPieChartData;
            contentReportData: IContentReport;
          }
        ]) => {
          const accountName = accountData.account.profile.account_name;
          const devices = analytics1.accountProducts.hasApolloData
            ? [...accountData.devices, ...ApolloDevices.filter(d => d.account_id === accountId)]
            : accountData.devices;

          const facilitiesReport = this.buildFacilitiesList(
            selectedRange,
            accountData.facilities,
            devices,
            accountData.residents,
            analytics1.accountFacilitiesWithUsage,
            analytics1.accountFacilitiesTotalUsage
          );

          const drillDownChart = {
            data: analytics1.drillDownChartData.data.map(
              (item: [string, number], index: number) => {
                let value = item[1];
                if (devices.length > 1) {
                  value = value / devices.length;
                }
                if (selectedRange.for === SELECTED_RANGE_FOR_NAMES.YEAR) {
                  const daysInMonth = this.daysInMonthSoFar(selectedRange.date.year(), index);
                  value = value / daysInMonth;
                }
                const result: [string, number] = [item[0], value];
                return result;
              }
            )
          };

          this.cache[cacheKey] = {
            accountName,
            firstYear: analytics1.firstYear,
            accountProducts: analytics1.accountProducts,
            drillDownChart,
            facilitiesReport,
            contentPieChart: analytics2.contentPieChartData,
            contentAccessedReport: analytics2.contentReportData
          };
          return Observable.of(this.cache[cacheKey]);
        }
      )
      .share();

    return this.observableCache[cacheKey];
  }

  getFacilityDashboard(
    accountId: string,
    facilityId: string,
    selectedRange: ISelectedRange
  ): Observable<IFacilityDashboard> {
    const cacheKey = this.buildCacheKey('getFacilityDashboard', facilityId, selectedRange);

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const docsObservable = Observable.forkJoin(
      this.accountService.getAccount(accountId),
      this.facilityService.getFacility(facilityId),
      this.deviceService.getDevicesByFacilityId(facilityId),
      this.deviceService.getDeviceStatusesByFacilityId(facilityId),
      this.residentService.getAllResidentsForFacility(facilityId)
    ).flatMap(
      ([account, facility, devices, deviceStatuses, residents]: [
        Account,
        Facility,
        Device[],
        DeviceStatus[],
        Resident[]
      ]) => {
        return Observable.of({
          account,
          facility,
          residents,
          devices,
          deviceStatuses
        });
      }
    );

    const analyticsObservable1 = Observable.forkJoin(
      this.dashboardApiService.getFirstYear(facilityId),
      this.dashboardApiService.getProducts(facilityId),
      this.dashboardApiService.getDrillDownChartUsageData(facilityId, selectedRange),
      this.dashboardApiService.getFacilityResidentDeviceUsage(facilityId, selectedRange)
    ).flatMap(
      ([firstYear, facilityProducts, drillDownChartData, residentDeviceUsage]: [
        number,
        IHasProducts,
        IChartData,
        { [id: string]: number }
      ]) => {
        return Observable.of({
          firstYear,
          facilityProducts,
          drillDownChartData,
          residentDeviceUsage
        });
      }
    );

    const analyticsObservable2 = Observable.forkJoin(
      this.dashboardApiService.getContentPieChartData(facilityId, selectedRange),
      this.dashboardApiService.getContentReportData(facilityId, selectedRange)
    ).flatMap(([contentPieChartData, contentReportData]: [IPieChartData, IContentReport]) => {
      return Observable.of({ contentPieChartData, contentReportData });
    });

    this.observableCache[cacheKey] = Observable.forkJoin(
      docsObservable,
      analyticsObservable1,
      analyticsObservable2
    )
      .flatMap(
        ([accountData, analytics1, analytics2]: [
          {
            account: Account;
            facility: Facility;
            devices: Device[];
            deviceStatuses: DeviceStatus[];
            residents: Resident[];
          },
          {
            firstYear: number;
            facilityProducts: IHasProducts;
            drillDownChartData: IChartData;
            residentDeviceUsage: { [id: string]: number };
          },
          {
            contentPieChartData: IPieChartData;
            contentReportData: IContentReport;
          }
        ]) => {
          const accountName = accountData.account.profile.account_name;
          const facilityName = accountData.facility.profile.name;

          let devices: (Device | IApolloDevice)[] = accountData.devices.filter(
            d =>
              selectedRange.productFilter === allProducts ||
              d.product.toLowerCase() === selectedRange.productFilter
          );
          const nonApolloDeviceCount = devices.length;
          devices = analytics1.facilityProducts.hasApolloData
            ? [...devices, ...ApolloDevices.filter(d => d.facility_id === facilityId)]
            : devices;

          const drillDownChart = {
            data: analytics1.drillDownChartData.data.map(
              (item: [string, number], index: number) => {
                let value = item[1];
                const deviceCount =
                  selectedRange.productFilter === 'all'
                    ? devices.length
                    : devices.filter(
                        d => d.product.toLowerCase() === selectedRange.productFilter.toLowerCase()
                      ).length;
                if (deviceCount > 1) {
                  value = value / deviceCount;
                }
                if (selectedRange.for === SELECTED_RANGE_FOR_NAMES.YEAR) {
                  const daysInMonth = this.daysInMonthSoFar(selectedRange.date.year(), index);
                  value = value / daysInMonth;
                }
                const result: [string, number] = [item[0], value];
                return result;
              }
            )
          };

          const periodCount = this.calculatePeriodDivisor(selectedRange);
          const residentReportPeriodCount =
            selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY ? 1 : periodCount;
          const deviceReportPeriodCount =
            selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY ? 1 : periodCount;

          const residentCount = accountData.residents.length;
          const residentsReport: IResidentReport[] = [
            { _id: 'guest', first_name: '', last_name: '', room_number: '', status: '' },
            ...accountData.residents
          ]
            .map(resident => {
              let statusStyle;
              if (resident._id === 'guest') {
                statusStyle = '';
              } else if (resident.status === RESIDENT_STATUS_ACTIVE || resident.status === '') {
                statusStyle = 'label label-success';
              } else {
                statusStyle = 'label label-warning';
              }

              const usage = analytics1.residentDeviceUsage[resident._id] || 0;
              const report: IResidentReport = {
                id: resident._id,
                name:
                  resident._id === 'guest'
                    ? 'Guest'
                    : `${resident.last_name}, ${resident.first_name}`,
                nameLink:
                  resident._id === 'guest'
                    ? null
                    : ['/account', accountId, 'facility', facilityId, 'resident', resident._id],
                status: resident.status || '',
                statusStyle: statusStyle,
                roomNumber: resident.room_number || null,
                averageUsage: usage / residentReportPeriodCount
              };
              return report;
            })
            .sort((a, b) => b.averageUsage - a.averageUsage);

          const otherDevice = {
            _id: 'Other',
            account_id: '',
            facility_id: '',
            nickname: '',
            external_nickname: '',
            product: '',
            serial_number: 'Other'
          };

          const devicesReport: IDeviceReport[] = [otherDevice, ...devices]
            .filter(
              d =>
                selectedRange.productFilter === 'all' ||
                d.product.toLowerCase() === selectedRange.productFilter.toLowerCase() ||
                d._id === 'Other'
            )
            .map(device => {
              const status =
                accountData.deviceStatuses.find(ds => ds.device_id === device._id) ||
                DeviceStatusFactory.createFromDevice(device as Device);
              const isApollo = _.get(device, 'isApollo', false);

              const statusLastSync = moment(status.last_sync);
              const statusTimeSinceLastSync = statusLastSync.diff(moment(), 'seconds', true) || 0;
              let lastSync = 'Not Found';
              let timeSinceLastSync = 'Not Found';
              if (!isApollo && device.serial_number !== 'Other' && statusLastSync.isValid()) {
                lastSync = statusLastSync.format('MMMM Do YYYY, h:mm:ss a');
                timeSinceLastSync = statusLastSync.fromNow();
              }

              let timeSinceLastSyncStyle = '';
              if (!statusLastSync.isValid() || statusTimeSinceLastSync <= -604800) {
                // Red text for no sync time or no sync over the last sync 7+ days
                timeSinceLastSyncStyle = 'text-danger';
              } else if (statusTimeSinceLastSync <= -172800) {
                // Yellow text for no sync over the last 2+ days
                timeSinceLastSyncStyle = 'text-warning';
              }

              const usage = analytics1.residentDeviceUsage[device._id] || 0;
              const report: IDeviceReport = {
                id: device._id,
                serialNumber: isApollo ? '' : device.serial_number,
                serialNumberLink:
                  isApollo || device.serial_number === 'Other'
                    ? null
                    : ['/account', accountId, 'facility', facilityId, 'devices', device._id],
                nickname: device.nickname,
                external_nickname: device.external_nickname,
                lastSync,
                timeSinceLastSync,
                timeSinceLastSyncStyle,
                averageUsage: usage / deviceReportPeriodCount
              };
              return report;
            })
            .sort((a, b) => b.averageUsage - a.averageUsage);

          this.cache[cacheKey] = {
            accountName,
            facilityName,
            firstYear: analytics1.firstYear,
            facilityProducts: analytics1.facilityProducts,
            drillDownChart,
            residentCount,
            residentsReport,
            nonApolloDeviceCount,
            devicesReport,
            contentPieChart: analytics2.contentPieChartData,
            contentAccessedReport: analytics2.contentReportData
          };
          return Observable.of(this.cache[cacheKey]);
        }
      )
      .share();

    return this.observableCache[cacheKey];
  }

  getResidentDashboard(
    residentId: string,
    selectedRange: ISelectedRange
  ): Observable<IResidentDashboard> {
    const cacheKey = this.buildCacheKey('getResidentDashboard', residentId, selectedRange);

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const residentObservable = this.residentService.getResident(residentId);
    const quickUsageObservable = this.dashboardApiService.getResidentQuickUsage(residentId);
    const analyticsObservable1 = Observable.forkJoin(
      this.dashboardApiService.getFirstYear(residentId),
      this.dashboardApiService.getProducts(residentId),
      this.dashboardApiService.getDrillDownChartUsageData(residentId, selectedRange)
    ).flatMap(
      ([firstYear, residentProducts, drillDownChartData]: [number, IHasProducts, IChartData]) => {
        return Observable.of({
          firstYear,
          residentProducts,
          drillDownChartData
        });
      }
    );

    const analyticsObservable2 = Observable.forkJoin(
      this.dashboardApiService.getContentPieChartData(residentId, selectedRange),
      this.dashboardApiService.getContentReportData(residentId, selectedRange)
    ).flatMap(([contentPieChartData, contentReportData]: [IPieChartData, IContentReport]) => {
      return Observable.of({ contentPieChartData, contentReportData });
    });

    this.observableCache[cacheKey] = Observable.forkJoin(
      residentObservable,
      quickUsageObservable,
      analyticsObservable1,
      analyticsObservable2
    )
      .flatMap(
        ([resident, quickUsage, analytics1, analytics2]: [
          Resident,
          IResidentQuickUsage,
          {
            firstYear: number;
            residentProducts: IHasProducts;
            drillDownChartData: IChartData;
          },
          {
            contentPieChartData: IPieChartData;
            contentReportData: IContentReport;
          }
        ]) => {
          const drillDownChart = {
            data: analytics1.drillDownChartData.data.map(
              (item: [string, number], index: number) => {
                let value = item[1];
                if (selectedRange.for === SELECTED_RANGE_FOR_NAMES.YEAR) {
                  const daysInMonth = this.daysInMonthSoFar(selectedRange.date.year(), index);
                  value = value / daysInMonth;
                }
                const result: [string, number] = [item[0], value];
                return result;
              }
            )
          };

          this.cache[cacheKey] = {
            resident,
            quickUsage,
            firstYear: analytics1.firstYear,
            residentProducts: analytics1.residentProducts,
            drillDownChart,
            contentPieChart: analytics2.contentPieChartData,
            contentAccessedReport: analytics2.contentReportData
          };
          return Observable.of(this.cache[cacheKey]);
        }
      )
      .share();

    return this.observableCache[cacheKey];
  }

  // Days in the month that are not in the future
  private daysInMonthSoFar(year: number, month: number): number {
    const daysInMonth =
      moment().year() === year && moment().month() === month
        ? moment().date()
        : moment({ year: year, month: month, date: 1 })
            .add(1, 'month')
            .subtract(1, 'day')
            .date();
    return daysInMonth;
  }

  private calculatePeriodDivisor(selectedRange: ISelectedRange): number {
    if (selectedRange.for === SELECTED_RANGE_FOR_NAMES.YEAR) {
      if (selectedRange.date.year() === moment().year()) {
        return moment().dayOfYear();
      }

      return moment({
        year: selectedRange.date.year(),
        month: 11,
        date: 31
      }).dayOfYear();
    }

    if (selectedRange.for === SELECTED_RANGE_FOR_NAMES.MONTH) {
      return this.daysInMonthSoFar(selectedRange.date.year(), selectedRange.date.month());
    }

    if (selectedRange.for === SELECTED_RANGE_FOR_NAMES.DAY) {
      return 24;
    }

    // else it is a last week or this week
    return 7;
  }

  private buildCacheKey(
    functionName: string,
    accountId: string,
    selectedRange?: ISelectedRange
  ): string {
    const range = selectedRange
      ? [selectedRange.for, selectedRange.date.format('YYYY-MM-DD'), selectedRange.productFilter]
      : [];
    return [functionName, accountId, ...range].join('-');
  }

  private buildFacilitiesList(
    selectedRange: ISelectedRange,
    facilities: Facility[],
    devices: (Device | IApolloDevice)[],
    residents: Resident[],
    withUsage: IAccountFacilitiesWithUsage,
    totalUsage: IAccountFacilitiesTotalUsage
  ): ISortableReport[] {
    const periodCount = this.calculatePeriodDivisor(selectedRange);
    return facilities
      .map((f: Facility) => {
        const facilityDevices = devices.filter(
          d =>
            d.facility_id === f._id &&
            (selectedRange.productFilter === allProducts ||
              d.product.toLowerCase() === selectedRange.productFilter)
        );
        const facilityResidents = residents.filter(r => r.facility_id === f._id);
        const residentCount = facilityResidents.length;
        const residentsWithUsageCount = _.get(withUsage[f._id], 'residentsWithUsage.length', 0);
        const facilityDeviceIds = facilityDevices.map(d => d._id);
        const deviceCount = facilityDevices.length;
        const devicesWithUsageCount = _.get(withUsage[f._id], 'devicesWithUsage', []).filter(id =>
          facilityDeviceIds.includes(id)
        ).length;
        const averageUsage = (totalUsage[f._id] || 0) / periodCount;

        const facilityReport: IFacilityReport = {
          id: f._id,
          name: f.profile.name,
          nameLink: ['/account', f.account_id, 'facility', f._id, 'dashboard'],
          residentCount: residentCount,
          residentsWithUsageCount: residentsWithUsageCount,
          deviceCount: deviceCount,
          devicesWithUsageCount: devicesWithUsageCount,
          averageUsage: deviceCount > 0 ? averageUsage / deviceCount : averageUsage
        };

        return facilityReport;
      })
      .sort((a, b) => Number(b.averageUsage) - Number(a.averageUsage))
      .map(
        (fr: IFacilityReport): ISortableReport => {
          const report: ISortableReport = {
            id: fr.id,
            name: fr.name,
            nameLink: fr.nameLink,
            residentCount: fr.residentCount,
            residentsWithUsageCount: fr.residentsWithUsageCount,
            deviceCount: fr.deviceCount,
            devicesWithUsageCount: fr.devicesWithUsageCount,
            averageUsage: fr.averageUsage
          };
          return report;
        }
      );
  }
}
