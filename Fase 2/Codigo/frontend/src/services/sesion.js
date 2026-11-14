// Sesión del usuario en el navegador
//
// Guarda los datos del usuario y el JWT que devuelve el login. Si marcó "Recordarme" se guardan en
// localStorage (se mantienen al cerrar el navegador); si no, en sessionStorage (solo mientras
// la pestaña siga abierta).
//
// Cada sesión se guarda con una fecha de vencimiento. Si ya venció, o si es una sesión guardada
// con el formato antiguo (sin vencimiento), se borra y se pide iniciar sesión de nuevo.
//
const CLAVE = "futuro.sesion";

const HORA = 60 * 60 * 1000;
const DURACION_TOKEN = 8 * HORA; // Debe coincidir con la expiración JWT del backend

export const guardarSesion = (usuario, token, recordar = false) => {
  if (!usuario || !token) return false;

  try {
    // Elegir dónde guardar según "Recordarme" y limpiar el otro almacenamiento
    let destino;
    let otro;
    if (recordar) {
      destino = localStorage;
      otro = sessionStorage;
    } else {
      destino = sessionStorage;
      otro = localStorage;
    }

    const sesion = {
      usuario,
      token,
      expira: Date.now() + DURACION_TOKEN,
    };

    otro.removeItem(CLAVE);
    destino.setItem(CLAVE, JSON.stringify(sesion));
    return true;
  } catch (error) {
    console.error("Error al guardar la sesión:", error);
    return false;
  }
};

const leerSesion = () => {
  try {
    const sesionGuardada = sessionStorage.getItem(CLAVE) ?? localStorage.getItem(CLAVE);
    if (!sesionGuardada) {
      return null;
    }

    const sesion = JSON.parse(sesionGuardada);
    if (sesion?.usuario && sesion?.token && sesion.expira > Date.now()) return sesion;
    cerrarSesion();
    return null;
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    cerrarSesion();
    return null;
  }
};

export const obtenerSesion = () => leerSesion()?.usuario ?? null;
export const obtenerToken = () => leerSesion()?.token ?? null;

export const cerrarSesion = () => {
  try {
    sessionStorage.removeItem(CLAVE);
    localStorage.removeItem(CLAVE);
  } catch (error) {
    console.error("Error al cerrar la sesión:", error);
  }
};

// Obtener el panel que corresponde a cada rol
// Se compara por palabra clave para aceptar variaciones del nombre (ALUMNO, Alumno, ADMINISTRADOR, etc.)
// Devuelve null si el rol no tiene un panel asignado
export const rutaPorRol = (nombreRol) => {
  const rol = String(nombreRol || "").toUpperCase();

  if (rol.includes("ALUMNO")) {
    return "/dashboard-alumno";
  } else if (rol.includes("INSTRUCTOR")) {
    return "/panel-instructor";
  } else if (rol.includes("ADMIN")) {
    return "/admin/agendamiento";
  } else {
    return null;
  }
};
