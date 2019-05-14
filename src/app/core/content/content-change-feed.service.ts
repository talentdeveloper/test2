import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { $WebSocket, WebSocketConfig } from 'angular2-websocket/angular2-websocket';

import { ContentChangedMessage, RefreshRootMessage } from '../ui-event-service/ui-content-tree';
import { WebSocketFactory } from '../../model/web-socket/web-socket-factory';
import { SyncGatewayDocumentChange } from '../../model/sync-gateway/sync-gateway-document-change';
import { SyncGatewayService, CONTENT_BUCKET } from '../sync-gateway/sync-gateway.service';
import { AuthenticationService } from '../authentication/authentication.service';
import { ToasterMessage } from '../ui-event-service/ui-toaster-message';
import { UiEventService } from '../ui-event-service/ui-event-service';
import { USER_TYPE_IN2L_ADMIN, USER_TYPE_IN2L } from '../../model/user/user';

@Injectable()
export class ContentChangeFeedService {
  private changeFeedSocket: $WebSocket;
  private socketOpen = false;
  private locallyModified: { [id: string]: number } = {};

  constructor(
    protected authenticationService: AuthenticationService,
    protected uiEventService: UiEventService,
    protected syncGatewayService: SyncGatewayService
  ) {}

  startContentChangeWatch() {
    const user = this.authenticationService.currentUser().value;
    if (!user || ![USER_TYPE_IN2L_ADMIN, USER_TYPE_IN2L].includes(user.type)) {
      return;
    }

    this.syncGatewayService.getChanges(CONTENT_BUCKET).subscribe(changes => {
      if (changes && changes.last_seq) {
        const lastSeq = changes.last_seq;
        this.initializeSocket(lastSeq);
      }
    });
  }

  // Manually close the socket
  close() {
    // If the socket is closed unexpectedly,
    // the angular2-websocket library will automatically re-open it
    // so there is no concern about the socket being closed when we thing it is open
    if (this.socketOpen) {
      this.changeFeedSocket.close(false);
      this.socketOpen = false;
      console.log('Content change feed socket closed');
    }
  }

  recordLocalModification(id: string) {
    if (this.locallyModified[id]) {
      this.locallyModified[id]++;
      return;
    }
    this.locallyModified[id] = 1;
  }

  feedIsOpen(): boolean {
    return this.socketOpen;
  }

  private initializeSocket(lastSeq: string) {
    const webSocketConfig: WebSocketConfig = {
      initialTimeout: 50,
      maxTimeout: 50,
      reconnectIfNotNormalClose: true
    };

    // Get the web socket change feed URL with credentials
    this.syncGatewayService.changeFeedUrlForEnvironment(CONTENT_BUCKET).subscribe((url: string) => {
      if (url === null) {
        console.log(
          'Unable to retrieve change feed socket URL with credentials. The change feed will not be started.'
        );
        return;
      }

      // Create the socket
      this.changeFeedSocket = WebSocketFactory.create(url, webSocketConfig);

      // Send socket config to start the connection
      this.changeFeedSocket
        .send({ include_docs: true, since: lastSeq, heartbeat: 30 * 1000 })
        .subscribe(
          (msg: MessageEvent) => {
            // This is never called
          },
          error => {
            // A socket closed error is expected
            if (error !== 'Socket connection has been closed') {
              throw error;
            }

            console.log('Content Change Feed Socket Initialized!');
            this.socketOpen = true;
          }
        );

      this.changeFeedSocket.getDataStream().subscribe(
        (messageEvent: MessageEvent) => {
          if (messageEvent.data) {
            const toNotify: {
              [id: string]: { locallyChanged: boolean; item: SyncGatewayDocumentChange };
            } = {};
            const data: SyncGatewayDocumentChange[] = JSON.parse(messageEvent.data);
            if (data.length > 0) {
              data.forEach((item: SyncGatewayDocumentChange) => {
                const locallyChanged =
                  this.locallyModified[item.id] && this.locallyModified[item.id] > 0;

                if (locallyChanged) {
                  this.locallyModified[item.id]--;
                }

                toNotify[item.id] = { locallyChanged, item };
              });

              Object.keys(toNotify).forEach((id: string) => {
                const item = toNotify[id].item;
                const locallyChanged = toNotify[id].locallyChanged;
                this.uiEventService.dispatch(
                  new ContentChangedMessage(item.id, !!item.deleted, item.doc, locallyChanged)
                );
              });
            }
          }
        },
        socketError => {
          console.log('Content changeFeedSocket.error: ', socketError);
          this.uiEventService.dispatch(
            new ToasterMessage({
              body:
                'There was an error while syncing content changes from other users. ' +
                'Please refresh the page to restore content update syncronization.',
              type: 'error'
            })
          );
        },
        () => {
          console.log('changeFeedSocket.complete');
        }
      );
    });
  }
}
