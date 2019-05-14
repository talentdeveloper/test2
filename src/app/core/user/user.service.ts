import { Injectable } from '@angular/core';
import { /*Http, */ Response /*, Headers, RequestOptions*/ } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { UUID } from 'angular2-uuid';
import 'rxjs/add/operator/find';

import { Attachment } from '../../model/attachment/attachment';
import {
  IUser,
  USER_TYPE_FACILITY_ADMIN,
  USER_TYPE_FACILITY_USER,
  USER_STATUS_INVITED,
  USER_STATUS_ACTIVE,
  USER_STATUS_INACTIVE,
  USER_PROFILE_IMAGE_FILENAME,
  USER_RESIDENT_MODE_ALL
} from '../../model/user/user';
import { PortalAPIService } from '../portal-api/portal-api.service';
import {
  SyncGatewayService,
  USER_PROFILE_BUCKET,
  IUpdateResult
} from '../sync-gateway/sync-gateway.service';
import { UserFactoryService } from './user-factory.service';
import { SyncAdminApiService } from '../sync-admin-api/sync-admin-api.service';
import { ISyncGatewayModel } from '../../model/sync-gateway/sync-gateway-model';

@Injectable()
export class UserService {
  constructor(
    private syncAdminApiService: SyncAdminApiService,
    private portalAPIService: PortalAPIService,
    private syncGatewayService: SyncGatewayService,
    private userFactoryService: UserFactoryService
  ) {}

  getUser(user_id: string): Observable<IUser> {
    return this.syncGatewayService
      .sendGetDocumentRequest(USER_PROFILE_BUCKET, user_id)
      .filter(result => result.type !== 'contact')
      .map(result => {
        return this.userFactoryService.createUserFromCouchbaseResult(result);
      });
  }

  getAllUsers(): Observable<IUser[]> {
    return this.syncGatewayService
      .sendGetAllDocumentsRequest(USER_PROFILE_BUCKET)
      .flatMap(userArray => {
        const users = userArray
          .filter(result => result.type !== 'contact')
          .map(user => this.userFactoryService.createUserFromCouchbaseResult(user));
        return Observable.of(users.filter(user => !!user));
      });
  }

  getActiveUsers(): Observable<IUser[]> {
    return this.getAllUsers().flatMap((users: IUser[]) =>
      Observable.of(users.filter(user => user.status === USER_STATUS_ACTIVE))
    );
  }

  /**
   * getUserWithStatus(...statusParams)
   * pass in multiple user status values as separate function arguments to get a list
   * of users that match each type provided
   */
  getUsersWithStatus(...statusParms): Observable<IUser[]> {
    return this.getAllUsers().flatMap((users: IUser[]) => {
      const usersWithStatus = users.filter(user => user && statusParms.includes(user.status));
      return Observable.of(usersWithStatus);
    });
  }

  getInvitedUsers(): Observable<IUser[]> {
    return this.getAllUsers().flatMap((users: IUser[]) => {
      const invitedUsers = users.filter(user => user && user.status === USER_STATUS_INVITED);
      return Observable.of(invitedUsers);
    });
  }

  createUser(user: IUser, id?: string): Observable<IUser> {
    const userId = id ? id : UUID.UUID();

    return this.syncGatewayService
      .sendAddDocumentRequest(USER_PROFILE_BUCKET, userId, user)
      .flatMap(() => {
        return this.syncAdminApiService.updatePortalUserSyncAdmin(user);
      })
      .flatMap(() => {
        return this.getUser(userId);
      });
  }

