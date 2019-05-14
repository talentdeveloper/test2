import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SelectModule } from 'ng2-select';
import { Ng2TableModule } from 'ng2-table/ng2-table';

import { SharedModule } from '../../shared/shared.module';
import { AccountDashboardComponent } from './account-dashboard/account-dashboard.component';
import { AccountFormComponent } from './shared/account-form/account-form.component';
import { AccountGuard } from '../../core/guard/account-guard';
import { AccountListComponent } from './account-list/account-list.component';
import { AddAccountComponent } from './add-account/add-account.component';
import { EditAccountComponent } from './edit-account/edit-account.component';
import { ViewAccountComponent } from './view-account/view-account.component';
import { AddFacilityComponent } from './add-facility/add-facility.component';
import { AddFacilityStaffComponent } from './add-facility-staff/add-facility-staff.component';
import { EditFacilityComponent } from './edit-facility/edit-facility.component';
import { EditFacilityStaffComponent } from './edit-facility-staff/edit-facility-staff.component';
import { FacilityListComponent } from './facility-list/facility-list.component';
import { FacilityUserSelectorComponent } from './shared/facility-user-selector/facility-user-selector.component';
import { FacilityStaffListComponent } from './facility-staff-list/facility-staff-list.component';
import { ViewFacilityComponent } from './view-facility/view-facility.component';
import { DeleteDeviceComponent } from './delete-device/delete-device.component';
import { DeviceListComponent } from './device-list/device-list.component';
import { DeviceFormComponent } from './shared/device-form/device-form.component';
import { AddDeviceComponent } from './add-device/add-device.component';
import { EditDeviceComponent } from './edit-device/edit-device.component';
import { MessageFormComponent } from './shared/message-form/message-form.component';
import { SendFacilityMessageComponent } from './send-facility-message/send-facility-message';
import { AddResidentComponent } from './add-resident/add-resident.component';
import { EditResidentComponent } from './edit-resident/edit-resident.component';
import { ResidentContactFormModalComponent } from './shared/resident-contact-form-modal/resident-contact-form-modal.component';
import { ResidentFormComponent } from './shared/resident-form/resident-form.component';
import { ResidentListComponent } from './resident-list/resident-list.component';
import { MoveResidentComponent } from './move-resident/move-resident.component';
import {
  ROLE_ADD_ACCOUNT,
  ROLE_EDIT_ACCOUNT,
  ROLE_VIEW_ACCOUNT,
  ROLE_ADD_DEVICE,
  ROLE_EDIT_DEVICE,
  ROLE_VIEW_DEVICE,
  ROLE_MOVE_DEVICE,
  ROLE_ADD_FACILITY,
  ROLE_EDIT_FACILITY,
  ROLE_VIEW_FACILITY,
  ROLE_ADD_RESIDENT,
  ROLE_EDIT_RESIDENT,
  ROLE_VIEW_RESIDENT,
  ROLE_EDIT_FACILITY_STAFF,
  ROLE_VIEW_FACILITY_STAFF,
  ROLE_NOTIFY_ACCOUNT_RESIDENTS,
  ROLE_NOTIFY_FACILITY_RESIDENTS,
  ROLE_NOTIFY_RESIDENT,
  ROLE_MOVE_RESIDENT
} from '../../model/role/role';
import { RoleGuard } from '../../core/guard/role-guard';
import { SendAccountMessageComponent } from './send-account-message/send-account-message.component';
import { SendResidentMessageComponent } from './send-resident-message/send-resident-message.component';
import { ViewDeviceComponent } from './view-device/view-device.component';
import { ViewFacilityStaffComponent } from './view-facility-staff/view-facility-staff.component';
import { ViewResidentComponent } from './view-resident/view-resident.component';
import { FacilityDashboardComponent } from './facility-dashboard/facility-dashboard.component';
import { MoveDeviceComponent } from './move-device/move-device.component';

