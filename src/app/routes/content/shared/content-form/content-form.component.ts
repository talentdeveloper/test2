import * as _ from 'lodash';
import * as moment from 'moment';

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { Observable } from 'rxjs';
import { UUID } from 'angular2-uuid';

import { BaseFormComponent, FormUtil, AppValidator } from '../../../../util/FormUtil';
import {
  Content, IContent, skillLevelMap, tagMap, accessibilityMap, typeMap, displayType, displayTypeMap,
  LabelValueMap, type, HappyNeuronLang, HappyNeuronLangMap, productMap
} from '../../../../model/content/content';
import {
  contentStatus, IActiveDateRange,
  PRODUCTS, IContentProducts,
  userContentStatusLabels
} from '../../../../model/content/base-content';
import { ImageCropControlComponent } from '../../../../shared/components/image-crop-control/image-crop-control.component';
import { InputService } from '../../../../core/input/input.service';
import { ContentService } from '../../../../core/content/content.service';
import { SyncGatewayService } from '../../../../core/sync-gateway/sync-gateway.service';
import { DateRangeValidator } from '../DateRangeValidator';
import { Router } from '@angular/router';
import { UiEventService } from '../../../../core/ui-event-service/ui-event-service';
import { CancelPromptMessage } from '../../../../core/ui-event-service/ui-cancel-prompt';

export interface IContentFormSubmitEvent {
  content: Content;
  uploadedTileImage?: {
    base64Data: string;
    filename: string;
  },
  error: string;
}

const MAX_FILE_SIZE = 1073741824;

@Component({
  selector: 'content-form',
  // styles: [ '.file-name-spacer { margin-right: 5px; }' ],
  styleUrls: ['./content-form.component.scss'],
  templateUrl: './content-form.component.html'
})
export class ContentFormComponent extends BaseFormComponent implements OnInit {
  @Input() content : Content;
  @Input() errorMessage : string;
  @Input() submitEnabled : boolean = true;

  // will only exist if an image already exists
  tileImagePath : String;

  contentFile : File;
  replaceFile : boolean = false;

  // needed to obtain the binary
  @ViewChild('cropControl', undefined) cropControl : ImageCropControlComponent;

  // following props req'd on ng template
  contentStatusList = userContentStatusLabels;

  skillLevelList = skillLevelMap;
  tagList = tagMap;
  productList = productMap;
  accessibilityList = accessibilityMap;
  typeList = typeMap;
  displayTypeList = displayTypeMap;
  dateMask: Array<string | RegExp> = InputService.DATE_MASK;
  activeDateForms: FormArray;
  happyNeuronLangOptions = HappyNeuronLangMap;
  keywordErrorMessageMap = { 'pattern': 'Invalid characters, you may only use alphanumeric characters and spaces' };
  keywordValidators = [ this.validateKeywordPattern ];

  fileStatus = '';

  fileValidationMessage = '';

  constructor(
    protected fb : FormBuilder,
    protected contentService : ContentService,
    protected router : Router,
    protected uiEventService : UiEventService
  ) {
    super();
  }

