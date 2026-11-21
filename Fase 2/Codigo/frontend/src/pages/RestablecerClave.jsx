import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { restablecerClave, validarClaveNueva, LARGO_MINIMO_CLAVE } from "../services/recuperacionService";
import { ApiError } from "../services/api";
import PantallaAcceso from "../components/auth/PantallaAcceso";

// Página del enlace que llega por correo para crear la contraseña nueva
// Ejemplo: /restablecer-clave?token=abc-123
function RestablecerClave() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token");

  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  const enviarFormulario = async (e) => {
    e.preventDefault();

    // Evitar enviar dos veces mientras se espera la respuesta
    if (guardando) {
      return;
    }

    const errorClave = validarClaveNueva(clave, confirmacion);
    if (errorClave) {
      setError(errorClave);
      return;
    }

    setError("");
    setGuardando(true);
    try {
      await restablecerClave(token, clave);
      setListo(true);
    } catch (err) {
      console.error("Error al restablecer la contraseña:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado. Inténtalo nuevamente.");
      }
    } finally {
      setGuardando(false);
    }
  };

  // Contenido según el caso
  const mostrarContenido = () => {
    if (!token) {
      return (
        <>
          <p className="text-[#E31B23] font-semibold">El enlace no es válido. Revisa que lo hayas abierto completo desde el correo.</p>
          <Link to="/recuperar-clave" className="btn-amarillo mt-5 inline-flex">Pedir un enlace nuevo</Link>
        </>
      );
    }

    if (listo) {
      return (
        <>
          <p className="aviso-info font-semibold">¡Listo! Tu contraseña fue actualizada.</p>
          <Link to="/iniciar-sesion" className="btn-amarillo mt-5 inline-flex">Iniciar sesión</Link>
        </>
      );
    }

    return (
      <>
        <p className="text-sm text-[#0D0D0D]/70">Elige una contraseña nueva de al menos {LARGO_MINIMO_CLAVE} caracteres.</p>

        <form className="mt-5 space-y-4" onSubmit={enviarFormulario} noValidate>
          <div>
            <label htmlFor="clave-nueva" className="campo-etiqueta">Contraseña nueva</label>
            <input
              id="clave-nueva"
              type={verClave ? "text" : "password"}
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="campo"
            />
          </div>
          <div>
            <label htmlFor="clave-confirmar" className="campo-etiqueta">Repite la contraseña</label>
            <input
              id="clave-confirmar"
              type={verClave ? "text" : "password"}
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              className="campo"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#0D0D0D]/70">
            <input
              type="checkbox"
              checked={verClave}
              onChange={(e) => setVerClave(e.target.checked)}
              className="w-4 h-4 rounded-sm border-black/30 accent-[#0D0D0D]"
            />
            Mostrar contraseñas
          </label>

          {error && (
            <div role="alert" className="aviso-error">
              <p>{error}</p>
              <Link to="/recuperar-clave" className="underline font-semibold">Pedir un enlace nuevo</Link>
            </div>
          )}

          <button type="submit" disabled={guardando} className="btn-amarillo w-full">
            {guardando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </>
    );
  };

  return <PantallaAcceso titulo="Crear contraseña nueva">{mostrarContenido()}</PantallaAcceso>;
}

export default RestablecerClave;
