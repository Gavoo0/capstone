// Servicio de asistencias a clases teóricas
import { api, conFiltros } from "./api";

// Filtros disponibles: idAlumno, idInstructor, fecha, estado
export const fetchAsistencias = async (filtros = {}) => {
  const datos = await api.get(conFiltros("/asistencias", filtros));
  return datos || [];
};

export const fetchAsistenciasAlumno = async (idAlumno) => {
  const datos = await api.get(`/asistencias/alumno/${idAlumno}`);
  return datos || [];
};

// Registrar la asistencia de varios alumnos a un mismo bloque
// asistencias: [{ idAlumno, estado: "PRESENTE" | "AUSENTE" }]
export const registrarAsistenciaMasiva = (datosBloque) => {
  return api.post("/asistencias/masiva", datosBloque);
};

export const eliminarAsistencia = (id) => {
  return api.delete(`/asistencias/${id}`);
};
