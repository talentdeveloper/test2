import * as _ from 'lodash';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SidebarService } from '../sidebar.service';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { LoaderService } from '../../../core/loader/loader.service';

const COMPONENT_NAME = 'sidebar-resource-group';

export abstract class SidebarResourceGroupComponent implements OnInit, OnChanges {
  @Input()
  param: string; // string to replace out
  @Input()
  placeholder: string; // select placeholder
  @Input()
  displayKey = '_id';
  @Input()
  clearParams: Array<string> = [];
  @Input()
  paramDependency = '';
  @Input()
  defaultRoute: string;

  private resources: Array<Object>;

  value = '';
  listReady = true;
  dependentKey = '';

  constructor(
    protected sidebarService: SidebarService,
    protected router: Router,
    protected uiEventService: UiEventService,
    protected loaderService: LoaderService
  ) {}

  ngOnInit() {
    // if there's param dependencies, let's address it
    if (this.paramDependency) {
      this.resolveDependentKey();
    }

    // if params set previously (URL, previous event), use them
    this.value = this.sidebarService.selectedParams.getValue()[this.param] || '';

    // register dropdown to listen to param changes
    this.sidebarService.selectedParams.subscribe(params => {
      const oldValue = this.value;
      this.value = params[this.param] || '';

      if (this.value !== oldValue && !params['preventNavigateToDefault']) {
        this.navigateToDefault(params);
      }
    });

    // some resources need to resolve parameters
    if (this.listReady) {
      this.populateList();
    }

    this.sidebarService.refresh.subscribe(() => {
      if (this.listReady) {
        this.populateList();
      }
    });
  }

  ngOnChanges() {
    if (this.listReady) {
      this.populateList();
    }
  }

  resolveDependentKey() {
    this.listReady = false;
    this.dependentKey = this.sidebarService.selectedParams.getValue()[this.paramDependency] || '';

    this.sidebarService.selectedParams.subscribe(params => {
      const previousKey = this.dependentKey;
      this.dependentKey = params[this.paramDependency] || '';

      if (previousKey !== this.dependentKey) {
        if (this.dependentKey.length > 0) {
          this.listReady = true;
          this.populateList();
        } else {
          this.listReady = false;
        }
      }
    });
  }

  onChange(newValue) {
    const existingParams = this.sidebarService.selectedParams.getValue();

    this.clearParams.forEach((param: string) => {
      existingParams[param] = '';
    });

    existingParams['preventNavigateToDefault'] = false;

    this.sidebarService.selectedParams.next(
      Object.assign(existingParams, { [this.param]: newValue })
    );
  }

  getDisplayValue(item) {
    const value: string = _.get(item, this.displayKey);

    // escape hatch if data isn't structured properly
    if (!value || value === '') {
      return item._id;
    }

    return value;
  }

  abstract resolveResource();

  populateList() {
    this.loaderService.start(COMPONENT_NAME);

    // request target resource
    this.resolveResource().subscribe(
      resources => {
        this.resources = [
          _.set({ _id: this.placeholder, placeholder: true }, this.displayKey, this.placeholder),
          ...resources
        ];

        this.loaderService.stop(COMPONENT_NAME);
      },
      e => {
        console.log(e);
        this.loaderService.stop(COMPONENT_NAME);
      }
    );
  }

  navigateToDefault(params: Object) {
    if (!this.defaultRoute) {
      return;
    }

    let output = this.defaultRoute;

    Object.keys(params)
      .filter(key => params[key] && params[key].length > 0)
      .forEach(key => {
        output = output.replace(key, params[key]);
      });

    if (output.indexOf(':') === -1) {
      this.router.navigateByUrl(output);
    }
  }
}
