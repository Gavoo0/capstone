// Servicio de clases prácticas de manejo
import { api, conFiltros } from "./api";

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

// Saber si el alumno ya confirmó una clase agendada
export const estaConfirmada = (clase) => {
  return clase.ESTADO === "AGENDADA" && clase.OBSERVACIONES === MARCA_CONFIRMADA;
};

// Texto y estilo de la etiqueta de estado de una clase
export const obtenerEtiquetaClase = (clase) => {
  if (estaConfirmada(clase)) {
    return { texto: "Confirmada", clase: "bg-[#FFC400] text-[#0D0D0D]" };
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
