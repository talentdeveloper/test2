import * as _ from 'lodash';

import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { UUID } from 'angular2-uuid';

import { ClearCacheMessage } from '../ui-event-service/ui-clear-cache';
import { Device } from '../../model/device/device';
import {
  Resident,
  RESIDENT_PROFILE_IMAGE_FILENAME,
  RESIDENT_STATUS_ACTIVE,
  RESIDENT_STATUS_INACTIVE,
  RESIDENT_CONTACT_IMAGE_FILENAME_PREFIX
} from '../../model/resident/resident';
import { ResidentContact } from '../../model/resident/resident-contact';
import { ResidentFactoryService } from '../../core/resident/resident-factory.service';
import {
  SyncGatewayService,
  IUpdateResult,
  RESIDENT_BUCKET,
  RESIDENT_SMS_VIEW
} from '../../core/sync-gateway/sync-gateway.service';
import { TextMessageService } from '../../core/text-message/text-message.service';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';

const GENERIC_PROFILE_IMAGE = '/assets/img/user/generic.png';

@Injectable()
export class ResidentService {
  private residents: Resident[] = null;
  private getAllResidentsObservable: Observable<Resident[]> = null;
  private refreshCache = false;

  constructor(
    private residentFactoryService: ResidentFactoryService,
    private syncGatewayService: SyncGatewayService,
    private uiEventService: UiEventService
  ) {
    this.uiEventService.subscribe(ClearCacheMessage, clearCacheMessage => {
      if (clearCacheMessage.clearAllCaches || clearCacheMessage.bucket === RESIDENT_BUCKET) {
        this.clearCache();
      }
    });
  }

  clearCache() {
    this.refreshCache = true;
    this.getAllResidentsObservable = null;
    this.syncGatewayService.clearCache(RESIDENT_BUCKET);
  }

  createResident(resident: Resident): Observable<Resident> {
    const residentId = UUID.UUID();

    return this.getAllResidents()
      .flatMap(() =>
        this.syncGatewayService.sendAddDocumentRequest(RESIDENT_BUCKET, residentId, resident)
      )
      .flatMap((result: any) => {
        resident._id = residentId;
        this.updateCache(residentId, resident, result.rev);

        return this.getResident(residentId);
      });
  }

  getAllResidents(): Observable<Resident[]> {
    if (!this.refreshCache && this.residents && this.residents.length) {
      return Observable.of(this.residents);
    }

    if (!this.refreshCache && this.getAllResidentsObservable) {
      return this.getAllResidentsObservable;
    }

    // sendGetAllDocumentsRequest returns an array of objects, not a stream
    // convert to resident objects before returning
    this.getAllResidentsObservable = this.syncGatewayService
      .getAll(RESIDENT_BUCKET)
      .flatMap((residents: ISyncGatewayModel[]) => {
        this.refreshCache = false;

        this.residents = residents.map(r => {
          return this.residentFactoryService.createResidentFromCouchbaseResult(r);
        });

        this.getAllResidentsObservable = null;

        return Observable.of(this.residents);
      });

    return this.getAllResidentsObservable;
  }

  getAllResidentsForFacility(facility_id: string): Observable<Resident[]> {
    // getAllResidents returns an array of resident objects, not a stream
    // filter out results that do not belong to the facility
    return this.getAllResidents().flatMap(() => {
      return Observable.of(this.residents.filter(r => r.facility_id === facility_id));
    });
  }

  getRawResident(residentId: string): Observable<Resident> {
    return this.getAllResidents()
      .flatMap(() => this.syncGatewayService.getRaw(RESIDENT_BUCKET, residentId))
      .flatMap((resident: ISyncGatewayModel) => {
        return this.updateCache(
          residentId,
          this.residentFactoryService.createResidentFromCouchbaseResult(resident),
          resident._rev
        );
      });
  }

  getRawResidents(): Observable<Resident[]> {
    this.clearCache();
    return this.getAllResidents();
  }

  getResident(residentId: string): Observable<Resident> {
    return this.getAllResidents().flatMap(() =>
      Observable.of(this.residents.find(r => r._id === residentId))
    );
  }

  getResidentsWithDevice(device: Device): Observable<Resident[]> {
    return this.getAllResidents().flatMap((allResidents: Resident[]) => {
      const residents = allResidents.filter(r => {
        return (
          r.facility_id === device.facility_id && r.serial_numbers.includes(device.serial_number)
        );
      });
      return Observable.of(residents);
    });
  }

