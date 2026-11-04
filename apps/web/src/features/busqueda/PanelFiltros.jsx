import { ANIO_MAXIMO, ANIO_MINIMO, ROL_PERSONA, TIPOS_TITULO } from '@buscador/shared/constants';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SegmentedControl } from '../../components/ui/SegmentedControl.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { FIELD_LABEL_CLASS_NAME } from '../../components/ui/fieldClassName.js';
import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';
import { SelectorPersona } from './SelectorPersona.jsx';

const OPCIONES_TIPO = [
  { value: '', label: 'Todos' },
  ...TIPOS_TITULO.map((tipo) => ({ value: tipo, label: ETIQUETAS_TIPO_TITULO[tipo] })),
];

function textoOpcionGenero({ isLoading, cargados }) {
  if (isLoading) {
    return 'Cargando géneros...';
  }
  return cargados ? 'Todos los géneros' : 'Seleccioná para cargar géneros';
}

export function PanelFiltros({
  id,
  abierto,
  filtros,
  errorAnio,
  generos,
  isLoading,
  onChange,
  onCambiarPersona,
  onCambiarNombrePersona,
  onErrorPersona,
}) {
  return (
    <Card id={id} hidden={!abierto} padding="lg" className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <SegmentedControl
            legend="Tipo"
            name="tipo"
            value={filtros.tipo}
            options={OPCIONES_TIPO}
            onChange={onChange}
          />
        </div>

        <TextField
          id="anio"
          label="Año"
          name="anio"
          type="number"
          min={ANIO_MINIMO}
          max={ANIO_MAXIMO}
          value={filtros.anio}
          onChange={onChange}
          placeholder="Cualquier año"
          error={errorAnio}
        />

        <div className="space-y-1.5">
          <label htmlFor="genero" className={FIELD_LABEL_CLASS_NAME}>
            Género
          </label>
          <Select
            id="genero"
            name="genero"
            value={filtros.genero}
            onChange={onChange}
            onFocus={generos.cargar}
            aria-busy={generos.isLoading}
            disabled={Boolean(generos.error)}
          >
            <option value="">{textoOpcionGenero(generos)}</option>
            {generos.lista.map((genero) => (
              <option key={genero.id} value={genero.id}>
                {genero.nombre}
              </option>
            ))}
          </Select>
          {generos.error && <Alert onRetry={generos.reintentar}>{generos.error}</Alert>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <SelectorPersona
          rol={ROL_PERSONA.ACTOR}
          etiqueta="Actor"
          persona={filtros.actor ? { id: filtros.actor, nombre: filtros.actorNombre } : null}
          consulta={filtros.actorNombre}
          onConsultaChange={(consulta) => onCambiarPersona(ROL_PERSONA.ACTOR, null, consulta)}
          onSeleccionar={(persona) => onCambiarPersona(ROL_PERSONA.ACTOR, persona)}
          onNombreCargado={(personaId, nombre) =>
            onCambiarNombrePersona(ROL_PERSONA.ACTOR, personaId, nombre)
          }
          onErrorPersona={onErrorPersona}
        />
        <SelectorPersona
          rol={ROL_PERSONA.DIRECTOR}
          etiqueta="Director"
          persona={
            filtros.director ? { id: filtros.director, nombre: filtros.directorNombre } : null
          }
          consulta={filtros.directorNombre}
          onConsultaChange={(consulta) => onCambiarPersona(ROL_PERSONA.DIRECTOR, null, consulta)}
          onSeleccionar={(persona) => onCambiarPersona(ROL_PERSONA.DIRECTOR, persona)}
          onNombreCargado={(personaId, nombre) =>
            onCambiarNombrePersona(ROL_PERSONA.DIRECTOR, personaId, nombre)
          }
          onErrorPersona={onErrorPersona}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" size="compact" fullWidth={false} disabled={isLoading}>
          Aplicar filtros
        </Button>
      </div>
    </Card>
  );
}
