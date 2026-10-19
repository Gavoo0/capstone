// Servicio de usuarios (alumnos, instructores y administradores)
import { api } from "./api";

export const fetchUsuarios = async () => {
  const datos = await api.get("/usuarios");
  return datos || [];
};

export const fetchRoles = async () => {
  const datos = await api.get("/roles");
  return datos || [];
};

export const crearUsuario = (usuario) => {
  return api.post("/usuarios", usuario);
};

export const editarUsuario = (id, usuario) => {
  return api.put(`/usuarios/${id}`, usuario);
};

// Activar o desactivar la cuenta (activo: true o false)
export const cambiarEstadoUsuario = (id, activo) => {
  return api.patch(`/usuarios/${id}/estado`, { activo });
};

export const eliminarUsuario = (id) => {
  return api.delete(`/usuarios/${id}`);
};
