export default function Sedes({ sedes }) {
  return (
    <section id="sedes" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-24">
      <h2 className="font-display text-3xl md:text-4xl font-bold">Dos sedes, un solo registro.</h2>
      <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
        Rinde clases y evaluaciones en la sede que te acomode: tu avance viaja contigo.
      </p>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {sedes.map((sede) => (
          <article key={sede.id} className="tarjeta-sede">
            <div className="w-14 h-14 rounded-full bg-[#E31B23] grid place-items-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="#FAFAF8" strokeWidth="1.6" />
                <circle cx="12" cy="9.5" r="2.3" fill="#FAFAF8" />
              </svg>
            </div>
            <div className="font-body">
              <h3 className="font-display text-2xl">Sede {sede.nombre}</h3>
              <p className="mt-1 text-[#0D0D0D]/70">{sede.direccion}</p>
              {sede.telefono && <p className="text-sm text-[#0D0D0D]/70">Tel. {sede.telefono}</p>}
              <div className="mt-4 text-sm">
                <p className="font-semibold">Horario de atención</p>
                {sede.horarios.map((h) => (
                  <p key={h.dias} className="text-[#0D0D0D]/70">
                    {h.dias}: {h.horas}
                  </p>
                ))}
              </div>
              <a href={sede.mapa} target="_blank" rel="noreferrer" className="enlace-subrayado inline-flex mt-5 text-sm">
                Cómo llegar
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
