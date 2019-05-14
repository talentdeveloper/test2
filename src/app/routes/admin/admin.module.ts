import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


import { AdminUserAccountTypeComponent } from './admin-user-account-type/admin-user-account-type.component';
import { AdminAccountDeviceListComponent } from './admin-account-device-list/admin-account-device-list.component';
import { AdminDeviceListComponent } from './admin-device-list/admin-device-list.component';
import { AdminEditUserComponent } from './admin-edit-user/admin-edit-user.component';
import { AdminResidentDeviceListComponent } from './admin-resident-device-list/admin-resident-device-list.component';
import { AdminUserListComponent } from './admin-user-list/admin-user-list.component';
import { AdminViewUserComponent } from './admin-view-user/admin-view-user.component';
import { RoleGuard } from '../../core/guard/role-guard';
import { ROLE_CHANGE_USER_TYPE } from '../../model/role/role';
import { SharedModule } from '../../shared/shared.module';


const routes: Routes = [
    {
        path: 'account/device/list',
        component: AdminAccountDeviceListComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'Device List', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    },
    {
        path: 'device/list',
        component: AdminDeviceListComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'Device List', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    },
    {
        path: 'resident/device/list',
        component: AdminResidentDeviceListComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'Resident Device List', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    },
    {
        path: 'user/list',
        component: AdminUserListComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'User List', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    },
    {
        path: 'user/:user_id',
        component: AdminViewUserComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'View User', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    },
    {
        path: 'user/:user_id/account-type',
        component: AdminUserAccountTypeComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'User Account Type', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    },
    {
        path: 'user/:user_id/edit',
        component: AdminEditUserComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'Edit User', url: '' }],
            roles: [ ROLE_CHANGE_USER_TYPE ]
        }
    }
];


@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        AdminUserAccountTypeComponent,
        AdminAccountDeviceListComponent,
        AdminDeviceListComponent,
        AdminEditUserComponent,
        AdminResidentDeviceListComponent,
        AdminUserListComponent,
        AdminViewUserComponent
    ],
    exports: [
        RouterModule
    ]
})
export class AdminModule { }
