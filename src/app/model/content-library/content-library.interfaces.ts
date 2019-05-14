import { ISyncGatewayModel } from '../sync-gateway/sync-gateway-model';
import { ContentItem } from './content-item';

export namespace ContentLibraryInterfaces {
  export interface IContentItem extends ISyncGatewayModel {
    readonly doc_type: string;

    title: string;
    library_path: string;
    tile_image_path?: string;
    display_type: string;
    content_type: string;
    platforms: {
      android: boolean;
      pc: boolean;
    };
    products: {
      engage: boolean;
      focus: boolean;
      rehab: boolean;
    };
    keywords?: string[];
    accessibility: {
      hearing_impairment: boolean;
      physical_impairment: boolean;
      vision_impairment: boolean;
    };
    usage_settings: {
      group_use: boolean;
      joint_use: boolean;
      solo_use: boolean;
    };
    skill_level: {
      level_one: boolean;
      level_two: boolean;
      level_three: boolean;
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
  }

  export interface IContentItemForm {
    title: string;
    library_path: string;
    display_type: string;
    content_type: string;
    platforms: {
      android: boolean;
      pc: boolean;
    };
    products: {
      engage: boolean;
      focus: boolean;
      rehab: boolean;
    };
    keywords: string[];
    accessibility: {
      hearingImpairment: boolean;
      physicalImpairment: boolean;
      visionImpairment: boolean;
    };
    usage_settings: {
      groupUse: boolean;
      jointUse: boolean;
      soloUse: boolean;
    };
    skill_level: {
      levelOne: boolean;
      levelTwo: boolean;
      levelThree: boolean;
    };
    source: string;
    license_expiration_date: string;
    notes: string;

    happy_neuron_game_id: string;
    happy_neuron_lang: string;

    video_description: string;

    content_url: string;

    windows_exe_locations: string;
  }

  export interface IActiveFavoritesMap {
    [contentId: string]: number;
  }

  export interface IContentAnalyticsMap {
    [contentId: string]: {
      times_accessed: number;
      last_time_used: string;
    };
  }

  export interface IContentStatsResult {
    _id?: string;
    library_path: string;
    doc_type: string;
    title: string;
    total_content_items: number;
    created_date: string;
    // last_active: string;
    last_time_used: string;
    times_accessed: number;
    active_favorites: number;
    products: {
      engage: boolean;
      focus: boolean;
      rehab: boolean;
    };
    platforms?: string;
  }

  export interface ISelectedItems {
    contentIds: {
      [id: string]: boolean;
    };
    folderTitles: {
      [title: string]: boolean;
    };
  }

  export interface IChangeEvent {
    addFolder?: {
      newFolderName: string;
    };
    renameFolder?: {
      oldTitle: string;
      newTitle: string;
    };
    addEditContentItem?: {
      contentItem?: ContentItem;
    };
    saveContentItem?: {
      contentItem?: ContentItem;
      file?: File;
      tileImageBase64Data?: string;
      cancelled?: boolean;
    };
    moveItems?: {
      items: IContentStatsResult[];
      newPath: string;
    };
    deleteItems?: {
      contentItem?: ContentItem;
      libraryItems?: IContentStatsResult[];
    };
    search?: {
      searchText: string;
    };
    error?: {
      message: string;
    };
  }

  export interface FileChangeEvent {
    target: {
      files: File[];
      value: string;
    };
  }
}
