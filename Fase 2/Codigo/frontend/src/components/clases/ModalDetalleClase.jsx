import { useState } from "react";
import EtiquetaEstado from "../panel/EtiquetaEstado";
import {
  cambiarEstadoClase,
  cancelarClase,
  obtenerEtiquetaClase,
  obtenerEnlaceAutogestion,
} from "../../services/claseService";
import { formatearFechaLarga } from "../../utils/fechas";

// Detalle de una clase práctica con sus acciones (se usa en el panel admin y en el del instructor)
function ModalDetalleClase({ clase, mostrarAlerta, onCerrar, onCambio, permitirCancelar = true, mostrarEnlace = true }) {
  const [procesando, setProcesando] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  if (!clase) {
    return null;
  }

  const etiqueta = obtenerEtiquetaClase(clase);
  const enlace = obtenerEnlaceAutogestion(clase);
  const esAgendada = clase.ESTADO === "AGENDADA";

  const marcarEstado = async (estado, mensajeExito) => {
    setProcesando(true);
    try {
      await cambiarEstadoClase(clase.ID_CLASE, estado);
      mostrarAlerta("success", mensajeExito);
      onCambio();
    } catch (error) {
      console.error("Error al cambiar estado de la clase:", error);
      mostrarAlerta("danger", error.message || "Error al actualizar la clase");
    } finally {
      setProcesando(false);
    }
  };

  const confirmarCancelacion = async () => {
    setProcesando(true);
    try {
      await cancelarClase(clase.ID_CLASE, "Cancelada por la administración");
      mostrarAlerta("success", "Clase cancelada: el cupo quedó libre");
      onCambio();
    } catch (error) {
      console.error("Error al cancelar clase:", error);
      mostrarAlerta("danger", error.message || "Error al cancelar la clase");
    } finally {
      setProcesando(false);
    }
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      mostrarAlerta("success", "Enlace copiado");
    } catch (error) {
      console.error("Error al copiar enlace:", error);
      mostrarAlerta("danger", "No se pudo copiar, selecciónalo y cópialo a mano");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FAFAF8] rounded-md shadow-xl font-body">
        {/* Encabezado */}
        <div className="flex items-center justify-between bg-[#0D0D0D] text-[#FAFAF8] px-6 py-4 rounded-t-md">
          <h2 className="font-display text-xl">Clase práctica</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-2xl leading-none text-[#FAFAF8]/60 hover:text-[#FFC400]">
            ×
          </button>
        </div>
        <div className="h-1.5 w-full stripe-hazard" />

        <div className="px-6 py-5">
          {/* Datos de la clase */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-2xl leading-tight">{clase.NOMBRE_ALUMNO} {clase.APELLIDO_ALUMNO}</p>
              <p className="text-sm text-[#0D0D0D]/50">{clase.RUT_ALUMNO}</p>
            </div>
            <EtiquetaEstado etiqueta={etiqueta} />
          </div>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-[#0D0D0D]/50">Fecha</dt>
            <dd className="font-semibold">{formatearFechaLarga(clase.FECHA)}</dd>
            <dt className="text-[#0D0D0D]/50">Horario</dt>
            <dd className="font-semibold">{clase.HORA_INICIO} a {clase.HORA_FIN} hrs</dd>
            <dt className="text-[#0D0D0D]/50">Sede</dt>
            <dd className="font-semibold">{clase.NOMBRE_SEDE}</dd>
            <dt className="text-[#0D0D0D]/50">Instructor</dt>
            <dd className="font-semibold">{clase.NOMBRE_INSTRUCTOR} {clase.APELLIDO_INSTRUCTOR}</dd>
            <dt className="text-[#0D0D0D]/50">Vehículo</dt>
            <dd className="font-semibold">{clase.MODELO_VEHICULO} ({clase.PATENTE_VEHICULO})</dd>
            {clase.OBSERVACIONES && (
              <>
                <dt className="text-[#0D0D0D]/50">Notas</dt>
                <dd>{clase.OBSERVACIONES}</dd>
              </>
            )}
          </dl>

          {/* Enlace de autogestión para el alumno */}
          {mostrarEnlace && esAgendada && enlace && (
            <div className="mt-6 border border-black/10 rounded-md p-4 bg-white">
              <p className="text-sm font-semibold">Enlace de autogestión</p>
              <p className="text-xs text-[#0D0D0D]/60 mt-0.5">Envíaselo al alumno para que confirme o cancele su clase.</p>
              <input readOnly value={enlace} className="campo mt-2 text-xs" onFocus={(e) => e.target.select()} />
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={copiarEnlace} className="btn-contorno btn-compacto">
                  Copiar enlace
                </button>
              </div>
            </div>
          )}

          {/* Acciones según el estado */}
          {esAgendada && !confirmandoCancelar && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={procesando} onClick={() => marcarEstado("REALIZADA", "Clase marcada como realizada")} className="btn-negro btn-compacto">
                Marcar realizada
              </button>
              <button type="button" disabled={procesando} onClick={() => marcarEstado("INASISTENCIA", "Inasistencia registrada")} className="btn-contorno btn-compacto">
                Registrar inasistencia
              </button>
              {permitirCancelar && (
                <button type="button" disabled={procesando} onClick={() => setConfirmandoCancelar(true)} className="btn-compacto font-semibold text-[#E31B23] hover:underline">
                  Cancelar clase
                </button>
              )}
            </div>
          )}

          {/* Confirmar cancelación */}
          {confirmandoCancelar && (
            <div className="mt-6 border border-[#E31B23]/40 bg-[#E31B23]/5 rounded-md p-4">
              <p className="text-sm font-semibold text-[#E31B23]">¿Cancelar esta clase?</p>
              <p className="text-sm text-[#0D0D0D]/70 mt-1">El vehículo y el instructor quedarán libres en ese horario.</p>
              <div className="mt-3 flex gap-3">
                <button type="button" onClick={() => setConfirmandoCancelar(false)} className="btn-contorno btn-compacto">
                  Volver
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={confirmarCancelacion}
                  className="btn-compacto inline-flex items-center rounded-sm bg-[#E31B23] text-[#FAFAF8] font-semibold hover:bg-[#C4151C] disabled:opacity-60"
                >
                  {procesando ? "Cancelando..." : "Sí, cancelar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalDetalleClase;
