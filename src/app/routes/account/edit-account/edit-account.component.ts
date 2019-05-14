import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { Observable } from 'rxjs/Observable';

import { Account } from '../../../model/account/account';
import { AccountService } from '../../../core/account/account.service';
import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { SettingsService } from '../../../core/settings/settings.service';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';


@Component({
    selector: 'app-edit-account',
    templateUrl: './edit-account.component.html'
})
export class EditAccountComponent implements OnInit {

    accountId: string;
    account: Account;

    constructor(
        private route: ActivatedRoute,
        private accountService: AccountService,
        private breadcrumbService: BreadcrumbService,
        private uiEventService: UiEventService
    ) { }

    ngOnInit() {
        this.accountId = this.route.snapshot.params['id'];

        this.accountService.getAccount(this.accountId).subscribe(
            (result: Account) => {
                this.account = result;

                // update breadcrumb with accounnt information
                this.breadcrumbService.updateBreadcrumbs([{ label: `Edit ${this.account.profile.account_name}`, url: '' }]);
            },
            (error) => {
                this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
            }
        );
    }

}
