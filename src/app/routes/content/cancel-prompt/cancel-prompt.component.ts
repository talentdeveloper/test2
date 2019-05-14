import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { UiEventService } from '../../../core/ui-event-service/ui-event-service';
import { CancelPromptMessage } from '../../../core/ui-event-service/ui-cancel-prompt';

@Component({
  selector: 'cancel-prompt',
  templateUrl: './cancel-prompt.component.html',
  styles: [ '.modal-content { top: 100px; }' ]
})
export class CancelPromptComponent implements OnInit {
  @ViewChild('modal') modal : ModalDirective;

  constructor(
    protected uiEventService : UiEventService,
    protected router : Router
  ) { }

  ngOnInit() {
    this.uiEventService.subscribe(CancelPromptMessage, (message) => {
      this.modal.show();
    });
  }

  cancelConfirm() {
    this.modal.hide();
    this.router.navigate(['/content/catalog']);
  }
}