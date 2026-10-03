import { useTheme } from '../../contexts/theme/ThemeContext.js';
import { MoonIcon, SunIcon } from './icons.jsx';
import { IconButton } from './IconButton.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
