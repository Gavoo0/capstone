import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { obtenerSesion } from "../services/sesion";
import { fetchProgreso, obtenerEtiquetaPsicotecnico, ASISTENCIA_MINIMA } from "../services/alumnoService";
import { fetchClases, confirmarClase, cancelarClase, estaConfirmada, obtenerEtiquetaClase } from "../services/claseService";
import { fetchAsistenciasAlumno } from "../services/asistenciaService";
import { fetchEvaluacionesAlumno, formatearNota } from "../services/evaluacionService";
import { fechaParaInput, fechaHoy, formatearFecha, formatearFechaLarga, formatearDiaCorto } from "../utils/fechas";
import { HORAS_PRACTICAS_REQUERIDAS } from "../data/agenda";
import useAlerta from "../hooks/useAlerta";
import BarraPanel from "../components/panel/BarraPanel";
import AlertaFlotante from "../components/panel/AlertaFlotante";
import EtiquetaEstado from "../components/panel/EtiquetaEstado";

// Pestañas de la tarjeta web
const PESTANAS = [
  { id: "resumen", titulo: "Mi avance" },
  { id: "historial", titulo: "Historial de clases" },
  { id: "evaluaciones", titulo: "Mis evaluaciones" },
];

// Obtener las iniciales del nombre para el avatar (ej: "Camila Rojas" -> "CR")
const obtenerIniciales = (nombre, apellido) => {
  return `${(nombre || " ")[0]}${(apellido || " ")[0]}`.trim().toUpperCase();
};

// Color de la barra de progreso: amarillo desde la mitad, rojo si va atrasado
const obtenerColorProgreso = (progreso) => {
  if (progreso >= 0.5) {
    return "#FFC400";
  } else {
    return "#E31B23";
  }
};

