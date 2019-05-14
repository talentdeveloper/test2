/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BaseContent } from './base-content';

describe('Base Content Model', () => {

    let content;

    beforeEach(() => {
        content = new BaseContent({"_id":"26407731-8d55-1441-bb44-6e6df1ab271e","_rev":"7-19e5a007eb27fef4718de9caf6f9b887","active_dates":[{"end":"2017-07-31","start":"2017-07-29"}],"content_status":"approved","created_by":"krdobbs1+040517@gmail.com","created_date":"2017-05-25T20:48:17.759Z","modified_by":"jburich@gmail.com","modified_date":"2017-07-31T13:46:31.290Z","new_content_date":"2017-07-31T13:21:25.010Z","title":"game","type":"content","tile_image_path":""});
    });

    it('should match against single date range', () => {
        // middle range
        expect(content.activeDateMatch('2017-07-30')).toBe(true);
        // on start date
        expect(content.activeDateMatch('2017-07-29')).toBe(true);
        // on end date
        expect(content.activeDateMatch('2017-07-31')).toBe(true);
    });

    it('should not match against single date range', () => {
        expect(content.activeDateMatch('2017-07-28')).toBe(false);
        expect(content.activeDateMatch('2017-08-01')).toBe(false);
    });

    it('should match against multiple date ranges', () => {
        content.active_dates = [
            {start: '2017-06-30', end: '2017-07-02'},
            {start: '2017-07-29', end: '2017-07-31'}
        ];

        expect(content.activeDateMatch('2017-06-30')).toBe(true);
        expect(content.activeDateMatch('2017-07-01')).toBe(true);
        expect(content.activeDateMatch('2017-07-02')).toBe(true);
        expect(content.activeDateMatch('2017-07-29')).toBe(true);
        expect(content.activeDateMatch('2017-07-30')).toBe(true);
        expect(content.activeDateMatch('2017-07-31')).toBe(true);
    });

    it('should not match against multiple date ranges', () => {
        content.active_dates = [
            {start: '2017-06-30', end: '2017-07-02'},
            {start: '2017-07-29', end: '2017-07-31'}
        ];

        expect(content.activeDateMatch('2017-06-29')).toBe(false);
        expect(content.activeDateMatch('2017-07-05')).toBe(false);
        expect(content.activeDateMatch('2017-08-01')).toBe(false);
    });

    it('should not match against empty date ranges', () => {
        content.active_dates = [];

        expect(content.activeDateMatch('2017-06-30')).toBe(false);
    });
});
