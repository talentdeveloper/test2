/**
 *  PortalAPIService
 **
 *  This class will setup communication with the portal api
 *
 *  Communication happens through a HTTP REST calls, guarded by the passing
 *  authentication information in the header from the Angular2TokenService
 *  http wrappers
 */

import { Injectable, Injector } from '@angular/core';
import { RequestMethod, RequestOptions, Response, ResponseContentType } from '@angular/http';
import { Router } from '@angular/router';
import { Angular2TokenService } from 'angular2-token';
import { Observable } from 'rxjs/Observable';

import { AuthenticationService } from '../../core/authentication/authentication.service';
import { environment } from '../../../environments/environment';
import { IUser } from '../../model/user/user';
import { UnauthorizedMessage } from '../ui-event-service/ui-unauthorized';
import { UiEventService } from '../ui-event-service/ui-event-service';

const SYNC_GATEWAY_PROXY_PATH = '/api/syncgw';

@Injectable()
export class PortalAPIService {
  private authenticationService: AuthenticationService;

  static normalizeUrl(path) {
    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    return path;
  }

  static requestMethodToString(requestMethod: RequestMethod): string {
    switch (requestMethod) {
      case RequestMethod.Get:
        return 'GET';
      case RequestMethod.Put:
        return 'PUT';
      case RequestMethod.Post:
        return 'POST';
      case RequestMethod.Delete:
        return 'DELETE';
      default:
        return 'GET';
    }
  }

  constructor(
    private injector: Injector,
    private router: Router,
    private tokenService: Angular2TokenService,
    private uiEventService: UiEventService
  ) {
    // due to a cyclic dependancy between the AuthenticationService and this
    // SyncGatewayService, we need to load the auth manually
    // @see: http://stackoverflow.com/a/40860233/5578570
    setTimeout(
      () =>
        (this.authenticationService = <AuthenticationService>injector.get(AuthenticationService))
    );
  }

  // --- Invite requests ---

  sendInvite(inviteData): Observable<any> {
    return this.sendRequest('/api/invites', inviteData, RequestMethod.Post);
  }

  deleteInvite(user: IUser): Observable<boolean> {
    return this.sendRequest(
      `/api/invites/${user._id}`,
      { id: user._id, email: user.email },
      RequestMethod.Delete
    ).map(result => !!result.success);
  }

  sendPublicUserStatusRequest(user_id: string): Observable<string> {
    return this.sendRequest(`${SYNC_GATEWAY_PROXY_PATH}/user_status/${user_id}`).map(
      (statusResult: { status?: string }) => (statusResult.status ? statusResult.status : '')
    );
  }

  // --- Device requests ---

  sendAddDeviceUser(deviceSerialNumber: string): Observable<any> {
    return this.sendRequest(
      '/api/devices',
      { serial_number: deviceSerialNumber },
      RequestMethod.Post
    );
  }

  sendRemoveDeviceUser(deviceSerialNumber: string): Observable<any> {
    return this.sendRequest(`/api/devices/${deviceSerialNumber}`, null, RequestMethod.Delete);
  }

  sendDeviceUserExists(deviceSerialNumber: string): Observable<any> {
    return this.sendRequest(`/api/devices/${deviceSerialNumber}/exists`);
  }

  getDeviceUserList(): Observable<any> {
    return this.sendRequest('/api/devices/list');
  }

  // User Profile Facility User

  sendAddFacilityUserRequest(facilityId: string): Observable<any> {
    return this.sendRequest(`/api/facility_user/${facilityId}`, {}, RequestMethod.Post);
  }

  // --- Welcome Text ---

  sendWelcomeTextMessage(data: { family_member_phone: string; facility: string }): Observable<any> {
    return this.sendRequest('/api/text_messages/send_welcome_text', data, RequestMethod.Post);
  }

  // --- AWS ---

  deleteS3Object(key: string) {
    return this.sendRequest(
      `/api/content/media/${encodeURIComponent(key)}`,
      null,
      RequestMethod.Delete
    );
  }

  // --- Content User Credentials ---

  getContentUserCredentials() {
    return this.sendRequest(`/api/content_user`);
  }

  // --- SyncGateway Request ---

  sendSyncGatewayRequest(
    url: string,
    options?: { method?: RequestMethod; data?: any; contentType?: string }
  ) {
    const defaultSyncGatewayOptions = {
      method: RequestMethod.Get,
      data: null,
      contentType: 'application/json'
    };

    options = Object.assign({}, defaultSyncGatewayOptions, options);

    const syncgatewayData = {
      url,
      method: PortalAPIService.requestMethodToString(options.method),
      data: options.data,
      contentType: options.contentType
    };

    return this.sendRequest(SYNC_GATEWAY_PROXY_PATH, syncgatewayData, RequestMethod.Post, false);
  }

  sendSyncGatewayGetAttachmentRequest(url: string): Observable<Blob> {
    url = `${SYNC_GATEWAY_PROXY_PATH}/${PortalAPIService.normalizeUrl(url)}`;

    /**
     * NOTE: Need to duplicate url in requestOptions, tokenService does not update it
     * like you would expect. In requestOptions, we need to prepend the base api url,
     * but the url in the 'tokenService.get' request needs to be a relative path
     */
    const requestOptions = new RequestOptions({
      url: `${environment.portal.apiURL}/${PortalAPIService.normalizeUrl(url)}`,
      method: RequestMethod.Get,
      responseType: ResponseContentType.Blob
    });

    return this.tokenService.get(url, requestOptions).map((response: Response) => response.blob());
  }

  sendSyncGatewaySaveAttachmentRequest(
    url: string,
    base64Data: string,
    filename: string
  ): Observable<any> {
    url = `${SYNC_GATEWAY_PROXY_PATH}/${PortalAPIService.normalizeUrl(url)}`;

    const data = {
      file_name: filename,
      file_contents: base64Data
    };

    return this.sendRequest(url, data, RequestMethod.Post, false);
  }

  // --- send actual request ---

  private sendRequest(
    path: string,
    data?: Object,
    method: RequestMethod = RequestMethod.Get,
    processResponse: boolean = true
  ) {
    path = PortalAPIService.normalizeUrl(path);

    let requestObservable;

    // unfortunately calling this.tokenService.request() was not working, so
    // we need this longer if-else block
    if (method === RequestMethod.Get) {
      requestObservable = this.tokenService.get(path, data);
    } else if (method === RequestMethod.Put) {
      requestObservable = this.tokenService.put(path, data);
    } else if (method === RequestMethod.Post) {
      requestObservable = this.tokenService.post(path, data);
    } else if (method === RequestMethod.Delete) {
      requestObservable = this.tokenService.delete(path, data);
    } else {
      requestObservable = Observable.throw(`Unsupported api request method (${method})`);
    }

    // do not process response, just return raw observable
    return requestObservable
      .map((response: Response) => {
        return !processResponse ? response : response.json();
      })
      .catch((error: any) => {
        if (error.status === 401) {
          // this.authenticationService.signOut();
          // this.router.navigateByUrl('/login');
          this.uiEventService.dispatch(new UnauthorizedMessage());
          return Observable.throw(new Error('unauthenticated request'));
          // return Observable.of(null);
        }
        return Observable.throw(error || 'Unknown server error');
      });
  }
}
