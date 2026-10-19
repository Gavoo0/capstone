// Servicio de sedes de la escuela
import { api } from "./api";

export const fetchSedes = async () => {
  const datos = await api.get("/sedes");
  return datos || [];
};

export const crearSede = (sede) => {
  return api.post("/sedes", sede);
};

export const editarSede = (id, sede) => {
  return api.put(`/sedes/${id}`, sede);
};

export const eliminarSede = (id) => {
  return api.delete(`/sedes/${id}`);
};
