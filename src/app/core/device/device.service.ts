import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DocTypeConstants } from '../../constants';
import { AuthenticationService } from '../authentication/authentication.service';
import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { Device, DeviceFactory } from '../../model/device/device';
import { DeviceStatus, DeviceStatusFactory } from '../../model/device/device-status';
import { PortalAPIService } from '../../core/portal-api/portal-api.service';
import { Resident } from '../../model/resident/resident';
import { ResidentService } from '../resident/resident.service';
import {
  IBulkUpdateResult,
  IUpdateResult,
  SyncGatewayService,
  ACCOUNT_BUCKET,
  DEVICE_STATUS_VIEW,
  DOWNLOAD_STATUS_BUCKET,
  FAVORITES_BUCKET,
  MESSAGE_BUCKET,
  RESIDENT_BUCKET
} from '../sync-gateway/sync-gateway.service';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';
import { SyncAdminApiService } from '../sync-admin-api/sync-admin-api.service';

interface IAccountFacilityChangeDetails {
  accountId?: string;
  facilityId?: string;
  serialNumber?: string;
  removeSerialNumber?: string;
}

interface IResidentChangeDetails {
  isInAllResidentMode?: boolean;
  selectedResidentIds?: string[];
  accountId?: string;
  facilityId?: string;
  serialNumber?: string;
  removeSerialNumber?: string;
}

@Injectable()
export class DeviceService {
  private devices: Device[] = null;
  private refreshDeviceCache = false;
  private getAllDevicesObservable: Observable<Device[]> = null;

  private deviceStatuses: DeviceStatus[] = null;
  private getAllDeviceStatusesObservable: Observable<DeviceStatus[]> = null;

