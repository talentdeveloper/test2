/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Angular2TokenService } from 'angular2-token';
import { BaseRequestOptions, Http, HttpModule, Response, ResponseOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { $WebSocket, WebSocketConfig } from 'angular2-websocket/angular2-websocket';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { AuthenticationService } from '../authentication/authentication.service';
import { ContentChangeFeedService } from '../content/content-change-feed.service';
import { PortalAPIService } from '../portal-api/portal-api.service';
import { SyncGatewayService, CONTENT_BUCKET } from '../sync-gateway/sync-gateway.service';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { UserService } from '../user/user.service';
import { UserFactoryService } from '../user/user-factory.service';
import { WebSocketFactory } from '../../model/web-socket/web-socket-factory';

describe('ContentChangeFeedService', () => {
  let mockBackend;
  let authenticationService,
    contentChangeFeedService,
    syncGatewayService,
    portalAPIService,
    uiEventService,
    userFactoryService,
    userService,
    WebSock;

  const websocketUrlWithCreds = 'wss://contentUser:contentPass@syncgw.com:4984';
  const lastSeq = 100;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        Angular2TokenService,
        AuthenticationService,
        BaseRequestOptions,
        ContentChangeFeedService,
        MockBackend,
        PortalAPIService,
        SyncGatewayService,
        UiEventService,
        UserFactoryService,
        UserService,
        {
          provide: Http,
          useFactory: (backendInstance: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backendInstance, defaultOptions);
          },
          deps: [MockBackend, BaseRequestOptions]
        }
      ]
    });
  });

  beforeEach(inject(
    [
      AuthenticationService,
      ContentChangeFeedService,
      MockBackend,
      PortalAPIService,
      SyncGatewayService,
      UiEventService,
      UserService
    ],
    (
      _authenticationService: AuthenticationService,
      _contentChangeFeedService: ContentChangeFeedService,
      _mockBackend: MockBackend,
      _portalAPIService: PortalAPIService,
      _syncGatewayService: SyncGatewayService,
      _uiEventService: UiEventService,
      _userFactoryService: UserFactoryService,
      _userService: UserService
    ) => {
      authenticationService = _authenticationService;
      contentChangeFeedService = _contentChangeFeedService;
      mockBackend = _mockBackend;
      syncGatewayService = _syncGatewayService;
      portalAPIService = _portalAPIService;
      uiEventService = _uiEventService;
      userFactoryService = _userFactoryService;
      userService = _userService;
    }
  ));

  describe('startContentChangeWatch', () => {
    let getDataStreamCalled = false;
    const mockWebSocket = {
      send: (config: any) => {
        expect(config.include_docs).toBe(true);
        expect(config.since).toBe(lastSeq);
        expect(config.heartbeat).toBe(30000);

        return Observable.throw('Socket connection has been closed');
      },

      getDataStream: () => {
        getDataStreamCalled = true;

        return Observable.of('message');
      },

      close: (immediate: boolean) => {
        expect(immediate).toBe(false);
      }
    };

    beforeEach(() => {
      spyOn(authenticationService, 'getCurrentUserDocumentChangedByValue').and.callFake(
        (): string => 'test@in2l.com'
      );

      spyOn(WebSocketFactory, 'create').and.callFake((url: string, config: WebSocketConfig) => {
        expect(url).toBe(websocketUrlWithCreds);
        expect(config.initialTimeout).toBe(50);
        expect(config.maxTimeout).toBe(50);
        expect(config.reconnectIfNotNormalClose).toBe(true);

        return mockWebSocket;
      });

      spyOn(syncGatewayService, 'sendGetLastChange').and.callFake(bucketName => {
        expect(bucketName).toBe(CONTENT_BUCKET);

        return Observable.of({ last_seq: lastSeq });
      });

      spyOn(syncGatewayService, 'changeFeedUrlForEnvironment').and.callFake(bucketName => {
        expect(bucketName).toBe(CONTENT_BUCKET);

        return Observable.of(websocketUrlWithCreds);
      });
    });

    // it('should initialize the websocket and setup change subscriptions', () => {
    //   getDataStreamCalled = false;
    //   expect(contentChangeFeedService.feedIsOpen()).toBe(false);
    //   contentChangeFeedService.startContentChangeWatch();
    //   expect(contentChangeFeedService.feedIsOpen()).toBe(true);
    //   expect(getDataStreamCalled).toBe(true);
    //   contentChangeFeedService.close();
    //   expect(contentChangeFeedService.feedIsOpen()).toBe(false);
    // });
  });
});
