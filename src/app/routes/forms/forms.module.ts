import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ColorPickerModule, ColorPickerService } from 'ngx-color-picker';
import { SelectModule } from 'ng2-select';
import { TextMaskModule } from 'angular2-text-mask';
import { TagInputModule } from 'ng2-tag-input';
import { CustomFormsModule } from 'ng2-validation';
import { FileUploadModule } from 'ng2-file-upload';
import { ImageCropperModule } from 'ng2-img-cropper';

import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
    { path: 'standard', component: StandardComponent },
    { path: 'extended', component: ExtendedComponent },
    { path: 'validation', component: ValidationComponent },
    { path: 'upload', component: UploadComponent },
    { path: 'cropper', component: CropperComponent }
];

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild(routes),
        SelectModule,
        ColorPickerModule,
        TextMaskModule,
        TagInputModule,
        CustomFormsModule,
        FileUploadModule,
        ImageCropperModule
    ],
    providers: [ColorPickerService],
    declarations: [
    ],
    exports: [
        RouterModule
    ]
})
export class FormsModule { }
