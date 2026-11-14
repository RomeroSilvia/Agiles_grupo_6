import { useSearchParams } from 'react-router';
import { SegmentedControl } from '../../components/ui/SegmentedControl.jsx';
import { ListaCarteleraActual } from './ListaCarteleraActual.jsx';
import { ListaProximosEstrenos } from './ListaProximosEstrenos.jsx';
import { SelectorCiudadCine } from './SelectorCiudadCine.jsx';

export function PaginaCartelera() {
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista') === 'estrenos' ? 'estrenos' : 'cartelera';
  return (
    <div className="space-y-7">
      <SelectorCiudadCine />
      <SegmentedControl
        legend="Catálogo de cine en Argentina"
        name="vista-cartelera"
        value={vista}
        options={[
          { value: 'cartelera', label: 'En cartelera' },
          { value: 'estrenos', label: 'Próximos estrenos' },
        ]}
        onChange={(event) =>
          setParams((actuales) => {
            const siguientes = new URLSearchParams(actuales);
            siguientes.set('vista', event.target.value);
            return siguientes;
          })
        }
      />
      {vista === 'estrenos' ? <ListaProximosEstrenos /> : <ListaCarteleraActual />}
    </div>
  );
}
