import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { USER_TYPE_ACCOUNT_ADMIN, USER_TYPE_FACILITY_ADMIN } from '../../../model/user/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(private authenticationService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    if (
      this.authenticationService.currentUser() &&
      this.authenticationService.currentUser().getValue()
    ) {
      const user = this.authenticationService.currentUser().getValue();

      // redirect account-admin and facility-admin users to their dashboard
      // and make sure left nav gets updates correctly
      if (user.type === USER_TYPE_ACCOUNT_ADMIN) {
        this.router.navigateByUrl(`/account/${user.account_id}/dashboard`);
      } else if (user.type === USER_TYPE_FACILITY_ADMIN) {
        this.router.navigateByUrl(
          `/account/${user.account_id}/facility/${user.facility_ids[0]}/dashboard`
        );
      }
    }
  }
}
