import * as _ from 'lodash';
import * as moment from 'moment';

import { Component, Input, EventEmitter, Output, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';

import {
  ContentLibraryConstants as CLC,
  ContentLibraryInterfaces as CLI,
  ContentItem
} from '../../../model/content-library';
import { ImageCropControlComponent } from '../../../shared/components/image-crop-control/image-crop-control.component';
import { CustomValidators } from 'ng2-validation';
import { AppValidator } from '../../../util/FormUtil';

@Component({
  selector: 'app-content-library-item-form',
  templateUrl: './content-library-item-form.component.html',
  styleUrls: ['./content-library-item-form.component.scss']
})
export class ContentLibraryItemFormComponent implements OnInit {
  @Input()
  libraryPath: string;
  @Input()
  contentItem: ContentItem;
  @Output()
  changeEvent: EventEmitter<CLI.IChangeEvent> = new EventEmitter<CLI.IChangeEvent>();

  // needed to obtain the binary
  @ViewChild('cropControl') cropControl: ImageCropControlComponent;

  contentTypeNames = CLC.contentTypeNames;
  displayTypeNames = CLC.displayTypeNames;

  form: FormGroup;
  tileImagePath: string = null;

  contentFile: File;
  replaceFile = false;
  fileValidationMessage = '';

  happyNeuronLangOptions = [
    { label: 'English', value: CLC.HappyNeuronLang.ENGLISH },
    { label: 'Spanish', value: CLC.HappyNeuronLang.SPANISH }
  ];

  keywordErrorMessageMap = {
    pattern: 'Invalid characters, you may only use alphanumeric characters and spaces'
  };
  keywordValidators = [this.validateKeywordPattern];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    if (!this.contentItem) {
      this.contentItem = new ContentItem();
    }

    this.tileImagePath = this.contentItem._id ? this.contentItem.getTileImage() : null;

    this.form = this.fb.group({
      title: [this.contentItem.title || '', Validators.required],
      library_path: [this.libraryPath || '/', Validators.required],
      display_type: [this.contentItem.display_type || '', Validators.required],
      content_type: [this.contentItem.content_type || '', Validators.required],
      platforms: new FormGroup({
        android: new FormControl(!!this.contentItem.platforms.android),
        pc: new FormControl(!!this.contentItem.platforms.pc)
      }),
      products: new FormGroup({
        engage: new FormControl(!!this.contentItem.products.engage),
        focus: new FormControl(!!this.contentItem.products.focus),
        rehab: new FormControl(!!this.contentItem.products.rehab)
      }),
      keywords: [this.contentItem.keywords || []],
      accessibility: new FormGroup({
        hearing_impairment: new FormControl(!!this.contentItem.accessibility.hearing_impairment),
        physical_impairment: new FormControl(!!this.contentItem.accessibility.physical_impairment),
        vision_impairment: new FormControl(!!this.contentItem.accessibility.vision_impairment)
      }),
      usage_settings: new FormGroup({
        group_use: new FormControl(!!this.contentItem.usage_settings.group_use),
        joint_use: new FormControl(!!this.contentItem.usage_settings.joint_use),
        solo_use: new FormControl(!!this.contentItem.usage_settings.solo_use)
      }),
      skill_level: new FormGroup({
        level_one: new FormControl(!!this.contentItem.skill_level.level_one),
        level_two: new FormControl(!!this.contentItem.skill_level.level_two),
        level_three: new FormControl(!!this.contentItem.skill_level.level_three)
      }),
      source: [this.contentItem.source || ''],
      license_expiration_date: [
        this.contentItem.license_expiration_date || '',
        Validators.compose([CustomValidators.date, AppValidator.dateExists()])
      ],
      notes: [this.contentItem.notes || ''],

      // AWS uploaded file info
      s3_etag: [this.contentItem.s3_etag || ''],
      s3_key: [this.contentItem.s3_key || ''],

      // Happy neuron content type
      happy_neuron_game_id: [_.get(this, 'contentItem.happy_neuron.game_id', '')],
      happy_neuron_lang: [_.get(this, 'contentItem.happy_neuron.lang', '')],

      // Video content type
      video_description: [this.contentItem.video_description || ''],

      // Website content type
      content_url: [this.contentItem.content_url || ''],

      // Windows exe
      windows_exe_locations: [(this.contentItem.windows_exe_locations || []).join('\n')]
    });
  }

  contentTypeList(): { label: string; value: string }[] {
    return Object.keys(this.contentTypeNames).map(key => ({
      label: this.contentTypeNames[key],
      value: key
    }));
  }

  displayTypeList(): { label: string; value: string }[] {
    return Object.keys(this.displayTypeNames).map(key => ({
      label: this.displayTypeNames[key],
      value: key
    }));
  }

  setActiveValidatorsByType(subjectContentType, targetContentType, control, activeValidators) {
    if (subjectContentType === targetContentType) {
      control.setValidators(activeValidators);
    } else {
      control.setValidators(null);
    }

    control.updateValueAndValidity();
  }

  onContentTypeChange() {
    const contentType = this.form.controls['content_type'].value;

    // toggle URL validators
    this.setActiveValidatorsByType(
      CLC.contentType.WEBSITE,
      contentType,
      this.form.controls['content_url'],
      [Validators.required, CustomValidators.url]
    );

    // toggle video info validator
    this.setActiveValidatorsByType(
      CLC.contentType.WINDOWSEXE,
      contentType,
      this.form.controls['windows_exe_locations'],
      [Validators.required]
    );

    // toggle video info validator
    this.setActiveValidatorsByType(
      CLC.contentType.VIDEO,
      contentType,
      this.form.controls['video_description'],
      [Validators.required]
    );

    // toggle happy neuron validators
    this.setActiveValidatorsByType(
      CLC.contentType.HAPPYNEURON,
      contentType,
      this.form.controls['happy_neuron_game_id'],
      [Validators.required, CustomValidators.digits]
    );

    this.setActiveValidatorsByType(
      CLC.contentType.HAPPYNEURON,
      contentType,
      this.form.controls['happy_neuron_lang'],
      Validators.required
    );

    this.setFileValidationMessage(contentType, this.contentItem.s3_key);
  }

  fileUploadRequired(): boolean {
    if (!this.form.controls['content_type']) {
      return false;
    }

    const typeRequiredFile = ![CLC.contentType.HAPPYNEURON, CLC.contentType.WEBSITE].includes(
      this.form.controls['content_type'].value
    );
    return typeRequiredFile;
  }

  fileIsValid(): boolean {
    return !this.fileUploadRequired() || this.fileValidationMessage.length === 0;
  }

  setFileValidationMessage(contentType: string, filename?: string, fileSize?: number) {
    this.fileValidationMessage = '';

    if (!contentType) {
      this.fileValidationMessage = 'Select a content type before uploading a file';
      return;
    }

    // validate formats
    if (!this.fileUploadRequired() || !filename) {
      return;
    }

    const ext = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();

    if (contentType === CLC.contentType.PDF && ext !== 'pdf') {
      this.fileValidationMessage =
        'Choose a valid PDF file (.PDF), or change the Content Type above.';
      return;
    }

    if (contentType === CLC.contentType.VIDEO && ext !== 'webm' && ext !== 'mp4') {
      this.fileValidationMessage =
        'Choose a valid Video file (.MP4 or .WEBM), or change the Content Type above.';
      return;
    }

    if (contentType === CLC.contentType.WEBAPP && ext !== 'zip') {
      this.fileValidationMessage =
        'Choose a valid Web App file (.ZIP), or change the Content Type above.';
      return;
    }

    if (contentType === CLC.contentType.WINDOWSEXE && ext !== 'exe') {
      this.fileValidationMessage =
        'Choose a valid Windows EXE file (.EXE), or change the Content Type above.';
      return;
    }

    if (fileSize && fileSize > CLC.maxFileSize) {
      this.fileValidationMessage = 'Max file size is 1 GB';
      return;
    }
  }

  fileChangeListener(event: CLI.FileChangeEvent) {
    if (!this.fileUploadRequired()) {
      event.target.value = '';
      return;
    }

    const file: File = event.target.files[0];
    this.setFileValidationMessage(this.form.controls['content_type'].value, file.name, file.size);

    if (this.fileValidationMessage) {
      event.target.value = '';
      return;
    }

    this.contentFile = file;
  }

  submit(formData: CLI.IContentItemForm) {
    if (!this.form.valid || !this.fileIsValid()) {
      this.changeEvent.emit({
        error: {
          message: 'Content item cannot be saved. Please add all required fields before submitting.'
        }
      });
      return;
    }

    const fileRequired = this.fileUploadRequired();

    const additionalValues = {
      library_path: this.libraryPath,
      license_expiration_date: moment(formData.license_expiration_date).isValid()
        ? moment(formData.license_expiration_date).format('MM/DD/YYYY')
        : undefined,
      happy_neuron: formData.happy_neuron_game_id
        ? {
            game_id: formData.happy_neuron_game_id,
            lang: formData.happy_neuron_lang
          }
        : undefined,
      s3_etag: fileRequired && this.replaceFile ? '' : this.contentItem.s3_etag,
      s3_key: fileRequired && this.replaceFile ? '' : this.contentItem.s3_key,
      windows_exe_locations: formData.windows_exe_locations
        ? formData.windows_exe_locations.split('\n')
        : undefined
    };

    const item = new ContentItem(Object.assign({}, this.contentItem, formData, additionalValues));

    this.changeEvent.emit({
      saveContentItem: {
        contentItem: item,
        file: fileRequired ? this.contentFile : undefined,
        tileImageBase64Data: this.cropControl.getCroppedImageBase64Data() || undefined
      }
    });
  }

  submitDisabled(): boolean {
    const invalidForm = !this.form.valid;
    const invalidFile = !this.fileIsValid();
    return invalidForm || invalidFile;
  }

  cancel() {
    this.changeEvent.emit({
      saveContentItem: {
        cancelled: true
      }
    });
  }

  validateKeywordPattern(control: FormControl): { [key: string]: boolean } {
    if (!/^[A-Za-z0-9\s]+$/.test(control.value)) {
      return { pattern: true };
    }

    return null;
  }

  normalizeKeyword(keyword: string): string {
    return keyword
      .toLowerCase()
      .replace(/\s{2,}/g, '')
      .trim();
  }

  isValidDate(formDate: string, format: string): boolean {
    return moment(formDate, format).isValid();
  }
}
