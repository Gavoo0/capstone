import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { obtenerSesion, rutaPorRol } from "../services/sesion";
import Vehiculo from "../components/inicio/Vehiculo";
import { HORARIO, CURSOS, ETAPAS } from "../data/inicio";

// Validar RUT chileno con el dígito verificador (módulo 11)
// Acepta "12.345.678-5", "12345678-5" o "123456785"
const rutValido = (texto) => {
  // Quitar puntos y guion
  const limpio = texto.replace(/\./g, "").replace("-", "").trim().toUpperCase();
  if (limpio.length < 8) {
    return false;
  }

  // Separar el cuerpo del dígito verificador
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) {
    return false;
  }

  // Calcular la suma multiplicando de derecha a izquierda por 2, 3, 4, 5, 6, 7
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    if (multiplo === 7) {
      multiplo = 2;
    } else {
      multiplo = multiplo + 1;
    }
  }

  // Obtener el dígito verificador esperado
  const resto = 11 - (suma % 11);
  let dvEsperado = String(resto);
  if (resto === 11) {
    dvEsperado = "0";
  } else if (resto === 10) {
    dvEsperado = "K";
  }

  return dv === dvEsperado;
};

// Validar formato de correo (texto@texto.texto)
const correoValido = (texto) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim());
};

// Validar celular chileno: 9 dígitos que parten con 9 (los recordatorios llegan por WhatsApp)
const celularValido = (texto) => {
  let numeros = texto.replace(/\D/g, ""); // Dejar solo los números
  if (numeros.startsWith("56")) {
    numeros = numeros.slice(2); // Quitar el código de país
  }
  return /^9\d{8}$/.test(numeros);
};

