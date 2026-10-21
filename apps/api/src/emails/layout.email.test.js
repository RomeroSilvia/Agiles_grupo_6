import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { APP_NAME } from '@buscador/shared/constants';
import { LOGO_ATTACHMENT, renderEmail } from './layout.email.js';
import { mailAvisoCambioMail } from './avisoCambioMail.email.js';
import { mailRecuperacionPassword } from './recuperacionPassword.email.js';
import { mailAvisoDisponibilidad } from './avisoDisponibilidad.email.js';

const CONTENIDO = {
  preheader: 'Resumen',
  titulo: 'Título',
  parrafos: ['Primer párrafo'],
  accion: { texto: 'Abrir', url: 'http://localhost:5173/restablecer-contrasena#token=abc' },
  nota: 'Nota final',
};

describe('renderEmail', () => {
  it('arma el HTML con el logo, el nombre de la app y el botón', () => {
    const { html } = renderEmail(CONTENIDO);

    expect(html).toContain(`src="cid:${LOGO_ATTACHMENT.cid}"`);
    expect(html).toContain(APP_NAME);
    expect(html).toContain('href="http://localhost:5173/restablecer-contrasena#token=abc"');
    expect(html).toContain('prefers-color-scheme: dark');
  });

  it('arma también la versión de texto con el enlace', () => {
    const { text } = renderEmail(CONTENIDO);

    expect(text).toContain('Título');
    expect(text).toContain('Abrir: http://localhost:5173/restablecer-contrasena#token=abc');
    expect(text).toContain('Nota final');
  });

  it('escapa los datos que se insertan en el HTML', () => {
    const { html } = mailAvisoCambioMail({ nuevoEmail: '<script>@mail.com' });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;@mail.com');
  });

  it('el logo adjunto existe', () => {
    expect(existsSync(LOGO_ATTACHMENT.path)).toBe(true);
  });
});

describe('mailRecuperacionPassword', () => {
  it('indica el vencimiento del enlace', () => {
    const mail = mailRecuperacionPassword({ enlace: 'http://localhost/x' });

    expect(mail.subject).toContain(APP_NAME);
    expect(mail.text).toMatch(/vence a los 30 minutos/);
  });
});

describe('mailAvisoDisponibilidad', () => {
  const AVISO = {
    titulo: { nombre: 'Dune', anio: 2021 },
    plataformas: ['Netflix', 'Prime Video', 'Max'],
    enlace: 'https://streamly.app/titulos/pelicula/42',
  };

  it('nombra el título y todas las plataformas donde llegó', () => {
    const mail = mailAvisoDisponibilidad(AVISO);

    expect(mail.subject).toBe('Dune ya está disponible en Netflix, Prime Video y Max');
    expect(mail.text).toContain('Dune (2021)');
    expect(mail.text).toContain('Ver dónde verlo: https://streamly.app/titulos/pelicula/42');
  });

  it('explica en el pie por qué le llega el aviso', () => {
    const { html, text } = mailAvisoDisponibilidad(AVISO);

    expect(text).toContain('tenés los avisos activos en tu watchlist');
    expect(html).toContain('tenés los avisos activos en tu watchlist');
    expect(html).not.toContain('movimiento en tu cuenta');
  });
});
