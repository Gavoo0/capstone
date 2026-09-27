import { useState } from "react";

/**
 * Página de inicio — Escuela de Conductores Futuro
 * Paleta de marca: negro y amarillo (identidad de la escuela), rojo y blanco (flota de vehículos)
 *
 * Para integrarlo en tu proyecto (Vite + Tailwind):
 * 1. Guarda este archivo como src/pages/Inicio.jsx (reemplaza el actual).
 * 2. No necesitas tocar tailwind.config.js: los colores van como valores arbitrarios (bg-[#...]),
 *    así el archivo funciona igual sin importar la config que ya tengas.
 * 3. Las tipografías (Kanit y Manrope) se cargan con un <style> embebido más abajo.
 *    Si luego quieres cargarlas una sola vez para todo el sitio, mueve el @import a tu index.css
 *    y borra el bloque <style> de aquí.
 */

const SEDES = [
  {
    nombre: "Macul",
    direccion: "Av. Macul 1234, Macul",
    horario: "Lun a Vie 9:00–19:00 · Sáb 9:00–14:00",
  },
  {
    nombre: "Peñalolén",
    direccion: "Av. Tobalaba 5678, Peñalolén",
    horario: "Lun a Vie 9:00–19:00 · Sáb 9:00–14:00",
  },
];

const CURSOS = [
  {
    clase: "Clase B",
    tipo: "Particular",
    descripcion: "Autos y camionetas de uso personal: la licencia más solicitada y la puerta de entrada a las demás categorías.",
    duracion: "Duración estimada: 4 a 6 semanas",
  },
  {
    clase: "Clase A2",
    tipo: "Profesional",
    descripcion: "Ambulancias y vehículos de transporte de pasajeros de capacidad limitada: hasta 17 asientos, ampliable a 32 después de dos años.",
    duracion: "Duración estimada: 6 a 8 semanas",
  },
  {
    clase: "Clase A3",
    tipo: "Profesional",
    descripcion: "Transporte de pasajeros sin límite de capacidad, incluidos buses.",
    duracion: "Duración estimada: 6 a 8 semanas",
    requisito: "Requiere Clase A1 o A2 con al menos dos años de experiencia.",
  },
  {
    clase: "Clase A4",
    tipo: "Profesional",
    descripcion: "Camiones simples de hasta 3,5 toneladas de capacidad de carga.",
    duracion: "Duración estimada: 6 a 8 semanas",
  },
];

const ETAPAS = [
  {
    numero: "01",
    titulo: "Evaluación psicotécnica",
    detalle:
      "Rinde tu examen psicosensotécnico en cualquiera de nuestras dos sedes, sin fichas de papel que se puedan traspapelar.",
  },
  {
    numero: "02",
    titulo: "Clases teóricas",
    detalle:
      "Asiste a los bloques teóricos y revisa tu asistencia y tus notas desde tu propia tarjeta de avance, en línea.",
  },
  {
    numero: "03",
    titulo: "Prácticas de manejo",
    detalle:
      "Agenda tus horas al volante según la disponibilidad real de la flota e instructores, sin choques de horario.",
  },
];

