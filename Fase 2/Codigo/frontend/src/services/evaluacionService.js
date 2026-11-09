// Servicio de evaluaciones (notas de exámenes teóricos y prácticos)
import { api, conFiltros } from "./api";

export const TIPOS_EVALUACION = [
  "Control teórico",
  "Examen teórico",
  "Evaluación de manejo",
  "Examen práctico",
];

// Filtros disponibles: idAlumno, idInstructor, tipoEvaluacion, fechaDesde, fechaHasta
export const fetchEvaluaciones = async (filtros = {}) => {
  const datos = await api.get(conFiltros("/evaluaciones", filtros));
  return datos || [];
};

export const fetchEvaluacionesAlumno = async (idAlumno) => {
  const datos = await api.get(`/evaluaciones/alumno/${idAlumno}`);
  return datos || [];
};

export const crearEvaluacion = (evaluacion) => {
  return api.post("/evaluaciones", evaluacion);
};

export const editarEvaluacion = (id, evaluacion) => {
  return api.put(`/evaluaciones/${id}`, evaluacion);
};

export const eliminarEvaluacion = (id) => {
  return api.delete(`/evaluaciones/${id}`);
};

// Mostrar la nota con un decimal y coma (ej: 5,5)
export const formatearNota = (nota) => {
  const numero = parseFloat(nota);
  if (isNaN(numero)) {
    return "-";
  }
  return numero.toFixed(1).replace(".", ",");
};
