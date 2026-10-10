import logo from '../../assets/logo-s.svg';

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={logo} alt="" className="h-7 w-auto shrink-0" />
      <span className="font-display text-xl font-extrabold tracking-tight">STREAMLY</span>
    </span>
  );
}