  ngOnInit() {
    this.tileImagePath = this.content.getTileImage();

    const windowsExeLocations = _.get(this.content, 'meta_data.windows_exe_locations', []);
    const videoInfo = _.get(this.content, 'meta_data.video_info', '');

    const activeDates = (this.content.active_dates || []).map(range => this.mapActiveDateRange(range));
    this.activeDateForms = this.fb.array(activeDates);

    const defaultSkillLevelValue = this.skillLevelList.map(option => option.value);

    this.form = this.fb.group({
      title: [
        this.content.title,
        Validators.required
      ],
      parent_title_override: [this.content.parent_title_override],
      content_type: [
        this.content.content_type,
        Validators.required
      ],
      display_type: [
        this.content.display_type,
        Validators.required
      ],
      content_url: [
        this.content.content_url,
        CustomValidators.url
      ],
      keywords: [
        (this.content.keywords || []).map(keyword => Content.normalizeKeyword(keyword))
      ],
      use_tag: this.createOptionsMap(
        this.tagList,
        (this.content.use_tag || '').split(',')
      ),
      skill_level: this.createOptionsMap(
        this.skillLevelList,
        (this.content.skill_level || defaultSkillLevelValue)
      ),
      accessibility: this.createOptionsMap(
        this.accessibilityList,
        (this.content.accessibility || '').split(',')
      ),
      // not used, but we'll leave the form control here for when it is
      // existing data has this properties
      subscription_package: [this.content.subscription_package || ''],
      // matrix has it as an array, but the data schema is a string, leaving as string
      source: [this.content.source || ''],
      license_expiration_date: [
        this.content.license_expiration_date || '',
        Validators.compose([ CustomValidators.date, AppValidator.dateExists() ])
      ],
      active_dates: this.activeDateForms,
      content_status: [
        this.content.content_status || contentStatus.QA
      ],
      notes: [this.content.notes || ''],
      new_content_date: [this.content.new_content_date || SyncGatewayService.formatDateForCouchbase()],
      happy_neuron_game_id: [ _.get(this.content, 'meta_data.game_id', '') ],
      happy_neuron_lang: [ _.get(this.content, 'meta_data.lang', HappyNeuronLang.ENGLISH) ],
      windows_exe_locations: [windowsExeLocations],
      video_info: [videoInfo],
      products: this.createProductOptionsMap(
        this.productList,
        (this.content.products || { engage: true, focus: true, rehab: false })
      )
    });

    this.filterTypeList();

    // invoke any conditional field combinations
    this.onContentTypeChange();
  }

  handleOnSubmit(e, rawData : any) {
    e.preventDefault();

    FormUtil.markAllAsTouched(this.form);

    // no accidental mutations
    const data = Object.assign({}, rawData);

    const licenseExpirationDate = moment(data.license_expiration_date);
    data.license_expiration_date =  licenseExpirationDate.isValid()
      ? licenseExpirationDate.format('MM/DD/YYYY')
      : "";

    // modify these properties to match schema
    data.accessibility = this.formControlOptionsMap(this.accessibilityList, data.accessibility).join(',');
    data.use_tag = this.formControlOptionsMap(this.tagList, data.use_tag).join(',');
    data.products = {
      engage: data.products[0],
      focus: data.products[1],
      rehab: data.products[2]
    };

    data.skill_level = this.formControlOptionsMap(this.skillLevelList, data.skill_level)
      .map(value => parseInt(value, 10));

    // map meta data
    data.meta_data = {
      windows_exe_locations: data.windows_exe_locations,
      video_info: data.video_info,
      game_id: data.content_type === type.HAPPYNEURON ? data.happy_neuron_game_id : '',
      lang: data.content_type === type.HAPPYNEURON ? data.happy_neuron_lang : ''
    };

    // cleanup happy neuron form data
    delete data.happy_neuron_game_id;
    delete data.happy_neuron_lang;

    // transform dates proper format
    data.active_dates = (data.active_dates || []).map(range => this.serializedActiveDates(range));

    const fileValidated = this.fileUploadRequired(data.content_type) ? this.fileValidationMessage.length === 0 : true;

    if (this.form.valid && this.onSubmit && fileValidated) {
      const content = new Content(Object.assign({}, this.content, data));

      if (this.replaceFile) {
        content.s3_key = '';
        content.s3_etag = '';
      }

      (content._id
        ? this.contentService.updateItem(content, this.cropControl.getCroppedImageBase64Data())
        : this.contentService.createItem(content.parent_id, content, this.cropControl.getCroppedImageBase64Data()))
        .subscribe((content: Content) => {
          if (!this.contentFile && this.replaceFile) {
            this.emitData(content);
          } else if (this.contentFile || this.replaceFile) {
            // disable submission
            this.submitEnabled = false;

            this.contentService.uploadContentFile(content, this.contentFile)
              // if we uploaded successfully, update the entire object
              .subscribe((updatedContent : Content) => {
                this.fileStatus = 'Upload Queued';

                this.emitData(updatedContent);
              }, (e) => {
                // open form back, reset progress
                this.submitEnabled = true;
                this.fileStatus = '';

                this.errorMessage = e;
              });
          } else {
            this.emitData(content);
          }
        }, (error) => {
          this.emitData(content, error)
        });
    }
  }

