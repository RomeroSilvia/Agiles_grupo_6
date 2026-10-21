import { fileURLToPath } from 'node:url';
import { APP_NAME } from '@buscador/shared/constants';
import { escapeHtml } from '../utils/escapeHtml.js';
import { EMAIL_COLORS, EMAIL_FONTS, EMAIL_LAYOUT } from './emailTheme.js';

const LOGO_CID = 'logo';

export const LOGO_ATTACHMENT = Object.freeze({
  filename: 'logo.png',
  path: fileURLToPath(new URL('./assets/logo.png', import.meta.url)),
  cid: LOGO_CID,
});

const { light, dark } = EMAIL_COLORS;

const DARK_MODE_STYLES = `
  @media (prefers-color-scheme: dark) {
    .fondo { background-color: ${dark.background} !important; }
    .tarjeta { background-color: ${dark.surface} !important; border-color: ${dark.border} !important; }
    .texto { color: ${dark.foreground} !important; }
    .secundario { color: ${dark.muted} !important; }
    .enlace { color: ${dark.link} !important; }
  }
  @media (max-width: 620px) {
    .tarjeta { padding: 24px !important; }
  }
`;

function renderBoton({ texto, url }) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 8px 0 16px;">
      <tr>
        <td style="border-radius: 8px; background-color: ${light.primary};">
          <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 14px 24px; font-family: ${EMAIL_FONTS.sans}; font-size: 16px; font-weight: 600; color: ${light.primaryForeground}; text-decoration: none; border-radius: 8px;">${escapeHtml(texto)}</a>
        </td>
      </tr>
    </table>
    <p class="secundario" style="margin: 0 0 16px; font-family: ${EMAIL_FONTS.sans}; font-size: 13px; line-height: 20px; color: ${light.muted};">
      Si el botón no funciona, copiá este enlace en tu navegador:<br />
      <a class="enlace" href="${escapeHtml(url)}" target="_blank" style="color: ${light.link}; word-break: break-all;">${escapeHtml(url)}</a>
    </p>`;
}

function renderHtml({ preheader, titulo, parrafos, accion, nota }) {
  const parrafosHtml = parrafos
    .map(
      (parrafo) =>
        `<p class="texto" style="margin: 0 0 16px; font-family: ${EMAIL_FONTS.sans}; font-size: 16px; line-height: 24px; color: ${light.foreground};">${escapeHtml(parrafo)}</p>`,
    )
    .join('');

  const notaHtml = nota
    ? `<p class="secundario" style="margin: 16px 0 0; font-family: ${EMAIL_FONTS.sans}; font-size: 14px; line-height: 22px; color: ${light.muted};">${escapeHtml(nota)}</p>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(titulo)}</title>
    <style>${DARK_MODE_STYLES}</style>
  </head>
  <body class="fondo" style="margin: 0; padding: 0; background-color: ${light.background};">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(preheader)}</div>
    <table role="presentation" class="fondo" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${light.background};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: ${EMAIL_LAYOUT.maxWidth}px;">
            <tr>
              <td style="padding: 0 0 24px;">
                <img src="cid:${LOGO_CID}" width="${EMAIL_LAYOUT.logoWidth}" height="${EMAIL_LAYOUT.logoHeight}" alt="" style="border: 0; vertical-align: middle;" />
                <span class="texto" style="margin-left: 8px; font-family: ${EMAIL_FONTS.display}; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase; vertical-align: middle; color: ${light.foreground};">${escapeHtml(APP_NAME)}</span>
              </td>
            </tr>
            <tr>
              <td class="tarjeta" style="padding: 32px; background-color: ${light.surface}; border: 1px solid ${light.border}; border-radius: 12px;">
                <h1 class="texto" style="margin: 0 0 16px; font-family: ${EMAIL_FONTS.display}; font-size: 24px; line-height: 32px; font-weight: 800; color: ${light.foreground};">${escapeHtml(titulo)}</h1>
                ${parrafosHtml}
                ${accion ? renderBoton(accion) : ''}
                ${notaHtml}
              </td>
            </tr>
            <tr>
              <td class="secundario" style="padding: 24px 8px 0; font-family: ${EMAIL_FONTS.sans}; font-size: 12px; line-height: 18px; color: ${light.muted};">
                Recibiste este mail por un movimiento en tu cuenta de ${escapeHtml(APP_NAME)}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText({ titulo, parrafos, accion, nota }) {
  return [
    APP_NAME.toUpperCase(),
    titulo,
    ...parrafos,
    accion && `${accion.texto}: ${accion.url}`,
    nota,
    `Recibiste este mail por un movimiento en tu cuenta de ${APP_NAME}.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function renderEmail(contenido) {
  return { html: renderHtml(contenido), text: renderText(contenido) };
}
