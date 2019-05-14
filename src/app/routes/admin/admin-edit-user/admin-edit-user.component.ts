import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { IUser } from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserService } from '../../../core/user/user.service';


@Component({
    selector: 'app-admin-edit-user',
    templateUrl: './admin-edit-user.component.html'
})
export class AdminEditUserComponent implements OnInit {

    dataLoaded = false;
    user: IUser;
    userId: string;

    constructor(
        private breadcrumbService: BreadcrumbService,
        private location: Location,
        private route: ActivatedRoute,
        private router: Router,
        private uiEventService: UiEventService,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(( params: { user_id: string } ) => {
            this.userId = params.user_id;

            this.loadData();
        });

        // trigger last value
        this.route.params.last();
    }

    onSubmit(event) {
        this.router.navigateByUrl(`/admin/user/${this.userId}`);
    }

    onCancel() {
        this.location.back();
    }

    private loadData(): void {
        this.userService.getUser( this.userId )
            .subscribe(
                (user: IUser) => {
                    this.user = user;

                    this.breadcrumbService.updateBreadcrumbs([
                        { label: 'User List', url: '/admin/user/list' },
                        { label: `${this.user.first_name} ${this.user.last_name}`, url: `/admin/user/${user._id}` },
                        { label: `Edit Profile`, url: '' }
                    ]);
                },
                error => {
                    this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
                },
                () => {
                    this.dataLoaded = true;
                }
            );
    }
}
