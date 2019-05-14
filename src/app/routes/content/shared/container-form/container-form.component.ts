import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { BaseFormComponent, FormUtil } from '../../../../util/FormUtil';
import { Container, IContainer } from '../../../../model/content/container';
import { ImageCropControlComponent } from '../../../../shared/components/image-crop-control/image-crop-control.component';
import { userContentStatusLabels, contentStatus } from '../../../../model/content/base-content';
import { SyncGatewayService } from '../../../../core/sync-gateway/sync-gateway.service';
import { Router } from '@angular/router';
import { UiEventService } from '../../../../core/ui-event-service/ui-event-service';
import { CancelPromptMessage } from '../../../../core/ui-event-service/ui-cancel-prompt';

export interface IContainerFormSubmitEvent {
    container: Container;
    uploadedTileImage?: {
        base64Data: string;
        filename: string;
    }
}

@Component({
    selector: 'container-form',
    templateUrl: './container-form.component.html'
})
export class ContainerFormComponent extends BaseFormComponent implements OnInit {
    @Input() container : Container;
    @Input() errorMessage : string;
    @Input() submitEnabled : boolean = true;

    // will only exist if an image already exists
    tileImagePath : String;

    // needed to obtain the binary
    @ViewChild('cropControl', undefined) cropControl: ImageCropControlComponent;

    // following props req'd on ng template
    contentStatusList = userContentStatusLabels;

    constructor (
        protected fb: FormBuilder,
        protected router : Router,
        protected uiEventService : UiEventService
    ) {
        super();
    }

    ngOnInit() {
        this.tileImagePath = this.container.getTileImage();

        this.form = this.fb.group({
            title: [
                this.container.title,
                Validators.required
            ],
            notes: [this.container.notes || ''],
            new_content_date: [this.container.new_content_date || SyncGatewayService.formatDateForCouchbase()]
        });
    }

    handleOnSubmit(e, data: any) {
        e.preventDefault();

        FormUtil.markAllAsTouched(this.form);

        if (this.form.valid && this.onSubmit) {
            this.onSubmit.emit(<IContainerFormSubmitEvent>{
                container: new Container(Object.assign({}, this.container, data)),
                uploadedTileImage: {
                    base64Data:  this.cropControl.getCroppedImageBase64Data(),
                    filename: this.cropControl.getCroppedImageFilename()
                }
            });
        }
    }

    resolveCancel() {
        if (this.form.dirty) {
            this.uiEventService.dispatch(new CancelPromptMessage());
        } else {
            this.router.navigate(['/content/catalog']);
        }
    }
}
