import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { UserService } from '../../../../core/user/user.service';
import { IUser } from '../../../../model/user/user';
import { FacilityAdminUser } from '../../../../model/user/facility-admin-user';
import { RoleService, IPermissions } from '../../../../core/role/role.service';
import { ROLE_ADMIN_SEND_INVITES, ROLE_ADD_FACILITY_STAFF } from '../../../../model/role/role';

type ngSelectItem = {id: string, text: string};

@Component({
    selector: 'app-facility-user-selector',
    templateUrl: './facility-user-selector.component.html'
})
export class FacilityUserSelectorComponent implements OnInit {
    @Input() facilityId = '';
    @Input() accountId = '';
    @Output() onSelect : EventEmitter<IUser> = new EventEmitter();

    permissions: IPermissions;
    userOptions : Array<ngSelectItem> = [];
    users : IUser[] = [];

    constructor(protected userService : UserService, private roleService: RoleService) {

    }

    ngOnInit() {
        this.permissions = this.roleService.currentUserPermissionsObject([
            { keyName: 'canInviteStaffAsAdmin', role: ROLE_ADMIN_SEND_INVITES },
            { keyName: 'canInviteFacilityStaff', role: ROLE_ADD_FACILITY_STAFF }
        ]);

        this.userService.getUsersForFacility(this.accountId, this.facilityId).subscribe((users) => {
            this.users = users;
            this.userOptions = users
                .filter(user => user instanceof FacilityAdminUser)
                .map(user => ({id: user._id, text: `${user.first_name} ${user.last_name}`}));
        });
    }

    public selected(value: ngSelectItem): void {
        this.onSelect.emit(this.users.filter(user => user._id === value.id)[0]);
    }

    inviteRouterLink() {
        if ( this.permissions['canInviteStaffAsAdmin'] ) {
            return [ '/invite', 'send' ];
        }

        if ( this.permissions['canInviteFacilityStaff'] ) {
            return [ '/account', this.accountId, 'facility', this.facilityId, 'staff', 'invite' ];
        }

        return [];
    }
}
