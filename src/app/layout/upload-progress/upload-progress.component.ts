import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ModalDirective } from 'ngx-bootstrap/modal';

import { IActiveUpload, UploadService } from '../../core/upload/upload.service';

@Component({
    selector: 'app-upload-progress',
    templateUrl: './upload-progress.component.html',
    styles: [
      '.upload-progress-menu { margin-top: 2px }',
      '.upload-progress-btn { padding: 0 }',
      '.upload-progress-modal { margin-top: 50px }',
      '.upload { color: #515253; padding-bottom: 5px; padding-top: 5px }',
      '.clear-completed-link { padding-left: 0 }'
    ]
})
export class UploadProgressComponent implements OnInit {
    @ViewChild('uploadListModal')
    uploadListModal: ModalDirective;

    constructor(protected uploadService: UploadService) {}

    ngOnInit() {
    }

    uploads(): IActiveUpload[] {
      return this.uploadService.getActiveUploads();
    }

    completedUploads(): number {
      if (this.uploads().length === 0) {
        return 0;
      }

      return this.uploads().filter(
        (upload: IActiveUpload): boolean => upload.loaded === upload.total).length;
    }

    openUploadListModal(): void {
      this.uploadListModal.show()
    }

    clearCompleted() {
      this.uploadService.clearCompleted();
    }

    public onHidden(): void {
      console.log('Dropdown is hidden');
    }
    public onShown(): void {
      console.log('Dropdown is shown');
    }
    public isOpenChange(): void {
      console.log('Dropdown state is changed');
    }
}
