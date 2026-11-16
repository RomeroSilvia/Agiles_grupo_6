import { describe, it, expect } from 'vitest';
import { esDeepLinkDePlataforma } from './deepLink.validator.js';

const NETFLIX = { tmdbProviderId: 8 };

describe('esDeepLinkDePlataforma', () => {
  it('acepta un enlace https al dominio de la plataforma o a un subdominio', () => {
    expect(esDeepLinkDePlataforma('https://netflix.com/title/1', NETFLIX)).toBe(true);
    expect(esDeepLinkDePlataforma('https://www.netflix.com/title/1', NETFLIX)).toBe(true);
  });

  it('rechaza http, otros dominios y dominios que solo terminan igual', () => {
    expect(esDeepLinkDePlataforma('http://www.netflix.com/title/1', NETFLIX)).toBe(false);
    expect(esDeepLinkDePlataforma('https://evil.com/?r=netflix.com', NETFLIX)).toBe(false);
    expect(esDeepLinkDePlataforma('https://evilnetflix.com/title/1', NETFLIX)).toBe(false);
  });

  it('rechaza valores que no son URL, plataformas desconocidas y enlaces demasiado largos', () => {
    expect(esDeepLinkDePlataforma('javascript:alert(1)', NETFLIX)).toBe(false);
    expect(esDeepLinkDePlataforma(null, NETFLIX)).toBe(false);
    expect(esDeepLinkDePlataforma('https://www.netflix.com/', { tmdbProviderId: 999 })).toBe(false);
    expect(esDeepLinkDePlataforma(`https://www.netflix.com/${'a'.repeat(600)}`, NETFLIX)).toBe(
      false,
    );
  });
});
