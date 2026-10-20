import { useState } from 'react';
import { IconButton } from './IconButton.jsx';
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
        <IconButton
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      }
    />
  );
}
