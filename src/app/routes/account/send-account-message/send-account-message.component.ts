import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { AccountMessage, Message } from '../../../model/message/message';
import { MessageService } from '../../../core/message/message.service';
import { Account } from '../../../model/account/account';
import { LoaderService } from '../../../core/loader/loader.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

const COMPONENT_NAME = 'send-account-message';

@Component({
    selector: 'app-send-account-message',
    templateUrl: './send-account-message.component.html'
})
export class SendAccountMessageComponent implements OnInit {

    accountId: string;
    accountName: string;
    message: AccountMessage;

    constructor(
        protected accountService: AccountService,
        protected breadcrumbService: BreadcrumbService,
        protected messageService: MessageService,
        protected route: ActivatedRoute,
        protected uiEventService: UiEventService,
        protected loaderService: LoaderService
    ) { }

    ngOnInit() {
        this.route.params.subscribe((v: { id: string }) => {
            this.accountId = v.id;
        });

        this.route.params.last();

        this.loaderService.start(COMPONENT_NAME);

        this.accountService.getAccount(this.accountId)
            .subscribe((account: Account) => {
                this.accountName = account.profile.account_name;
                this.initNewAccountMessage();
                this.loaderService.stop(COMPONENT_NAME);
            }, () => {
                this.loaderService.stop(COMPONENT_NAME);
            });
    }

    onSubmit(message: Message) {
        this.loaderService.start(COMPONENT_NAME);

        this.messageService.sendMessage(message)
            .subscribe(() => {
                this.message = message;
                this.loaderService.stop(COMPONENT_NAME);
            }, () => {
                this.loaderService.stop(COMPONENT_NAME);
            });
    }

    resetForm() {
        this.initNewAccountMessage();
    }

    private initNewAccountMessage() {
        this.message = new AccountMessage();
        this.message.recipient_id = this.accountId;
        this.message.from_name = this.accountName;
    }
}