  emitData(content: Content, error?: string) {
    this.onSubmit.emit(<IContentFormSubmitEvent>{
      content,
      uploadedTileImage: {
        base64Data: this.cropControl.getCroppedImageBase64Data(),
        filename: this.cropControl.getCroppedImageFilename()
      },
      error: error
    });
  }

  createProductOptionsMap(productLabelValues: LabelValueMap, products: { engage: boolean; focus: boolean; rehab: boolean; }): FormArray {
    return new FormArray(productLabelValues.map((labelValue) => {
      return new FormControl( products[labelValue.value] );
    }));    
  }

  createOptionsMap(options : LabelValueMap, values : Array<string | number>) : FormArray {
    return new FormArray(options.map((item) => {
      return new FormControl( values.some(value => value.toString() === item.value.toString()) );
    }));
  }

  formControlOptionsMap(options : LabelValueMap, data : Array<boolean>): any[] {
    if (options.length !== data.length) {
      throw new Error('Invalid form control map');
    }

    const values = data.map((value: boolean, index : number) => value ? options[index].value : null).filter(value => value);
    return values;
  }

  fileUploadRequired(contentType?: string) {
    contentType = contentType || this.form.controls['content_type'].value;
    return contentType !== type.WEBSITE && contentType !== type.HAPPYNEURON;
  }

  fileChangeListener($event) {
    const file : File = $event.target.files[0];
    const contentType = this.form.controls['content_type'].value;

    if (!this.fileUploadRequired(contentType)) {
      $event.target.value = '';
      return;
    }

    this.setFileValidationMessage(contentType, file.name, file.size);

    if (this.fileValidationMessage) {
      $event.target.value = '';
      return;
    }

    this.contentFile = file;
  }

  setFileValidationMessage(contentType: string, filename?: string, fileSize?: number) {
    this.fileValidationMessage = '';

    if (!contentType) {
      this.fileValidationMessage = 'Select a content type before uploading a file';
      return;
    }

    // validate formats
    if (!this.fileUploadRequired(contentType)) {
      return;
    }

    const ext = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();

    if (contentType === type.PDF && ext !== 'pdf') {
      this.fileValidationMessage = 'Choose a valid PDF file (.PDF), or change the Content Type above.';
      return;
    }

    if (contentType === type.VIDEO && ext !== 'webm' && ext !== 'mp4') {
      this.fileValidationMessage = 'Choose a valid Video file (.MP4 or .WEBM), or change the Content Type above.';
      return;
    }

    if (contentType === type.WEBAPP && ext !== 'zip') {
      this.fileValidationMessage = 'Choose a valid Web App file (.ZIP), or change the Content Type above.';
      return;
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      this.fileValidationMessage = 'Max file size is 1 GB';
      return;
    }

  }

  sanitizeKeywordInput(keywordInput : string) {
    return keywordInput
      .replace(/\s{2,}/g, '')
      .replace(/,{2,}/g, ',')
      .trim();
  }

  onContentTypeChange() {
    this.updateDisplayType();

    const contentType = this.form.controls['content_type'].value;

    // toggle URL validators
    this.setActiveValidatorsByType(
      type.WEBSITE,
      contentType,
      this.form.controls['content_url'],
      [Validators.required, CustomValidators.url]
    );

    // toggle video info validator
    this.setActiveValidatorsByType(
      type.WINDOWSEXE,
      contentType,
      this.form.controls['windows_exe_locations'],
      [Validators.required]
    );

    // toggle video info validator
    this.setActiveValidatorsByType(
      type.VIDEO,
      contentType,
      this.form.controls['video_info'],
      [Validators.required]
    );

    // toggle happy neuron validators
    this.setActiveValidatorsByType(
      type.HAPPYNEURON,
      contentType,
      this.form.get('happy_neuron_game_id'),
      [ Validators.required, CustomValidators.digits ]
    );

    this.setActiveValidatorsByType(
      type.HAPPYNEURON,
      contentType,
      this.form.get('happy_neuron_lang'),
      Validators.required
    );

    this.setFileValidationMessage(contentType, this.content.s3_key);
  }

