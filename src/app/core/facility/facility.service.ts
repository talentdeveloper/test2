import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Response, Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { DocTypeConstants } from '../../constants';
import { AuthenticationService } from '../authentication/authentication.service';
import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { Facility, FacilityFactory } from '../../model/facility/facility';
import { PortalAPIService } from '../portal-api/portal-api.service';
import { SyncGatewayService, ACCOUNT_BUCKET } from '../sync-gateway/sync-gateway.service';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { ConnectApiBaseService } from '../connect-api/connect-api-base.service';

@Injectable()
export class FacilityService extends ConnectApiBaseService {
  private facilities: Facility[] = null;
  private getAllFacilitiesObservable: Observable<Facility[]> = null;
  private refreshCache = false;

  constructor(
    private authenticationService: AuthenticationService,
    http: Http,
    private syncGatewayService: SyncGatewayService,
    private uiEventService: UiEventService
  ) {
    super(http);
    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      if (clearCacheMessage.clearAllCaches || clearCacheMessage.bucket === ACCOUNT_BUCKET) {
        this.clearCache();
      }
    });
  }

  clearCache() {
    this.refreshCache = true;
    this.getAllFacilitiesObservable = null;
  }

  getFacility(facilityId: string): Observable<Facility> {
    return this.getAllFacilities().flatMap(() =>
      Observable.of(this.facilities.find(f => f._id === facilityId))
    );
  }

  getRawFacility(facilityId: string): Observable<Facility> {
    return this.syncGatewayService
      .sendGetDocumentRequest(ACCOUNT_BUCKET, facilityId)
      .flatMap((facility: Facility) => {
        return this.updateCache(
          facilityId,
          this.createFacilityFromCouchbaseResult(facility),
          facility._rev
        );
      });
  }

  getAccountFacilities(accountId: string): Observable<Facility[]> {
    return this.getAllFacilities().flatMap(() =>
      Observable.of(this.facilities.filter(f => f.account_id === accountId))
    );
  }

  getRawFacilities(): Observable<Facility[]> {
    this.clearCache();
    return this.getAllFacilities();
  }

  getAllFacilities(): Observable<Facility[]> {
    if (!this.refreshCache && this.facilities && this.facilities.length) {
      return Observable.of(this.facilities);
    }

    if (!this.refreshCache && this.getAllFacilitiesObservable) {
      return this.getAllFacilitiesObservable;
    }

    this.getAllFacilitiesObservable = this.syncGatewayService
      .getAll(ACCOUNT_BUCKET)
      .flatMap((results: any[]) => {
        this.refreshCache = false;

        this.facilities = results
          .filter(d => d.doc_type === DocTypeConstants.DOC_TYPES.ACCOUNT.FACILITY)
          .map(item => this.createFacilityFromCouchbaseResult(item));

        this.getAllFacilitiesObservable = null;

        return Observable.of(this.facilities);
      });

    return this.getAllFacilitiesObservable;
  }

  createFacility(facility: Facility): Observable<Facility> {
    const facilityId = facility._id;

    facility.created_date = SyncGatewayService.formatDateForCouchbase();
    facility.created_by = this.authenticationService.getCurrentUserDocumentChangedByValue();
    facility.modified_date = SyncGatewayService.formatDateForCouchbase();
    facility.modified_by = this.authenticationService.getCurrentUserDocumentChangedByValue();

    return this.http
      .post(`${this.connectApiUrl}/portal/facilities`, facility, this.getHttpOptions())
      .mergeMap((response: Response) => {
        const newFacility = FacilityFactory.create(response.json());

        return this.updateCache(newFacility._id, newFacility, newFacility._rev);
      });
  }

  updateFacility(facility: Facility): Observable<Facility> {
    const facilityId = facility._id;

    facility.modified_date = SyncGatewayService.formatDateForCouchbase();
    facility.modified_by = this.authenticationService.getCurrentUserDocumentChangedByValue();

    return this.getAllFacilities()
      .flatMap(() => this.syncGatewayService.sendUpdateDocumentRequest(ACCOUNT_BUCKET, facility))
      .flatMap((result: any) => {
        return this.updateCache(facilityId, facility, result.rev);
      });
  }

  deleteFacility(facility: Facility): Observable<boolean> {
    return this.getAllFacilities()
      .flatMap(() => this.syncGatewayService.sendDeleteDocumentRequest(ACCOUNT_BUCKET, facility))
      .flatMap((result: any) => {
        if (!!result.ok) {
          return this.updateCache(facility._id, facility, facility._rev, true);
        }
        return Observable.of(false);
      });
  }

  deleteFacilityById(facilityId: string): Observable<boolean> {
    return this.getFacility(facilityId).flatMap((facility: Facility) =>
      this.deleteFacility(facility)
    );
  }

  updateCache(
    itemId: string,
    newItem: any,
    rev: string,
    isDeleted: boolean = false
  ): Observable<any> {
    if (isDeleted) {
      if (this.facilities) {
        this.facilities = this.facilities.filter(f => f._id !== itemId);
      }

      return Observable.of(true);
    }

    if (this.facilities) {
      const oldItem = this.facilities.find(f => f._id === itemId) || new Facility();

      const oldRev = Number((oldItem._rev || '0').split('-')[0]);
      const newRev = Number((rev || '0').split('-')[0]);
      const latestRev = newRev > oldRev ? rev : oldItem._rev;

      if (oldItem._id) {
        _.merge(oldItem, newItem);
        oldItem._rev = latestRev;
      } else {
        newItem._rev = latestRev;
        this.facilities.push(newItem);
      }
    }

    return this.getFacility(itemId);
  }

  private createFacilityFromCouchbaseResult(result): Facility {
    const facility = new Facility();
    if (result.id && result.value) {
      result.value._id = result.id;
      _.merge(facility, result.value);
    } else {
      _.merge(facility, result);
    }

    return facility;
  }
}
