import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { IUser } from '../../../model/user/user';


@Component({
    selector: 'app-edit-profile',
    templateUrl: './edit-profile.component.html'
})
export class EditProfileComponent implements OnInit {

    user: IUser;

    constructor(
        private authenticationService: AuthenticationService,
        private router: Router
    ) { }

    ngOnInit() {
        this.user = this.authenticationService.currentUser().getValue();
    }

    onSubmit(user: IUser) {
        this.router.navigateByUrl( '/profile' );
    }

    onCancel() {
        this.router.navigateByUrl( '/profile' );
    }
}
