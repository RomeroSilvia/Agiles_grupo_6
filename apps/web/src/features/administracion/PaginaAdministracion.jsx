import { Outlet, useMatches } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { TabsNav } from '../../components/ui/TabsNav.jsx';
import { APP_NAME } from '../../config/app.config.js';
import { PESTANAS_ADMIN, TITULO_PANEL_ADMIN } from './administracion.constants.js';

export function PaginaAdministracion() {
  const pestanaActiva = useMatches().findLast(({ handle }) => handle?.pestanaAdmin)?.handle
    .pestanaAdmin;

  return (
    <section className="space-y-6">
      <PageHeader
        titulo={TITULO_PANEL_ADMIN}
        descripcion={
          pestanaActiva && (
            <>
              {pestanaActiva.descripcionAntesDeApp} <span className="uppercase">{APP_NAME}</span>
            </>
          )
        }
      />
      <TabsNav label={TITULO_PANEL_ADMIN} tabs={PESTANAS_ADMIN} />
      <Outlet />
    </section>
  );
}
