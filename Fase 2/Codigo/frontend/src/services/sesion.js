// Sesión del usuario en el navegador
//
// Guarda los datos del usuario que devuelve el login. Si marcó "Recordarme" se guardan en
// localStorage (se mantienen al cerrar el navegador); si no, en sessionStorage (solo mientras
// la pestaña siga abierta).
//
// Cada sesión se guarda con una fecha de vencimiento. Si ya venció, o si es una sesión guardada
// con el formato antiguo (sin vencimiento), se borra y se pide iniciar sesión de nuevo.
//
// Importante: por ahora el backend no entrega un token, así que esto sirve para mostrar el
// nombre y llevar al panel correcto, pero NO protege las rutas ni la API. Cuando el backend
// entregue un token (JWT), también se guarda acá.

const CLAVE = "futuro.sesion";

// Duración de la sesión
const HORA = 60 * 60 * 1000;
const DURACION_NORMAL = 8 * HORA; // Sin "Recordarme": 8 horas
const DURACION_RECORDAR = 7 * 24 * HORA; // Con "Recordarme": 7 días

export const guardarSesion = (usuario, recordar = false) => {
  try {
    // Elegir dónde guardar según "Recordarme" y limpiar el otro almacenamiento
    let destino;
    let otro;
    let duracion;
    if (recordar) {
      destino = localStorage;
      otro = sessionStorage;
      duracion = DURACION_RECORDAR;
    } else {
      destino = sessionStorage;
      otro = localStorage;
      duracion = DURACION_NORMAL;
    }

    const sesion = {
      usuario,
      expira: Date.now() + duracion, // Fecha en que vence la sesión
    };

    otro.removeItem(CLAVE);
    destino.setItem(CLAVE, JSON.stringify(sesion));
  } catch (error) {
    // Almacenamiento bloqueado (modo privado, etc.): la app sigue funcionando sin recordar la sesión
    console.error("Error al guardar la sesión:", error);
  }
};

export const obtenerSesion = () => {
  try {
    // Buscar primero en sessionStorage y después en localStorage
    const sesionGuardada = sessionStorage.getItem(CLAVE) ?? localStorage.getItem(CLAVE);
    if (!sesionGuardada) {
      return null;
    }

    const sesion = JSON.parse(sesionGuardada);

    // Revisar que la sesión tenga el formato nuevo y que no esté vencida
    if (sesion && sesion.usuario && sesion.expira > Date.now()) {
      return sesion.usuario;
    } else {
      cerrarSesion(); // Sesión vencida o antigua: borrarla
      return null;
    }
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
    cerrarSesion(); // Si está dañada, borrarla para no quedar con una sesión inválida
    return null;
  }
};

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
