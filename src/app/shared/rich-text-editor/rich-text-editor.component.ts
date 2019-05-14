declare var $ : any;

import { Component, Input, ViewChild, ElementRef, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-rich-text-editor',
    templateUrl: './rich-text-editor.component.html',
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => RichTextEditorComponent),
        multi: true,
    }]
})
export class RichTextEditorComponent implements ControlValueAccessor, OnInit {
    protected onChangeCallback = (data? : any) => {};

    ngOnInit() {
        $('#summernote')
            .summernote({
                code: 'Hello World',
                height: 280,
                dialogsInBody: true,
                callbacks: {
                    onChange: (contents) => {
                        this.onChangeCallback(contents);
                    }
                },
                toolbar: [
                    // [groupName, [list of button]]
                    ['style', ['bold', 'italic', 'underline']]
                ]
        });
    }

    writeValue(data : string) {
        if (data) {
            $('#summernote').summernote('code', data);
        }
    }

    registerOnTouched() {

    }

    registerOnChange(callback : () => void) {
        this.onChangeCallback = callback;
    }
}