export default function Inicio() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sedeActiva, setSedeActiva] = useState(0);
  const [cursoActivo, setCursoActivo] = useState(0);

  const cursoAnterior = () => setCursoActivo((i) => (i - 1 + CURSOS.length) % CURSOS.length);
  const cursoSiguiente = () => setCursoActivo((i) => (i + 1) % CURSOS.length);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Kanit', 'Arial Narrow', sans-serif; }
        .font-body { font-family: 'Manrope', system-ui, sans-serif; }
      `}</style>

      {/* Franja de peligro — único lugar donde se repite este patrón */}
      <div className="h-2 w-full bg-[repeating-linear-gradient(135deg,#FFC400_0,#FFC400_18px,#0D0D0D_18px,#0D0D0D_36px)]" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <a href="#inicio" className="font-display text-xl text-[#FAFAF8]">
            Futuro <span className="text-[#FFC400]">·</span> Conductores
          </a>

          <nav className="hidden md:flex items-center gap-8 font-body text-sm text-[#FAFAF8]/80">
            <a href="#cursos" className="hover:text-[#FFC400] transition-colors">Cursos</a>
            <a href="#etapas" className="hover:text-[#FFC400] transition-colors">Cómo funciona</a>
            <a href="#sedes" className="hover:text-[#FFC400] transition-colors">Sedes</a>
            <a href="#contacto" className="hover:text-[#FFC400] transition-colors">Contacto</a>
            <a href="#alumno" className="hover:text-[#FFC400] transition-colors">Portal del alumno</a>
          </nav>

          <a
            href="#contacto"
            className="hidden md:inline-flex items-center rounded-sm bg-[#FFC400] text-[#0D0D0D] font-body font-semibold text-sm px-4 py-2 hover:bg-[#E6B000] transition-colors"
          >
            Inscríbete
          </a>

          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="md:hidden text-[#FAFAF8]"
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {menuAbierto && (
          <div className="md:hidden bg-[#0D0D0D] border-t border-white/10 px-6 py-4 flex flex-col gap-4 font-body text-[#FAFAF8]/90">
            <a href="#cursos" onClick={() => setMenuAbierto(false)}>Cursos</a>
            <a href="#etapas" onClick={() => setMenuAbierto(false)}>Cómo funciona</a>
            <a href="#sedes" onClick={() => setMenuAbierto(false)}>Sedes</a>
            <a href="#contacto" onClick={() => setMenuAbierto(false)}>Contacto</a>
            <a href="#alumno" onClick={() => setMenuAbierto(false)}>Portal del alumno</a>
            <a href="#contacto" onClick={() => setMenuAbierto(false)} className="text-[#FFC400] font-semibold">
              Inscríbete
            </a>
          </div>
        )}
      </header>

      {/* Hero: una escena, no una plantilla — un letrero real parado sobre pavimento */}
      <section id="inicio" className="relative bg-[#0D0D0D] text-[#FAFAF8] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-16 grid md:grid-cols-[1.15fr_0.85fr] gap-12 items-end">
          <div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1.05] font-bold">
              Aprende a manejar y saca la licencia que necesitas.
            </h1>
            <p className="font-body mt-6 text-lg text-[#FAFAF8]/70 max-w-md">
              Curso particular Clase B o profesional A2, A3 y A4: evaluación psicotécnica, clases teóricas
              y prácticas de manejo en Macul y Peñalolén, con cupos reales de nuestra flota.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="rounded-sm bg-[#FFC400] text-[#0D0D0D] font-body font-semibold px-6 py-3 hover:bg-[#E6B000] transition-colors"
              >
                Inscríbete
              </a>
              <a
                href="#cursos"
                className="rounded-sm border border-white/30 font-body font-semibold px-6 py-3 hover:border-[#FFC400] hover:text-[#FFC400] transition-colors"
              >
                Ver cursos
              </a>
            </div>
          </div>

          {/* Letrero "L" parado sobre su poste, con la placa de datos colgando debajo */}
          <div className="flex flex-col items-center md:items-end">
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-2xl bg-[#FFC400] border-[3px] border-[#0D0D0D] flex items-center justify-center rotate-[-5deg] shadow-[0_18px_30px_-10px_rgba(0,0,0,0.6)]">
              <span className="font-display text-6xl text-[#0D0D0D] leading-none">L</span>
            </div>
            <div className="-mt-1 rotate-[-2deg] bg-[#0D0D0D] border-2 border-[#FFC400] rounded-md px-4 py-3 w-56 font-body text-xs shadow-[0_14px_24px_-10px_rgba(0,0,0,0.6)]">
              <p className="text-[#FFC400] font-semibold text-[11px]">Escuela de Conductores Futuro</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between border-t border-white/10 pt-1.5">
                  <span className="text-[#FAFAF8]/60">Sedes</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FAFAF8]/60">Flota activa</span>
                  <span className="font-semibold text-[#E31B23]">1–2 vehículos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#FAFAF8]/60">Avance</span>
                  <span className="font-semibold">100% en línea</span>
                </div>
              </div>
            </div>
            <div className="w-1.5 h-14 bg-[#FAFAF8]/15 mt-1" aria-hidden="true" />
          </div>
        </div>

        {/* Franja de pavimento: línea de carril y solera pintada, como en las calles de Santiago */}
        <div className="relative h-14 md:h-16 bg-[#1E1E1B]">
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5"
            style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFC400 0 28px, transparent 28px 56px)" }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-1.5"
            style={{ backgroundImage: "repeating-linear-gradient(90deg,#E31B23 0 16px,#FAFAF8 16px 32px)" }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Cursos: no es solo Clase B — particular y profesional, en carrusel */}
      <section id="cursos" className="bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="font-display text-3xl md:text-4xl font-bold max-w-lg">Un curso para cada licencia.</h2>
          <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
            Desde tu primera licencia particular hasta una categoría profesional, en las mismas dos sedes.
          </p>

          <div className="mt-12 relative max-w-2xl mx-auto">
            <button
              onClick={cursoAnterior}
              aria-label="Curso anterior"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-[#0D0D0D] text-[#FAFAF8] grid place-items-center hover:bg-[#1E1E1B] transition-colors z-10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="border border-black/10 rounded-md p-8 text-center">
              <span
                className={`inline-block font-body text-xs font-semibold px-3 py-1 rounded-full ${
                  CURSOS[cursoActivo].tipo === "Profesional" ? "bg-[#E31B23] text-[#FAFAF8]" : "bg-[#FFC400] text-[#0D0D0D]"
                }`}
              >
                {CURSOS[cursoActivo].tipo}
              </span>
              <h3 className="font-display text-3xl mt-4">{CURSOS[cursoActivo].clase}</h3>
              <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-sm mx-auto">{CURSOS[cursoActivo].descripcion}</p>
              <p className="font-body mt-2 text-sm text-[#0D0D0D]/40">{CURSOS[cursoActivo].duracion}</p>
              {CURSOS[cursoActivo].requisito && (
                <p className="font-body mt-1 text-sm text-[#E31B23]">{CURSOS[cursoActivo].requisito}</p>
              )}
              <a
                href="#contacto"
                className="inline-flex mt-6 rounded-sm bg-[#0D0D0D] text-[#FAFAF8] font-body font-semibold px-5 py-2.5 hover:bg-[#1E1E1B] transition-colors"
              >
                Quiero este curso
              </a>
            </div>

            <button
              onClick={cursoSiguiente}
              aria-label="Siguiente curso"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-[#0D0D0D] text-[#FAFAF8] grid place-items-center hover:bg-[#1E1E1B] transition-colors z-10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {CURSOS.map((c, i) => (
              <button
                key={c.clase}
                onClick={() => setCursoActivo(i)}
                aria-label={`Ver ${c.clase}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === cursoActivo ? "bg-[#0D0D0D]" : "bg-black/15"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="etapas" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold max-w-lg">
          Tres etapas, una sola plataforma.
        </h2>
        <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
          Cada etapa queda registrada automáticamente en tu tarjeta de avance, sin importar en qué sede la rindas.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-10">
          {ETAPAS.map((etapa, i) => (
            <div key={etapa.numero} className="relative pl-2">
              <span className="font-display text-6xl text-[#FFC400]" style={{ WebkitTextStroke: "1.5px #0D0D0D" }}>
                {etapa.numero}
              </span>
              <h3 className="font-display text-xl mt-4">{etapa.titulo}</h3>
              <p className="font-body mt-2 text-[#0D0D0D]/60">{etapa.detalle}</p>
              {i < ETAPAS.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 -right-5 w-10 h-0.5"
                  style={{ backgroundImage: "repeating-linear-gradient(90deg,#0D0D0D 0 6px,transparent 6px 12px)" }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Portal del alumno — mockup de la tarjeta de avance */}
      <section id="alumno" className="bg-[#0D0D0D] text-[#FAFAF8]">
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
                <p className="font-body text-xs text-[#0D0D0D]/50">Tarjeta de avance</p>
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
              <div>
                <div className="flex justify-between font-body text-sm mb-1">
                  <span>Psicotécnico</span>
                  <span className="text-[#0D0D0D]/50">Aprobado</span>
                </div>
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-[#FFC400]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-body text-sm mb-1">
                  <span>Clases teóricas</span>
                  <span className="text-[#0D0D0D]/50">8 / 10</span>
                </div>
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 bg-[#FFC400]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-body text-sm mb-1">
                  <span>Prácticas de manejo</span>
                  <span className="text-[#0D0D0D]/50">3 / 12</span>
                </div>
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-[#E31B23]" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/10 font-body text-sm">
              <p className="text-[#0D0D0D]/50">Próxima clase práctica</p>
              <p className="font-semibold">Jue 02 oct · 10:00 · Sede Macul</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sedes */}
      <section id="sedes" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Dos sedes, un solo registro.</h2>
        <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
          Rinde clases y evaluaciones en la sede que te acomode: tu avance viaja contigo.
        </p>

        <div className="mt-10 flex gap-2">
          {SEDES.map((sede, i) => (
            <button
              key={sede.nombre}
              onClick={() => setSedeActiva(i)}
              className={`font-body text-sm font-semibold px-4 py-2 rounded-sm border transition-colors ${
                sedeActiva === i
                  ? "bg-[#0D0D0D] text-[#FAFAF8] border-[#0D0D0D]"
                  : "border-black/15 text-[#0D0D0D]/60 hover:border-black/40"
              }`}
            >
              {sede.nombre}
            </button>
          ))}
        </div>

        <div className="mt-6 border border-black/10 rounded-md p-8 grid md:grid-cols-[auto_1fr] gap-6 items-center max-w-2xl">
          <div className="w-14 h-14 rounded-full bg-[#E31B23] grid place-items-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"
                stroke="#FAFAF8"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="9.5" r="2.3" fill="#FAFAF8" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-xl">Sede {SEDES[sedeActiva].nombre}</h3>
            <p className="font-body text-[#0D0D0D]/60 mt-1">{SEDES[sedeActiva].direccion}</p>
            <p className="font-body text-[#0D0D0D]/60">{SEDES[sedeActiva].horario}</p>
          </div>
        </div>
      </section>

      {/* Contacto / preinscripción */}
      <section id="contacto" className="bg-[#FFC400]">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0D0D0D]">
              Empieza tu proceso hoy.
            </h2>
            <p className="font-body mt-4 text-[#0D0D0D]/70 max-w-sm">
              Completa tus datos y te contactamos para coordinar tu evaluación psicotécnica en la sede
              que prefieras.
            </p>
          </div>

          <form className="bg-[#FAFAF8] rounded-md p-6 space-y-4">
            <div>
              <label className="font-body text-sm text-[#0D0D0D]/70">Nombre completo</label>
              <input
                type="text"
                className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#0D0D0D]"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="font-body text-sm text-[#0D0D0D]/70">Correo o teléfono</label>
              <input
                type="text"
                className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#0D0D0D]"
                placeholder="tucorreo@ejemplo.cl"
              />
            </div>
            <div>
              <label className="font-body text-sm text-[#0D0D0D]/70">Sede preferida</label>
              <select className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#0D0D0D]">
                <option>Macul</option>
                <option>Peñalolén</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-sm bg-[#0D0D0D] text-[#FAFAF8] font-body font-semibold py-3 hover:bg-[#1A1A18] transition-colors"
            >
              Enviar preinscripción
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] text-[#FAFAF8]/70">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 font-body text-sm">
          <div>
            <p className="font-display text-lg text-[#FAFAF8]">Futuro · Conductores</p>
            <p className="mt-2">Formación para conductores en la Región Metropolitana.</p>
          </div>
          <div>
            <p className="text-[#FAFAF8] font-semibold mb-2">Sedes</p>
            {SEDES.map((s) => (
              <p key={s.nombre}>{s.nombre} — {s.direccion}</p>
            ))}
          </div>
          <div>
            <p className="text-[#FAFAF8] font-semibold mb-2">Enlaces</p>
            <p><a href="#cursos" className="hover:text-[#FFC400]">Cursos</a></p>
            <p><a href="#etapas" className="hover:text-[#FFC400]">Cómo funciona</a></p>
            <p><a href="#alumno" className="hover:text-[#FFC400]">Portal del alumno</a></p>
            <p><a href="#contacto" className="hover:text-[#FFC400]">Contacto</a></p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-[repeating-linear-gradient(135deg,#FFC400_0,#FFC400_14px,#E31B23_14px,#E31B23_28px)]" />
      </footer>
    </div>
  );
}
