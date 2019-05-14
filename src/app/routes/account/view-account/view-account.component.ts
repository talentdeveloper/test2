import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd} from '@angular/router';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


@Component({
    selector: 'app-view-account',
    providers: [ AccountService ],
    templateUrl: './view-account.component.html'
})
export class ViewAccountComponent implements OnInit {

    account: any;
    accountId: string;
    selectedAccount: any;

    constructor (
        private route: ActivatedRoute,
        private accountService: AccountService,
        private breadcrumbService: BreadcrumbService,
        private uiEventService: UiEventService
    ) { }

    ngOnInit() {
        // resolves view refresh if only params update (no component instantiation)
        this.route.params.subscribe((v: { id: string }) => {
            this.resolveUser(v.id);
        });

        this.resolveUser(this.route.snapshot.params['id']);
    }

    private resolveUser(id: string) {
        this.accountService.getAccount(id).subscribe(
            (result) => {
                this.account = <Account> result;

                // update breadcrumb with accounnt information
                this.breadcrumbService.updateBreadcrumbs([{ label: this.account.profile.account_name, url: '' }]);
            },
            (error) => {
                this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
            }
        );
    }
}
