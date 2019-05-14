import * as _ from 'lodash';
import * as moment from 'moment';

import {
  BaseContent,
  IBaseContent,
  contentTypes,
  contentStatus,
  PRODUCTS,
  IContentProducts
} from './base-content';
import { IContentMap } from '../../core/content/content.service';

export type LabelValueMap = Array<{
  label: string;
  value: string | number;
}>;

export const skillLevel = {
  LEVEL_ONE: 1,
  LEVEL_TWO: 2,
  LEVEL_THREE: 3
};

export const skillLevelMap: LabelValueMap = [
  { label: 'Level One', value: skillLevel.LEVEL_ONE },
  { label: 'Level Two', value: skillLevel.LEVEL_TWO },
  { label: 'Level Three', value: skillLevel.LEVEL_THREE }
];

export const tag = {
  GROUP: 'group',
  JOINT: 'joint',
  SOLO: 'solo'
};

export const tagMap: LabelValueMap = [
  { label: 'Solo Use', value: tag.SOLO },
  { label: 'Joint Use', value: tag.JOINT },
  { label: 'Group Use', value: tag.GROUP }
];

export const accessibility = {
  HEARING_IMPAIRMENT: 'hearing impairment',
  PHYSICAL_IMPAIRMENT: 'physical impairment',
  VISION_IMPAIRMENT: 'vision impairment'
};

export const accessibilityMap: LabelValueMap = [
  { label: 'Vision Impairment', value: accessibility.VISION_IMPAIRMENT },
  { label: 'Hearing Impairment', value: accessibility.HEARING_IMPAIRMENT },
  { label: 'Physical Impairment', value: accessibility.PHYSICAL_IMPAIRMENT }
];

export const type = {
  HAPPYNEURON: 'happyneuron',
  PDF: 'pdf',
  VIDEO: 'video',
  WEBAPP: 'webapp',
  WEBSITE: 'website',
  WINDOWSEXE: 'windowsexe'
};

// sorted so that items appear in alphabetical order on content form
export const typeMap: LabelValueMap = [
  { label: 'Happy Neuron', value: type.HAPPYNEURON },
  { label: 'PDF', value: type.PDF },
  { label: 'Video', value: type.VIDEO },
  { label: 'Web App', value: type.WEBAPP },
  { label: 'Website', value: type.WEBSITE },
  { label: 'Windows EXE Location', value: type.WINDOWSEXE }
].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

export const displayType = {
  ACTIVITY: 'activity',
  AUDIO: 'audio',
  AUDIOBOOK: 'audiobook',
  DOCUMENT: 'document',
  GAME: 'game',
  IMAGE: 'image',
  MUSIC: 'music',
  PUZZLE: 'puzzle',
  RECIPE: 'recipe',
  SLIDESHOW: 'slideshow',
  TRIVIA: 'trivia',
  VIDEO: 'video',
  WEBSITE: 'website'
};

// sorted so that items appear in alphabetical order on content form
export const displayTypeMap: LabelValueMap = [
  { label: 'Activity', value: displayType.ACTIVITY },
  { label: 'Audio', value: displayType.AUDIO },
  { label: 'Audio Book', value: displayType.AUDIOBOOK },
  { label: 'Document', value: displayType.DOCUMENT },
  { label: 'Game', value: displayType.GAME },
  { label: 'Image', value: displayType.IMAGE },
  { label: 'Music', value: displayType.MUSIC },
  { label: 'Puzzle', value: displayType.PUZZLE },
  { label: 'Recipe', value: displayType.RECIPE },
  { label: 'Slideshow', value: displayType.SLIDESHOW },
  { label: 'Trivia', value: displayType.TRIVIA },
  { label: 'Video', value: displayType.VIDEO },
  { label: 'Website', value: displayType.WEBSITE }
].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

export const HappyNeuronLang = {
  ENGLISH: 'en',
  SPANISH: 'es'
};

export const HappyNeuronLangMap: LabelValueMap = [
  { label: 'English', value: HappyNeuronLang.ENGLISH },
  { label: 'Spanish', value: HappyNeuronLang.SPANISH }
];

export const productMap: LabelValueMap = [
  { label: PRODUCTS.ENGAGE.toUpperCase(), value: PRODUCTS.ENGAGE },
  { label: PRODUCTS.FOCUS.toUpperCase(), value: PRODUCTS.FOCUS },
  { label: PRODUCTS.REHAB.toUpperCase(), value: PRODUCTS.REHAB }
];

export interface IContent extends IBaseContent {
  accessibility: string;
  content_path: string;
  content_type: string;
  content_url?: string;
  display_type: string;
  library_path?: string;
  license_expiration_date: string;
  keywords: Array<string>;
  meta_data?: {
    windows_exe_locations?: string[];
    video_info?: string;
    game_id?: number;
    lang: string;
  };
  notes: string;
  parent_title_override: string;
  s3_etag: string;
  s3_key: string;
  skill_level: number[];
  source: string;
  subscription_package: string;
  use_tag: string;
}

