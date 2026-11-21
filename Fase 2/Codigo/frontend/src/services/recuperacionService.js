import { api } from "./api";

// Reglas de la contraseña nueva (el backend usa bcrypt, que admite hasta 72 bytes)
export const LARGO_MINIMO_CLAVE = 8;
export const LARGO_MAXIMO_BYTES = 72;

// Pedir el correo con el enlace para crear una contraseña nueva (acepta correo o RUT)
export const solicitarRecuperacion = (identificador) => {
  return api.post("/usuarios/recuperar-clave", { identificador });
};

// Guardar la contraseña nueva usando el token que llegó en el enlace del correo
export const restablecerClave = (token, password) => {
  return api.post("/usuarios/restablecer-clave", { token, password });
};

// Devuelve el mensaje de error si la contraseña no sirve, o null si está bien
export const validarClaveNueva = (clave, confirmacion) => {
  if (clave.length < LARGO_MINIMO_CLAVE) {
    return `La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`;
  } else if (new TextEncoder().encode(clave).length > LARGO_MAXIMO_BYTES) {
    return "La contraseña es demasiado larga. Usa una más corta.";
  } else if (clave !== confirmacion) {
    return "Las contraseñas no coinciden.";
  } else {
    return null;
  }
};
