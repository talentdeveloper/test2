import * as _ from 'lodash';
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import * as Roles from '../../model/role/role';
import { RoleService } from '../../core/role/role.service';
import { SettingsService } from '../../core/settings/settings.service';
import { SidebarService } from './sidebar.service';
import { SidebarSizeChangeMessage } from '../../core/ui-event-service/ui-sidebar-size-change';
import { SidebarAccountChangeMessage } from '../../core/ui-event-service/ui-sidebar-account-change';
import { UiEventService } from '../../core/ui-event-service/ui-event-service';

declare var $: any;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  roles: any;
  menuItems: Array<any>;
  sidebarAccountChangeSubscription: Subscription;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected roleService: RoleService,
    public settings: SettingsService,
    protected router: Router,
    protected sidebarService: SidebarService,
    protected uiEventService: UiEventService
  ) {}

  ngOnInit() {
    this.roles = Roles;

    this.router.events.subscribe(event => {
      // close any submenu opened when route changes
      this.removeFloatingNav();
      // scroll view to top
      window.scrollTo(0, 0);

      if (event instanceof NavigationEnd) {
        // activatedRoutes.params returns an empty object instead of the correct route params
        // requiring us to parse the url manually
        const accountMatch = event.url.match(/\/account\/([^\/]+)/i);
        const facilityMatch = event.url.match(/\/facility\/([^\/]+)/i);

        const accountId = accountMatch ? accountMatch[1] : null;
        const facilityId = facilityMatch ? facilityMatch[1] : null;

        if (accountId) {
          this.uiEventService.dispatch(
            new SidebarAccountChangeMessage({
              accountId: accountId,
              facilityId: facilityId,
              preventNavigateToDefault: true
            })
          );
        }
      }
    });

    this.sidebarAccountChangeSubscription = this.uiEventService.subscribe(
      SidebarAccountChangeMessage,
      changeMessage => {
        if (changeMessage.accountId) {
          const newParams = { ':accountId': changeMessage.accountId };

          if (changeMessage.facilityId) {
            newParams[':facilityId'] = changeMessage.facilityId;
          }

          newParams['preventNavigateToDefault'] = changeMessage.preventNavigateToDefault;

          const existingParams = this.sidebarService.selectedParams.getValue();
          this.sidebarService.selectedParams.next(Object.assign(existingParams, newParams));
        }
      }
    );
  }

  ngOnDestroy() {
    this.sidebarAccountChangeSubscription.unsubscribe();
  }

  toggleSubmenuClick(event) {
    if (!this.isSidebarCollapsed() && !this.isSidebarCollapsedText() && !this.isEnabledHover()) {
      event.preventDefault();

      const target = $(event.target || event.srcElement || event.currentTarget);
      let ul,
        anchor = target;

      // find the UL
      if (!target.is('a')) {
        anchor = target.parent('a').first();
      }
      ul = anchor.next();

      // hide other submenus
      const parentNav = ul.parents('.sidebar-subnav');
      $('.sidebar-subnav').each((idx, el) => {
        const $el = $(el);
        // if element is not a parent or self ul
        if (!$el.is(parentNav) && !$el.is(ul)) {
          this.closeMenu($el);
        }
      });

      // abort if not UL to process
      if (!ul.length) {
        return;
      }

      // any child menu should start closed
      ul.find('.sidebar-subnav').each((idx, el) => {
        this.closeMenu($(el));
      });

      // toggle UL height
      if (parseInt(ul.height(), 0)) {
        this.closeMenu(ul);
      } else {
        // expand menu
        ul.on('transitionend', () => {
          ul.height('auto').off('transitionend');
        }).height(ul[0].scrollHeight);
        // add class to manage animation
        ul.addClass('opening');
      }
    }
  }

  // Close menu collapsing height
  closeMenu(elem) {
    if (!elem.hasClass('disable-auto-close')) {
      elem.height(elem[0].scrollHeight); // set height
      elem.height(0); // and move to zero to collapse
      elem.removeClass('opening');
    }
  }

  toggleSubmenuHover(event) {
    const self = this;
    if (this.isSidebarCollapsed() || this.isSidebarCollapsedText() || this.isEnabledHover()) {
      event.preventDefault();

      this.removeFloatingNav();

      const target = $(event.target || event.srcElement || event.currentTarget);
      let ul,
        anchor = target;
      // find the UL
      if (!target.is('a')) {
        anchor = target.parent('a');
      }
      ul = anchor.next();

      if (!ul.length) {
        return; // if not submenu return
      }

      const $aside = $('.aside');
      const $asideInner = $aside.children('.aside-inner'); // for top offset calculation
      const $sidebar = $asideInner.children('.sidebar');
      const mar =
        parseInt($asideInner.css('padding-top'), 0) + parseInt($aside.css('padding-top'), 0);
      const itemTop = anchor.parent().position().top + mar - $sidebar.scrollTop();

      const floatingNav = ul.clone().appendTo($aside);
      const vwHeight = $(window).height();

      // let itemTop = anchor.position().top || anchor.offset().top;

      floatingNav
        .removeClass('opening') // necesary for demo if switched between normal//collapsed mode
        .addClass('nav-floating')
        .css({
          position: this.settings.layout.isFixed ? 'fixed' : 'absolute',
          top: itemTop,
          bottom: floatingNav.outerHeight(true) + itemTop > vwHeight ? 0 : 'auto'
        });

      floatingNav
        .on('mouseleave', () => {
          floatingNav.remove();
        })
        .find('a')
        .on('click', function(e) {
          e.preventDefault(); // prevents page reload on click
          // get the exact route path to navigate
          self.router.navigate([$(this).attr('route')]);
        });

      this.listenForExternalClicks();
    }
  }

  listenForExternalClicks() {
    const $doc = $(document).on('click.sidebar', e => {
      if (!$(e.target).parents('.aside').length) {
        this.removeFloatingNav();
        $doc.off('click.sidebar');
      }
    });
  }

  removeFloatingNav() {
    $('.nav-floating').remove();
  }

  isSidebarCollapsed() {
    return this.settings.layout.isCollapsed;
  }
  isSidebarCollapsedText() {
    return this.settings.layout.isCollapsedText;
  }
  isEnabledHover() {
    return this.settings.layout.asideHover;
  }

  toggleSidebar() {
    this.settings.setLayoutSetting('isCollapsed', !this.settings.layout.isCollapsed);
    this.uiEventService.dispatch(new SidebarSizeChangeMessage(this.settings.layout.isCollapsed));
  }

  isContentUser() {
    return this.roleService.currentUserHasRoles(this.roles.ROLE_VIEW_CONTENT);
  }
}
