import { ListaPlataformas } from '../plataformas/ListaPlataformas.jsx';
import { DESCRIPCION_MIS_PLATAFORMAS } from '../plataformas/plataformas.constants.js';
import { SeccionPlegable } from '../../components/ui/SeccionPlegable.jsx';
import { AccionesCuenta } from './AccionesCuenta.jsx';
import { TarjetaIdentidad } from './TarjetaIdentidad.jsx';

export function PaginaPerfil() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Mi perfil</h1>

      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:gap-8">
        <TarjetaIdentidad className="lg:col-start-1 lg:row-start-1" />

        <SeccionPlegable
          titulo="Mis plataformas"
          resumen="Elegí las que tenés contratadas"
          descripcion={DESCRIPCION_MIS_PLATAFORMAS}
          className="lg:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <ListaPlataformas />
        </SeccionPlegable>

        <SeccionPlegable
          titulo="Cuenta"
          resumen="Mail, contraseña y eliminar cuenta"
          className="lg:col-start-1 lg:row-start-2 lg:self-start"
        >
          <AccionesCuenta />
        </SeccionPlegable>
      </div>
    </section>
  );
}
