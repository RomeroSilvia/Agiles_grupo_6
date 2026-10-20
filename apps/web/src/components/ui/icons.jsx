import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleAlert,
  Eye,
  EyeOff,
  Key,
  LoaderCircle,
  Mail,
  Menu,
  Moon,
  Search,
  Sun,
  Trash,
  X,
} from 'lucide-react';

/*
 * Íconos de lucide-react (licencia ISC). Heredan el color del texto.
 * Son decorativos: el texto o el aria-label del elemento que los contiene da el significado.
 * Este es el único archivo que importa lucide-react; el resto de la app usa estos exports.
 */

const DEFAULT_ICON_CLASS_NAME = 'size-5';

function createIcon(LucideIcon, baseClassName = '') {
  function Icono({ className = DEFAULT_ICON_CLASS_NAME, ...props }) {
    return (
      <LucideIcon
        aria-hidden="true"
        focusable="false"
        className={`${baseClassName} ${className}`.trim()}
        {...props}
      />
    );
  }
  Icono.displayName = `${LucideIcon.displayName ?? ''}Icon`;
  return Icono;
}

export const EyeIcon = createIcon(Eye);
export const EyeOffIcon = createIcon(EyeOff);
export const CheckIcon = createIcon(Check);
export const BookmarkIcon = createIcon(Bookmark);
export const CircleIcon = createIcon(Circle);
export const AlertIcon = createIcon(CircleAlert);
export const SunIcon = createIcon(Sun);
export const MoonIcon = createIcon(Moon);
export const MenuIcon = createIcon(Menu);
export const XIcon = createIcon(X);
export const SpinnerIcon = createIcon(LoaderCircle, 'animate-spin');
export const SearchIcon = createIcon(Search);
export const ChevronDownIcon = createIcon(ChevronDown);
export const ChevronRightIcon = createIcon(ChevronRight);
export const MailIcon = createIcon(Mail);
export const KeyIcon = createIcon(Key);
export const TrashIcon = createIcon(Trash);
