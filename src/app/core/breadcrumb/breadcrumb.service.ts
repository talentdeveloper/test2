import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import {
  Event,
  Router,
  ActivatedRoute,
  NavigationEnd,
  PRIMARY_OUTLET,
  Params
} from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/filter';

import { Account } from '../../model/account/account';
import { AccountService } from './../account/account.service';
import { Device } from '../../model/device/device';
import { DeviceService } from '../device/device.service';
import { Facility } from '../../model/facility/facility';
import { FacilityService } from '../facility/facility.service';
import { IBreadcrumb } from './breadcrumb.service';
import { Resident } from '../../model/resident/resident';
import { ResidentService } from '../resident/resident.service';
import { UserService } from '../user/user.service';
import { IUser } from '../../model/user/user';

export interface IBreadcrumb {
  label: string;
  url: string;
}

export interface IRouteParameters {
  id?: string;
  facility_id?: string;
  device_id?: string;
  resident_id?: string;
  user_id?: string;
}

const ROUTE_DATA_BREADCRUMB_KEY = 'breadcrumb';
const ROUTE_DATA_BREADCRUMB_ARRAY_KEY = 'breadcrumbs';

@Injectable()
export class BreadcrumbService {
  breadcrumbs: Observable<IBreadcrumb[]>;
  private _breadcrumbs: BehaviorSubject<IBreadcrumb[]>;
  private breadcrumbStore: {
    breadcrumbs: IBreadcrumb[];
  };
  private homeBreadcrumb: IBreadcrumb;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private facilityService: FacilityService,
    private deviceService: DeviceService,
    private residentService: ResidentService,
    private userService: UserService
  ) {
    this.breadcrumbStore = { breadcrumbs: [] };
    this._breadcrumbs = <BehaviorSubject<IBreadcrumb[]>>(
      new BehaviorSubject(this.breadcrumbStore.breadcrumbs)
    );
    this.breadcrumbs = this._breadcrumbs.asObservable();

    // subscribe to the NavigationEnd event
    if (this.router.events) {
      this.router.events
        .filter(event => event instanceof NavigationEnd)
        .subscribe(event => {
          const routeBreadcrumbs = this.getBreadcrumbsForRoute(this.activatedRoute.root).filter(
            crumb => !!crumb.label
          );
          if (
            routeBreadcrumbs &&
            routeBreadcrumbs.length &&
            routeBreadcrumbs[0].label === 'Content Library'
          ) {
            return;
          }
          const params = this.getParams(this.activatedRoute.root);
          this.buildRouteParameterBreadcrumbs(params).subscribe((breadcrumbs: IBreadcrumb[]) =>
            this.updateBreadcrumbs(breadcrumbs.concat(routeBreadcrumbs))
          );
        });
    }
  }

  updateBreadcrumbs(breadcrumbs: IBreadcrumb[]) {
    if (breadcrumbs && breadcrumbs.length) {
      breadcrumbs[breadcrumbs.length - 1].url = '';
    }

    this.breadcrumbStore.breadcrumbs = breadcrumbs;
    this._breadcrumbs.next(Object.assign({}, this.breadcrumbStore).breadcrumbs);
  }

  private getParams(activatedRoute: ActivatedRoute, params: Params = {}): Params {
    const children: ActivatedRoute[] = activatedRoute.children;

    if (!children.length) {
      return params;
    }

    let newParams = params;
    for (const child of children) {
      if (child.outlet !== PRIMARY_OUTLET || !child.snapshot.params) {
        continue;
      }

      newParams = this.getParams(child, Object.assign({}, newParams, child.snapshot.params));
    }

    return newParams;
  }

  // based on: http://brianflove.com/2016/10/23/angular2-breadcrumb-using-router/
  private getBreadcrumbsForRoute(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: IBreadcrumb[] = []
  ): IBreadcrumb[] {
    // get the child routes
    const children: ActivatedRoute[] = route.children;

    // return if there are no more children
    if (children.length === 0) {
      return breadcrumbs;
    }

    // iterate over each children
    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      // verify primary route
      if (child.outlet !== PRIMARY_OUTLET) {
        continue;
      }

      // verify the custom data property "breadcrumb" is specified on the route
      if (!child.snapshot.data.hasOwnProperty(ROUTE_DATA_BREADCRUMB_KEY)) {
        return this.getBreadcrumbsForRoute(child, url, breadcrumbs);
      }

      // check for shortcut breadcrumbs key route
      if (child.snapshot.data.hasOwnProperty(ROUTE_DATA_BREADCRUMB_ARRAY_KEY)) {
        return child.snapshot.data[ROUTE_DATA_BREADCRUMB_ARRAY_KEY];
      }

      // get the route's URL segment
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');

      // append route URL to URL
      url += `/${routeURL}`;

      // add breadcrumb
      const breadcrumb: IBreadcrumb = {
        label: child.snapshot.data[ROUTE_DATA_BREADCRUMB_KEY],
        url: url
      };

      breadcrumbs.push(breadcrumb);

      // recursive
      return this.getBreadcrumbsForRoute(child, url, breadcrumbs);
    }
  }

  private buildRouteParameterBreadcrumbs(params: IRouteParameters): Observable<IBreadcrumb[]> {
    if (!params.id) {
      return Observable.of([]);
    }

    return Observable.forkJoin(
      params.id ? this.accountService.getAccount(params.id) : Observable.of(null),
      params.facility_id
        ? this.facilityService.getFacility(params.facility_id)
        : Observable.of(null),
      params.device_id ? this.deviceService.getDevice(params.device_id) : Observable.of(null),
      params.resident_id
        ? this.residentService.getResident(params.resident_id)
        : Observable.of(null),
      params.user_id ? this.userService.getUser(params.user_id) : Observable.of(null)
    ).flatMap(
      ([account, facility, device, resident, user]: [
        Account,
        Facility,
        Device,
        Resident,
        IUser
      ]) => {
        const crumbs = [];
        if (account) {
          crumbs.push({
            label: _.get(account, 'profile.account_name', ''),
            url: `/account/${params.id}/dashboard`
          });
        }

        if (facility) {
          crumbs.push({
            label: _.get(facility, 'profile.name', ''),
            url: `/account/${params.id}/facility/${params.facility_id}/dashboard`
          });
        }

        if (device) {
          crumbs.push({
            label: 'Device List',
            url: `/account/${params.id}/facility/${params.facility_id}/devices`
          });

          crumbs.push({
            label: _.get(device, 'nickname', _.get(device, 'serial_number', 'Device')),
            url: `/account/${params.id}/facility/${params.facility_id}/devices/${params.device_id}`
          });
        } else if (resident) {
          const firstName = _.get(resident, 'first_name', '');
          const lastName = _.get(resident, 'last_name', '');
          const name = `${firstName} ${lastName}`;

          crumbs.push({
            label: 'Resident List',
            url: `/account/${params.id}/facility/${params.facility_id}/resident`
          });

          crumbs.push({
            label: name,
            url: `/account/${params.id}/facility/${params.facility_id}/resident/${
              params.resident_id
            }`
          });
        } else if (user) {
          const firstName = _.get(user, 'first_name', '');
          const lastName = _.get(user, 'last_name', '');
          const name = `${firstName} ${lastName}`;

          if (params.id && params.facility_id) {
            crumbs.push({
              label: 'Staff List',
              url: `/account/${params.id}/facility/${params.facility_id}/staff`
            });

            crumbs.push({
              label: name,
              url: ''
            });
          } else {
            crumbs.push({
              label: 'User List',
              url: '/admin/user/list'
            });

            crumbs.push({
              label: name,
              url: ''
            });
          }
        }

        return Observable.of(crumbs);
      }
    );
  }
}
