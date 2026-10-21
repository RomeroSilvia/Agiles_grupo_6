import { describe, it, expect } from 'vitest';
import { obtenerDestinoPlataforma } from './destinoPlataforma.js';

const URL_HOME = 'https://www.netflix.com';
const DEEP_LINK = 'https://www.netflix.com/title/80100172';

describe('obtenerDestinoPlataforma', () => {
  it('usa el deep link cuando es válido', () => {
    expect(obtenerDestinoPlataforma({ deepLink: DEEP_LINK, urlHome: URL_HOME })).toEqual({
      href: DEEP_LINK,
      esDeepLink: true,
    });
  });

  it('usa la home de la plataforma cuando no hay deep link', () => {
    expect(obtenerDestinoPlataforma({ deepLink: null, urlHome: URL_HOME })).toEqual({
      href: URL_HOME,
      esDeepLink: false,
    });
    expect(obtenerDestinoPlataforma({ urlHome: URL_HOME })).toEqual({
      href: URL_HOME,
      esDeepLink: false,
    });
  });

  it.each(['javascript:alert(1)', 'data:text/html,hola', 'ftp://netflix.com/1', 'no es un enlace'])(
    'usa la home cuando el deep link no es un enlace http(s) válido: %s',
    (deepLink) => {
      expect(obtenerDestinoPlataforma({ deepLink, urlHome: URL_HOME })).toEqual({
        href: URL_HOME,
        esDeepLink: false,
      });
    },
  );

  it('devuelve null si no hay ningún enlace válido', () => {
    expect(obtenerDestinoPlataforma({ deepLink: null, urlHome: null })).toBeNull();
    expect(
      obtenerDestinoPlataforma({ deepLink: 'javascript:alert(1)', urlHome: 'javascript:void(0)' }),
    ).toBeNull();
  });
});
