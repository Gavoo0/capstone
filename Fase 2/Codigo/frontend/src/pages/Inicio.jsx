import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Página de inicio — Escuela de Conductores Futuro
 * Paleta de marca: negro y amarillo (identidad de la escuela), rojo y blanco (flota de vehículos)
 *
 * Para integrarlo en tu proyecto (Vite + Tailwind):
 * 1. Guarda este archivo como src/pages/Inicio.jsx (reemplaza el actual).
 * 2. No necesitas tocar tailwind.config.js: los colores van como valores arbitrarios (bg-[#...]),
 *    así el archivo funciona igual sin importar la config que ya tengas.
 * 3. Las fuentes (Kanit/Manrope), las animaciones (.anim-drive, .anim-slide) y los patrones
 *    decorativos (.stripe-hazard, .stripe-lane, .stripe-curb, .stripe-connector) están en
 *    src/styles/brand.css, para reutilizarlos en el resto de las páginas. Impórtalo una sola
 *    vez en src/main.jsx, después de './index.css'.
 */

const SEDES = [
  {
    nombre: "Macul",
    direccion: "Av. Macul 4186, Macul",
    horarios: [{ dias: "Lunes a viernes", horas: "9:40 a 13:00 y 15:00 a 20:20" }],
    mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Macul+4186%2C+Macul%2C+Chile",
  },
  {
    nombre: "Peñalolén",
    direccion: "Av. Grecia 5566, Peñalolén",
    horarios: [{ dias: "Lunes a viernes", horas: "9:40 a 13:00 y 15:00 a 20:20" }],
    mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Grecia+5566%2C+Pe%C3%B1alol%C3%A9n%2C+Chile",
  },
];

const CURSOS = [
  {
    clase: "Clase B",
    tipo: "Particular",
    titulo: "Autos y camionetas",
    descripcion: "La licencia básica y la más solicitada: el punto de partida para conducir tu propio vehículo.",
    habilita: ["Autos y camionetas de uso particular"],
    duracion: "25 días si vas de corrido",
    etapas: [
      { nombre: "psicotécnico", dias: 3, fondo: "bg-[#0D0D0D]", texto: "text-[#FFC400]" },
      { nombre: "clases teóricas", dias: 8, fondo: "bg-[#FAFAF8]", texto: "text-[#0D0D0D]" },
      { nombre: "práctica de manejo", dias: 14, fondo: "bg-[#E31B23]", texto: "text-[#FAFAF8]" },
    ],
    vehiculo: "auto",
  },
  {
    clase: "Clase A2",
    tipo: "Profesional",
    titulo: "Ambulancias y transporte de pasajeros",
    descripcion: "Primer paso profesional para trabajar transportando personas en vehículos de capacidad limitada.",
    habilita: [
      "Ambulancias",
      "Transporte de pasajeros de hasta 17 asientos",
      "Hasta 32 asientos después de dos años",
    ],
    vehiculo: "van",
  },
  {
    clase: "Clase A3",
    tipo: "Profesional",
    titulo: "Buses y transporte sin límite",
    descripcion: "Transporte de pasajeros sin restricción de capacidad, además de los vehículos de las clases anteriores.",
    habilita: ["Transporte de pasajeros sin límite de capacidad", "Buses de cualquier número de asientos"],
    requisito: "Licencia A1 o A2 con al menos dos años de experiencia.",
    vehiculo: "bus",
  },
  {
    clase: "Clase A4",
    tipo: "Profesional",
    titulo: "Transporte de carga",
    descripcion: "Para quienes quieren trabajar conduciendo camiones de carga.",
    habilita: ["Camiones simples de hasta 3,5 toneladas", "Transporte de carga profesional"],
    vehiculo: "camion",
  },
];

/**
 * Ilustraciones planas de cada vehículo (paleta de marca).
 * Para usar fotos reales más adelante: agrega `imagen: "/cursos/clase-b.jpg"` a un curso
 * y en el escenario del carrusel muestra <img> cuando exista, en vez de <Vehiculo />.
 */
function Vehiculo({ tipo }) {
  const rueda = (cx) => (
    <g>
      <circle cx={cx} cy="176" r="28" fill="#0D0D0D" />
      <circle cx={cx} cy="176" r="14" fill="#D9D9D3" />
      <circle cx={cx} cy="176" r="5" fill="#0D0D0D" />
    </g>
  );
  const texto = { fontFamily: "Kanit, sans-serif", fontWeight: 800, textAnchor: "middle", fill: "#0D0D0D" };

  return (
    <svg viewBox="0 0 520 230" className="w-full h-auto" role="img" aria-label={`Vehículo de práctica ${tipo}`}>
      {tipo === "auto" && (
        <g strokeLinejoin="round">
          <rect x="226" y="70" width="68" height="18" rx="3" fill="#FFC400" stroke="#0D0D0D" strokeWidth="3" />
          <text x="260" y="84" fontSize="11" {...texto}>ESCUELA</text>
          <path d="M56 172 L56 152 Q56 140 72 136 L134 128 L182 92 Q190 86 202 86 L318 86 Q332 86 341 94 L384 128 L446 136 Q464 140 464 156 L464 172 Z" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          <path d="M196 100 L250 100 L250 126 L164 126 Z" fill="#0D0D0D" />
          <path d="M260 100 L316 100 L352 126 L260 126 Z" fill="#0D0D0D" />
          <path d="M255 100 L255 168" stroke="#0D0D0D" strokeWidth="3" />
          <rect x="58" y="158" width="404" height="7" fill="#E31B23" />
          <text x="304" y="151" fontSize="16" {...texto}>FUTURO</text>
          <rect x="446" y="142" width="16" height="8" rx="2" fill="#FFC400" />
          <rect x="56" y="142" width="10" height="12" rx="2" fill="#E31B23" />
          {rueda(140)}
          {rueda(384)}
        </g>
      )}

      {tipo === "van" && (
        <g strokeLinejoin="round">
          <rect x="118" y="70" width="76" height="14" rx="3" fill="#E31B23" stroke="#0D0D0D" strokeWidth="3" />
          <path d="M52 172 L52 96 Q52 84 64 84 L338 84 L410 128 L452 136 Q466 140 466 154 L466 172 Z" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          <path d="M346 98 L386 98 L408 124 L346 124 Z" fill="#0D0D0D" />
          <rect x="72" y="98" width="52" height="34" rx="3" fill="#0D0D0D" />
          <rect x="176" y="98" width="22" height="46" fill="#E31B23" />
          <rect x="164" y="110" width="46" height="22" fill="#E31B23" />
          <rect x="54" y="148" width="410" height="9" fill="#E31B23" />
          <rect x="452" y="142" width="14" height="8" rx="2" fill="#FFC400" />
          {rueda(126)}
          {rueda(396)}
        </g>
      )}

      {tipo === "bus" && (
        <g strokeLinejoin="round">
          <rect x="28" y="66" width="464" height="106" rx="16" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={54 + i * 62} y="82" width="50" height="36" rx="4" fill="#0D0D0D" />
          ))}
          <rect x="420" y="82" width="36" height="88" rx="3" fill="#0D0D0D" />
          <line x1="438" y1="82" x2="438" y2="170" stroke="#FAFAF8" strokeWidth="2" />
          <rect x="462" y="82" width="26" height="54" rx="4" fill="#0D0D0D" />
          <rect x="32" y="130" width="384" height="10" fill="#FFC400" />
          <rect x="32" y="142" width="384" height="6" fill="#E31B23" />
          <rect x="484" y="148" width="8" height="10" rx="2" fill="#FFC400" />
          {rueda(116)}
          {rueda(400)}
        </g>
      )}

      {tipo === "camion" && (
        <g strokeLinejoin="round">
          <defs>
            <pattern id="hz-a4" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="12" height="24" fill="#FFC400" />
              <rect x="12" width="12" height="24" fill="#0D0D0D" />
            </pattern>
          </defs>
          <rect x="36" y="58" width="272" height="114" rx="6" fill="#FFC400" stroke="#0D0D0D" strokeWidth="4" />
          <rect x="38" y="152" width="268" height="18" fill="url(#hz-a4)" />
          <text x="172" y="120" fontSize="34" {...texto}>FUTURO</text>
          <path d="M316 172 L316 84 Q316 76 324 76 L384 76 L424 124 L452 130 Q466 134 466 150 L466 172 Z" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          <path d="M328 90 L378 90 L410 124 L328 124 Z" fill="#0D0D0D" />
          <rect x="318" y="146" width="146" height="8" fill="#E31B23" />
          <rect x="452" y="138" width="14" height="8" rx="2" fill="#FFC400" />
          <rect x="36" y="170" width="430" height="8" fill="#0D0D0D" />
          {rueda(110)}
          {rueda(390)}
        </g>
      )}
    </svg>
  );
}

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
  const [cursoActivo, setCursoActivo] = useState(0);

  const cursoAnterior = () => setCursoActivo((i) => (i - 1 + CURSOS.length) % CURSOS.length);
  const cursoSiguiente = () => setCursoActivo((i) => (i + 1) % CURSOS.length);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D]">
      {/* Franja de peligro — único lugar donde se repite este patrón */}
      <div className="h-2 w-full stripe-hazard" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <a href="#inicio" className="flex items-center gap-3 font-display text-xl text-[#FAFAF8]">
            <img src="/logo/logo-nav.png" alt="" className="h-9 w-9 object-contain" />
            <span>
              Futuro <span className="text-[#FFC400]">·</span> Conductores
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8 font-body text-sm text-[#FAFAF8]/80">
            <a href="#cursos" className="hover:text-[#FFC400] transition-colors">Cursos</a>
            <a href="#etapas" className="hover:text-[#FFC400] transition-colors">Cómo funciona</a>
            <a href="#sedes" className="hover:text-[#FFC400] transition-colors">Sedes</a>
            <a href="#contacto" className="hover:text-[#FFC400] transition-colors">Contacto</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/iniciar-sesion"
              className="inline-flex items-center gap-2 rounded-sm border border-white/30 text-[#FAFAF8] font-body font-semibold text-sm px-4 py-2 hover:border-[#FFC400] hover:text-[#FFC400] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Iniciar sesión
            </Link>
            <a
              href="#contacto"
              className="inline-flex items-center rounded-sm bg-[#FFC400] text-[#0D0D0D] font-body font-semibold text-sm px-4 py-2 hover:bg-[#E6B000] transition-colors"
            >
              Inscríbete
            </a>
          </div>

          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="lg:hidden text-[#FAFAF8]"
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {menuAbierto && (
          <div className="lg:hidden bg-[#0D0D0D] border-t border-white/10 px-6 py-4 flex flex-col gap-4 font-body text-[#FAFAF8]/90">
            <a href="#cursos" onClick={() => setMenuAbierto(false)}>Cursos</a>
            <a href="#etapas" onClick={() => setMenuAbierto(false)}>Cómo funciona</a>
            <a href="#sedes" onClick={() => setMenuAbierto(false)}>Sedes</a>
            <a href="#contacto" onClick={() => setMenuAbierto(false)}>Contacto</a>
            <Link to="/iniciar-sesion" onClick={() => setMenuAbierto(false)}>Iniciar sesión</Link>
            <a href="#contacto" onClick={() => setMenuAbierto(false)} className="text-[#FFC400] font-semibold">
              Inscríbete
            </a>
          </div>
        )}
      </header>

      {/* Hero: una escena, no una plantilla — un letrero real parado sobre pavimento */}
      <section id="inicio" className="scroll-mt-20 relative bg-[#0D0D0D] text-[#FAFAF8] overflow-hidden md:min-h-[calc(100vh-4.5rem)] flex flex-col">
        <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-10 grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
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

          {/* Emblema de la escuela + panel con lo que incluye la formación */}
          <div className="flex flex-col items-center md:items-end gap-5">
            <img
              src="/logo/logo-completo.png"
              alt="Escuela de Manejo Futuro"
              className="w-48 md:w-56 h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)]"
            />
            <div className="w-full max-w-sm bg-[#0D0D0D] border-2 border-[#FFC400] rounded-md px-6 py-5 font-body">
              <p className="font-display text-base text-[#FFC400]">Lo que incluye tu formación</p>
              <dl className="mt-2 text-sm divide-y divide-white/10">
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#FAFAF8]/60">Sedes</dt>
                  <dd className="font-semibold text-right">Macul y Peñalolén</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#FAFAF8]/60">Cursos</dt>
                  <dd className="font-semibold text-right">Clase B, A2, A3 y A4</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#FAFAF8]/60">Etapas</dt>
                  <dd className="font-semibold text-right">Psicotécnico, teoría y práctica</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#FAFAF8]/60">Flota</dt>
                  <dd className="font-semibold text-right text-[#E31B23]">Vehículos de instrucción propios</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#FAFAF8]/60">Seguimiento</dt>
                  <dd className="font-semibold text-right">Tarjeta de avance en línea</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Franja de pavimento: línea de carril y solera pintada, como en las calles de Santiago */}
        <div className="relative h-14 md:h-16 bg-[#1E1E1B]">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 stripe-lane" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-1.5 stripe-curb" aria-hidden="true" />
        </div>
      </section>

      {/* Cursos: carrusel a ancho completo — vehículo a la izquierda, información a la derecha */}
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
                  onClick={() => setCursoActivo(i)}
                  aria-pressed={i === cursoActivo}
                  aria-label={`Ver ${c.clase}`}
                  className={`font-display text-lg px-4 py-2 rounded-sm border-2 border-[#0D0D0D] transition-colors ${
                    i === cursoActivo ? "bg-[#0D0D0D] text-[#FFC400]" : "hover:bg-[#0D0D0D]/10"
                  }`}
                >
                  {c.clase.replace("Clase ", "")}
                </button>
              ))}
            </div>
          </div>

          <div key={cursoActivo} className="mt-6 md:mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12 items-center">
            {/* Escenario: el vehículo llega manejando sobre el pavimento */}
            <div className="relative rounded-md overflow-hidden bg-[#141412] aspect-[16/10] shadow-[0_24px_40px_-18px_rgba(0,0,0,0.55)]">
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[24%] translate-y-1/2 w-[72%] aspect-square rounded-full bg-[#FFC400]" />
              <div className="absolute inset-x-0 bottom-0 h-[24%] bg-[#1E1E1B]" />
              <div className="absolute inset-x-0 bottom-[8%] h-1.5 stripe-lane" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 h-1.5 stripe-curb" aria-hidden="true" />
              <div className="absolute inset-x-[4%] bottom-[13%] anim-drive">
                <Vehiculo tipo={CURSOS[cursoActivo].vehiculo} />
              </div>
              <span
                className={`absolute top-4 left-4 font-body text-xs font-semibold px-3 py-1 rounded-full ${
                  CURSOS[cursoActivo].tipo === "Profesional" ? "bg-[#E31B23] text-[#FAFAF8]" : "bg-[#FAFAF8] text-[#0D0D0D]"
                }`}
              >
                {CURSOS[cursoActivo].tipo}
              </span>
            </div>

            {/* Información de la licencia */}
            <div className="anim-slide">
              <h3 className="font-display text-5xl md:text-6xl font-bold leading-none">{CURSOS[cursoActivo].clase}</h3>
              <p className="font-display text-xl md:text-2xl mt-2">{CURSOS[cursoActivo].titulo}</p>
              <p className="font-body mt-3 text-[#0D0D0D]/75 max-w-md">{CURSOS[cursoActivo].descripcion}</p>

              <p className="font-body mt-5 text-sm font-semibold">Te habilita para</p>
              <ul className="font-body mt-2 space-y-2">
                {CURSOS[cursoActivo].habilita.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#0D0D0D] grid place-items-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFC400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {CURSOS[cursoActivo].requisito && (
                <div className="mt-4 bg-[#0D0D0D] text-[#FAFAF8] rounded-sm px-4 py-3 font-body text-sm max-w-md">
                  <span className="font-semibold text-[#E31B23]">Requisito: </span>
                  {CURSOS[cursoActivo].requisito}
                </div>
              )}

              {CURSOS[cursoActivo].etapas ? (
                <div className="mt-5 max-w-md font-body">
                  <p className="text-sm">
                    <span className="font-semibold">Duración:</span> {CURSOS[cursoActivo].duracion}
                  </p>
                  <div className="mt-2 flex h-9 rounded-sm overflow-hidden border-2 border-[#0D0D0D]">
                    {CURSOS[cursoActivo].etapas.map((e) => (
                      <div
                        key={e.nombre}
                        style={{ flexGrow: e.dias }}
                        className={`basis-0 grid place-items-center font-display text-sm ${e.fondo} ${e.texto}`}
                      >
                        {e.dias}
                      </div>
                    ))}
                  </div>
                  <ul className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
                    {CURSOS[cursoActivo].etapas.map((e) => (
                      <li key={e.nombre} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-sm border border-[#0D0D0D] ${e.fondo}`} />
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
                <a
                  href="#contacto"
                  className="rounded-sm bg-[#0D0D0D] text-[#FAFAF8] font-body font-semibold px-6 py-3 hover:bg-[#1E1E1B] transition-colors"
                >
                  Quiero la {CURSOS[cursoActivo].clase}
                </a>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cursoAnterior}
                    aria-label="Curso anterior"
                    className="w-11 h-11 rounded-full border-2 border-[#0D0D0D] grid place-items-center hover:bg-[#0D0D0D] hover:text-[#FFC400] transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={cursoSiguiente}
                    aria-label="Siguiente curso"
                    className="w-11 h-11 rounded-full border-2 border-[#0D0D0D] grid place-items-center hover:bg-[#0D0D0D] hover:text-[#FFC400] transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="font-display text-lg ml-2">
                    {String(cursoActivo + 1).padStart(2, "0")} / {String(CURSOS.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="etapas" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-24">
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
                  className="hidden md:block absolute top-8 -right-5 w-10 h-0.5 stripe-connector"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Portal del alumno — mockup de la tarjeta de avance */}
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
      <section id="sedes" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Dos sedes, un solo registro.</h2>
        <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
          Rinde clases y evaluaciones en la sede que te acomode: tu avance viaja contigo.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {SEDES.map((sede) => (
            <article key={sede.nombre} className="border border-black/10 rounded-md p-8 flex gap-5">
              <div className="w-14 h-14 rounded-full bg-[#E31B23] grid place-items-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" stroke="#FAFAF8" strokeWidth="1.6" />
                  <circle cx="12" cy="9.5" r="2.3" fill="#FAFAF8" />
                </svg>
              </div>
              <div className="font-body">
                <h3 className="font-display text-2xl">Sede {sede.nombre}</h3>
                <p className="mt-1 text-[#0D0D0D]/70">{sede.direccion}</p>
                <div className="mt-4 text-sm">
                  <p className="font-semibold">Horario de atención</p>
                  {sede.horarios.map((h) => (
                    <p key={h.dias} className="text-[#0D0D0D]/70">
                      {h.dias}: {h.horas}
                    </p>
                  ))}
                </div>
                <a
                  href={sede.mapa}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex mt-5 text-sm font-semibold underline decoration-[#FFC400] decoration-2 underline-offset-4 hover:decoration-[#E31B23]"
                >
                  Cómo llegar
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Contacto / preinscripción */}
      <section id="contacto" className="scroll-mt-20 bg-[#FFC400]">
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
        <div className="h-1.5 w-full stripe-hazard" />
      </footer>
    </div>
  );
}
