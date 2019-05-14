import * as moment from 'moment';
import { Http, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../../environments/environment';
import { IUser } from '../../model/user/user';
import { Device } from '../../model/device/device';
import { ConnectApiBaseService } from '../connect-api/connect-api-base.service';

@Injectable()
export class SyncAdminApiService extends ConnectApiBaseService {
  constructor(http: Http) {
    super(http);
  }

  /**
   * Portal User Management
   */

  updatePortalUserSyncAdmin(user: IUser): Observable<boolean> {
    return this.http
      .post(
        `${this.connectApiUrl}/syncadmin/portaluser`,
        {
          userProfileId: user._id,
          email: user.email,
          type: user.type,
          account_id: user.account_id,
          facility_ids: user.facility_ids
        },
        this.getHttpOptions()
      )
      .mergeMap((result: Response) => {
        return Observable.of(result && result.ok);
      });
  }

  updateDeviceUserSyncAdmin(device: Device, residentIds: string[]): Observable<boolean> {
    return this.http
      .post(
        `${this.connectApiUrl}/syncadmin/deviceuser`,
        {
          serial_number: device.serial_number,
          device_id: device._id,
          account_id: device.account_id,
          facility_id: device.facility_id,
          resident_ids: residentIds
        },
        this.getHttpOptions()
      )
      .mergeMap((result: Response) => {
        return Observable.of(result && result.ok);
      });
  }

  deleteDeviceUserSyncAdmin(serialNumber: string): Observable<boolean> {
    return this.http
      .delete(`${this.connectApiUrl}/syncadmin/deviceuser/${serialNumber}`, this.getHttpOptions())
      .mergeMap(() => {
        return Observable.of(true);
      });
  }
}
