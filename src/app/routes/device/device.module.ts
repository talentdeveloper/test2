import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { ROLE_VIEW_DEVICE_STATUS } from '../../model/role/role';
import { RoleGuard } from '../../core/guard/role-guard';
import { ViewDeviceStatusesComponent } from './view-device-statuses/view-device-statuses.component'
import { DeviceStatusListComponent } from './device-status-list/device-status-list.component';

const routes: Routes = [
    {
        path: 'status',
        component: ViewDeviceStatusesComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [
                { label: 'Device Status List', url: '' }
            ],
            roles: [ ROLE_VIEW_DEVICE_STATUS ]
        }
    }
];


@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        ViewDeviceStatusesComponent,
        DeviceStatusListComponent
    ],
    exports: [
        RouterModule
    ]
})
export class DeviceModule { }
