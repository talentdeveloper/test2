import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { InviteListComponent } from './invite-list/invite-list.component';
import { ROLE_ADMIN_SEND_INVITES, ROLE_ADMIN_MANAGE_INVITES } from '../../model/role/role';
import { RoleGuard } from '../../core/guard/role-guard';
import { SendInvitationComponent } from './send-invitation/send-invitation.component';


const routes: Routes = [
    {
        path: 'send',
        component: SendInvitationComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'Send Invitation', url: '' }],
            roles: [ ROLE_ADMIN_SEND_INVITES ]
        }
    },
    {
        path: 'list',
        component: InviteListComponent,
        canActivate: [ RoleGuard ],
        data: {
            breadcrumbs: [{ label: 'Open Invitations', url: '' }],
            roles: [ ROLE_ADMIN_MANAGE_INVITES ]
        }
    }
];


@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(routes)
    ],
    declarations: [
        InviteListComponent,
        SendInvitationComponent
    ],
    exports: [
        RouterModule
    ]
})
export class InviteModule { }
