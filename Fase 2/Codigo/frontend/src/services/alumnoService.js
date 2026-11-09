// Servicio de la ficha académica de los alumnos
import { api } from "./api";

export const ESTADOS_PSICOTECNICO = [
  { valor: "PENDIENTE", texto: "Pendiente" },
  { valor: "APROBADO", texto: "Aprobado" },
  { valor: "RECHAZADO", texto: "Rechazado" },
];

// Asistencia teórica mínima para poder agendar prácticas (la misma regla del backend)
export const ASISTENCIA_MINIMA = 75;

export const fetchAlumnos = async () => {
  const datos = await api.get("/alumnos");
  return datos || [];
};

export const fetchAlumno = (idUsuario) => {
  return api.get(`/alumnos/${idUsuario}`);
};

// Devuelve { alumno, clasesPracticas, evaluaciones }
export const fetchProgreso = (idUsuario) => {
  return api.get(`/alumnos/${idUsuario}/progreso`);
};

export const actualizarPsicotecnico = (idUsuario, psicotecnico) => {
  return api.put(`/alumnos/${idUsuario}/psicotecnico`, psicotecnico);
};

// Revisar si el alumno cumple los requisitos para agendar prácticas
export const estaHabilitado = (alumno) => {
  const psicotecnicoAprobado = String(alumno.ESTADO_PSICOTECNICO || "").toUpperCase() === "APROBADO";
  const asistencia = parseFloat(alumno.PORCENTAJE_ASISTENCIA_TEORICA) || 0;
  return Boolean(alumno.ESTADO_ACTIVO) && psicotecnicoAprobado && asistencia >= ASISTENCIA_MINIMA;
};

// Texto y estilo de la etiqueta del examen psicotécnico
export const obtenerEtiquetaPsicotecnico = (estado) => {
  const valor = String(estado || "PENDIENTE").toUpperCase();
  if (valor === "APROBADO") {
    return { texto: "Aprobado", clase: "bg-[#FFC400] text-[#0D0D0D]" };
  } else if (valor === "RECHAZADO") {
    return { texto: "Rechazado", clase: "bg-[#E31B23] text-[#FAFAF8]" };
  } else {
    return { texto: "Pendiente", clase: "border border-black/20 text-[#0D0D0D]/70" };
  }
};