const routes: Routes = [
  // account list works, but is not part of wires, comment out for now
  // { path: 'list', data: { breadcrumbs: [{ label: 'Account List', url: '' }] }, component: AccountListComponent },
  {
    path: 'add',
    component: AddAccountComponent,
    canActivate: [RoleGuard],
    data: {
      breadcrumbs: [{ label: 'Add Account', url: '' }],
      roles: [ROLE_ADD_ACCOUNT]
    }
  },
  {
    path: ':id',
    component: ViewAccountComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Account Profile', url: '' }],
      roles: [ROLE_VIEW_ACCOUNT]
    }
  },
  {
    path: ':id/dashboard',
    component: AccountDashboardComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: '', url: '' }],
      roles: [ROLE_VIEW_ACCOUNT]
    }
  },
  {
    path: ':id/edit',
    component: EditAccountComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Edit Account', url: '' }],
      roles: [ROLE_EDIT_ACCOUNT]
    }
  },
  {
    path: ':id/messages/send',
    component: SendAccountMessageComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Notify All Account Users', url: '' }],
      roles: [ROLE_NOTIFY_ACCOUNT_RESIDENTS]
    }
  },
  {
    path: ':id/facility/add',
    component: AddFacilityComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Add Facility', url: '' }],
      roles: [ROLE_ADD_FACILITY]
    }
  },
  {
    path: ':id/facility/:facility_id',
    component: ViewFacilityComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Facility Profile', url: '' }],
      roles: [ROLE_VIEW_FACILITY]
    }
  },
  {
    path: ':id/facility/:facility_id/dashboard',
    component: FacilityDashboardComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: '', url: '' }],
      roles: [ROLE_VIEW_FACILITY]
    }
  },
  {
    path: ':id/facility/:facility_id/edit',
    component: EditFacilityComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Edit Facility', url: '' }],
      roles: [ROLE_EDIT_FACILITY]
    }
  },
  {
    path: ':id/facility/:facility_id/devices',
    component: DeviceListComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Device List', url: '' }],
      roles: [ROLE_VIEW_DEVICE]
    }
  },
  {
    path: ':id/facility/:facility_id/devices/add',
    component: AddDeviceComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Add Device', url: '' }],
      roles: [ROLE_ADD_DEVICE]
    }
  },
  {
    path: ':id/facility/:facility_id/devices/:device_id',
    component: ViewDeviceComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: '', url: '' }],
      roles: [ROLE_VIEW_DEVICE]
    }
  },
  {
    path: ':id/facility/:facility_id/devices/:device_id/edit',
    component: EditDeviceComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Edit Device', url: '' }],
      roles: [ROLE_EDIT_DEVICE]
    }
  },
  {
    path: ':id/facility/:facility_id/devices/:device_id/move',
    component: MoveDeviceComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Move Device', url: '' }],
      roles: [ROLE_MOVE_DEVICE]
    }
  },
  {
    path: ':id/facility/:facility_id/messages/send',
    component: SendFacilityMessageComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Notify All Facility Users', url: '' }],
      roles: [ROLE_NOTIFY_FACILITY_RESIDENTS]
    }
  },
  {
    path: ':id/facility/:facility_id/resident',
    component: ResidentListComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Resident List', url: '' }],
      roles: [ROLE_VIEW_RESIDENT]
    }
  },
  {
    path: ':id/facility/:facility_id/resident/add',
    component: AddResidentComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Add Resident', url: '' }],
      roles: [ROLE_ADD_RESIDENT]
    }
  },
  {
    path: ':id/facility/:facility_id/resident/:resident_id',
    component: ViewResidentComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: '', url: '' }],
      roles: [ROLE_VIEW_RESIDENT]
    }
  },
  {
    path: ':id/facility/:facility_id/resident/:resident_id/edit',
    component: EditResidentComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Edit', url: '' }],
      roles: [ROLE_EDIT_RESIDENT]
    }
  },
  {
    path: ':id/facility/:facility_id/resident/:resident_id/move',
    component: MoveResidentComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Move Resident', url: '' }],
      roles: [ROLE_MOVE_RESIDENT]
    }
  },
  {
    path: ':id/facility/:facility_id/resident/:resident_id/message/send',
    component: SendResidentMessageComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Notify Resident', url: '' }],
      roles: [ROLE_NOTIFY_RESIDENT]
    }
  },
  {
    path: ':id/facility/:facility_id/staff',
    component: FacilityStaffListComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Staff List', url: '' }],
      roles: [ROLE_VIEW_FACILITY_STAFF]
    }
  },
  {
    path: ':id/facility/:facility_id/staff/invite',
    component: AddFacilityStaffComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Invite Staff', url: '' }],
      roles: [ROLE_VIEW_FACILITY_STAFF]
    }
  },
  {
    path: ':id/facility/:facility_id/staff/:user_id',
    component: ViewFacilityStaffComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: '', url: '' }],
      roles: [ROLE_VIEW_FACILITY_STAFF]
    }
  },
  {
    path: ':id/facility/:facility_id/staff/:user_id/edit',
    component: EditFacilityStaffComponent,
    canActivate: [AccountGuard],
    data: {
      breadcrumbs: [{ label: 'Edit Staff Member', url: '' }],
      roles: [ROLE_EDIT_FACILITY_STAFF]
    }
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    Ng2TableModule,
    SelectModule
  ],
  declarations: [
    AccountDashboardComponent,
    AccountFormComponent,
    AccountListComponent,
    AddAccountComponent,
    EditAccountComponent,
    ViewAccountComponent,
    AddFacilityComponent,
    AddFacilityStaffComponent,
    EditFacilityComponent,
    EditFacilityStaffComponent,
    FacilityListComponent,
    FacilityDashboardComponent,
    FacilityUserSelectorComponent,
    FacilityStaffListComponent,
    ViewFacilityComponent,
    DeleteDeviceComponent,
    DeviceFormComponent,
    DeviceListComponent,
    AddDeviceComponent,
    EditDeviceComponent,
    MessageFormComponent,
    SendFacilityMessageComponent,
    ResidentContactFormModalComponent,
    ResidentFormComponent,
    ResidentListComponent,
    AddResidentComponent,
    EditResidentComponent,
    ViewDeviceComponent,
    ViewFacilityStaffComponent,
    ViewResidentComponent,
    SendAccountMessageComponent,
    SendResidentMessageComponent,
    MoveDeviceComponent,
    MoveResidentComponent
  ],
  exports: [AccountFormComponent, ResidentFormComponent, RouterModule]
})
export class AccountModule {}
