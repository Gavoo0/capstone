import { useState, useEffect } from "react";
import ModalDetalleClase from "../clases/ModalDetalleClase";
import ModalPerfilAlumno from "./ModalPerfilAlumno";
import EtiquetaEstado from "../panel/EtiquetaEstado";
import { fetchClases, obtenerEtiquetaClase } from "../../services/claseService";
import { fetchBloqueos } from "../../services/bloqueoService";
import { fechaParaInput, fechaHoy, sumarDias, formatearFechaLarga } from "../../utils/fechas";

// Agenda diaria del instructor: sus clases prácticas y sus salidas a examen
function AgendaInstructor({ sesion, mostrarAlerta }) {
  const idInstructor = sesion.ID_USUARIO;
  const hoy = fechaHoy();

  const [fecha, setFecha] = useState(hoy);
  const [clases, setClases] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Modales
  const [claseVer, setClaseVer] = useState(null);
  const [idAlumnoVer, setIdAlumnoVer] = useState(null);

  // Cargar las clases y bloqueos del día elegido
  useEffect(() => {
    const cargarAgenda = async () => {
      try {
        const [datosClases, datosBloqueos] = await Promise.all([fetchClases({ idInstructor, fecha }), fetchBloqueos()]);
        setClases(datosClases);

        // Dejar solo los bloqueos de este instructor en ese día
        const bloqueosDelDia = datosBloqueos.filter((b) => b.ID_INSTRUCTOR === idInstructor && fechaParaInput(b.FECHA) === fecha);
        setBloqueos(bloqueosDelDia);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar la agenda:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarAgenda();
  }, [idInstructor, fecha, recargar]);

  const cambiarFecha = (nuevaFecha) => {
    if (nuevaFecha && nuevaFecha !== fecha) {
      setCargando(true);
      setFecha(nuevaFecha);
    }
  };

  const handleCambioClase = () => {
    setClaseVer(null);
    setRecargar(recargar + 1);
  };

  // Juntar clases y bloqueos en una sola lista ordenada por hora
  const actividades = [
    ...clases.map((c) => ({ tipo: "clase", hora: c.HORA_INICIO, datos: c })),
    ...bloqueos.map((b) => ({ tipo: "bloqueo", hora: b.HORA_INICIO, datos: b })),
  ].sort((a, b) => a.hora.localeCompare(b.hora));

  const clasesPendientes = clases.filter((c) => c.ESTADO === "AGENDADA").length;

  return (
    <section>
      {/* Título */}
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Mi agenda</h2>
        <p className="font-body text-sm text-[#0D0D0D]/60 mt-1">Tus clases prácticas y salidas a examen del día.</p>
      </div>

      {/* Navegación por día */}
      <div className="mt-6 flex flex-wrap items-center gap-2 font-body text-sm">
        <button type="button" onClick={() => cambiarFecha(sumarDias(fecha, -1))} aria-label="Día anterior" className="btn-redondo">←</button>
        <input type="date" className="campo !w-auto !mt-0" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} aria-label="Fecha" />
        <button type="button" onClick={() => cambiarFecha(sumarDias(fecha, 1))} aria-label="Día siguiente" className="btn-redondo">→</button>
        {fecha !== hoy && (
          <button type="button" onClick={() => cambiarFecha(hoy)} className="ml-2 font-semibold underline decoration-[#FFC400] decoration-2 underline-offset-4">Hoy</button>
        )}
      </div>

      <p className="mt-6 font-display text-lg">
        {formatearFechaLarga(fecha)}
        {!cargando && !errorCarga && (
          <span className="font-body text-sm text-[#0D0D0D]/50 ml-2">
            {clases.length} {clases.length === 1 ? "clase" : "clases"} · {clasesPendientes} por realizar
          </span>
        )}
      </p>

      {cargando && <p className="mt-3 font-body text-sm text-[#0D0D0D]/50">Cargando agenda...</p>}
      {!cargando && errorCarga && <p className="mt-3 font-body text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}
      {!cargando && !errorCarga && actividades.length === 0 && (
        <p className="mt-3 font-body text-sm text-[#0D0D0D]/60 border border-dashed border-black/20 rounded-md px-4 py-8 text-center">
          No tienes clases ni bloqueos este día.
        </p>
      )}

      {/* Lista de actividades del día */}
      {!cargando && !errorCarga && (
        <ol className="mt-3 space-y-3">
          {actividades.map((actividad) => {
            // Salida a examen u otro bloqueo del instructor
            if (actividad.tipo === "bloqueo") {
              const b = actividad.datos;
              return (
                <li key={`b-${b.ID_BLOQUEO}`} className="flex gap-4 rounded-md border border-[#E31B23]/40 bg-[#E31B23]/5 px-4 py-3 font-body">
                  <span className="w-24 shrink-0 font-semibold">{b.HORA_INICIO} - {b.HORA_FIN}</span>
                  <div>
                    <p className="text-sm font-bold text-[#E31B23] uppercase">Bloqueo</p>
                    <p className="text-sm">{b.MOTIVO}</p>
                    <p className="text-xs text-[#0D0D0D]/60">Vehículo {b.PATENTE} · {b.MODELO}</p>
                  </div>
                </li>
              );
            }

            // Clase práctica
            const c = actividad.datos;
            const cancelada = c.ESTADO === "CANCELADA";
            return (
              <li key={`c-${c.ID_CLASE}`} className={cancelada ? "flex flex-col sm:flex-row gap-4 rounded-md border border-black/10 bg-white px-4 py-3 font-body opacity-60" : "flex flex-col sm:flex-row gap-4 rounded-md border border-black/10 bg-white px-4 py-3 font-body"}>
                <span className="w-24 shrink-0 font-semibold">{c.HORA_INICIO} - {c.HORA_FIN}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{c.NOMBRE_ALUMNO} {c.APELLIDO_ALUMNO}</p>
                    <EtiquetaEstado etiqueta={obtenerEtiquetaClase(c)} />
                  </div>
                  <p className="text-xs text-[#0D0D0D]/60 mt-0.5">
                    {c.MODELO_VEHICULO} ({c.PATENTE_VEHICULO}) · {c.TRANSMISION_VEHICULO} · Sede {c.NOMBRE_SEDE}
                  </p>
                  {c.OBSERVACIONES && <p className="text-xs mt-1">{c.OBSERVACIONES}</p>}
                </div>
                <div className="flex gap-4 text-sm font-semibold sm:self-center whitespace-nowrap">
                  <button type="button" onClick={() => setIdAlumnoVer(c.ID_ALUMNO)} className="hover:text-[#E6B000]">Ver perfil</button>
                  {c.ESTADO === "AGENDADA" && (
                    <button type="button" onClick={() => setClaseVer(c)} className="hover:text-[#E6B000]">Registrar</button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Modales */}
      {claseVer && (
        <ModalDetalleClase
          key={claseVer.ID_CLASE}
          clase={claseVer}
          mostrarAlerta={mostrarAlerta}
          onCerrar={() => setClaseVer(null)}
          onCambio={handleCambioClase}
          permitirCancelar={false}
          mostrarEnlace={false}
        />
      )}
      {idAlumnoVer && <ModalPerfilAlumno key={idAlumnoVer} idAlumno={idAlumnoVer} onCerrar={() => setIdAlumnoVer(null)} />}
    </section>
  );
}

export default AgendaInstructor;