function Inicio() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cursoActivo, setCursoActivo] = useState(0);
  const [sedes, setSedes] = useState([]);
  const [errorSedes, setErrorSedes] = useState("");

  // Campos del formulario de preinscripción
  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [idSede, setIdSede] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Alerta del formulario
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [tipoAlerta, setTipoAlerta] = useState("success");

  const curso = CURSOS[cursoActivo]; // Curso que se muestra en el carrusel

  // Revisar si hay sesión iniciada para mostrar "Mi panel" o "Iniciar sesión"
  const sesion = obtenerSesion();
  const rutaPanel = sesion ? rutaPorRol(sesion.NOMBRE_ROL) : null;
  const rutaAcceso = rutaPanel || "/iniciar-sesion";
  const textoAcceso = rutaPanel ? "Mi panel" : "Iniciar sesión";

  // Cargar las sedes al abrir la página
  useEffect(() => {
    const cargarSedes = async () => {
      try {
        const datos = await api.get("/sedes");

        // Formatear las sedes para usarlas en la página
        const sedesFormateadas = datos.map((s) => ({
          id: s.ID_SEDE,
          nombre: s.NOMBRE.replace(/^sede\s+/i, ""), // Quitar la palabra "Sede" del nombre
          direccion: s.DIRECCION,
          telefono: s.TELEFONO,
        }));
        setSedes(sedesFormateadas);
      } catch (error) {
        console.error("Error al cargar sedes:", error);
        setErrorSedes(error.message); // Mostrar el error en vez de dejar las sedes en blanco
      }
    };

    cargarSedes();
  }, []);

  const mostrarAlerta = (tipo, mensaje) => {
    setTipoAlerta(tipo);
    setMensajeAlerta(mensaje);
    setTimeout(() => setMensajeAlerta(null), 4000);
  };

  const cursoAnterior = () => {
    setCursoActivo((cursoActivo - 1 + CURSOS.length) % CURSOS.length);
  };

  const cursoSiguiente = () => {
    setCursoActivo((cursoActivo + 1) % CURSOS.length);
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  // Armar el link de Google Maps con la dirección de la sede
  const linkMapa = (direccion) => {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(direccion + ", Chile");
  };

  const limpiarFormulario = () => {
    setNombre("");
    setRut("");
    setCorreo("");
    setTelefono("");
    setIdSede("");
  };

  const enviarPreinscripcion = async (e) => {
    e.preventDefault();

    // Validar nombre
    if (nombre.trim() === "") {
      mostrarAlerta("danger", "Ingresa tu nombre completo.");
      return;
    }

    // Validar RUT
    if (!rutValido(rut)) {
      mostrarAlerta("danger", "El RUT no es válido. Revisa el número y el dígito verificador.");
      return;
    }

    // Validar correo
    if (!correoValido(correo)) {
      mostrarAlerta("danger", "Ingresa un correo válido, por ejemplo nombre@correo.cl.");
      return;
    }

    // Validar celular
    if (!celularValido(telefono)) {
      mostrarAlerta("danger", "Ingresa un celular de 9 dígitos, por ejemplo 912345678.");
      return;
    }

    // Validar sede
    if (idSede === "") {
      mostrarAlerta("danger", "Elige la sede donde quieres hacer tu curso.");
      return;
    }

    const preinscripcionFormateada = {
      nombre: nombre.trim(),
      rut: rut.trim(),
      correo: correo.trim(),
      telefono: telefono.trim(),
      idSede: Number(idSede),
    };

    setEnviando(true);
    try {
      await api.post("/preinscripciones", preinscripcionFormateada);
      mostrarAlerta("success", "¡Listo! Recibimos tu preinscripción. Te contactaremos para coordinar tu evaluación psicotécnica.");
      limpiarFormulario();
    } catch (error) {
      console.error("Error al enviar preinscripción:", error);
      mostrarAlerta("danger", error.message || "Error al enviar la preinscripción");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D]">
      <div className="h-2 w-full stripe-hazard" />

      {/* Encabezado con menú de navegación */}
      <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <a href="#inicio" className="flex items-center gap-3 font-display text-xl text-[#FAFAF8]">
            <img src="/logo/logo-nav.png" alt="" className="h-9 w-9 object-contain" />
            <span>
              Futuro <span className="text-[#FFC400]">·</span> Conductores
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8 font-body text-sm text-[#FAFAF8]/80">
            <a href="#cursos" className="hover:text-[#FFC400]">Cursos</a>
            <a href="#etapas" className="hover:text-[#FFC400]">Cómo funciona</a>
            <a href="#sedes" className="hover:text-[#FFC400]">Sedes</a>
            <a href="#contacto" className="hover:text-[#FFC400]">Contacto</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to={rutaAcceso} className="btn-contorno-claro btn-compacto">{textoAcceso}</Link>
            <a href="#contacto" className="btn-amarillo btn-compacto">Inscríbete</a>
          </div>

          <button onClick={() => setMenuAbierto(!menuAbierto)} className="lg:hidden text-[#FAFAF8] text-2xl" aria-label="Abrir menú">
            ☰
          </button>
        </div>

        {/* Menú para celular */}
        {menuAbierto && (
          <div className="lg:hidden bg-[#0D0D0D] border-t border-white/10 px-6 py-4 flex flex-col gap-4 font-body text-[#FAFAF8]/90">
            <a href="#cursos" onClick={cerrarMenu}>Cursos</a>
            <a href="#etapas" onClick={cerrarMenu}>Cómo funciona</a>
            <a href="#sedes" onClick={cerrarMenu}>Sedes</a>
            <a href="#contacto" onClick={cerrarMenu}>Contacto</a>
            <Link to={rutaAcceso} onClick={cerrarMenu}>{textoAcceso}</Link>
            <a href="#contacto" onClick={cerrarMenu} className="text-[#FFC400] font-semibold">Inscríbete</a>
          </div>
        )}
      </header>

      {/* Sección principal */}
      <section id="inicio" className="scroll-mt-20 bg-[#0D0D0D] text-[#FAFAF8] md:min-h-[calc(100vh-4.5rem)] flex flex-col">
        <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
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
            <img src="/logo/logo-completo.png" alt="Escuela de Manejo Futuro" className="w-48 md:w-56 h-auto" />
            <div className="panel-formacion w-full max-w-sm font-body">
              <p className="font-display text-base text-[#FFC400]">Lo que incluye tu formación</p>
              <ul className="mt-2 text-sm space-y-2">
                <li>Sedes en Macul y Peñalolén</li>
                <li>Cursos Clase B, A2, A3 y A4</li>
                <li>Psicotécnico, teoría y práctica</li>
                <li className="text-[#E31B23] font-semibold">Vehículos de instrucción propios</li>
                <li>Tarjeta de avance en línea</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Franja de pavimento */}
        <div className="relative h-14 md:h-16 bg-[#1E1E1B]">
          <div className="absolute inset-x-0 top-1/2 h-1.5 stripe-lane" />
          <div className="absolute inset-x-0 bottom-0 h-1.5 stripe-curb" />
        </div>
      </section>

      {/* Carrusel de cursos */}
      <section id="cursos" className="scroll-mt-20 bg-[#FFC400]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold">Un curso para cada licencia.</h2>
              <p className="font-body mt-3 text-[#0D0D0D]/70">Desde tu primera licencia particular hasta una profesional.</p>
            </div>
            <div className="flex gap-2">
              {CURSOS.map((c, i) => (
                <button key={c.clase} onClick={() => setCursoActivo(i)} aria-pressed={i === cursoActivo} className="chip-curso">
                  {c.clase.replace("Clase ", "")}
                </button>
              ))}
            </div>
          </div>

          <div key={cursoActivo} className="mt-8 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center">
            {/* Escenario con el vehículo animado */}
            <div className="escena">
              <div className="escena-sol" />
              <div className="escena-asfalto" />
              <div className="escena-carril stripe-lane" />
              <div className="escena-solera stripe-curb" />
              <div className="escena-vehiculo anim-drive">
                <Vehiculo tipo={curso.vehiculo} />
              </div>
              <span className={curso.tipo === "Profesional" ? "etiqueta-tipo etiqueta-profesional" : "etiqueta-tipo etiqueta-particular"}>
                {curso.tipo}
              </span>
            </div>

            {/* Información del curso */}
            <div className="anim-slide font-body">
              <h3 className="font-display text-5xl md:text-6xl font-bold leading-none">{curso.clase}</h3>
              <p className="font-display text-xl md:text-2xl mt-2">{curso.titulo}</p>
              <p className="mt-3 text-[#0D0D0D]/75 max-w-md">{curso.descripcion}</p>

              <p className="mt-5 text-sm font-semibold">Te habilita para</p>
              <ul className="mt-2 space-y-2">
                {curso.habilita.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="check-circulo text-[#FFC400] text-xs">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {curso.requisito && (
                <div className="mt-4 bg-[#0D0D0D] text-[#FAFAF8] rounded-sm px-4 py-3 text-sm max-w-md">
                  <span className="font-semibold text-[#E31B23]">Requisito: </span>
                  {curso.requisito}
                </div>
              )}

              {/* Duración por etapas (si el curso la tiene) */}
              {curso.etapas ? (
                <div className="mt-5 max-w-md">
                  <p className="text-sm"><span className="font-semibold">Duración:</span> {curso.duracion}</p>
                  <div className="barra-duracion mt-2">
                    {curso.etapas.map((e) => (
                      <div key={e.nombre} style={{ flexGrow: e.dias }} className={e.tono}>{e.dias}</div>
                    ))}
                  </div>
                  <ul className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1">
                    {curso.etapas.map((e) => (
                      <li key={e.nombre} className="flex items-center gap-2">
                        <span className={"muestra-tono " + e.tono} />
                        {e.dias} días de {e.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-5 text-sm max-w-md">
                  <span className="font-semibold">Duración y fechas:</span> consúltalas directamente con la escuela.
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a href="#contacto" className="btn-negro">Quiero la {curso.clase}</a>
                <div className="flex items-center gap-2">
                  <button onClick={cursoAnterior} aria-label="Curso anterior" className="btn-redondo">←</button>
                  <button onClick={cursoSiguiente} aria-label="Siguiente curso" className="btn-redondo">→</button>
                  <span className="font-display text-lg ml-2">{cursoActivo + 1} / {CURSOS.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="etapas" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-display text-3xl md:text-4xl font-bold max-w-lg">Tres etapas, una sola plataforma.</h2>
        <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
          Cada etapa queda registrada automáticamente en tu tarjeta de avance, sin importar en qué sede la rindas.
        </p>

        <div className="mt-14 grid md:grid-cols-3 gap-10">
          {ETAPAS.map((etapa) => (
            <div key={etapa.numero}>
              <span className="numero-etapa">{etapa.numero}</span>
              <h3 className="font-display text-xl mt-4">{etapa.titulo}</h3>
              <p className="font-body mt-2 text-[#0D0D0D]/60">{etapa.detalle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal del alumno */}
      <section id="alumno" className="scroll-mt-20 bg-[#0D0D0D] text-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Tu avance, siempre a la vista.</h2>
            <p className="font-body mt-4 text-[#FAFAF8]/70 max-w-md">
              El portal del alumno reemplaza la ficha de papel por una tarjeta de avance en línea: psicotécnico,
              asistencia a clases teóricas y horas prácticas agendadas, todo en un solo lugar, protegido con tu
              credencial QR.
            </p>
          </div>

          {/* Tarjeta de avance de ejemplo */}
          <div className="bg-[#FAFAF8] text-[#0D0D0D] rounded-md p-6 max-w-sm md:ml-auto font-body">
            <p className="text-xs text-[#0D0D0D]/50">Tarjeta de avance · ejemplo</p>
            <p className="font-display text-lg">Camila Rojas</p>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <div className="flex justify-between mb-1"><span>Psicotécnico</span><span className="text-[#0D0D0D]/50">Aprobado</span></div>
                <div className="h-1.5 bg-black/10 rounded-full"><div className="h-full w-full bg-[#FFC400] rounded-full" /></div>
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Clases teóricas</span><span className="text-[#0D0D0D]/50">8 / 10</span></div>
                <div className="h-1.5 bg-black/10 rounded-full"><div className="h-full w-4/5 bg-[#FFC400] rounded-full" /></div>
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Prácticas de manejo</span><span className="text-[#0D0D0D]/50">3 / 12</span></div>
                <div className="h-1.5 bg-black/10 rounded-full"><div className="h-full w-1/4 bg-[#E31B23] rounded-full" /></div>
              </div>
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

        {errorSedes && <p className="font-body mt-6 text-[#E31B23] font-semibold">{errorSedes}</p>}

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {sedes.map((sede) => (
            <article key={sede.id} className="tarjeta-sede font-body">
              <div>
                <h3 className="font-display text-2xl">Sede {sede.nombre}</h3>
                <p className="mt-1 text-[#0D0D0D]/70">{sede.direccion}</p>
                {sede.telefono && <p className="text-sm text-[#0D0D0D]/70">Tel. {sede.telefono}</p>}
                <p className="mt-4 text-sm font-semibold">Horario de atención</p>
                <p className="text-sm text-[#0D0D0D]/70">{HORARIO}</p>
                <a href={linkMapa(sede.direccion)} target="_blank" rel="noreferrer" className="enlace-subrayado inline-block mt-5 text-sm">
                  Cómo llegar
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Formulario de preinscripción */}
      <section id="contacto" className="scroll-mt-20 bg-[#FFC400]">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Empieza tu proceso hoy.</h2>
            <p className="font-body mt-4 text-[#0D0D0D]/70 max-w-sm">
              Completa tus datos y te contactamos para coordinar tu evaluación psicotécnica en la sede que prefieras.
            </p>
          </div>

          <form onSubmit={enviarPreinscripcion} noValidate className="bg-[#FAFAF8] rounded-md p-6 space-y-4">
            <div>
              <label htmlFor="nombre" className="campo-etiqueta">Nombre completo</label>
              <input id="nombre" type="text" className="campo" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label htmlFor="rut" className="campo-etiqueta">RUT</label>
              <input id="rut" type="text" className="campo" placeholder="12.345.678-5" value={rut} onChange={(e) => setRut(e.target.value)} />
            </div>
            <div>
              <label htmlFor="correo" className="campo-etiqueta">Correo</label>
              <input id="correo" type="email" className="campo" placeholder="tucorreo@ejemplo.cl" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            </div>
            <div>
              <label htmlFor="telefono" className="campo-etiqueta">Celular (WhatsApp)</label>
              <input id="telefono" type="tel" className="campo" placeholder="912345678" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div>
              <label htmlFor="sede" className="campo-etiqueta">Sede preferida</label>
              <select id="sede" className="campo" value={idSede} onChange={(e) => setIdSede(e.target.value)}>
                <option value="">Elige una sede</option>
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                ))}
              </select>
            </div>

            {/* Alerta de éxito o error */}
            {mensajeAlerta && (
              <p role="status" className={tipoAlerta === "danger" ? "text-sm font-semibold text-[#E31B23]" : "aviso-info"}>
                {mensajeAlerta}
              </p>
            )}

            <button type="submit" disabled={enviando} className="btn-negro w-full disabled:opacity-60">
              {enviando ? "Enviando..." : "Enviar preinscripción"}
            </button>
          </form>
        </div>
      </section>

      {/* Pie de página */}
      <footer className="bg-[#0D0D0D] text-[#FAFAF8]/70">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 font-body text-sm">
          <div>
            <p className="font-display text-lg text-[#FAFAF8]">Futuro · Conductores</p>
            <p className="mt-2">Formación para conductores en la Región Metropolitana.</p>
          </div>
          <div>
            <p className="text-[#FAFAF8] font-semibold mb-2">Sedes</p>
            {sedes.map((sede) => (
              <p key={sede.id}>{sede.nombre} — {sede.direccion}</p>
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

export default Inicio;