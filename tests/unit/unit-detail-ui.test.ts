import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('unit detail UI', () => {
  const source = readFileSync('src/app/hotel/[id]/unit/[unitId]/page.tsx', 'utf8');

  it('uses the property card thumbnail for the detail hero image', () => {
    assert.match(source, /src=\{hotel\.thumbnail\}/);
    assert.doesNotMatch(source, /unitImages/);
    assert.doesNotMatch(source, /`\/images\/\$\{hotel\.id\}-unit-1\.jpg`/);
  });

  it('removes the gallery tab from the unit detail menu', () => {
    assert.doesNotMatch(source, /ImageGallery/);
    assert.doesNotMatch(source, /value="gallery"/);
    assert.doesNotMatch(source, />Gallery</);
    assert.match(source, /grid-cols-3/);
  });
});