  getResidentsWithFamilyPhoneNumber(phone_number: string): Observable<Resident[]> {
    const formatted_number = TextMessageService.formatPhoneNumber(phone_number).slice(1); // remove + from beginning

    return this.syncGatewayService
      .sendViewRequest(RESIDENT_BUCKET, RESIDENT_BUCKET, RESIDENT_SMS_VIEW, formatted_number)
      .flatMap((result: any) => {
        // if we have results, get a fresh copy of each resident
        if (result && Array.isArray(result) && result.length) {
          return Observable.forkJoin(result.map(row => this.getResident(row.id)));
        }

        // no residents found, just return an empty array
        return Observable.of([]);
      });
  }

  updateResident(resident: Resident): Observable<Resident> {
    // on any update, check 'status' property .. if blank set to active
    if (resident.status === '') {
      resident.status = RESIDENT_STATUS_ACTIVE;
    }

    // clean up old properties
    // skype_number was the initial skype property name, but later changed to skype_user
    // after we stopped recording phone numbers and started recording user names
    // its no longer used so lets remove from existing objects
    if (resident.family && resident.family.hasOwnProperty('skype_number')) {
      delete resident.family['skype_number'];
    }

    // skype_user was moved to family.member objects, instead of a general family
    // property, but old references can still be used in the tablet. If blank we want
    // to remove the property but leave it for now if a value exists
    if (
      resident.family &&
      resident.family.hasOwnProperty('skype_user') &&
      !resident.family.skype_user
    ) {
      delete resident.family.skype_user;
    }

    return this.getAllResidents()
      .flatMap(() => this.syncGatewayService.sendUpdateDocumentRequest(RESIDENT_BUCKET, resident))
      .flatMap((updateResult: IUpdateResult) => {
        return this.updateCache(resident._id, resident, updateResult.rev);
      });
  }

  updateResidentRemoveProfileImage(resident: Resident): Observable<Resident> {
    delete resident._attachments[RESIDENT_PROFILE_IMAGE_FILENAME];
    return this.updateResident(resident);
  }

  moveResident(
    allDevices: Device[],
    residentId: string,
    newAccountId: string,
    newFacilityId: string
  ): Observable<Resident> {
    return this.getRawResident(residentId).flatMap((resident: Resident) => {
      resident.account_id = newAccountId;
      resident.facility_id = newFacilityId;

      resident.serial_numbers = allDevices.reduce((serialNumbers: string[], device: Device) => {
        if (
          device.account_id === newAccountId &&
          device.facility_id === newFacilityId &&
          device.isInAllResidentMode()
        ) {
          serialNumbers.push(device.serial_number);
        }

        return serialNumbers;
      }, []);

      return this.updateResident(resident);
    });
  }

  // --- Disable / Re-Activate Resident ---

  activateResident(resident: Resident): Observable<Resident> {
    // reload resident and then update status
    return this.getResident(resident._id).flatMap((updateResident: Resident) => {
      updateResident.status = RESIDENT_STATUS_ACTIVE;

      return this.updateResident(updateResident);
    });
  }

  disableResident(resident: Resident): Observable<Resident> {
    // reload resident and then update status
    return this.getResident(resident._id).flatMap((updateResident: Resident) => {
      updateResident.status = RESIDENT_STATUS_INACTIVE;

      return this.updateResident(updateResident);
    });
  }

  // --- Twilio Blacklist ---

  markNumberAsBlacklistedOnResident(
    resident: Resident,
    phone_number: string
  ): Observable<Resident> {
    let resident_needs_update = false;

    if (resident.family && resident.family.members && Array.isArray(resident.family.members)) {
      resident.family.members = resident.family.members.map((member: ResidentContact) => {
        if (member.phone === phone_number && member.twilio_blacklist !== 'true') {
          member.twilio_blacklist = 'true';
          member.twilio_blacklist_date = SyncGatewayService.formatDateForCouchbase();
          resident_needs_update = true;
        }

        return member;
      });
    }

    return resident_needs_update ? this.updateResident(resident) : this.getResident(resident._id);
  }

  unmarkNumberAsBlacklistedOnResident(
    resident: Resident,
    phone_number: string
  ): Observable<Resident> {
    let resident_needs_update = false;

    if (resident.family && resident.family.members && Array.isArray(resident.family.members)) {
      resident.family.members = resident.family.members.map((member: ResidentContact) => {
        if (member.phone === phone_number && member.twilio_blacklist !== 'false') {
          member.twilio_blacklist = 'false';
          member.twilio_blacklist_date = '';
          resident_needs_update = true;
        }

        return member;
      });
    }

    return resident_needs_update ? this.updateResident(resident) : this.getResident(resident._id);
  }

