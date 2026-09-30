import { useTheme } from '../../contexts/theme/ThemeContext.js';
import { MoonIcon, SunIcon } from './icons.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-border/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
