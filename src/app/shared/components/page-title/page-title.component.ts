import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  template: '<div class="content-heading">{{ title }}</div>'
  // styleUrls: ['./page-title.component.scss']
})
export class PageTitleComponent {
  @Input() title: string;
}
