import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';

describe('hotel detail tab routing', () => {
  it('builds property links that can open a specific tab', async () => {
    const tabs = await import('../../src/lib/hotel-tabs') as {
      buildHotelTabHref: (hotelId: string, tab: string) => string;
      getHotelTabFromSearch: (value: unknown) => string;
    };

    assert.equal(tabs.buildHotelTabHref('the-sail', 'units'), '/hotel/the-sail?tab=units');
    assert.equal(tabs.getHotelTabFromSearch('faq'), 'faq');
    assert.equal(tabs.getHotelTabFromSearch('unknown'), 'overview');
  });

  it('routes home property cards to the units tab', () => {
    const source = readFileSync('src/app/page.tsx', 'utf8');

    assert.match(source, /buildHotelTabHref\(property\.id, 'units'\)/);
  });

  it('keeps hotel detail tabs controlled by the tab query parameter', () => {
    const source = readFileSync('src/app/hotel/[id]/page.tsx', 'utf8');

    assert.match(source, /useSearchParams\(\)/);
    assert.match(source, /getHotelTabFromSearch\(searchParams\.get\('tab'\)\)/);
    assert.match(source, /onValueChange=\{handleTabChange\}/);
    assert.match(source, /nextParams\.set\('tab', nextTab\)/);
  });
});
