import { Component, Input } from '@angular/core';

import { IBaseContent, contentStatus } from '../../../../model/content/base-content';

@Component({
    selector: 'app-content-status',
    templateUrl: './content-status.component.html',
    styles: [ '.status-icon {  width: 10px; height: 24px; }' ]
})
export class ContentStatusComponent {
    @Input() contentItem: IBaseContent | undefined;

    statusMap = contentStatus;
}