  constructor(
    private authenticationService: AuthenticationService,
    private syncAdminApiService: SyncAdminApiService,
    private portalAPIService: PortalAPIService,
    private residentService: ResidentService,
    private syncGatewayService: SyncGatewayService,
    private uiEventService: UiEventService
  ) {
    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      if (clearCacheMessage.clearAllCaches || clearCacheMessage.bucket === ACCOUNT_BUCKET) {
        this.clearDeviceCache();
        this.clearDeviceStatusCache();
      }
    });
  }

  clearDeviceCache() {
    this.refreshDeviceCache = true;
    this.getAllDevicesObservable = null;
  }

  clearDeviceStatusCache() {
    this.getAllDeviceStatusesObservable = null;
  }

  getAllDevices(): Observable<Device[]> {
    if (!this.refreshDeviceCache && this.devices && this.devices.length) {
      return Observable.of(this.devices);
    }

    if (!this.refreshDeviceCache && this.getAllDevicesObservable) {
      return this.getAllDevicesObservable;
    }

    this.getAllDevicesObservable = this.syncGatewayService
      .getAll(ACCOUNT_BUCKET)
      .flatMap((results: ISyncGatewayModel[]) => {
        this.refreshDeviceCache = false;

        this.loadDeviceCache(results);
        this.getAllDevicesObservable = null;
        return Observable.of(this.devices);
      })
      .share();

    return this.getAllDevicesObservable;
  }

  getRawDevice(deviceId: string): Observable<Device> {
    return this.syncGatewayService
      .getRaw(ACCOUNT_BUCKET, deviceId)
      .flatMap((device: ISyncGatewayModel) => {
        return this.updateDeviceCache(
          deviceId,
          this.createDeviceFromCouchbaseResult(device),
          device._rev
        );
      });
  }

  getDevice(deviceId: string): Observable<Device> {
    return this.getAllDevices().flatMap(() =>
      Observable.of(this.devices.find(d => d._id === deviceId))
    );
  }

  getDeviceBySerialNumber(serialNumber: string): Observable<Device> {
    if (!serialNumber) {
      return Observable.of(null);
    }
    return this.getAllDevices().flatMap(() =>
      Observable.of(this.devices.find(d => d.serial_number === serialNumber))
    );
  }

  getDevicesByAccountId(accountId: string): Observable<Device[]> {
    return this.getAllDevices().flatMap(() =>
      Observable.of(this.devices.filter(d => d.account_id === accountId))
    );
  }

  getDevicesByFacilityId(facilityId: string): Observable<Device[]> {
    return this.getAllDevices().flatMap(() => {
      const facilityDevices = this.devices.filter(d => d.facility_id === facilityId);
      return Observable.of(facilityDevices);
    });
  }

  doesDeviceSerialNumberExist(deviceSerialNumber: string): Observable<boolean> {
    return Observable.of(!!this.getDeviceBySerialNumber(deviceSerialNumber));
  }

  /**
   * Device Status
   **/

  getAllDeviceStatuses(): Observable<DeviceStatus[]> {
    if (this.deviceStatuses && this.deviceStatuses.length) {
      return Observable.of(this.deviceStatuses);
    }

    if (this.getAllDeviceStatusesObservable) {
      return this.getAllDeviceStatusesObservable;
    }

    this.getAllDeviceStatusesObservable = this.syncGatewayService
      .getAll(ACCOUNT_BUCKET)
      .flatMap((results: any[]) => {
        this.loadDeviceStatusCache(results);
        this.getAllDeviceStatusesObservable = null;
        return Observable.of(this.deviceStatuses);
      })
      .share();

    return this.getAllDeviceStatusesObservable;
  }

  getRawDeviceStatus(deviceStatusId: string): Observable<DeviceStatus> {
    return this.syncGatewayService
      .getRaw(ACCOUNT_BUCKET, deviceStatusId)
      .flatMap((deviceStatus: ISyncGatewayModel) => {
        return this.updateDeviceStatusCache(
          deviceStatusId,
          this.createDeviceStatusFromCouchbaseResult(deviceStatus),
          deviceStatus._rev
        );
      });
  }

  getDeviceStatus(deviceStatusId: string): Observable<DeviceStatus> {
    return this.getAllDeviceStatuses().flatMap(() =>
      Observable.of(this.deviceStatuses.find(d => d._id === deviceStatusId))
    );
  }

  getDeviceStatusByDeviceId(deviceId: string): Observable<DeviceStatus> {
    return this.getAllDeviceStatuses().flatMap(deviceStatuses => {
      const deviceStatus = deviceStatuses.find(ds => ds.device_id === deviceId);
      return Observable.of(deviceStatus);
    });
  }

  getDeviceStatusBySerialNumber(serialNumber: string): Observable<DeviceStatus> {
    if (!serialNumber) {
      return Observable.of(null);
    }

    return this.getAllDeviceStatuses().flatMap(() =>
      Observable.of(this.deviceStatuses.find(ds => ds.serial_number === serialNumber))
    );
  }

  getAllRawDeviceStatusesByDevice(device: Device): Observable<DeviceStatus[]> {
    const deviceId = device._id;
    const serialNumber = device.serial_number;
    return this.getAllDeviceStatuses().flatMap(() => {
      const deviceStatuses = this.deviceStatuses.filter(
        ds => ds.device_id === deviceId || (!!serialNumber && ds.serial_number === serialNumber)
      );
      return deviceStatuses.length
        ? Observable.forkJoin(deviceStatuses.map(ds => this.getRawDeviceStatus(ds._id)))
        : Observable.of([]);
    });
  }

  getDeviceStatusesByAccountId(accountId: string): Observable<DeviceStatus[]> {
    return Observable.forkJoin(
      this.getDevicesByAccountId(accountId),
      this.getAllDeviceStatuses()
    ).flatMap(([devices, deviceStatusList]: [Device[], DeviceStatus[]]) => {
      const accountDeviceStatuses = devices
        .map((device: Device) =>
          deviceStatusList.find((ds: DeviceStatus) => ds.device_id === device._id)
        )
        .filter(ds => !!ds);
      return Observable.of(accountDeviceStatuses);
    });
  }

  getDeviceStatusesByFacilityId(facilityId: string): Observable<DeviceStatus[]> {
    return Observable.forkJoin(
      this.getDevicesByFacilityId(facilityId),
      this.getAllDeviceStatuses()
    ).flatMap(([devices, deviceStatusList]: [Device[], DeviceStatus[]]) => {
      const facilityDeviceStatuses = devices
        .filter(device => !!device.serial_number)
        .map((device: Device) =>
          deviceStatusList.find((ds: DeviceStatus) => ds.device_id === device._id)
        )
        .filter(ds => !!ds);
      return Observable.of(facilityDeviceStatuses);
    });
  }

  getDeviceDownloadStatus(device_id: string): Observable<any> {
    return this.syncGatewayService.getReducerData(DOWNLOAD_STATUS_BUCKET, DEVICE_STATUS_VIEW, {
      connection_timeout: 90000,
      key: `"${device_id}"`
    });
  }

  createDevice(device: Device): Observable<Device> {
    return this.getAllDevices()
      .flatMap(() =>
        this.syncGatewayService.sendAddDocumentRequest(ACCOUNT_BUCKET, device._id, device)
      )
      .flatMap((result: any) => {
        return this.getRawDevice(device._id);
      });
  }

  createDeviceStatus(deviceStatus: DeviceStatus): Observable<DeviceStatus> {
    return this.getAllDevices()
      .flatMap(() =>
        this.syncGatewayService.sendAddDocumentRequest(
          ACCOUNT_BUCKET,
          deviceStatus._id,
          deviceStatus
        )
      )
      .flatMap((result: any) => {
        return this.getRawDeviceStatus(deviceStatus._id);
      });
  }

  updateDeviceStatus(deviceStatus: DeviceStatus): Observable<DeviceStatus> {
    return this.getAllDevices()
      .flatMap(() =>
        this.syncGatewayService.sendUpdateDocumentRequest(ACCOUNT_BUCKET, deviceStatus)
      )
      .flatMap((result: IUpdateResult) => {
        return this.getRawDeviceStatus(deviceStatus._id);
      });
  }

  deleteDevice(device: Device): Observable<boolean> {
    return this.syncGatewayService
      .sendDeleteDocumentRequest(ACCOUNT_BUCKET, device)
      .flatMap((result: IUpdateResult) => {
        if (!!result.ok) {
          return this.updateDeviceCache(device._id, device, device._rev, true);
        }
        return Observable.of(false);
      });
  }

  deleteDeviceStatus(deviceStatus: DeviceStatus): Observable<boolean> {
    return this.syncGatewayService
      .sendDeleteDocumentRequest(ACCOUNT_BUCKET, deviceStatus)
      .flatMap((result: IUpdateResult) => {
        if (!!result.ok) {
          return this.updateDeviceStatusCache(
            deviceStatus._id,
            deviceStatus,
            deviceStatus._rev,
            true
          );
        }
        return Observable.of(false);
      });
  }

  addDevice(device: Device, selectedResidentIds: string[]): Observable<Device> {
    const accountId = device.account_id;
    const facilityId = device.facility_id;
    const deviceId = device._id;
    const serialNumber = device.serial_number;

    if (!accountId || !facilityId || !device._id) {
      throw new Error(
        'Invalid device. Cannot create the device because is missing the accountId, facilityId, or deviceId.'
      );
    }

    device.modified_date = SyncGatewayService.formatDateForCouchbase();
    device.modified_by = this.authenticationService.getCurrentUserDocumentChangedByValue();
    device.created_date = SyncGatewayService.formatDateForCouchbase();
    device.created_by = this.authenticationService.getCurrentUserDocumentChangedByValue();

    const deviceStatus = DeviceStatusFactory.createFromDevice(device);
    const deviceStatusId = deviceStatus._id;

    deviceStatus.modified_date = device.modified_date;
    deviceStatus.modified_by = device.modified_by;
    deviceStatus.created_date = device.created_date;
    deviceStatus.created_by = device.created_by;

    // make sure device does not already
    return Observable.forkJoin(
      this.getDeviceBySerialNumber(serialNumber),
      this.residentService.getAllResidents()
    )
      .flatMap(([existingDevice, residents]: [Device, Resident[]]) => {
        // if device does exist, throw error
        if (existingDevice) {
          return Observable.throw('A device with this serial number already exists.');
        }

        const accountDocsToBeUpdated = [device, deviceStatus];

        const residentChangeDetails: IResidentChangeDetails = {
          isInAllResidentMode: device.isInAllResidentMode(),
          selectedResidentIds: selectedResidentIds,
          accountId: accountId,
          facilityId: facilityId,
          serialNumber: device.serial_number
        };
        const residentsToBeUpdated = this.getResidentsToUpdate(residents, residentChangeDetails);

        return Observable.forkJoin(
          this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
            ACCOUNT_BUCKET,
            accountDocsToBeUpdated
          ),
          residentsToBeUpdated.length
            ? this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
                RESIDENT_BUCKET,
                residentsToBeUpdated
              )
            : Observable.of({ docs: [] }),
          this.addDeviceUser(serialNumber),
          Observable.of(device),
          Observable.of(deviceStatus),
          Observable.of(residentsToBeUpdated),
          this.updateBucketsSyncAdminDocs(
            device,
            residents.filter(r => r.serial_numbers.includes(device.serial_number))
          )
        );
      })
      .flatMap(
        ([
          accountBucketUpdate,
          residentBucketUpdate,
          addDeviceUser,
          device,
          deviceStatus,
          updatedResidents,
          syncAdminsUpdated
        ]: [
          IBulkUpdateResult,
          IBulkUpdateResult,
          any,
          Device,
          DeviceStatus,
          Resident[],
          boolean
        ]) => {
          const deviceIdRev = accountBucketUpdate.docs.find(item => item.id === device._id);
          const deviceStatusIdRev = accountBucketUpdate.docs.find(
            item => item.id === deviceStatus._id
          );
          const residentCacheUpdates = updatedResidents.map(r => {
            const idRev = residentBucketUpdate.docs.find(item => item.id === r._id);
            return this.residentService.updateCache(idRev.id, r, idRev.rev);
          });

          return Observable.forkJoin(
            this.updateDeviceCache(deviceId, device, deviceIdRev.rev),
            this.updateDeviceStatusCache(deviceStatusId, deviceStatus, deviceStatusIdRev.rev),
            ...residentCacheUpdates
          ).flatMap(() => {
            return this.throwBulkErrorIfExists(
              accountBucketUpdate.docs.concat(residentBucketUpdate.docs)
            );
          });
        }
      )
      .flatMap(() => this.getDevice(deviceId));
  }

  removeDevice(device: Device): Observable<boolean> {
    const accountId = device.account_id;
    const facilityId = device.facility_id;
    const deviceId = device._id;
    const serialNumber = device.serial_number;

    return Observable.forkJoin(
      this.getAllRawDeviceStatusesByDevice(device),
      this.residentService.getAllResidents()
    )
      .flatMap(([deviceStatuses, residents]: [DeviceStatus[], Resident[]]) => {
        device._deleted = true;
        deviceStatuses.forEach(ds => (ds._deleted = true));
        const accountDocsToBeUpdated = [device, ...deviceStatuses];

        const residentChangeDetails: IResidentChangeDetails = {
          removeSerialNumber: device.serial_number
        };
        const residentsToBeUpdated = this.getResidentsToUpdate(residents, residentChangeDetails);

        return Observable.forkJoin(
          this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
            ACCOUNT_BUCKET,
            accountDocsToBeUpdated
          ),
          residentsToBeUpdated.length
            ? this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
                RESIDENT_BUCKET,
                residentsToBeUpdated
              )
            : Observable.of({ docs: [] }),
          this.removeDeviceUser(serialNumber),
          Observable.of(device),
          Observable.of(deviceStatuses),
          Observable.of(residentsToBeUpdated),
          this.deleteBucketsSyncAdminDocs(device)
        );
      })
      .flatMap(
        ([
          accountBucketUpdate,
          residentBucketUpdate,
          removeDeviceUser,
          device,
          deviceStatuses,
          updatedResidents,
          syncAdminsUpdated
        ]: [
          IBulkUpdateResult,
          IBulkUpdateResult,
          any,
          Device,
          DeviceStatus[],
          Resident[],
          boolean
        ]) => {
          const deviceIdRev = accountBucketUpdate.docs.find(item => item.id === device._id);

          const residentCacheUpdates = updatedResidents.map(r => {
            const idRev = residentBucketUpdate.docs.find(item => item.id === r._id);
            return this.residentService.updateCache(idRev.id, r, idRev.rev);
          });

          return Observable.forkJoin(
            this.updateDeviceCache(deviceId, device, deviceIdRev.rev, true),
            ...accountBucketUpdate.docs.map(idRev => {
              const ds = deviceStatuses.find(item => item._id === idRev.id);
              return this.updateDeviceStatusCache(idRev.id, ds, idRev.rev, true);
            })
          )
            .flatMap(() => {
              return residentCacheUpdates.length
                ? Observable.forkJoin(residentCacheUpdates)
                : Observable.of([]);
            })
            .flatMap(() => {
              return this.throwBulkErrorIfExists(
                accountBucketUpdate.docs.concat(residentBucketUpdate.docs)
              );
            });
        }
      )
      .flatMap(() => Observable.of(true));
  }

  moveDevice(
    serialNumber: string,
    deviceId: string,
    deviceStatusId: string,
    oldAccountId: string,
    oldFacilityId: string,
    newAccountId: string,
    newFacilityId: string
  ): Observable<Device> {
    return Observable.forkJoin(this.getRawDevice(deviceId), this.residentService.getRawResidents())
      .flatMap(([device, residents]: [Device, Resident[]]) => {
        device.addTermsOfUseSigned(newAccountId, newFacilityId);

        // Making a new device and deviceStatus so they can be updated without changing the originals
        const newDevice = DeviceFactory.createFromDevice(device);
        newDevice.account_id = newAccountId;
        newDevice.facility_id = newFacilityId;

        // updateDevice takes care of resident cleanup
        return this.updateDevice(newDevice, []);
      })
      .flatMap(() => this.getDevice(deviceId));
  }

  updateDevice(device: Device, selectedResidentIds: string[]): Observable<Device> {
    const accountId = device.account_id;
    const facilityId = device.facility_id;
    const deviceId = device._id;
    const serialNumber = device.serial_number;

    return this.residentService
      .getAllResidents()
      .flatMap((residents: Resident[]) => {
        const residentChangeDetails: IResidentChangeDetails = {
          isInAllResidentMode: device.isInAllResidentMode(),
          selectedResidentIds: selectedResidentIds,
          accountId: accountId,
          facilityId: facilityId,
          serialNumber: device.serial_number
        };

        const residentsToBeUpdated = this.getResidentsToUpdate(residents, residentChangeDetails);

        return Observable.forkJoin(
          this.syncGatewayService.sendUpdateDocumentRequest(ACCOUNT_BUCKET, device),
          residentsToBeUpdated.length
            ? this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
                RESIDENT_BUCKET,
                residentsToBeUpdated
              )
            : Observable.of({ docs: [] }),
          Observable.of(residentsToBeUpdated),
          this.updateBucketsSyncAdminDocs(
            device,
            residents.filter(r => r.serial_numbers.includes(device.serial_number))
          )
        );
      })
      .flatMap(
        ([deviceUpdateIdRev, residentBucketUpdate, updatedResidents, syncAdminsUpdated]: [
          IUpdateResult,
          IBulkUpdateResult,
          Resident[],
          boolean
        ]) => {
          const residentCacheUpdates = updatedResidents.map(r => {
            const idRev = residentBucketUpdate.docs.find(item => item.id === r._id);
            return this.residentService.updateCache(idRev.id, r, idRev.rev);
          });

          return (residentCacheUpdates.length
            ? Observable.forkJoin(residentCacheUpdates)
            : Observable.of([])
          )
            .flatMap(() => {
              return this.updateDeviceCache(deviceId, device, deviceUpdateIdRev.rev);
            })
            .flatMap(() => {
              return this.throwBulkErrorIfExists(
                [deviceUpdateIdRev].concat(residentBucketUpdate.docs)
              );
            });
        }
      );
  }

  updateDeviceWithSerialNumberChange(
    device: Device,
    selectedResidentIds: string[],
    oldSerialNumber: string,
    newSerialNumber: string
  ): Observable<Device> {
    const accountId = device.account_id;
    const facilityId = device.facility_id;
    const deviceId = device._id;

    return Observable.forkJoin(
      this.getAllDevices(),
      this.getAllRawDeviceStatusesByDevice(device),
      this.residentService.getAllResidents()
    )
      .flatMap(
        ([existingDevices, deviceStatuses, residents]: [Device[], DeviceStatus[], Resident[]]) => {
          // if device does exist, throw error
          if (
            existingDevices.find(
              existingDevice =>
                existingDevice.serial_number === newSerialNumber && existingDevice._id !== deviceId
            )
          ) {
            return Observable.throw('A device with this serial number already exists.');
          }

          const accountFacilityChangeDetails: IAccountFacilityChangeDetails = {
            accountId: accountId,
            facilityId: facilityId,
            serialNumber: newSerialNumber,
            removeSerialNumber: oldSerialNumber
          };

          // Update device
          // Making a new device and deviceStatus so they can be updated without changing the originals
          const newDevice = Object.assign({}, device);
          newDevice.serial_number = newSerialNumber;

          // Update device status
          const mergedDeviceStatus = this.getMergedDeviceStatus(device, deviceStatuses);
          const newDeviceStatus = Object.assign({}, mergedDeviceStatus);
          newDeviceStatus.serial_number = newSerialNumber;
          const invalidStatuses = deviceStatuses
            .filter(ds => ds._id !== newDeviceStatus._id)
            .map(ds => {
              ds._deleted = true;
              return ds;
            });

          const accountBucketDocsToBeUpdated = [newDevice, newDeviceStatus, ...invalidStatuses];

          const residentChangeDetails: IResidentChangeDetails = {
            isInAllResidentMode: device.isInAllResidentMode(),
            selectedResidentIds: selectedResidentIds,
            accountId: accountId,
            facilityId: facilityId,
            serialNumber: newSerialNumber,
            removeSerialNumber: oldSerialNumber
          };
          const residentsToBeUpdated = this.getResidentsToUpdate(residents, residentChangeDetails);

          return Observable.forkJoin(
            this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
              ACCOUNT_BUCKET,
              accountBucketDocsToBeUpdated
            ),
            residentsToBeUpdated.length
              ? this.syncGatewayService.sendUpdateMultipleDocumentsRequest(
                  RESIDENT_BUCKET,
                  residentsToBeUpdated
                )
              : Observable.of({ docs: [] }),
            this.removeDeviceUser(oldSerialNumber),
            this.addDeviceUser(newSerialNumber),
            Observable.of(accountBucketDocsToBeUpdated),
            Observable.of(residentsToBeUpdated),
            this.updateBucketsSyncAdminDocs(
              device,
              residents.filter(r => r.serial_numbers.includes(device.serial_number))
            )
          );
        }
      )
      .flatMap(
        ([
          accountBucketUpdates,
          residentBucketUpdates,
          removeDeviceUser,
          addDeviceUser,
          updatedAccountDocs,
          updatedResidentDocs,
          syncAdminsUpdated
        ]: [
          IBulkUpdateResult,
          IBulkUpdateResult,
          any,
          any,
          Array<Device | DeviceStatus>,
          Resident[],
          boolean
        ]) => {
          const accountCacheUpdates = updatedAccountDocs.map(doc => {
            const idRev = accountBucketUpdates.docs.find(item => item.id === doc._id);
            if (idRev.error) {
              return Observable.of(doc);
            }
            if (doc.doc_type === DocTypeConstants.DOC_TYPES.ACCOUNT.DEVICE) {
              return this.updateDeviceCache(idRev.id, doc, idRev.rev);
            } else if (doc.doc_type === DocTypeConstants.DOC_TYPES.ACCOUNT.DEVICE_STATUS) {
              return this.updateDeviceStatusCache(idRev.id, doc, idRev.rev);
            }
          });

          const residentCacheUpdates = updatedResidentDocs.map(r => {
            const idRev = residentBucketUpdates.docs.find(item => item.id === r._id);
            return this.residentService.updateCache(idRev.id, r, idRev.rev);
          });

          return Observable.forkJoin(
            accountCacheUpdates.length
              ? Observable.forkJoin(accountCacheUpdates)
              : Observable.of([]),
            residentCacheUpdates.length
              ? Observable.forkJoin(residentCacheUpdates)
              : Observable.of([])
          ).flatMap(() => {
            return this.throwBulkErrorIfExists(
              accountBucketUpdates.docs.concat(residentBucketUpdates.docs)
            );
          });
        }
      )
      .flatMap(() => this.getDevice(deviceId));
  }

  addDeviceUser(serialNumber: string): Observable<any> {
    if (serialNumber) {
      return this.portalAPIService.sendAddDeviceUser(serialNumber);
    }

    return Observable.of(null);
  }

  removeDeviceUser(serialNumber: string): Observable<any> {
    if (serialNumber) {
      return this.portalAPIService.sendRemoveDeviceUser(serialNumber);
    }

    return Observable.of(null);
  }

  // This function create helper docs in the message_data and favorites buckets to support sync functions
  updateBucketsSyncAdminDocs(device: Device, deviceResidents: Resident[]): Observable<boolean> {
    if (!device.serial_number) {
      return Observable.of(true);
    }

    return this.syncAdminApiService.updateDeviceUserSyncAdmin(
      device,
      deviceResidents.map(r => r._id)
    );
  }

  deleteBucketsSyncAdminDocs(device: Device): Observable<boolean> {
    if (!device.serial_number) {
      return Observable.of(true);
    }
    return this.syncAdminApiService.deleteDeviceUserSyncAdmin(device.serial_number);
  }

  private getResidentsToUpdate(allResidents: Resident[], changeDetails: IResidentChangeDetails) {
    const isInAllResidentMode =
      typeof changeDetails.isInAllResidentMode === 'undefined'
        ? null
        : changeDetails.isInAllResidentMode;
    const selectedResidentIds = changeDetails.selectedResidentIds || [];
    const accountId = changeDetails.accountId || null;
    const facilityId = changeDetails.facilityId || null;
    const serialNumber = changeDetails.serialNumber || null;
    const removeSerialNumber = changeDetails.removeSerialNumber || null;

    // Use addSerialNumber and removeSerialNumber to update serial number lists
    // These functions return true if the list changes, false if not
    // so that only residents that are changed get returned for saving
    return allResidents.filter(r => {
      let needsUpdate = false;

      if (removeSerialNumber && r.serial_numbers.includes(removeSerialNumber)) {
        needsUpdate = needsUpdate || this.removeSerialNumber(r, removeSerialNumber);
      }

      if (!accountId || !facilityId || !serialNumber || isInAllResidentMode === null) {
        return needsUpdate;
      }

      const correctAccountFacility = r.account_id === accountId && r.facility_id === facilityId;
      const isSelectedResident = isInAllResidentMode || selectedResidentIds.includes(r._id);
      const hasSerialNumber = r.serial_numbers.includes(serialNumber);

      if (!r.isActive()) {
        needsUpdate = needsUpdate || this.removeSerialNumber(r, serialNumber);
      }

      if (!correctAccountFacility || !isSelectedResident) {
        needsUpdate = needsUpdate || this.removeSerialNumber(r, serialNumber);
      }

      if (correctAccountFacility && isSelectedResident) {
        needsUpdate = needsUpdate || this.addSerialNumber(r, serialNumber);
      }

      return needsUpdate;
    });
  }

  private updateDeviceCache(
    itemId: string,
    newItem: any,
    rev: string,
    isDeleted: boolean = false
  ): Observable<any> {
    if (isDeleted) {
      if (this.devices) {
        this.devices = this.devices.filter(d => d._id !== itemId);
      }

      return Observable.of(true);
    }

    if (this.devices) {
      const oldItem = this.devices.find(d => d._id === itemId) || new Device();

      const oldRev = Number((oldItem._rev || '0').split('-')[0]);
      const newRev = Number((rev || '0').split('-')[0]);
      const latestRev = newRev > oldRev ? rev : oldItem._rev;

      if (oldItem._id) {
        _.merge(oldItem, newItem);
        oldItem._rev = latestRev;
      } else {
        newItem._rev = latestRev;
        this.devices.push(newItem);
      }
    }

    return this.getDevice(itemId);
  }

  private updateDeviceStatusCache(
    itemId: string,
    newItem: any,
    rev: string,
    isDeleted: boolean = false
  ): Observable<any> {
    if (!this.deviceStatuses) {
      return Observable.of(true);
    }

    if (isDeleted) {
      if (this.deviceStatuses) {
        this.deviceStatuses = this.deviceStatuses.filter(d => d._id !== itemId);
      }
      return Observable.of(true);
    }

    if (this.deviceStatuses) {
      const oldItem = this.deviceStatuses.find(d => d._id === itemId) || new DeviceStatus();

      const oldRev = Number((oldItem._rev || '0').split('-')[0]);
      const newRev = Number((rev || '0').split('-')[0]);
      const latestRev = newRev > oldRev ? rev : oldItem._rev;

      if (oldItem._id) {
        _.merge(oldItem, newItem);
        oldItem._rev = latestRev;
      } else {
        newItem._rev = latestRev;
        this.deviceStatuses.push(newItem);
      }
    }

    return this.getDeviceStatus(itemId);
  }

  private createDeviceFromCouchbaseResult(result): Device {
    const device = new Device();
    if (result.id && result.value) {
      result.value._id = result.id;
      _.merge(device, result.value);
    } else {
      _.merge(device, result);
    }

    return device;
  }

  private createDeviceStatusFromCouchbaseResult(result): DeviceStatus {
    const deviceStatus = new DeviceStatus();
    _.merge(deviceStatus, result);

    return deviceStatus;
  }

  private loadDeviceCache(results: any[]) {
    this.devices = results
      .filter(d => d.doc_type === DocTypeConstants.DOC_TYPES.ACCOUNT.DEVICE)
      .map(item => this.createDeviceFromCouchbaseResult(item));
  }

  private loadDeviceStatusCache(results: any[]) {
    this.deviceStatuses = results
      .filter(d => d.doc_type === DocTypeConstants.DOC_TYPES.ACCOUNT.DEVICE_STATUS)
      .map(item => this.createDeviceStatusFromCouchbaseResult(item));
  }

  private addSerialNumber(item: Resident, serialNumber: string): boolean {
    return this.updateSerialNumbers(item, serialNumber, true);
  }

  private removeSerialNumber(item: Resident, serialNumber: string): boolean {
    return this.updateSerialNumbers(item, serialNumber, false);
  }

  private updateSerialNumbers(item: Resident, serialNumber: string, isAdd: boolean): boolean {
    const itemSerialNumbers = new Set(item.serial_numbers);
    const originalListIncludedSerialNumber = itemSerialNumbers.has(serialNumber);
    let listWasChanged;
    if (isAdd) {
      itemSerialNumbers.add(serialNumber);
      listWasChanged = !originalListIncludedSerialNumber;
    } else {
      itemSerialNumbers.delete(serialNumber);
      listWasChanged = originalListIncludedSerialNumber;
    }
    item.serial_numbers = Array.from(itemSerialNumbers);
    return listWasChanged;
  }

  private throwBulkErrorIfExists(updateResults: IUpdateResult[]): Observable<any> {
    let errorResult: IUpdateResult = null;
    updateResults.forEach(result => {
      if (result && result.error) {
        console.log(result);
        errorResult = result;
      }
    });
    if (errorResult && errorResult.error) {
      this.uiEventService.dispatch(new ClearCacheMessage(ACCOUNT_BUCKET));
      this.uiEventService.dispatch(new ClearCacheMessage(RESIDENT_BUCKET));
      return Observable.throw(errorResult.error + '\n' + errorResult.reason);
    }
    return Observable.of(null);
  }

  private getMergedDeviceStatus(device: Device, deviceStatuses: DeviceStatus[]): DeviceStatus {
    if (deviceStatuses.length === 1) {
      return deviceStatuses[0];
    }

    const latestModified = deviceStatuses.reduce(
      (latest, ds) => (ds.modified_date > latest.modified_date ? ds : latest),
      deviceStatuses[0]
    );
    const mergedStatus: DeviceStatus = deviceStatuses.reduce(
      (first, ds) => (ds.created_date < first.created_date ? ds : first),
      deviceStatuses[0]
    );
    mergedStatus.device_id = device._id;
    mergedStatus.serial_number = device.serial_number;
    mergedStatus.modified_date = latestModified.modified_date;
    mergedStatus.modified_by = latestModified.modified_by;
    mergedStatus.last_online = deviceStatuses.reduce(
      (latest, ds) => (ds.last_online > latest ? ds.last_online : latest),
      deviceStatuses[0].last_online
    );
    mergedStatus.last_sync = deviceStatuses.reduce(
      (latest, ds) => (ds.last_sync > latest ? ds.last_sync : latest),
      deviceStatuses[0].last_sync
    );
    mergedStatus.last_used = deviceStatuses.reduce(
      (latest, ds) => (ds.last_used > latest ? ds.last_used : latest),
      deviceStatuses[0].last_used
    );
    return mergedStatus;
  }
}
