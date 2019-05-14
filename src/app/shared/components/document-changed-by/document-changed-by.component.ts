import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-document-changed-by',
    templateUrl: './document-changed-by.component.html'
    // styleUrls: ['./document-changed-by.component.scss']
})
export class DocumentChangedByComponent {
    @Input() document: Object;
}
