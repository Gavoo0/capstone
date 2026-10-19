// Servicio de vehículos de la flota
import { api } from "./api";

// Estados que maneja el backend para cada vehículo
export const ESTADOS_VEHICULO = [
  { valor: "OPERATIVO", texto: "Operativo" },
  { valor: "MANTENCION", texto: "En mantención" },
  { valor: "DE_BAJA", texto: "De baja" },
];

export const TRANSMISIONES = ["Manual", "Automática"];

export const fetchVehiculos = async () => {
  const datos = await api.get("/vehiculos");
  return datos || [];
};

export const crearVehiculo = (vehiculo) => {
  return api.post("/vehiculos", vehiculo);
};

export const editarVehiculo = (id, vehiculo) => {
  return api.put(`/vehiculos/${id}`, vehiculo);
};

export const eliminarVehiculo = (id) => {
  return api.delete(`/vehiculos/${id}`);
};
