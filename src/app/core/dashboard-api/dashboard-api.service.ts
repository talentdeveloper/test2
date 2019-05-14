import * as moment from 'moment';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ConnectApiBaseService } from '../connect-api/connect-api-base.service';

export interface IHasProducts {
  hasApolloData: boolean;
  hasEngageData: boolean;
  hasFocusData: boolean;
  hasRehabData: boolean;
}

export const SELECTED_RANGE_FOR_NAMES = {
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day',
  HOUR: 'hour'
};

export interface ISelectedRange {
  for: string;
  date: moment.Moment;
  productFilter: string;
}

export interface IChartData {
  data: [string, number][];
}

export interface IPieChartData {
  data: { label: string; data: number }[];
}

export interface IAccountFacilitiesWithUsage {
  [facilityId: string]: {
    devicesWithUsage: string[];
    residentsWithUsage: string[];
  };
}

export interface IAccountFacilitiesTotalUsage {
  [facilityId: string]: number;
}

export interface IResidentQuickUsage {
  lastWeekUsage: number;
  thisWeekUsage: number;
  averageDailyUsage: number;
}

export interface IContentReport {
  data: {
    title: string;
    displayType: string;
    usageCount: number;
  }[];
}

@Injectable()
export class DashboardApiService extends ConnectApiBaseService {
  private cache = {};
  private observableCache = {};

  constructor(http: Http) {
    super(http);
  }

  /**
   * Analytics Routes
   */

  getFirstYear(id: string): Observable<number> {
    const cacheKey = this.buildCacheKey('getFirstYear', { id });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/firstyear/${id}`)
      .map(res => res.json())
      .mergeMap((data: { firstYear: number; createdAt: string }) => {
        this.cache[cacheKey] = data.firstYear;
        return Observable.of(this.cache[cacheKey]);
      })
      .share();

    return this.observableCache[cacheKey];
  }

  getProducts(id: string): Observable<IHasProducts> {
    const cacheKey = this.buildCacheKey('getProducts', { id });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/products/${id}`)
      .map(res => res.json())
      .mergeMap((data: { products: IHasProducts; createdAt: string }) => {
        this.cache[cacheKey] = data.products;
        return Observable.of(this.cache[cacheKey]);
      })
      .share();

