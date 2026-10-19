import { useState } from "react";
import { CURSOS } from "../../data/inicio";
import Vehiculo from "./Vehiculo";

const Flecha = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d={d} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Check = () => (
  <span className="check-circulo">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFC400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

export default function CarruselCursos() {
  const [activo, setActivo] = useState(0);
  const curso = CURSOS[activo];
  const anterior = () => setActivo((i) => (i - 1 + CURSOS.length) % CURSOS.length);
  const siguiente = () => setActivo((i) => (i + 1) % CURSOS.length);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section id="cursos" className="scroll-mt-20 bg-[#FFC400] text-[#0D0D0D]">
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Un curso para cada licencia.</h2>
            <p className="font-body mt-3 text-[#0D0D0D]/70 max-w-md">
              Desde tu primera licencia particular hasta una profesional.
            </p>
          </div>
          <div className="flex gap-2">
            {CURSOS.map((c, i) => (
              <button
                key={c.clase}
                onClick={() => setActivo(i)}
                aria-pressed={i === activo}
                aria-label={`Ver ${c.clase}`}
                className="chip-curso"
              >
                {c.clase.replace("Clase ", "")}
              </button>
            ))}
          </div>
        </div>

        <div key={activo} className="mt-6 md:mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12 items-center">
          <div className="escena">
            <div className="escena-sol" />
            <div className="escena-asfalto" />
            <div className="escena-carril stripe-lane" aria-hidden="true" />
            <div className="escena-solera stripe-curb" aria-hidden="true" />
            <div className="escena-vehiculo anim-drive">
              <Vehiculo tipo={curso.vehiculo} />
            </div>
            <span className={`etiqueta-tipo ${curso.tipo === "Profesional" ? "etiqueta-profesional" : "etiqueta-particular"}`}>
              {curso.tipo}
            </span>
          </div>

          <div className="anim-slide">
            <h3 className="font-display text-5xl md:text-6xl font-bold leading-none">{curso.clase}</h3>
            <p className="font-display text-xl md:text-2xl mt-2">{curso.titulo}</p>
            <p className="font-body mt-3 text-[#0D0D0D]/75 max-w-md">{curso.descripcion}</p>

            <p className="font-body mt-5 text-sm font-semibold">Te habilita para</p>
            <ul className="font-body mt-2 space-y-2">
              {curso.habilita.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {curso.requisito && (
              <div className="mt-4 bg-[#0D0D0D] text-[#FAFAF8] rounded-sm px-4 py-3 font-body text-sm max-w-md">
                <span className="font-semibold text-[#E31B23]">Requisito: </span>
                {curso.requisito}
              </div>
            )}

            {curso.etapas ? (
              <div className="mt-5 max-w-md font-body">
                <p className="text-sm">
                  <span className="font-semibold">Duración:</span> {curso.duracion}
                </p>
                <div className="barra-duracion mt-2">
                  {curso.etapas.map((e) => (
                    <div key={e.nombre} style={{ flexGrow: e.dias }} className={`tono-${e.tono}`}>
                      {e.dias}
                    </div>
                  ))}
                </div>
                <ul className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
                  {curso.etapas.map((e) => (
                    <li key={e.nombre} className="flex items-center gap-2">
                      <span className={`muestra-tono tono-${e.tono}`} />
                      {e.dias} días de {e.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-body mt-5 text-sm max-w-md">
                <span className="font-semibold">Duración y fechas:</span> consúltalas directamente con la escuela.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a href="#contacto" className="btn-negro">Quiero la {curso.clase}</a>
              <div className="flex items-center gap-2">
                <button onClick={anterior} aria-label="Curso anterior" className="btn-redondo">
                  <Flecha d="M15 6l-6 6 6 6" />
                </button>
                <button onClick={siguiente} aria-label="Siguiente curso" className="btn-redondo">
                  <Flecha d="M9 6l6 6-6 6" />
                </button>
                <span className="font-display text-lg ml-2">
                  {pad(activo + 1)} / {pad(CURSOS.length)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
