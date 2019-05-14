import {
  Component,
  Input,
  ContentChildren,
  QueryList,
  OnInit,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { SidebarAccountChangeMessage } from '../../../core/ui-event-service/ui-sidebar-account-change';
import { SidebarAccountsGroupComponent } from '../sidebar-accounts-group/sidebar-accounts-group.component';
import { SidebarLinkComponent } from '../sidebar-link/sidebar-link.component';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

declare var $: any;

@Component({
  selector: 'app-sidebar-group',
  templateUrl: './sidebar-group.component.html',
  styleUrls: ['./sidebar-group.component.scss']
})
export class SidebarGroupComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  name = 'Default Group Name';
  @Input()
  main = false;
  @Input()
  alwaysShow = false;
  @Input()
  defaultRoute = ''; // expected sidebar-link text as string to match against

  @ContentChildren(SidebarLinkComponent)
  childLinks: QueryList<SidebarLinkComponent>;
  @ContentChildren(SidebarGroupComponent)
  childGroups: QueryList<SidebarGroupComponent>;
  @ContentChildren(SidebarAccountsGroupComponent)
  childAccountGroups: QueryList<SidebarLinkComponent>;

  open = false;
  showHeader = true;
  sidebarAccountChangeSubscription: Subscription;

  constructor(private router: Router, private uiEventService: UiEventService) {}

  ngOnInit() {
    this.sidebarAccountChangeSubscription = this.uiEventService.subscribe(
      SidebarAccountChangeMessage,
      changeMessage => {
        if (this.name === 'Facilities' && !this.open) {
          this.toggleVisibility();
        }
      }
    );
  }

  ngAfterViewInit() {
    // only concerned with checking sidebar-groups that are main (top-level) groups
    if (this.main) {
      // create list of active (visible) SidebarLinkComponents
      const activeChildLinks = this.childLinks.filter(childComponent => {
        if (childComponent instanceof SidebarLinkComponent) {
          return childComponent.visible;
        } else {
          return false;
        }
      });

      // for main sidebar groups, hide header if there are no child SidebarLinkComponents visible
      // or its not the accounts header (which is visible for all users)
      if (!this.childAccountGroups.length && !activeChildLinks.length) {
        this.showHeader = false;
      }
    } else {
      this.showHeader = this.hasActiveChildrenComponents();
    }
  }

  ngOnDestroy() {
    this.sidebarAccountChangeSubscription.unsubscribe();
  }

  toggleVisibility() {
    this.open = !this.open;

    if (this.open && this.defaultRoute) {
      const link = this.childLinks.find(childLink => childLink.href === this.defaultRoute);

      if (link && link.visible) {
        this.router.navigateByUrl(link.computedHref);
      }
    }
  }

  /**
   * return boolean based on if this sidebar group has active child elements
   * currently checks sidebar-groups and sidebar-link components (recursively)
   */
  hasActiveChildrenComponents(): boolean {
    const activeGroups = this.childGroups.filter(group => {
      // include groups that are set to always show, do not check children
      if (group.alwaysShow) {
        return true;
      }

      // note: QueryLists return self in list, need to detect in childGroup filter
      //   to avoid infinite loop, do not include as active child
      // @see: https://github.com/angular/angular/issues/10098
      if (group === this) {
        return false;
      }

      return group.hasActiveChildrenComponents();
    });

    const activeLinks = this.childLinks.filter(link => link.visible);

    return activeGroups.length + activeLinks.length > 0;
  }
}
