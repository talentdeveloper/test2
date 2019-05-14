import { Component, OnInit } from '@angular/core';

import { BUILD_ENV, BUILD_NUMBER, BUILD_VERSION } from '../../../build-number';

@Component({
    selector: 'app-build-number',
    templateUrl: './build-number.component.html'
})
export class BuildNumberComponent {
  buildEnv = BUILD_ENV;
  buildNumber = BUILD_NUMBER;
  buildVersion = BUILD_VERSION;

  constructor() {}
}