  // create a user in an invited status .. these are user profiles that exists
  // after a permissioned user sends an invite, but before the user completes their profile
  createInvitedUser(
    accountType: string,
    email: string = '',
    accountId: string = '',
    facilityIds: string[] = [],
    firstName: string = '',
    lastName: string = '',
    phone: string = '',
    title: string = '',
    pin: string = '',
    isTemporaryPin: boolean = false,
    residentIds: string[] = [],
    residentMode: string = USER_RESIDENT_MODE_ALL
  ): Observable<IUser> {
    const invitedUser = this.userFactoryService.createInvitedUser(
      accountType,
      email,
      accountId,
      facilityIds,
      firstName,
      lastName,
      phone,
      title,
      pin,
      isTemporaryPin,
      residentIds,
      residentMode
    );
    return this.createUser(invitedUser);
  }

  updateUser(user): Observable<IUser> {
    return this.syncGatewayService
      .sendUpdateDocumentRequest(USER_PROFILE_BUCKET, user)
      .flatMap((updatedUser: IUpdateResult) => {
        console.log(updatedUser);
        return this.syncAdminApiService.updatePortalUserSyncAdmin(user);
      })
      .flatMap(result => {
        // reload user to update _rev on successful update
        return this.getUser(user._id);
      });
  }

  // attachments
  updateUserRemoveProfileImage(user: IUser): Observable<IUser> {
    user._attachments.delete(USER_PROFILE_IMAGE_FILENAME);
    return this.updateUser(user);
  }

  updateProfileImage(user: IUser, base64ImageData: string) {
    return this.syncGatewayService
      .sendUpdateDocumentAttachmentRequest(
        USER_PROFILE_BUCKET,
        user,
        base64ImageData,
        USER_PROFILE_IMAGE_FILENAME
      )
      .flatMap((result: IUpdateResult) => {
        // reload user to update _attachments and _rev on successful upload
        const updatedUser = this.getUser(user._id);
        return updatedUser;
      });
  }

  getUserByEmail(email: string): Observable<IUser> {
    if (!email) {
      return Observable.of(null);
    }

    const emailLowerCase = email.toLowerCase();

    // TODO:: this is horribly inefficient, need to find a better way to scan for users by email address
    return this.syncGatewayService
      .getUserByEmailView(emailLowerCase)
      .flatMap((result: ISyncGatewayModel) => {
        const user =
          result && result['type'] !== 'contact'
            ? this.userFactoryService.createUserFromCouchbaseResult(<IUser>result)
            : null;
        return Observable.of(user);
      });
  }

  getUsersForFacility(accountId: string, facilityId: string): Observable<IUser[]> {
    return this.getUsersWithStatus(USER_STATUS_ACTIVE, USER_STATUS_INACTIVE).flatMap(
      (users: IUser[]) => {
        const filteredUsers = users
          .filter(
            user => user.type === USER_TYPE_FACILITY_ADMIN || user.type === USER_TYPE_FACILITY_USER
          )
          .filter(
            user =>
              user.account_id === accountId &&
              user.facility_ids &&
              user.facility_ids.includes(facilityId)
          );
        return Observable.of(filteredUsers);
      }
    );
  }

  deleteUser(user: IUser): Observable<boolean> {
    return this.syncGatewayService
      .sendDeleteDocumentRequest(USER_PROFILE_BUCKET, user)
      .map(result => !!result.ok);
  }

  // --- Disable / Re-Activate Account ---

  disableUser(user: IUser): Observable<IUser> {
    user.status = USER_STATUS_INACTIVE;
    return this.updateUser(user);
  }

  activateUser(user: IUser): Observable<IUser> {
    user.status = USER_STATUS_ACTIVE;
    return this.updateUser(user);
  }

  // --- Anonymous User Status Request ---

  getPublicUserStatus(user_id: string): Observable<string> {
    return this.portalAPIService.sendPublicUserStatusRequest(user_id);
  }

  getUserProfileImagePath(user: IUser): string {
    if (user.hasProfileImage()) {
      return SyncGatewayService.getAttachmentPath(
        USER_PROFILE_BUCKET,
        user._id,
        USER_PROFILE_IMAGE_FILENAME,
        user._rev
      );
    }

    return '/assets/img/user/generic.png';
  }
}