export class Content extends BaseContent implements IContent {
  accessibility;
  content_path;
  content_type;
  content_url;
  display_type;
  library_path: string;
  license_expiration_date;
  keywords;
  meta_data;
  notes;
  parent_title_override;
  s3_etag;
  s3_key;
  skill_level;
  source;
  subscription_package;
  use_tag;

  static normalizeKeyword(keyword: string): string {
    return keyword
      .toLowerCase()
      .replace(/\s{2,}/g, '')
      .trim();
  }

  constructor(data?: IContent) {
    super({
      _id: _.get(data, '_id'),
      _rev: _.get(data, '_rev'),
      _attachments: _.get(data, '_attachments'),
      created_by: _.get(data, 'created_by'),
      created_date: _.get(data, 'created_date'),
      modified_by: _.get(data, 'modified_by'),
      modified_date: _.get(data, 'modified_date'),
      parent_id: _.get(data, 'parent_id', null),
      active_dates: _.get(data, 'active_dates'),
      content_status: _.get(data, 'content_status'),
      tile_image_path: _.get(data, 'tile_image_path'),
      title: _.get(data, 'title'),
      type: _.get(data, 'type', contentTypes.CONTENT),
      new_content_date: _.get(data, 'new_content_date'),
      products: _.get(data, 'products')
    });

    this.accessibility = _.get(data, 'accessibility', '');
    this.content_path = _.get(data, 'content_path', '');
    this.content_type = _.get(data, 'content_type', '');
    this.content_url = _.get(data, 'content_url', '');
    this.display_type = _.get(data, 'display_type', '');
    this.library_path = _.get(data, 'library_path', '');
    this.license_expiration_date = _.get(data, 'license_expiration_date', '');
    this.keywords = _.get(data, 'keywords', []);
    this.meta_data = _.get(data, 'meta_data', {});
    this.notes = _.get(data, 'notes', '');
    this.parent_title_override = _.get(data, 'parent_title_override', '');
    this.s3_etag = _.get(data, 's3_etag', '');
    this.s3_key = _.get(data, 's3_key', '');
    this.source = _.get(data, 'source', '');
    this.subscription_package = _.get(data, 'subscription_package', '');
    this.use_tag = _.get(data, 'use_tag', '');

    // special case: if skill_level is a string, convert to an array
    // previous skill_level defaulted to "" or a value like "1,3" instead
    // of an array of numbers so we should check for this case and convert to
    // prevent js errors
    this.skill_level = _.get(data, 'skill_level', []);

    if (typeof this.skill_level === 'string') {
      this.skill_level = /^[123,]+$/.test(this.skill_level) ? this.skill_level.split(',') : [];
    }
  }

  getAccessibilityLabels() {
    return this.accessibility
      .split(',')
      .map(value => accessibilityMap.find(a => value === a.value))
      .filter(a => a)
      .map(a => a.label)
      .join(', ');
  }

  getSkillLevelLabels() {
    return this.skill_level
      .map(value => skillLevelMap.find(skill => skill.value === value))
      .filter(value => value)
      .map(value => value.label)
      .join(', ');
  }

  getUseTagLabels() {
    return this.use_tag
      .split(',')
      .map(value => tagMap.find(t => value === t.value))
      .filter(t => t)
      .map(t => t.label)
      .join(', ');
  }

  isExpired(date: Date = new Date()) {
    if (!this.license_expiration_date) {
      return false;
    }

    return moment.utc(this.license_expiration_date).isBefore(moment.utc(date));
  }

  getStatus(options?: { contentMap?: IContentMap; date?: Date }): string {
    options = options || {};
    const date = isNaN(Number(options.date)) ? new Date() : options.date;

    const expired = this.isExpired();
    const active = this.activeDateMatch(date);
    const previouslyActive = this.previouslyDateActive(date);

    if (this.content_status === contentStatus.QA) {
      return contentStatus.QA;
    } else if (expired) {
      return contentStatus.CANCELED;
    } else if (active) {
      // active
      return contentStatus.ACTIVE;
    } else if (previouslyActive) {
      // has been released before but isn't active
      return contentStatus.INACTIVE;
    }

    return contentStatus.APPROVED;
  }

  // --- Happy Neuron Template Helpers ---

  isHappyNeuron() {
    return this.content_type === type.HAPPYNEURON;
  }

  getHappyNeuronGameId() {
    return this.isHappyNeuron() ? _.get(this, 'meta_data.game_id', '') : '';
  }

  getHappyNeuronLangName() {
    const lang = this.isHappyNeuron() ? _.get(this, 'meta_data.lang', '') : '';
    const langOption = HappyNeuronLangMap.find(option => option.value === lang);
    return langOption ? langOption.label : '';
  }

  getContentTypeLabel() {
    const type = typeMap.filter(type => type.value === this.content_type)[0];

    // if any bad data
    if (!type) {
      return this.content_type;
    }

    return type.label;
  }

  getDisplayTypeLabel() {
    const displayType = displayTypeMap.filter(type => type.value === this.display_type)[0];

    // if any bad data
    if (!displayType) {
      return this.display_type;
    }

    return displayType.label;
  }
}
