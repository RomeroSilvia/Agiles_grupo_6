export function MensajeAside({ titulo, texto }) {
  return (
    <>
      <p className="text-5xl leading-[1.05] font-extrabold tracking-tight text-balance xl:text-6xl">
        {titulo}
      </p>
      <p className="mt-6 text-lg leading-relaxed text-panel-muted">{texto}</p>
    </>
  );
}
