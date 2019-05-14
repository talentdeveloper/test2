import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '../../core/guard/auth-guard';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { SharedModule } from '../../shared/shared.module';
import { ViewProfileComponent } from './view-profile/view-profile.component';

const viewProfileBreadcrumb = { label: 'View Profile', url: '/profile' };

// Profile components should only pull in current logged in user information so
// no guards other than an auth guard are needed, and we do not need to define
// a user id in the profile paths

const routes: Routes = [
    {
        path: '',
        component: ViewProfileComponent,
        canActivate: [ AuthGuard ],
        data: {
            breadcrumbs: [{ label: 'View Profile', url: '' }]
        }
    },
    {
        path: 'edit',
        component: EditProfileComponent,
        canActivate: [ AuthGuard ],
        data: {
            breadcrumbs: [
                viewProfileBreadcrumb,
                { label: 'Edit Profile', url: '' }
            ]
        }
    },
    {
        path: 'password',
        component: ChangePasswordComponent,
        canActivate: [ AuthGuard ],
        data: {
            breadcrumbs: [
                viewProfileBreadcrumb,
                { label: 'Change Profile Password', url: '' }
            ]
        }
    }
];


@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        ChangePasswordComponent,
        EditProfileComponent,
        ViewProfileComponent
    ],
    exports: [
        RouterModule
    ]
})
export class ProfileModule { }
