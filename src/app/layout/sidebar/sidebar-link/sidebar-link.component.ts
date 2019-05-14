import { Component, Input, OnInit } from '@angular/core';

import { RoleService } from '../../../core/role/role.service';
import { SidebarService } from '../sidebar.service';


@Component({
    selector: 'app-sidebar-link',
    templateUrl: './sidebar-link.component.html',
    styleUrls: ['./sidebar-link.component.scss']
})
export class SidebarLinkComponent implements OnInit {
    @Input() href = '';
    @Input() text = '';
    @Input() role = '';

    computedHref: string;
    visible = true;

    constructor(
        protected roleService: RoleService,
        protected sidebarService: SidebarService
    ) { }

    ngOnInit() {
        // listen to param changes if this is parameterized URLs
        if (this.href.indexOf(':') >= 0) {
            this.computedHref = this.generateHref(this.sidebarService.selectedParams.getValue());

            this.sidebarService.selectedParams.subscribe((params) => {
                this.computedHref = this.generateHref(params);
            });
        } else {
            this.computedHref = this.href;
        }

        // determine if link should be visible
        // we cannot use router configuarations because the router does not contain
        // any data for routes in lazy loaded modules
        //
        // this means will need to maintain a set of rules for link visibility separate
        // from the route guards :(
        //
        // a [role] attribute will need to be assigned to app-sidebar-link components. That
        // role is then checked against the current users allowed roles. Accounts and
        // facilities should be limited in the sidebar group resource resolve functions for
        // account and facility users

        if ( this.role ) {
            this.visible = this.roleService.currentUserHasRoles( this.role );
        }
    }

    generateHref(params: Object) {
        let output = this.href;

        Object.keys(params).map((key) => {
            output = output.replace(key, params[key]);
        });

        return output;
    }
}
