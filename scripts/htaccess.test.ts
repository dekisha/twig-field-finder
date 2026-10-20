import { describe, expect, it } from 'vitest';

import { renderHtaccess } from './htaccess';

describe('renderHtaccess', () => {
  it.each([
    ['/twig-field-finder', '/twig-field-finder/404.html'],
    ['/twig-field-finder/', '/twig-field-finder/404.html'],
    ['twig-field-finder', '/twig-field-finder/404.html'],
    ['/', '/404.html'],
    ['', '/404.html'],
  ])('points ErrorDocument at the base path (%j)', (base, expected) => {
    expect(renderHtaccess(base)).toContain(`ErrorDocument 404 ${expected}\n`);
  });

  it('caches hashed assets forever and revalidates pages', () => {
    const conf = renderHtaccess('/x');
    expect(conf).toContain('max-age=31536000, immutable');
    expect(conf).toContain('Header set Cache-Control "no-cache"');
  });
});
