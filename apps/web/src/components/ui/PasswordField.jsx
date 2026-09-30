import { useState } from 'react';
import { TextField } from './TextField.jsx';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/** Campo de contraseña con botón para mostrar u ocultar lo que se escribe. */
export function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
