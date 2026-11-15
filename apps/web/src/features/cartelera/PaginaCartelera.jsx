import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { ResultadoCard } from '../busqueda/ResultadoCard.jsx';
import { CardsCargando, GrillaResultados } from '../busqueda/ResultadosBusqueda.jsx';
import { formatearFechaCivil } from '../../utils/formatearFecha.js';
import { useCartelera } from './useCartelera.js';

function contenidoFecha(pelicula) {
  if (!pelicula.fechaEstrenoAr) {
    return 'Fecha de estreno en Argentina no informada';
  }

  return (
    <time dateTime={pelicula.fechaEstrenoAr}>
      Estreno en Argentina: {formatearFechaCivil(pelicula.fechaEstrenoAr)}
    </time>
  );
}
import { useSearchParams } from 'react-router';
import { SegmentedControl } from '../../components/ui/SegmentedControl.jsx';
import { ListaCarteleraActual } from './ListaCarteleraActual.jsx';
import { ListaProximosEstrenos } from './ListaProximosEstrenos.jsx';

export function PaginaCartelera() {
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista') === 'estrenos' ? 'estrenos' : 'cartelera';
  return (
    <div className="space-y-7">
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
