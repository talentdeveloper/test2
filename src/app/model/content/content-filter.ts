import * as moment from 'moment';

export interface IContentFilter {
  byKeywords: boolean;
  keywords: string[];
  byDisplayTypes: boolean;
  displayTypes: {
    activity: boolean;
    audio: boolean;
    audiobook: boolean;
    document: boolean;
    game: boolean;
    image: boolean;
    music: boolean;
    puzzle: boolean;
    recipe: boolean;
    slideshow: boolean;
    trivia: boolean;
    video: boolean;
    website: boolean;
  };
  bySkillLevels: boolean;
  skillLevels: number[];
  byAccessibility: boolean;
  accessibilities: string[];
  byStatus: boolean;
  statuses: {
    active: boolean;
    approved: boolean;
    canceled: boolean;
    inactive: boolean;
    pending: boolean;
    qa: boolean;
  };
  byActiveDates: boolean;
  activeStartDate: moment.Moment;
  activeEndDate: moment.Moment;
}