  updateNumberBlacklistOnResidents(
    phone_number: string,
    should_be_blacklisted: boolean
  ): Observable<boolean> {
    // only find residents that need an update
    // that is, find residents that have a family member with the phone that
    // is not already in the 'should_be_blacklisted' state
    return this.getResidentsWithFamilyPhoneNumber(phone_number).flatMap((residents: Resident[]) => {
      const residentsToUpdate = residents.filter((resident: Resident) => {
        if (resident.family && resident.family.members && Array.isArray(resident.family.members)) {
          return resident.family.members.some(member => {
            const blacklistCompareValue = should_be_blacklisted ? 'true' : 'false'; // need to match string val
            return (
              member.phone === phone_number && member.twilio_blacklist !== blacklistCompareValue
            );
          });
        }
        return false;
      });

      if (residentsToUpdate.length) {
        return Observable.forkJoin(
          residentsToUpdate.map(resident => {
            return should_be_blacklisted
              ? this.markNumberAsBlacklistedOnResident(resident, phone_number)
              : this.unmarkNumberAsBlacklistedOnResident(resident, phone_number);
          })
        ).flatMap(() => Observable.of(true));
      }

      return Observable.of(false);
    });
  }

  // --- Profile Images ---

  getResidentProfileImagePath(resident: Resident): string {
    if (resident && resident.hasProfileImage()) {
      return SyncGatewayService.getAttachmentPath(
        RESIDENT_BUCKET,
        resident._id,
        RESIDENT_PROFILE_IMAGE_FILENAME,
        resident._rev
      );
    }

    return GENERIC_PROFILE_IMAGE;
  }

  updateProfileImage(resident: Resident, base64Data: string): Observable<Resident> {
    return this.getAllResidents()
      .flatMap(() =>
        this.syncGatewayService.sendUpdateDocumentAttachmentRequest(
          RESIDENT_BUCKET,
          resident,
          base64Data,
          RESIDENT_PROFILE_IMAGE_FILENAME
        )
      )
      .flatMap(result => {
        // reload user to update _attachments and _rev on successful upload
        return this.getRawResident(resident._id);
      });
  }

  // --- Contact Image ---

  getContactImagePath(resident: Resident, phone: string): string {
    if (resident && resident.hasContactImage(phone)) {
      return SyncGatewayService.getAttachmentPath(
        RESIDENT_BUCKET,
        resident._id,
        resident.getContactImageName(phone),
        resident._rev
      );
    }

    return GENERIC_PROFILE_IMAGE;
  }

  updateContactImage(resident: Resident, phone: string, base64Data: string): Observable<Resident> {
    if (!resident || !phone || !base64Data) {
      return Observable.of(resident);
    }

    return this.getAllResidents()
      .flatMap(() =>
        this.syncGatewayService.sendUpdateDocumentAttachmentRequest(
          RESIDENT_BUCKET,
          resident,
          base64Data,
          resident.getContactImageName(phone)
        )
      )
      .flatMap(result => {
        // reload user to update _attachments and _rev on successful upload
        return this.getRawResident(resident._id);
      })
      .catch(error => {
        if (error.status === 400 || error.status === 409) {
          return this.getRawResident(resident._id);
        }

        return Observable.throw(error);
      });
  }

  updateCache(residentId: string, newResident: Resident, rev: string): Observable<Resident> {
    if (this.residents) {
      const oldResident = this.residents.find(r => r._id === residentId) || new Resident();

      const oldRev = Number((oldResident._rev || '0').split('-')[0]);
      const newRev = Number((rev || '0').split('-')[0]);
      const latestRev = newRev > oldRev ? rev : oldResident._rev;

      if (oldResident._id) {
        _.merge(oldResident, newResident);
        oldResident._rev = latestRev;
      } else {
        newResident._rev = latestRev;
        this.residents.push(newResident);
      }
    }

    return this.getResident(residentId);
  }

  private createResidentFromCouchbaseResult(result): Resident {
    const resident = new Resident();
    if (result.id && result.value) {
      result.value._id = result.id;
      _.merge(resident, result.value);
    } else {
      _.merge(resident, result);
    }

    return resident;
  }
}
