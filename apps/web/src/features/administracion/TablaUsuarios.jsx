import { Avatar } from '../../components/ui/Avatar.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { formatearFechaCorta } from '../../utils/formatearFecha.js';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { ETIQUETAS_ESTADO_USUARIO, VARIANTES_ESTADO_USUARIO } from './administracion.constants.js';

const COLUMNAS = ['Mail', 'Región', 'Plataformas', 'Watchlist', 'Registro', 'Estado'];

const CELDA_CLASS_NAME = 'lg:px-5 lg:py-3.5 lg:align-middle';

function textoTitulos(cantidad) {
  return `${cantidad} ${cantidad === 1 ? 'título' : 'títulos'}`;
}

function PlataformasUsuario({ plataformas, email }) {
  if (plataformas.length === 0) {
    return <span className="text-muted">—</span>;
  }

  return (
    <ul aria-label={`Plataformas de ${email}`} className="flex flex-wrap gap-1.5">
      {plataformas.map((plataforma) => (
        <li key={plataforma.id}>
          <LogoPlataforma plataforma={plataforma} size="small" />
        </li>
      ))}
    </ul>
  );
}

function FilaUsuario({ usuario, plataformasPorId }) {
  const { email, region, plataformaIds, titulosWatchlist, creadoEn, estado } = usuario;
  const plataformas = plataformaIds.map((id) => plataformasPorId.get(id)).filter(Boolean);
  const fechaRegistro = formatearFechaCorta(creadoEn);

  return (
    <tr className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-3 rounded-card border border-border bg-surface p-4 lg:table-row lg:rounded-none lg:border-0 lg:border-t lg:bg-transparent lg:p-0">
      <th scope="row" className={`${CELDA_CLASS_NAME} col-span-3 text-left font-normal`}>
        <span className="flex items-center gap-3">
          <Avatar email={email} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{email}</span>
            <span className="block text-sm text-muted lg:hidden">Registro: {fechaRegistro}</span>
          </span>
        </span>
      </th>
      <td className={CELDA_CLASS_NAME}>
        {region ? <Chip>{region}</Chip> : <span className="text-muted">—</span>}
      </td>
      <td className={`${CELDA_CLASS_NAME} order-last col-span-3`}>
        <PlataformasUsuario plataformas={plataformas} email={email} />
      </td>
      <td className={`${CELDA_CLASS_NAME} order-1 justify-self-end font-mono text-sm`}>
        {textoTitulos(titulosWatchlist)}
      </td>
      <td className={`${CELDA_CLASS_NAME} hidden text-sm text-muted lg:table-cell`}>
        <time dateTime={creadoEn}>{fechaRegistro}</time>
      </td>
      <td className={CELDA_CLASS_NAME}>
        <Chip variant={VARIANTES_ESTADO_USUARIO[estado]}>{ETIQUETAS_ESTADO_USUARIO[estado]}</Chip>
      </td>
    </tr>
  );
}

export function TablaUsuarios({ usuarios, plataformasPorId }) {
  return (
    <div className="lg:overflow-hidden lg:rounded-card lg:border lg:border-border lg:bg-surface">
      <table aria-label="Usuarios registrados" className="block w-full text-sm lg:table">
        <thead className="sr-only lg:not-sr-only">
          <tr className="bg-background text-left font-mono text-xs text-muted uppercase">
            {COLUMNAS.map((columna) => (
              <th key={columna} scope="col" className={`${CELDA_CLASS_NAME} font-medium`}>
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="grid gap-3 lg:table-row-group">
          {usuarios.map((usuario) => (
            <FilaUsuario key={usuario.id} usuario={usuario} plataformasPorId={plataformasPorId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
