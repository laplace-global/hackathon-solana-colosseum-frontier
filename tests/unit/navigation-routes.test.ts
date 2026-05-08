import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('public navigation routes', () => {
  it('keeps admin-only routes out of public navigation surfaces', async () => {
    const navigation = await import('../../src/lib/navigation/routes') as {
      HIDDEN_ADMIN_ROUTES?: readonly string[];
      PUBLIC_NAV_LINKS?: ReadonlyArray<{ href: string }>;
      PUBLIC_FOOTER_LINKS?: ReadonlyArray<{ href: string }>;
      PUBLIC_HOME_PROTOCOL_CARDS?: ReadonlyArray<{ href: string }>;
      isHiddenAdminRoute?: (pathname: string) => boolean;
    };

    assert.deepEqual(navigation.HIDDEN_ADMIN_ROUTES, ['/admin', '/lend']);

    const publicHrefs = [
      ...(navigation.PUBLIC_NAV_LINKS ?? []).map((link) => link.href),
      ...(navigation.PUBLIC_FOOTER_LINKS ?? []).map((link) => link.href),
      ...(navigation.PUBLIC_HOME_PROTOCOL_CARDS ?? []).map((link) => link.href),
    ];

    for (const hiddenRoute of navigation.HIDDEN_ADMIN_ROUTES ?? []) {
      assert.equal(publicHrefs.includes(hiddenRoute), false, `${hiddenRoute} must not be public`);
    }

    assert.equal(navigation.isHiddenAdminRoute?.('/admin'), true);
    assert.equal(navigation.isHiddenAdminRoute?.('/admin/markets'), true);
    assert.equal(navigation.isHiddenAdminRoute?.('/lend'), true);
    assert.equal(navigation.isHiddenAdminRoute?.('/lend/markets'), true);
    assert.equal(navigation.isHiddenAdminRoute?.('/borrow'), false);
  });
});