function DashboardAlumno() {
  const sesion = obtenerSesion();
  const idAlumno = sesion.ID_USUARIO;
  const { mensajeAlerta, tipoAlerta, mostrarAlerta } = useAlerta();

  const [tab, setTab] = useState("resumen");

  // Datos de la API
  const [progreso, setProgreso] = useState(null);
  const [clases, setClases] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Acciones sobre las clases
  const [idCancelando, setIdCancelando] = useState(null); // Clase que se está por cancelar
  const [procesando, setProcesando] = useState(false);

  // Cargar ficha, clases, asistencias y notas del alumno
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosProgreso, datosClases, datosAsistencias, datosEvaluaciones] = await Promise.all([
          fetchProgreso(idAlumno),
          fetchClases({ idAlumno }),
          fetchAsistenciasAlumno(idAlumno),
          fetchEvaluacionesAlumno(idAlumno),
        ]);
        setProgreso(datosProgreso);
        setClases(datosClases);
        setAsistencias(datosAsistencias);
        setEvaluaciones(datosEvaluaciones);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar la tarjeta del alumno:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [idAlumno, recargar]);

  const handleConfirmar = async (clase) => {
    setProcesando(true);
    try {
      await confirmarClase(clase.ID_CLASE);
      mostrarAlerta("success", "¡Listo! Confirmaste tu asistencia");
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al confirmar clase:", error);
      mostrarAlerta("danger", error.message || "Error al confirmar la clase");
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async (clase) => {
    setProcesando(true);
    try {
      await cancelarClase(clase.ID_CLASE, "Cancelada por el alumno");
      mostrarAlerta("success", "Clase cancelada: el cupo quedó libre para otro alumno");
      setIdCancelando(null);
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al cancelar clase:", error);
      mostrarAlerta("danger", error.message || "Error al cancelar la clase");
    } finally {
      setProcesando(false);
    }
  };

  // Mientras carga o si falla se muestra un aviso dentro del mismo diseño
  if (cargando || errorCarga || !progreso) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D] flex flex-col">
        <BarraPanel etiqueta="ALUMNO" sesion={sesion} />
        <main className="max-w-6xl w-full mx-auto px-6 py-16 font-body">
          {cargando ? (
            <p className="text-[#0D0D0D]/50">Cargando tu tarjeta de avance...</p>
          ) : (
            <p className="text-[#E31B23] font-semibold">{errorCarga || "No encontramos tu ficha de alumno. Contacta a la administración."}</p>
          )}
        </main>
      </div>
    );
  }

  const alumno = progreso.alumno;
  const hoy = fechaHoy();

  // Etapa 1: psicotécnico
  const psicotecnicoAprobado = String(alumno.ESTADO_PSICOTECNICO || "").toUpperCase() === "APROBADO";
  const etiquetaPsicotecnico = obtenerEtiquetaPsicotecnico(alumno.ESTADO_PSICOTECNICO);

  // Etapa 2: clases teóricas
  const porcentajeAsistencia = parseFloat(alumno.PORCENTAJE_ASISTENCIA_TEORICA) || 0;
  const bloquesPresentes = asistencias.filter((a) => String(a.ESTADO).toUpperCase() === "PRESENTE").length;

  // Etapa 3: prácticas de manejo
  const practicasRealizadas = clases.filter((c) => c.ESTADO === "REALIZADA").length;
  const horasRestantes = Math.max(HORAS_PRACTICAS_REQUERIDAS - practicasRealizadas, 0);

  const etapas = [
    {
      titulo: "Evaluación psicotécnica",
      estado: etiquetaPsicotecnico.texto,
      progreso: psicotecnicoAprobado ? 1 : 0,
    },
    {
      titulo: "Clases teóricas",
      estado: `${porcentajeAsistencia.toFixed(0)}% de asistencia (${bloquesPresentes} de ${asistencias.length} bloques)`,
      progreso: porcentajeAsistencia / 100,
    },
    {
      titulo: "Prácticas de manejo",
      estado: `${practicasRealizadas} de ${HORAS_PRACTICAS_REQUERIDAS} clases`,
      progreso: Math.min(practicasRealizadas / HORAS_PRACTICAS_REQUERIDAS, 1),
    },
  ];

  // Etapa en la que va el alumno
  let etapaActual = "Curso completado";
  if (!psicotecnicoAprobado) {
    etapaActual = "Evaluación psicotécnica";
  } else if (porcentajeAsistencia < ASISTENCIA_MINIMA) {
    etapaActual = "Clases teóricas";
  } else if (practicasRealizadas < HORAS_PRACTICAS_REQUERIDAS) {
    etapaActual = "Prácticas de manejo";
  }

  // Próximas clases agendadas (de la más cercana a la más lejana)
  const proximasClases = clases
    .filter((c) => c.ESTADO === "AGENDADA" && fechaParaInput(c.FECHA) >= hoy)
    .sort((a, b) => `${fechaParaInput(a.FECHA)} ${a.HORA_INICIO}`.localeCompare(`${fechaParaInput(b.FECHA)} ${b.HORA_INICIO}`));
  const proximaClase = proximasClases[0];
  const otrasClases = proximasClases.slice(1);

  // Historial: clases prácticas pasadas, asistencias teóricas y evaluaciones juntas por fecha
  const historial = [];
  clases
    .filter((c) => c.ESTADO !== "AGENDADA" || fechaParaInput(c.FECHA) < hoy)
    .forEach((c) => {
      historial.push({
        clave: `clase-${c.ID_CLASE}`,
        fecha: fechaParaInput(c.FECHA),
        tipo: "Práctica de manejo",
        detalle: `${c.HORA_INICIO} a ${c.HORA_FIN} · Sede ${c.NOMBRE_SEDE} · ${c.NOMBRE_INSTRUCTOR} ${c.APELLIDO_INSTRUCTOR}`,
        resultado: obtenerEtiquetaClase(c).texto,
      });
    });
  asistencias.forEach((a) => {
    historial.push({
      clave: `asistencia-${a.ID_ASISTENCIA}`,
      fecha: fechaParaInput(a.FECHA),
      tipo: "Clase teórica",
      detalle: a.NOMBRE_BLOQUE,
      resultado: String(a.ESTADO).toUpperCase() === "PRESENTE" ? "Asistió" : "Ausente",
    });
  });
  evaluaciones.forEach((e) => {
    historial.push({
      clave: `evaluacion-${e.ID_EVALUACION}`,
      fecha: fechaParaInput(e.FECHA),
      tipo: "Evaluación",
      detalle: e.TIPO_EVALUACION,
      resultado: `Nota ${formatearNota(e.NOTA)}`,
    });
  });
  historial.sort((a, b) => b.fecha.localeCompare(a.fecha));

  const promedio = progreso.evaluaciones?.promedio;

  // Botones de confirmar y cancelar de cada clase agendada
  const mostrarAccionesClase = (clase) => {
    if (idCancelando === clase.ID_CLASE) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[#E31B23]">¿Cancelar y liberar el cupo?</span>
          <button type="button" onClick={() => setIdCancelando(null)} className="btn-contorno btn-compacto">No</button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => handleCancelar(clase)}
            className="btn-compacto inline-flex items-center rounded-sm bg-[#E31B23] text-[#FAFAF8] font-semibold hover:bg-[#C4151C] disabled:opacity-60"
          >
            Sí, cancelar
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-3">
        {!estaConfirmada(clase) && (
          <button type="button" disabled={procesando} onClick={() => handleConfirmar(clase)} className="btn-amarillo btn-compacto">
            Confirmar asistencia
          </button>
        )}
        <button type="button" onClick={() => setIdCancelando(clase.ID_CLASE)} className="btn-contorno btn-compacto">
          Cancelar clase
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D]">
      <BarraPanel etiqueta="ALUMNO" sesion={sesion} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 print:hidden">
        {/* Saludo y etapa actual */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-body text-sm text-[#0D0D0D]/50">Hola, {alumno.NOMBRE}</p>
            <h1 className="font-display text-3xl font-bold mt-1">Tu avance en la formación</h1>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#FFC400] rounded-sm px-4 py-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#0D0D0D]" />
            <span className="font-body text-sm font-semibold">Etapa actual: {etapaActual}</span>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Columna principal */}
          <div className="min-w-0">
            {/* Pestañas */}
            <div className="flex gap-6 border-b border-black/10 font-body text-sm overflow-x-auto">
              {PESTANAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTab(p.id)}
                  className={
                    tab === p.id
                      ? "pb-3 -mb-px border-b-2 whitespace-nowrap border-[#0D0D0D] font-semibold"
                      : "pb-3 -mb-px border-b-2 whitespace-nowrap border-transparent text-[#0D0D0D]/50 hover:text-[#0D0D0D]"
                  }
                >
                  {p.titulo}
                </button>
              ))}
            </div>

            {/* Pestaña: mi avance */}
            {tab === "resumen" && (
              <div className="mt-8 space-y-10">
                {/* Progreso por etapa */}
                <section>
                  <h2 className="font-display text-lg mb-4">Tus tres etapas</h2>
                  <div className="space-y-5">
                    {etapas.map((e) => (
                      <div key={e.titulo}>
                        <div className="flex justify-between gap-4 font-body text-sm mb-1.5">
                          <span className="font-semibold">{e.titulo}</span>
                          <span className="text-[#0D0D0D]/50 text-right">{e.estado}</span>
                        </div>
                        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full" style={{ width: `${e.progreso * 100}%`, backgroundColor: obtenerColorProgreso(e.progreso) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Próxima clase práctica */}
                <section>
                  <h2 className="font-display text-lg mb-4">Próxima clase práctica</h2>
                  {!proximaClase && (
                    <p className="font-body text-sm text-[#0D0D0D]/60 border border-dashed border-black/20 rounded-md px-4 py-6 text-center">
                      No tienes clases prácticas agendadas. La escuela te contactará para coordinarlas.
                    </p>
                  )}
                  {proximaClase && (
                    <div className="border-2 border-[#0D0D0D] rounded-md p-5 bg-white font-body">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-display text-xl">{formatearFechaLarga(proximaClase.FECHA)}</p>
                          <p className="text-sm font-semibold mt-0.5">{proximaClase.HORA_INICIO} a {proximaClase.HORA_FIN} hrs</p>
                        </div>
                        <EtiquetaEstado etiqueta={obtenerEtiquetaClase(proximaClase)} />
                      </div>
                      <dl className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="text-[#0D0D0D]/50">Sede</dt>
                          <dd className="font-semibold">{proximaClase.NOMBRE_SEDE}</dd>
                        </div>
                        <div>
                          <dt className="text-[#0D0D0D]/50">Instructor</dt>
                          <dd className="font-semibold">{proximaClase.NOMBRE_INSTRUCTOR} {proximaClase.APELLIDO_INSTRUCTOR}</dd>
                        </div>
                        <div>
                          <dt className="text-[#0D0D0D]/50">Vehículo</dt>
                          <dd className="font-semibold">{proximaClase.MODELO_VEHICULO} ({proximaClase.PATENTE_VEHICULO})</dd>
                        </div>
                      </dl>
                      <div className="mt-5">{mostrarAccionesClase(proximaClase)}</div>
                    </div>
                  )}
                </section>

                {/* Otras clases agendadas */}
                {otrasClases.length > 0 && (
                  <section>
                    <h2 className="font-display text-lg mb-4">Siguientes clases</h2>
                    <div className="border border-black/10 rounded-md divide-y divide-black/10 bg-white">
                      {otrasClases.map((c) => (
                        <div key={c.ID_CLASE} className="px-4 py-3 font-body">
                          <div className="flex items-center gap-4">
                            <div className="w-16 shrink-0 text-center">
                              <p className="font-display text-sm leading-none">{formatearDiaCorto(c.FECHA).split(" ").slice(1).join(" ")}</p>
                              <p className="text-[11px] text-[#0D0D0D]/50 uppercase">{formatearDiaCorto(c.FECHA).split(" ")[0]}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{c.HORA_INICIO} a {c.HORA_FIN}</p>
                              <p className="text-xs text-[#0D0D0D]/50">Sede {c.NOMBRE_SEDE} · {c.NOMBRE_INSTRUCTOR} {c.APELLIDO_INSTRUCTOR}</p>
                            </div>
                            <EtiquetaEstado etiqueta={obtenerEtiquetaClase(c)} />
                          </div>
                          <div className="mt-3 pl-20">{mostrarAccionesClase(c)}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Pestaña: historial */}
            {tab === "historial" && (
              <div className="mt-8">
                {historial.length === 0 && <p className="font-body text-sm text-[#0D0D0D]/50">Todavía no hay clases ni evaluaciones registradas.</p>}
                {historial.length > 0 && (
                  <div className="border border-black/10 rounded-md divide-y divide-black/10 bg-white">
                    {historial.map((h) => (
                      <div key={h.clave} className="flex items-center gap-4 px-4 py-3 font-body">
                        <span className="w-20 shrink-0 text-xs text-[#0D0D0D]/50">{formatearFecha(h.fecha)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{h.tipo}</p>
                          <p className="text-xs text-[#0D0D0D]/50 truncate">{h.detalle}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#0D0D0D]/70 whitespace-nowrap">{h.resultado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña: evaluaciones */}
            {tab === "evaluaciones" && (
              <div className="mt-8">
                {evaluaciones.length === 0 && <p className="font-body text-sm text-[#0D0D0D]/50">Todavía no tienes notas registradas.</p>}
                {evaluaciones.length > 0 && (
                  <div className="overflow-x-auto border border-black/10 rounded-md bg-white">
                    <table className="w-full text-left font-body text-sm">
                      <thead className="bg-[#0D0D0D] text-[#FAFAF8]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Evaluación</th>
                          <th className="px-4 py-3 font-semibold">Instructor</th>
                          <th className="px-4 py-3 font-semibold text-right">Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {evaluaciones.map((e) => (
                          <tr key={e.ID_EVALUACION}>
                            <td className="px-4 py-3 whitespace-nowrap">{formatearFecha(e.FECHA)}</td>
                            <td className="px-4 py-3">
                              <span className="font-semibold">{e.TIPO_EVALUACION}</span>
                              {e.OBSERVACIONES && <span className="block text-xs text-[#0D0D0D]/50">{e.OBSERVACIONES}</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{e.NOMBRE_INSTRUCTOR} {e.APELLIDO_INSTRUCTOR}</td>
                            <td className={parseFloat(e.NOTA) >= 4 ? "px-4 py-3 text-right font-display text-lg" : "px-4 py-3 text-right font-display text-lg text-[#E31B23]"}>
                              {formatearNota(e.NOTA)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            {/* Credencial digital */}
            <div className="bg-[#0D0D0D] text-[#FAFAF8] rounded-md p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-body text-xs text-[#FAFAF8]/50">Credencial digital</p>
                  <p className="font-display text-lg">{alumno.NOMBRE} {alumno.APELLIDO}</p>
                  <p className="font-body text-xs text-[#FAFAF8]/50 mt-0.5">{alumno.RUT}</p>
                </div>
                <div className="w-12 h-12 rounded-sm bg-[#FFC400] text-[#0D0D0D] font-display text-lg grid place-items-center shrink-0">
                  {obtenerIniciales(alumno.NOMBRE, alumno.APELLIDO)}
                </div>
              </div>
              <p className="font-body text-xs text-[#FAFAF8]/50 mt-6">
                Sede {alumno.NOMBRE_SEDE || "sin asignar"}
                {alumno.FECHA_MATRICULA ? ` · Matrícula ${formatearFecha(alumno.FECHA_MATRICULA)}` : ""}
              </p>
            </div>

            {/* Resumen en números */}
            <div className="border border-black/10 rounded-md p-6 bg-white">
              <p className="font-body text-sm font-semibold mb-4">En números</p>
              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-[#0D0D0D]/60">Asistencia teórica</span>
                  <span className={porcentajeAsistencia >= ASISTENCIA_MINIMA ? "font-semibold" : "font-semibold text-[#E31B23]"}>{porcentajeAsistencia.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0D0D0D]/60">Clases prácticas restantes</span>
                  <span className="font-semibold">{horasRestantes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0D0D0D]/60">Promedio de notas</span>
                  <span className="font-semibold">{promedio ? formatearNota(promedio) : "-"}</span>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => window.print()} className="btn-negro w-full">
              Descargar certificado de avance
            </button>
            <Link to="/" className="block text-center font-body text-sm text-[#0D0D0D]/50 hover:text-[#0D0D0D]">
              ← Volver al inicio
            </Link>
          </aside>
        </div>
      </main>

      {/* Certificado de avance: solo se ve al imprimir o guardar como PDF */}
      <section className="hidden print:block px-10 py-8 font-body text-[#0D0D0D]">
        <div className="flex items-center justify-between border-b-4 border-[#FFC400] pb-4">
          <div>
            <p className="font-display text-2xl">Escuela de Conductores Futuro</p>
            <p className="text-sm">Sedes Macul y Peñalolén · Región Metropolitana</p>
          </div>
          <img src="/logo/logo-completo.png" alt="" className="h-20 w-auto" />
        </div>

        <h1 className="font-display text-3xl mt-8">Certificado de avance</h1>
        <p className="mt-4">
          Se certifica que <strong>{alumno.NOMBRE} {alumno.APELLIDO}</strong>, RUT <strong>{alumno.RUT}</strong>, alumno de la sede {alumno.NOMBRE_SEDE || "-"},
          registra el siguiente avance en su formación al {formatearFechaLarga(hoy)}:
        </p>

        <table className="w-full mt-6 text-sm border border-black/30">
          <tbody>
            <tr className="border-b border-black/30">
              <td className="px-3 py-2 font-semibold">Evaluación psicotécnica</td>
              <td className="px-3 py-2">{etiquetaPsicotecnico.texto}{alumno.FECHA_EVALUACION_PSICOTECNICA ? ` (${formatearFecha(alumno.FECHA_EVALUACION_PSICOTECNICA)})` : ""}</td>
            </tr>
            <tr className="border-b border-black/30">
              <td className="px-3 py-2 font-semibold">Asistencia a clases teóricas</td>
              <td className="px-3 py-2">{porcentajeAsistencia.toFixed(0)}% ({bloquesPresentes} de {asistencias.length} bloques)</td>
            </tr>
            <tr className="border-b border-black/30">
              <td className="px-3 py-2 font-semibold">Clases prácticas realizadas</td>
              <td className="px-3 py-2">{practicasRealizadas} de {HORAS_PRACTICAS_REQUERIDAS}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-semibold">Promedio de evaluaciones</td>
              <td className="px-3 py-2">{promedio ? formatearNota(promedio) : "Sin evaluaciones"}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-6 text-sm">Etapa actual: <strong>{etapaActual}</strong></p>
        <p className="mt-16 text-xs text-[#0D0D0D]/60">
          Documento informativo generado desde el portal del alumno. No reemplaza el certificado oficial de aprobación del curso.
        </p>
      </section>

      <AlertaFlotante mensaje={mensajeAlerta} tipo={tipoAlerta} />
    </div>
  );
}

export default DashboardAlumno;
