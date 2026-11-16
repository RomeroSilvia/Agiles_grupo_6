import { useId, useState } from 'react';
import { SegmentedControl } from '../../components/ui/SegmentedControl.jsx';
import { FUENTE_RANKING, OPCIONES_FUENTE_RANKING } from './administracion.constants.js';
import { TarjetaRanking } from './TarjetaRanking.jsx';

export function RankingPorFuente({ ranking, porFuente, className, children }) {
  const nombreControl = useId();
  const [fuente, setFuente] = useState(FUENTE_RANKING.WATCHLIST);

  return (
    <TarjetaRanking
      titulo={ranking.titulo}
      descripcion={ranking.descripciones[fuente]}
      className={className}
      control={
        <SegmentedControl
          legend={`Datos del ranking de ${ranking.titulo.toLowerCase()}`}
          legendHidden
          size="sm"
          name={nombreControl}
          value={fuente}
          options={OPCIONES_FUENTE_RANKING}
          onChange={(evento) => setFuente(evento.target.value)}
        />
      }
    >
      {children(porFuente[fuente])}
    </TarjetaRanking>
  );
}
