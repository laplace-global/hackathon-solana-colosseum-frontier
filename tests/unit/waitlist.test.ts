import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getWaitlistEmailError,
  normalizeWaitlistEmail,
} from '../../src/lib/waitlist';

describe('waitlist email handling', () => {
  it('normalizes waitlist emails before persistence', () => {
    assert.equal(normalizeWaitlistEmail('  Investor@Example.COM  '), 'investor@example.com');
  });

  it('rejects empty or malformed waitlist emails', () => {
    assert.equal(getWaitlistEmailError(''), 'Enter a valid email address.');
    assert.equal(getWaitlistEmailError('investor'), 'Enter a valid email address.');
    assert.equal(getWaitlistEmailError('investor@example.com'), null);
  });
});
