import { useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { TrashIcon } from '../../components/ui/icons.jsx';
import { SECCIONES_CUENTA } from '../../app/rutas.js';
import { DialogoEliminarCuenta } from './DialogoEliminarCuenta.jsx';
import { TarjetaCuenta } from './TarjetaCuenta.jsx';

export function SeccionEliminarCuenta() {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <TarjetaCuenta
      id={SECCIONES_CUENTA.ELIMINAR}
      titulo="Eliminar cuenta"
      descripcion="Se borran tu cuenta y tus datos, y se cierra tu sesión. Si más adelante te registrás con el mismo mail, se crea una cuenta nueva."
      peligro
    >
      <Button variant="outlineDanger" fullWidth={false} onClick={() => setConfirmando(true)}>
        <TrashIcon className="size-4" />
        Eliminar mi cuenta
      </Button>

      {confirmando && <DialogoEliminarCuenta onCancelar={() => setConfirmando(false)} />}
    </TarjetaCuenta>
  );
}
