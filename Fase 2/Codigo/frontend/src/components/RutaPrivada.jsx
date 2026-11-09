import { Navigate } from "react-router-dom";
import { obtenerSesion, rutaPorRol } from "../services/sesion";

// Mostrar la página solo si hay sesión y el rol corresponde a ese panel
// (esto ordena la navegación; la seguridad real la tiene que dar el backend con JWT)
function RutaPrivada({ rutaPanel, children }) {
  const sesion = obtenerSesion();

  // Sin sesión: al login
  if (!sesion) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  // Con sesión pero de otro rol: a su propio panel
  const rutaDelUsuario = rutaPorRol(sesion.NOMBRE_ROL);
  if (rutaDelUsuario !== rutaPanel) {
    if (rutaDelUsuario) {
      return <Navigate to={rutaDelUsuario} replace />;
    } else {
      return <Navigate to="/iniciar-sesion" replace />;
    }
  }

  return children;
}

export default RutaPrivada;
