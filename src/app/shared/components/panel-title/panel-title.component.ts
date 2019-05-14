import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-panel-title',
    templateUrl: './panel-title.component.html'
    // styleUrls: ['./panel-title.component.scss']
})
export class PanelTitleComponent {
    @Input() title: string;
    @Input() subTitle: string;
}