  filterTypeList() {
    const selectedProducts = this.formControlOptionsMap(this.productList, this.form.get('products').value);
    this.typeList = typeMap.filter(contentType => {
      return contentType.value !== type.WINDOWSEXE || !selectedProducts.includes(PRODUCTS.FOCUS);
    });

    if (this.form.get('content_type').value === type.WINDOWSEXE && selectedProducts.includes(PRODUCTS.FOCUS)) {
      this.form.get('content_type').setValue(null);
      this.form.get('content_type').updateValueAndValidity();
    }
  }

  onProductChange(event) {
    this.filterTypeList();
  }

  setActiveValidatorsByType(subjectType, targetType, control, activeValidators) {
    if (subjectType === targetType) {
      control.setValidators(activeValidators);
    } else {
      control.setValidators(null);
    }

    control.updateValueAndValidity();
  }

  updateDisplayType(): void {
    const contentType = this.form.controls['content_type'].value;

    if (contentType === type.HAPPYNEURON) {
      const lang = this.form.get('happy_neuron_lang').value || this.content.meta_data.lang || HappyNeuronLang.ENGLISH;

      this.form.patchValue({ 'happy_neuron_lang': lang });
    }
  }

  serializedActiveDates(range: { start: string; end: string; }) {
    return {
      start: moment.utc(range.start, 'MM/DD/YYYY').format('YYYY-MM-DD'),
      end: moment.utc(range.end, 'MM/DD/YYYY').format('YYYY-MM-DD')
    };
  }

  mapActiveDateRange(range: IActiveDateRange) {
    return this.fb.group({
      start: [
        range.start ? moment.utc(range.start).format('MM/DD/YYYY') : '',
        Validators.compose([
          Validators.required,
          CustomValidators.date,
          AppValidator.dateExists(),
          DateRangeValidator
        ])
      ],
      end: [
        range.end ? moment.utc(range.end).format('MM/DD/YYYY') : '',
        Validators.compose([
          Validators.required,
          CustomValidators.date,
          AppValidator.dateExists(),
          DateRangeValidator
        ])
      ],
    });
  }

  addDateRange() {
    this.activeDateForms.push(this.mapActiveDateRange({start: '', end: '', products: {focus: true, engage: true, rehab: false}}));
  }

  removeDateRange(index: number) {
    this.activeDateForms.removeAt(index);
  }

  resolveCancel() {
    if (this.form.dirty) {
      this.uiEventService.dispatch(new CancelPromptMessage());
    } else {
      this.router.navigate(['/content/catalog']);
    }
  }

  submitDisabled() {
    return !this.form.valid || !this.submitEnabled || this.fileValidationMessage;
  }

  handleKeywordTransform(tag: string): string {
    return Content.normalizeKeyword(tag);
  }

  validateKeywordPattern(control: FormControl): { [key: string]: boolean } {
    if ( !/^[A-Za-z0-9\s]+$/.test(control.value) ) {
      return { 'pattern': true };
    }

    return null;
  }

  windowsExeLocationsCount(windowsExeLocationsLines: string[]): number {
    console.log(windowsExeLocationsLines);
    return windowsExeLocationsLines.length;
  }

  onWindowsExeLocationsChange(event) {
    console.log(event);
    const lines = (event.target.value || '').split('\n');
    if (event.key === 'Enter' && lines.length > 10) {
      event.target.value = lines.slice(0, 10).join('\n');
    }
  }
}
