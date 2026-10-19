// Conexión del frontend con el backend (API REST)
//
// En desarrollo, Vite redirige /api al backend (ver vite.config.js), así que no hay que configurar nada.
// Si el backend está en otra dirección, definir VITE_API_URL en un archivo .env del frontend,
// por ejemplo: VITE_API_URL=http://localhost:4000/api
//
// Todas las páginas deben usar este archivo en vez de llamar a fetch directamente,
// así el manejo de errores y la dirección del servidor quedan en un solo lugar.

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Error con un mensaje listo para mostrarle al usuario
export class ApiError extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = "ApiError";
    this.estado = estado; // Código HTTP (0 si no hubo respuesta del servidor)
  }
}

const peticion = async (ruta, { method = "GET", body } = {}) => {
  // Armar la configuración de la petición (solo se manda JSON si hay body)
  const opciones = { method };
  if (body !== undefined) {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(body);
  }

  // Llamar al backend
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, opciones);
  } catch (error) {
    // No hubo respuesta: servidor apagado, sin red, etc.
    console.error("Error al conectar con el servidor:", error);
    throw new ApiError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.", 0);
  }

  // Leer el JSON de la respuesta (puede venir vacío)
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // La respuesta no trae JSON, se deja "datos" en null
  }

  // Revisar si el backend respondió con error
  if (!respuesta.ok) {
    // El backend manda "mensaje" pensado para el usuario ("detalle" es técnico y no se muestra)
    let mensaje = "Ocurrió un error inesperado. Inténtalo nuevamente.";
    if (datos?.mensaje) {
      mensaje = datos.mensaje;
    } else if (respuesta.status >= 500) {
      mensaje = "El servidor no está disponible en este momento. Inténtalo en unos minutos.";
    }
    throw new ApiError(mensaje, respuesta.status);
  }

  return datos;
};

// Métodos para llamar a la API desde las páginas
export const api = {
  get: (ruta) => peticion(ruta),
  post: (ruta, body) => peticion(ruta, { method: "POST", body }),
  put: (ruta, body) => peticion(ruta, { method: "PUT", body }),
  patch: (ruta, body) => peticion(ruta, { method: "PATCH", body }),
  delete: (ruta) => peticion(ruta, { method: "DELETE" }),
};

// Iniciar sesión con correo o RUT (devuelve { mensaje, usuario })
export const iniciarSesion = (identificador, password) => {
  return api.post("/usuarios/login", { identificador, password });
};
