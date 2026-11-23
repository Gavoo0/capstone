// Servicio de clases prácticas de manejo
import { api, conFiltros } from "./api";
import { formatearDiaCorto } from "../utils/fechas";

// Texto que se guarda en las observaciones cuando el alumno confirma su asistencia.
// La clase sigue en estado AGENDADA para que el backend la siga considerando al revisar
// choques de horario (sus validaciones solo miran las clases AGENDADA).
export const MARCA_CONFIRMADA = "Asistencia confirmada por el alumno";

// Filtros disponibles: idSede, idAlumno, idInstructor, idVehiculo, fecha, fechaDesde, fechaHasta, estado
export const fetchClases = async (filtros = {}) => {
  const datos = await api.get(conFiltros("/clases", filtros));
  return datos || [];
};

// Buscar la clase del enlace de autogestión que le llega al alumno
export const fetchClasePorToken = (token) => {
  return api.get(`/clases/autogestion/${encodeURIComponent(token)}`);
};

export const agendarClase = (clase) => {
  return api.post("/clases", clase);
};

// Estados: AGENDADA, REALIZADA, CANCELADA, INASISTENCIA
export const cambiarEstadoClase = (id, estado, observaciones) => {
  return api.patch(`/clases/${id}/estado`, { estado, observaciones });
};

export const confirmarClase = (id) => {
  return cambiarEstadoClase(id, "AGENDADA", MARCA_CONFIRMADA);
};

export const confirmarClasePorToken = (token) => {
  return api.post(`/clases/autogestion/${encodeURIComponent(token)}/confirmar`);
};

export const cancelarClase = (id, motivo) => {
  return api.patch(`/clases/${id}/cancelar`, { motivo });
};

export const cancelarClasePorToken = (token, motivo) => {
  return api.post(`/clases/autogestion/${encodeURIComponent(token)}/cancelar`, { motivo });
};

// Saber si el alumno ya cumplió la confirmación que se le pide ahora.
// Hay doble confirmación: una hasta 24 horas antes y otra hasta 3 horas antes (la calcula el backend en clase.CONFIRMACION).
// Las clases antiguas, sin ese dato, siguen usando la marca en las observaciones.
export const estaConfirmada = (clase) => {
  if (clase.CONFIRMACION?.aplica) {
    return clase.ESTADO === "AGENDADA" && clase.CONFIRMACION.confirmada;
  }
  return clase.ESTADO === "AGENDADA" && clase.OBSERVACIONES === MARCA_CONFIRMADA;
};

// Mostrar un plazo del backend ('AAAA-MM-DD HH:MM') como "mar 24 nov, 15:00"
const formatearPlazo = (texto) => {
  return `${formatearDiaCorto(texto.slice(0, 10)).toLowerCase()}, ${texto.slice(11)} hrs`;
};

// Texto que explica al alumno qué confirmación se le pide y hasta cuándo ("" si no corresponde)
export const obtenerMensajeConfirmacion = (clase) => {
  const confirmacion = clase.CONFIRMACION;
  if (clase.ESTADO !== "AGENDADA" || !confirmacion?.aplica) {
    return "";
  }

  if (confirmacion.fase === 1 && !confirmacion.confirmada) {
    return `Confirma tu asistencia hasta el ${formatearPlazo(confirmacion.vence)}. Si no, el cupo se libera automáticamente.`;
  } else if (confirmacion.fase === 1) {
    return `Asistencia confirmada. Deberás reconfirmarla entre el ${formatearPlazo(confirmacion.reconfirmarDesde)} y el ${formatearPlazo(confirmacion.venceSegunda)}.`;
  } else if (!confirmacion.confirmada) {
    return `Reconfirma tu asistencia hasta el ${formatearPlazo(confirmacion.vence)}. Si no, el cupo se libera automáticamente.`;
  } else {
    return "Asistencia reconfirmada. ¡Te esperamos!";
  }
};

// Texto y estilo de la etiqueta de estado de una clase
export const obtenerEtiquetaClase = (clase) => {
  if (estaConfirmada(clase)) {
    return { texto: "Confirmada", clase: "bg-[#FFC400] text-[#0D0D0D]" };
  } else if (clase.ESTADO === "AGENDADA" && clase.CONFIRMACION?.aplica && clase.CONFIRMACION.fase === 2) {
    return { texto: "Reconfirmar", clase: "border border-[#E31B23] text-[#E31B23]" };
  } else if (clase.ESTADO === "AGENDADA") {
    return { texto: "Por confirmar", clase: "border border-[#E31B23] text-[#E31B23]" };
  } else if (clase.ESTADO === "REALIZADA") {
    return { texto: "Realizada", clase: "bg-[#0D0D0D] text-[#FAFAF8]" };
  } else if (clase.ESTADO === "INASISTENCIA") {
    return { texto: "Inasistencia", clase: "bg-[#E31B23] text-[#FAFAF8]" };
  } else if (clase.ESTADO === "CANCELADA") {
    return { texto: "Cancelada", clase: "border border-black/20 text-[#0D0D0D]/50 line-through" };
  } else {
    return { texto: clase.ESTADO || "-", clase: "border border-black/20" };
  }
};

// Armar el enlace de autogestión para mandárselo al alumno
export const obtenerEnlaceAutogestion = (clase) => {
  if (!clase.TOKEN_AUTOGESTION) {
    return "";
  }
  return `${window.location.origin}/alumno/autogestion-clase?token=${clase.TOKEN_AUTOGESTION}`;
};

// Bloques que el alumno puede reservar en su sede (desde y hasta en formato AAAA-MM-DD, máximo 14 días)
// Devuelve { idSede, dias: [{ fecha, bloques: [{ inicio, fin, estado }] }] }
export const fetchBloquesDisponibles = (desde, hasta) => {
  return api.get(conFiltros("/clases/disponibilidad", { desde, hasta }));
};

// El alumno reserva un bloque; el sistema le asigna instructor y vehículo
export const solicitarClase = (bloque) => {
  return api.post("/clases/solicitar", bloque);
};
