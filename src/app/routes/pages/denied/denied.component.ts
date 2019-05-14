import { Component } from '@angular/core';
import { Location } from '@angular/common';


@Component({
    selector: 'app-denied',
    templateUrl: './denied.component.html'
})
export class DeniedComponent {
    constructor(private location: Location) { }

    goBack() {
        this.location.back();
    }
}
