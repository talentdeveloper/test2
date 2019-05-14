import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


@Component({
    selector: 'app-account-list',
    templateUrl: './account-list.component.html',
    styles: [
        '.id-cell { width: 120px }',
        '.action-cell { width: 125px }'
    ]
})
export class AccountListComponent implements OnInit {

    accountId: number;
    accounts: Array<Account> = [];
    dataLoaded = false;
    filteredAccounts: Array<Account> = [];
    search: string;

    constructor(
        private route: ActivatedRoute,
        private accountService: AccountService,
        private uiEventService: UiEventService
    ) {}

    ngOnInit() {
        this.accountService.getAccounts().subscribe(
            (accounts) => {
                this.accounts = accounts;
                this.filteredAccounts = accounts;
                this.dataLoaded = true;
            },
            (error) => {
                this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
                this.dataLoaded = true;
            }
        );
    }

    filterAccounts() {
        if (this.search.length) {
            const searchPhrase = this.search.toLowerCase();

            this.filteredAccounts = this.accounts.filter(account => {
                const accountName = account.profile && account.profile.account_name ? account.profile.account_name : '';
                return account._id.toLowerCase().includes(searchPhrase) || accountName.toLowerCase().includes(searchPhrase);
            });
        } else {
            this.filteredAccounts = this.accounts;
        }
    }
}
