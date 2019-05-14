import * as _ from 'lodash';

import { ContentLibraryInterfaces as CLI } from './content-library.interfaces';
import { SyncGatewayModel } from '../sync-gateway/sync-gateway-model';

export class ContentItem extends SyncGatewayModel implements CLI.IContentItem {
  readonly doc_type = 'content-item';

  title: string;
  library_path: string;
  tile_image_path?: string;
  display_type: string;
  content_type: string;
  platforms = {
    android: false,
    pc: false
  };
  products = {
    engage: false,
    focus: false,
    rehab: false
  };
  keywords?: string[];
  accessibility = {
    hearing_impairment: false,
    physical_impairment: false,
    vision_impairment: false
  };
  usage_settings = {
    group_use: false,
    joint_use: false,
    solo_use: false
  };
  skill_level = {
    level_one: false,
    level_two: false,
    level_three: false
  };
  source?: string;
  license_expiration_date?: string;
  notes?: string;

  // AWS uploaded file info
  s3_etag?: string;
  s3_key?: string;

  // Happy neuron content type
  happy_neuron?: {
    game_id: string;
    lang: string;
  };

  // Video content type
  video_description?: string;

  // Website content type
  content_url?: string;

  // Windows exe
  windows_exe_locations?: string[];

  constructor(props?: CLI.IContentItem) {
    super();

    if (!props) {
      return;
    }

    this._id = props._id;
    this._rev = props._rev;
    this._attachments = props._attachments;
    this.created_by = props.created_by;
    this.created_date = props.created_date;
    this.modified_by = props.modified_by;
    this.modified_date = props.modified_date;
    this.title = props.title;
    this.library_path = props.library_path;
    this.tile_image_path = props.tile_image_path;
    this.display_type = props.display_type;
    this.content_type = props.content_type;
    this.platforms = props.platforms;
    this.products = props.products;
    this.keywords = props.keywords;
    this.accessibility = props.accessibility;
    this.usage_settings = props.usage_settings;
    this.skill_level = props.skill_level;
    this.source = props.source;
    this.license_expiration_date = props.license_expiration_date;
    this.notes = props.notes;
    this.s3_etag = props.s3_etag;
    this.s3_key = props.s3_key;
    this.happy_neuron = props.happy_neuron;
    this.video_description = props.video_description;
    this.content_url = props.content_url;
    this.windows_exe_locations = props.windows_exe_locations;
  }

  getTileImage(): string {
    if (!this._attachments) {
      return null;
    }

    return `content_meta_data/${this._id}/tile_image?${this._rev}`;
  }
}
