import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { IUser } from '../../../model/user/user';
import { UserService } from '../../../core/user/user.service';
import { UserViewComponent } from '../../../shared/components/user-view/user-view.component';


@Component({
    selector: 'app-view-profile',
    templateUrl: './view-profile.component.html'
})
export class ViewProfileComponent implements OnInit {
    @ViewChild(UserViewComponent) userViewComponent: UserViewComponent;

    user: IUser;

    constructor(
        private authenticationService: AuthenticationService,
        private router: Router,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.user = this.authenticationService.currentUser().getValue();
        this.userViewComponent.dataIsLoaded();
    }

    onEditUser(user: IUser) {
        this.router.navigateByUrl( '/profile/edit' );
    }

    onChangePassword(user: IUser) {
        this.router.navigateByUrl( '/profile/password' );
    }
}
