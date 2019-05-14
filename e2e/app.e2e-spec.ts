import { OlympusPortalPage } from './app.po';

describe('Olympus Portal App', function() {
  let page: OlympusPortalPage;

  beforeEach(() => {
    page = new OlympusPortalPage();
  });

  it('should display Angle in h1 tag', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Angle');
  });
});
