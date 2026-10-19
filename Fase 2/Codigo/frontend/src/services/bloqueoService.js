// Servicio de bloqueos de flota (salidas a examen municipal, mantenciones, etc.)
import { api } from "./api";

export const fetchBloqueos = async () => {
  const datos = await api.get("/bloqueos");
  return datos || [];
};

export const crearBloqueo = (bloqueo) => {
  return api.post("/bloqueos", bloqueo);
};

export const editarBloqueo = (id, bloqueo) => {
  return api.put(`/bloqueos/${id}`, bloqueo);
};

// Levantar el bloqueo (el vehículo vuelve a quedar disponible)
export const eliminarBloqueo = (id) => {
  return api.delete(`/bloqueos/${id}`);
};
