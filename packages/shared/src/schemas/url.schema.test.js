import { describe, it, expect } from 'vitest';
import { httpUrlSchema } from './url.schema.js';

describe('httpUrlSchema', () => {
  it.each(['https://www.netflix.com/title/1', 'http://mubi.com/films/1'])('acepta %s', (url) => {
    expect(httpUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,hola',
    'ftp://netflix.com/1',
    'no es un enlace',
    '',
    null,
    undefined,
  ])('rechaza %j', (url) => {
    expect(httpUrlSchema.safeParse(url).success).toBe(false);
  });

  it('devuelve un mensaje en español', () => {
    expect(httpUrlSchema.safeParse('javascript:alert(1)').error.issues[0].message).toBe(
      'Enlace inválido',
    );
  });
});
