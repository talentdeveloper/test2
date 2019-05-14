import { Injectable } from '@angular/core';

import { Message } from '../../model/message/message';
import { SyncGatewayService, MESSAGE_BUCKET } from '../sync-gateway/sync-gateway.service';

@Injectable()
export class MessageService {

    constructor(
        protected syncGatewayService: SyncGatewayService
    ) { }

    sendMessage(message: Message) {
        const accountId = message._id;
        return this.syncGatewayService.sendAddDocumentRequest(MESSAGE_BUCKET, accountId, message);
    }
}
