// Catálogo de marcas y modelos de vehículos (lo entrega el backend)
import { api } from "./api";

export const fetchMarcas = async () => {
  const datos = await api.get("/catalogo-vehiculos/marcas");
  return datos?.marcas || [];
};

// Devuelve { marca, recomendados, otros, fuenteExterna }
export const fetchModelos = (marca) => {
  return api.get(`/catalogo-vehiculos/marcas/${encodeURIComponent(marca)}/modelos`);
};
