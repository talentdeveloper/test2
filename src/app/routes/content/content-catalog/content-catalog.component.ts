import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Content } from '../../../model/content/content';
import { Container } from '../../../model/content/container';
import { IContentFilter } from '../../../model/content/content-filter';
import { isContainer, isContent } from '../../../model/content/base-content';
import { SidebarSizeChangeMessage } from '../../../core/ui-event-service/ui-sidebar-size-change';
import { UiEventService } from '../../../core/ui-event-service/ui-event-service';

// primary sub layout for all content templates
@Component({
    selector: 'app-content-catalog',
    templateUrl: './content-catalog.component.html',
    styleUrls: ['./content-catalog.component.scss']
})
export class ContentCatalogComponent implements OnInit {
    @ViewChild('contentPageContainer') contentPageContainerElement: ElementRef;

    filters: IContentFilter;
    emptyFilters: IContentFilter = {
      byKeywords: false,
      keywords: [],

      byDisplayTypes: false,
      displayTypes: {
        activity: false,
        audio: false,
        audiobook: false,
        document: false,
        game: false,
        image: false,
        music: false,
        puzzle: false,
        recipe: false,
        slideshow: false,
        trivia: false,
        video: false,
        website: false
      },

      bySkillLevels: false,
      skillLevels: [],

      byAccessibility: false,
      accessibilities: [],

      byStatus: false,
      statuses: {
        active: false,
        approved: false,
        canceled: false,
        inactive: false,
        pending: false,
        qa: false
      },

      byActiveDates: false,
      activeStartDate: null,
      activeEndDate: null
    };

    enableFilter = false;
    isSimulatedDateActive = false;
    contentHeight: number;
    sidebarIsCollapsed = false;

    constructor(
        protected elRef: ElementRef,
        protected route: ActivatedRoute,
        protected router: Router,
        protected uiEventService: UiEventService
    ) { }

    ngOnInit() {
        this.filters = Object.assign({}, this.emptyFilters);
        
        this.uiEventService.subscribe(SidebarSizeChangeMessage, (message: SidebarSizeChangeMessage) => {
            this.sidebarIsCollapsed = message.sidebarIsCollapsed;
        });
    }

    handleSelectRouter(data : any) {
        if (isContainer(data.type)) {
            return this.handleSelectContainer(new Container(data));
        }

        if (isContent(data.type)) {
            return this.handleSelectContent(new Content(data));
        }

        throw new Error(`Unrecognizable type: ${data.type} from ${data._id} on 'content_meta_data'`);
    }

    handleSelectContent(content : Content) {
        this.router.navigateByUrl(`/content/catalog/(item:content/${content._id})`);
    }

    handleSelectContainer(container : Container) {
        this.router.navigateByUrl(`/content/catalog/(item:container/${container._id})`);
    }

    handleContainerCreate(parentId : string) {
        this.router.navigateByUrl(`/content/catalog/(item:container/${parentId}/add/container)`);
    }

    handleContentCreate(parentId : string) {
        this.router.navigateByUrl(`/content/catalog/(item:container/${parentId}/add/content)`);
    }

    handleFilterChange(filters : any) {
        this.filters = filters;
    }

    toggleFilter() {
        this.enableFilter = !this.enableFilter;

        // reset filters when its disabled
        if (!this.enableFilter) {
            this.filters = Object.assign({}, this.emptyFilters);
        }
    }

    handleSimulatedDateChange(simulatedDate: string): void {
        this.isSimulatedDateActive = simulatedDate.length > 0;

        // when simulated date active, disable and reset filters
        if (this.isSimulatedDateActive) {
            this.enableFilter = false;
            this.filters = Object.assign({}, this.emptyFilters);
        }
    }
}