    return this.observableCache[cacheKey];
  }

  getDrillDownChartUsageData(id: string, selectedRange: ISelectedRange): Observable<IChartData> {
    const cacheKey = this.buildCacheKey('getDrillDownChartUsageData', { id, selectedRange });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const queryString = `for=${selectedRange.for}&date=${selectedRange.date.format(
      'YYYY-MM-DD'
    )}&product=${selectedRange.productFilter}`;
    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/drilldownchart/${id}?${queryString}`)
      .map(res => res.json())
      .mergeMap((data: { drillDownChart: IChartData; createdAt: string }) => {
        this.cache[cacheKey] = { data: data.drillDownChart };
        return Observable.of(this.cache[cacheKey]);
      })
      .share();

    return this.observableCache[cacheKey];
  }

  getAccountFacilitiesWithUsage(
    accountId: string,
    selectedRange: ISelectedRange
  ): Observable<IAccountFacilitiesWithUsage> {
    const cacheKey = this.buildCacheKey('getAccountFacilitiesWithUsage', {
      id: accountId,
      selectedRange
    });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const queryString = `for=${selectedRange.for}&date=${selectedRange.date.format(
      'YYYY-MM-DD'
    )}&product=${selectedRange.productFilter}`;
    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/withusage/${accountId}?${queryString}`)
      .map(res => res.json())
      .mergeMap(
        (data: {
          facilities: {
            facilityId: string;
            devicesWithUsage: string[];
            residentsWithUsage: string[];
          }[];
        }) => {
          const withusage = data.facilities.reduce((result, facility) => {
            result[facility.facilityId] = {
              devicesWithUsage: facility.devicesWithUsage,
              residentsWithUsage: facility.residentsWithUsage
            };
            return result;
          }, {});
          this.cache[cacheKey] = withusage;
          return Observable.of(this.cache[cacheKey]);
        }
      )
      .share();

    return this.observableCache[cacheKey];
  }

  getAccountFacilitiesTotalUsage(
    accountId: string,
    selectedRange: ISelectedRange
  ): Observable<{ [facilityId: string]: number }> {
    const cacheKey = this.buildCacheKey('getAccountFacilitiesTotalUsage', {
      id: accountId,
      selectedRange
    });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const queryString = `for=${selectedRange.for}&date=${selectedRange.date.format(
      'YYYY-MM-DD'
    )}&product=${selectedRange.productFilter}`;
    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/totalfacilityusage/${accountId}?${queryString}`)
      .map(res => res.json())
      .mergeMap((data: { facilitiesUsage: IAccountFacilitiesTotalUsage; createdAt: string }) => {
        this.cache[cacheKey] = data.facilitiesUsage || {};
        return Observable.of(this.cache[cacheKey]);
      })
      .share();

    return this.observableCache[cacheKey];
  }

  getFacilityResidentDeviceUsage(
    facilityId: string,
    selectedRange: ISelectedRange
  ): Observable<{ [id: string]: number }> {
    const cacheKey = this.buildCacheKey('getAccountFacilitiesTotalUsage', {
      id: facilityId,
      selectedRange
    });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const queryString = `for=${selectedRange.for}&date=${selectedRange.date.format(
      'YYYY-MM-DD'
    )}&product=${selectedRange.productFilter}`;
    this.observableCache[cacheKey] = this.http
      .get(
        `${this.connectApiUrl}/dashboard/facilityresidentdeviceusage/${facilityId}?${queryString}`
      )
      .map(res => res.json())
      .mergeMap((data: { residentDeviceUsage: { [id: string]: number }; createdAt: string }) => {
        this.cache[cacheKey] = data.residentDeviceUsage || {};
        return Observable.of(this.cache[cacheKey]);
      })
      .share();

    return this.observableCache[cacheKey];
  }

  getResidentQuickUsage(residentId: string): Observable<IResidentQuickUsage> {
    const cacheKey = this.buildCacheKey('getResidentWeekOverWeekUsage', {
      id: residentId
    });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/residentquickusage/${residentId}`)
      .map(res => res.json())
      .mergeMap(
        (data: {
          residentQuickUsage: {
            lastWeekUsage: number;
            thisWeekUsage: number;
            averageDailyUsage: number;
          };
          createdAt: string;
        }) => {
          this.cache[cacheKey] = data.residentQuickUsage || {};
          return Observable.of(this.cache[cacheKey]);
        }
      )
      .share();

    return this.observableCache[cacheKey];
  }

  getContentPieChartData(id: string, selectedRange: ISelectedRange): Observable<IPieChartData> {
    const cacheKey = this.buildCacheKey('getContentPieChartData', {
      id,
      selectedRange
    });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const queryString = `for=${selectedRange.for}&date=${selectedRange.date.format(
      'YYYY-MM-DD'
    )}&product=${selectedRange.productFilter}`;
    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/contentpiechart/${id}?${queryString}`)
      .map(res => res.json())
      .mergeMap((data: { pieChartData: { label: string; data: number }[]; createdAt: string }) => {
        this.cache[cacheKey] = { data: data.pieChartData };
        return Observable.of(this.cache[cacheKey]);
      })
      .share();

    return this.observableCache[cacheKey];
  }

  getContentReportData(id: string, selectedRange: ISelectedRange): Observable<IContentReport> {
    const cacheKey = this.buildCacheKey('getContentReportData', {
      id,
      selectedRange
    });

    if (this.cache[cacheKey]) {
      return Observable.of(this.cache[cacheKey]);
    }

    if (this.observableCache[cacheKey]) {
      return this.observableCache[cacheKey];
    }

    const queryString = `for=${selectedRange.for}&date=${selectedRange.date.format(
      'YYYY-MM-DD'
    )}&product=${selectedRange.productFilter}`;
    this.observableCache[cacheKey] = this.http
      .get(`${this.connectApiUrl}/dashboard/contentreport/${id}?${queryString}`)
      .map(res => res.json())
      .mergeMap(
        (data: {
          contentUsageReport: { title: string; displayType: string; usageCount: number }[];
          createdAt: string;
        }) => {
          Observable.of({ data: data.contentUsageReport });
          this.cache[cacheKey] = { data: data.contentUsageReport };
          return Observable.of(this.cache[cacheKey]);
        }
      )
      .share();

    return this.observableCache[cacheKey];
  }

  /**
   * Helpers
   */

  private buildCacheKey(
    functionName: string,
    params: { id?: string; selectedRange?: ISelectedRange }
  ): string {
    const range = params.selectedRange
      ? [
          params.selectedRange.for,
          params.selectedRange.date.format('YYYY-MM-DD'),
          params.selectedRange.productFilter
        ]
      : [];
    return [functionName, params.id, ...range].join('-');
  }
}
