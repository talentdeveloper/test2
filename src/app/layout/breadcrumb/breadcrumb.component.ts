// import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChange, ElementRef } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { BreadcrumbService, IBreadcrumb } from '../../core/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styles: ['.content-heading > .breadcrumb { padding-top: 0 }']
})
export class BreadcrumbComponent implements OnInit {
  private breadcrumbs: Observable<IBreadcrumb[]>;

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbs = this.breadcrumbService.breadcrumbs;
  }
}
