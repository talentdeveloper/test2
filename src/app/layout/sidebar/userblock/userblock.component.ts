import { Component, OnInit } from '@angular/core';

import { AuthenticationService } from '../../../core/authentication/authentication.service';
import { IUser } from '../../../model/user/user';
import { UserblockService } from './userblock.service';
import { UserService } from '../../../core/user/user.service';

@Component({
  selector: 'app-userblock',
  templateUrl: './userblock.component.html',
  styleUrls: ['./userblock.component.scss']
})
export class UserblockComponent implements OnInit {
  currentUser: IUser;
  profileImageSrc: string;

  constructor(
    private authenticationService: AuthenticationService,
    private userblockService: UserblockService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.authenticationService.currentUser().subscribe(user => {
      if (!user) {
        return;
      }

      this.currentUser = user;
      this.profileImageSrc = this.userService.getUserProfileImagePath(this.currentUser);
    });
  }

  userBlockIsVisible() {
    return this.currentUser && this.userblockService.getVisibility();
  }
}
