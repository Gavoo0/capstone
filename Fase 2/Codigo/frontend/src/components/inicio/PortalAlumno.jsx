const AVANCE = [
  { nombre: "Psicotécnico", valor: "Aprobado", ancho: "100%", color: "bg-[#FFC400]" },
  { nombre: "Clases teóricas", valor: "8 / 10", ancho: "80%", color: "bg-[#FFC400]" },
  { nombre: "Prácticas de manejo", valor: "3 / 12", ancho: "25%", color: "bg-[#E31B23]" },
];

export default function PortalAlumno() {
  return (
    <section id="alumno" className="scroll-mt-20 bg-[#0D0D0D] text-[#FAFAF8]">
      <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Tu avance, siempre a la vista.</h2>
          <p className="font-body mt-4 text-[#FAFAF8]/70 max-w-md">
            El portal del alumno reemplaza la ficha de papel por una tarjeta de avance en línea: psicotécnico,
            asistencia a clases teóricas y horas prácticas agendadas, todo en un solo lugar, protegido con tu
            credencial QR.
          </p>
          <ul className="font-body mt-6 space-y-2 text-sm text-[#FAFAF8]/70">
            <li>· Resultado del examen psicotécnico</li>
            <li>· Asistencia a bloques teóricos</li>
            <li>· Próximas horas prácticas agendadas</li>
          </ul>
        </div>

        <div className="bg-[#FAFAF8] text-[#0D0D0D] rounded-md p-6 max-w-sm md:ml-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs text-[#0D0D0D]/50">Tarjeta de avance · ejemplo</p>
              <p className="font-display text-lg">Camila Rojas</p>
            </div>
            <div className="w-10 h-10 rounded-sm bg-[#0D0D0D] grid place-items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" fill="#FFC400" />
                <rect x="14" y="3" width="7" height="7" fill="#FFC400" />
                <rect x="3" y="14" width="7" height="7" fill="#FFC400" />
                <rect x="14" y="14" width="3" height="3" fill="#FFC400" />
                <rect x="18" y="18" width="3" height="3" fill="#FFC400" />
              </svg>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {AVANCE.map((a) => (
              <div key={a.nombre}>
                <div className="flex justify-between font-body text-sm mb-1">
                  <span>{a.nombre}</span>
                  <span className="text-[#0D0D0D]/50">{a.valor}</span>
                </div>
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className={`h-full ${a.color}`} style={{ width: a.ancho }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-black/10 font-body text-sm">
            <p className="text-[#0D0D0D]/50">Próxima clase práctica</p>
            <p className="font-semibold">Jue 02 oct · 10:00 · Sede Macul</p>
          </div>
        </div>
      </div>
    </section>
  );
}
