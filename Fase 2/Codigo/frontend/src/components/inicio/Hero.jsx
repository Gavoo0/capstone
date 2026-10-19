const INCLUYE = [
  ["Sedes", "Macul y Peñalolén"],
  ["Cursos", "Clase B, A2, A3 y A4"],
  ["Etapas", "Psicotécnico, teoría y práctica"],
  ["Flota", "Vehículos de instrucción propios", true],
  ["Seguimiento", "Tarjeta de avance en línea"],
];

export default function Hero() {
  return (
    <section
      id="inicio"
      className="scroll-mt-20 relative bg-[#0D0D0D] text-[#FAFAF8] overflow-hidden md:min-h-[calc(100vh-4.5rem)] flex flex-col"
    >
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-10 grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] font-bold">
            Aprende a manejar y saca la licencia que necesitas.
          </h1>
          <p className="font-body mt-6 text-lg text-[#FAFAF8]/70 max-w-md">
            Curso particular Clase B o profesional A2, A3 y A4: evaluación psicotécnica, clases teóricas y prácticas de
            manejo en Macul y Peñalolén, con cupos reales de nuestra flota.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#contacto" className="btn-amarillo">Inscríbete</a>
            <a href="#cursos" className="btn-contorno-claro">Ver cursos</a>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-5">
          <img
            src="/logo/logo-completo.png"
            alt="Escuela de Manejo Futuro"
            className="w-48 md:w-56 h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
          />
          <div className="panel-formacion w-full max-w-sm font-body">
            <p className="font-display text-base text-[#FFC400]">Lo que incluye tu formación</p>
            <dl className="mt-2 text-sm divide-y divide-white/10">
              {INCLUYE.map(([etiqueta, valor, resaltar]) => (
                <div key={etiqueta} className="flex justify-between gap-4 py-2">
                  <dt className="text-[#FAFAF8]/60">{etiqueta}</dt>
                  <dd className={`font-semibold text-right ${resaltar ? "text-[#E31B23]" : ""}`}>{valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Franja de pavimento: línea de carril y solera pintada */}
      <div className="relative h-14 md:h-16 bg-[#1E1E1B]">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 stripe-lane" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-1.5 stripe-curb" aria-hidden="true" />
      </div>
    </section>
  );
}
