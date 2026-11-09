import { useState, useEffect } from "react";
import EtiquetaEstado from "../panel/EtiquetaEstado";
import { fetchProgreso, obtenerEtiquetaPsicotecnico, ASISTENCIA_MINIMA } from "../../services/alumnoService";
import { fetchAsistenciasAlumno } from "../../services/asistenciaService";
import { fetchEvaluacionesAlumno, formatearNota } from "../../services/evaluacionService";
import { formatearFecha } from "../../utils/fechas";
import { HORAS_PRACTICAS_REQUERIDAS } from "../../data/agenda";

// Perfil de progreso del alumno, para revisarlo antes de salir a la clase práctica
function ModalPerfilAlumno({ idAlumno, onCerrar }) {
  const [progreso, setProgreso] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  // Cargar ficha, asistencias y notas del alumno
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const [datosProgreso, datosAsistencias, datosEvaluaciones] = await Promise.all([
          fetchProgreso(idAlumno),
          fetchAsistenciasAlumno(idAlumno),
          fetchEvaluacionesAlumno(idAlumno),
        ]);
        setProgreso(datosProgreso);
        setAsistencias(datosAsistencias);
        setEvaluaciones(datosEvaluaciones);
      } catch (error) {
        console.error("Error al cargar perfil del alumno:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [idAlumno]);

  const alumno = progreso?.alumno;
  const asistencia = parseFloat(alumno?.PORCENTAJE_ASISTENCIA_TEORICA) || 0;
  const practicasRealizadas = Number(progreso?.clasesPracticas?.clases_completadas) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FAFAF8] rounded-md shadow-xl font-body">
        {/* Encabezado */}
        <div className="flex items-center justify-between bg-[#0D0D0D] text-[#FAFAF8] px-6 py-4 rounded-t-md">
          <h2 className="font-display text-xl">Perfil del alumno</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-2xl leading-none text-[#FAFAF8]/60 hover:text-[#FFC400]">
            ×
          </button>
        </div>
        <div className="h-1.5 w-full stripe-hazard" />

        <div className="px-6 py-5">
          {cargando && <p className="text-sm text-[#0D0D0D]/50">Cargando perfil...</p>}
          {!cargando && errorCarga && <p className="text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}

          {!cargando && alumno && (
            <>
              {/* Datos del alumno */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl leading-tight">{alumno.NOMBRE} {alumno.APELLIDO}</p>
                  <p className="text-sm text-[#0D0D0D]/50">{alumno.RUT} · Sede {alumno.NOMBRE_SEDE || "-"}</p>
                </div>
                <EtiquetaEstado etiqueta={obtenerEtiquetaPsicotecnico(alumno.ESTADO_PSICOTECNICO)} />
              </div>

              {/* Resumen del avance */}
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="border border-black/10 rounded-md p-3 bg-white">
                  <p className={asistencia >= ASISTENCIA_MINIMA ? "font-display text-2xl" : "font-display text-2xl text-[#E31B23]"}>{asistencia.toFixed(0)}%</p>
                  <p className="text-xs text-[#0D0D0D]/50">Asistencia teórica</p>
                </div>
                <div className="border border-black/10 rounded-md p-3 bg-white">
                  <p className="font-display text-2xl">{practicasRealizadas}<span className="text-base text-[#0D0D0D]/40">/{HORAS_PRACTICAS_REQUERIDAS}</span></p>
                  <p className="text-xs text-[#0D0D0D]/50">Prácticas realizadas</p>
                </div>
                <div className="border border-black/10 rounded-md p-3 bg-white">
                  <p className="font-display text-2xl">{progreso.evaluaciones?.promedio ? formatearNota(progreso.evaluaciones.promedio) : "-"}</p>
                  <p className="text-xs text-[#0D0D0D]/50">Promedio de notas</p>
                </div>
              </div>

              {alumno.OBSERVACION_PSICOTECNICA && (
                <p className="mt-4 text-sm"><span className="font-semibold">Observación psicotécnica:</span> {alumno.OBSERVACION_PSICOTECNICA}</p>
              )}

              {/* Últimas asistencias teóricas */}
              <h3 className="mt-6 font-display text-lg">Últimas clases teóricas</h3>
              {asistencias.length === 0 && <p className="mt-1 text-sm text-[#0D0D0D]/50">Sin asistencias registradas.</p>}
              <ul className="mt-2 divide-y divide-black/10 text-sm">
                {asistencias.slice(0, 5).map((a) => (
                  <li key={a.ID_ASISTENCIA} className="flex justify-between gap-4 py-2">
                    <span><span className="text-[#0D0D0D]/50 mr-2">{formatearFecha(a.FECHA)}</span>{a.NOMBRE_BLOQUE}</span>
                    <span className={String(a.ESTADO).toUpperCase() === "PRESENTE" ? "font-semibold" : "font-semibold text-[#E31B23]"}>
                      {String(a.ESTADO).toUpperCase() === "PRESENTE" ? "Presente" : "Ausente"}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Últimas evaluaciones */}
              <h3 className="mt-6 font-display text-lg">Últimas evaluaciones</h3>
              {evaluaciones.length === 0 && <p className="mt-1 text-sm text-[#0D0D0D]/50">Sin evaluaciones registradas.</p>}
              <ul className="mt-2 divide-y divide-black/10 text-sm">
                {evaluaciones.slice(0, 5).map((e) => (
                  <li key={e.ID_EVALUACION} className="flex justify-between gap-4 py-2">
                    <span><span className="text-[#0D0D0D]/50 mr-2">{formatearFecha(e.FECHA)}</span>{e.TIPO_EVALUACION}</span>
                    <span className={parseFloat(e.NOTA) >= 4 ? "font-display" : "font-display text-[#E31B23]"}>{formatearNota(e.NOTA)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onCerrar} className="btn-contorno btn-compacto">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalPerfilAlumno;
