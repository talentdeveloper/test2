import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { BreadcrumbService } from '../../../core/breadcrumb/breadcrumb.service';
import { IUser, USER_STATUS_ACTIVE, USER_STATUS_INACTIVE } from '../../../model/user/user';
import { ToasterMessage } from '../../../core/ui-event-service/ui-toaster-message';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { UserService } from '../../../core/user/user.service';
import { UserViewComponent } from '../../../shared/components/user-view/user-view.component';


@Component({
    selector: 'app-admin-view-user',
    templateUrl: './admin-view-user.component.html'
})
export class AdminViewUserComponent implements OnInit {
    @ViewChild(UserViewComponent) userViewComponent: UserViewComponent;

    user: IUser;
    userId: string;

    constructor (
        private breadcrumbService: BreadcrumbService,
        private route: ActivatedRoute,
        private router: Router,
        private uiEventService: UiEventService,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.route.params.subscribe( ( params: { user_id: string } ) => {
            this.userId = params.user_id;

            this.userService.getUser( this.userId )
                .subscribe(
                    (user: IUser) => {
                        this.user = user;

                        this.breadcrumbService.updateBreadcrumbs([
                            { label: 'User List', url: '/admin/user/list' },
                            { label: `${this.user.first_name} ${this.user.last_name}`, url: '' }
                        ]);
                    },
                    error => {
                        this.uiEventService.dispatch( new ToasterMessage({ body: error, type: 'error' }) );
                    },
                    () => {
                        this.userViewComponent.dataIsLoaded();
                    }
                );
        });

        // trigger last value
        this.route.params.last();
    }

    onEditUser(user: IUser): void {
        this.router.navigateByUrl( `/admin/user/${user._id}/edit` );
    }
}
