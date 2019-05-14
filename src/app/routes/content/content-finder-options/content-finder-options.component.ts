import * as _ from 'lodash';
import * as moment from 'moment';

import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { Subject } from 'rxjs/Subject';

import { InputService } from '../../../core/input/input.service';
import { BaseFormComponent, AppValidator } from '../../../util/FormUtil';
import {
  accessibilityMap, displayType, displayTypeMap, LabelValueMap, skillLevelMap,
  tagMap, typeMap
} from '../../../model/content/content';
import { IContentFilter } from '../../../model/content/content-filter';
import { contentStatusLabels } from '../../../model/content/base-content';

const INPUT_DEBOUNCE_TIME_MS = 900; // time in milliseconds to debounce input change events

@Component({
  selector: 'app-content-finder-options',
  templateUrl: './content-finder-options.component.html',
  styleUrls: ['./content-finder-options.component.scss']
})
export class ContentFinderOptionsComponent extends BaseFormComponent implements OnInit {
  @Output() onOptionsChange : EventEmitter<any> = new EventEmitter();
  dateMask : Array<string | RegExp> = InputService.DATE_MASK;

  activeDateStartSubject = new Subject<any>();
  activeDateEndSubject = new Subject<any>();
  skillLevelList = skillLevelMap;
  tagList = tagMap;
  accessibilityList = accessibilityMap;
  typeList = typeMap;
  displayTypeList = displayTypeMap;
  contentStatus = contentStatusLabels;
  keywordChangeSubject = new Subject<any>();

  constructor(
    private fb: FormBuilder
  ) {
    super();
  }

  ngOnInit() {
    this.form = this.fb.group({
      keywords: [''],
      active_start_date: ['', Validators.compose([
        Validators.required,
        CustomValidators.date,
        AppValidator.dateExists()
      ])],
      active_end_date: ['', Validators.compose([
        Validators.required,
        CustomValidators.date,
        AppValidator.dateExists()
      ])],
      display_type: this.createOptionsMap(this.displayTypeList, []),
      skill_level: this.createOptionsMap(this.skillLevelList, []),
      content_status: this.createOptionsMap(this.contentStatus, []),
      accessibility: this.createOptionsMap(this.accessibilityList, [])
    });

    // setup find option text input debounce subject listeners
    this.keywordChangeSubject.debounceTime(INPUT_DEBOUNCE_TIME_MS).distinctUntilChanged().subscribe(event => this.onChange());
    this.activeDateStartSubject.debounceTime(INPUT_DEBOUNCE_TIME_MS).subscribe(event => this.onChange());
    this.activeDateEndSubject.debounceTime(INPUT_DEBOUNCE_TIME_MS).subscribe(event => this.onChange());
  }

  onChange() {
    const data: {
      accessibility: boolean[];
      active_end_date: moment.Moment | string;
      active_start_date: moment.Moment | string;
      content_status: boolean[];
      display_type: boolean[];
      keywords: string;
      skill_level: boolean[];
    } = Object.assign({}, this.form.value);

    // split keywords
    const keywords = (data.keywords || '')
      .split(',')
      .map(keyword => keyword.toLowerCase().trim())
      .filter(keyword => keyword && keyword.length > 0);

    const activeFilters: IContentFilter = {
      byKeywords: keywords.length > 0,
      keywords: keywords,

      byDisplayTypes: data.display_type.some(value => value),
      displayTypes: {
        activity: data.display_type[0],
        audio: data.display_type[1],
        audiobook: data.display_type[2],
        document: data.display_type[3],
        game: data.display_type[4],
        image: data.display_type[5],
        music: data.display_type[6],
        puzzle: data.display_type[7],
        recipe: data.display_type[8],
        slideshow: data.display_type[9],
        trivia: data.display_type[10],
        video: data.display_type[11],
        website: data.display_type[12]
      },

      bySkillLevels: data.skill_level.some(value => value),
      skillLevels: skillLevelMap.filter((item, index) => data.skill_level[index]).map(item => Number(item.value)),

      byAccessibility: data.accessibility.some(value => value),
      accessibilities: accessibilityMap.filter((item, index) => data.accessibility[index]).map(item => item.value.toString()),

      byStatus: data.content_status.some(value => value),
      statuses: {
        active: data.content_status[0],
        approved: data.content_status[1],
        canceled: data.content_status[2],
        inactive: data.content_status[3],
        pending: data.content_status[4],
        qa: data.content_status[5]
      },

      byActiveDates: !!data.active_start_date || !!data.active_end_date,
      activeStartDate: data.active_start_date ? moment(data.active_start_date) : moment().subtract(500, 'years'),
      activeEndDate: data.active_end_date ? moment(data.active_end_date) : moment().add(500, 'years')
    };

    this.onOptionsChange.emit(activeFilters);
  }

  createOptionsMap(options : LabelValueMap, values : Array<string | number>) : FormArray {
    return new FormArray(options.map((item) => {
      return new FormControl(values.some(value => value === item.value))
    }));
  }

  clearFilters() {
    this.form.reset();
    this.onChange();
  }

  handleKeywordChange(event) {
    this.keywordChangeSubject.next(event.target.value);
  }

  handleActiveDateStartChange(event) {
    const start = moment(_.get(event, 'target.value', null));
    this.activeDateStartSubject.next(start.isValid() ? start : '');
  }

  handleActiveDateEndChange(event) {
    const end = moment(_.get(event, 'target.value', null));
    this.activeDateEndSubject.next(end.isValid() ? end : '');
  }
}