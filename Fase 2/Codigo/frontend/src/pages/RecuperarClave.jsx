import { useState } from "react";
import { solicitarRecuperacion } from "../services/recuperacionService";
import { ApiError } from "../services/api";
import PantallaAcceso from "../components/auth/PantallaAcceso";

// Página donde el usuario pide el enlace para crear una contraseña nueva
function RecuperarClave() {
  const [identificador, setIdentificador] = useState(""); // Correo o RUT
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const enviarFormulario = async (e) => {
    e.preventDefault();

    // Evitar enviar dos veces mientras se espera la respuesta
    if (enviando) {
      return;
    }

    if (!identificador.trim()) {
      setError("Ingresa tu correo o RUT.");
      return;
    }

    setError("");
    setEnviando(true);
    try {
      await solicitarRecuperacion(identificador.trim());
      setEnviado(true);
    } catch (err) {
      console.error("Error al solicitar la recuperación:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado. Inténtalo nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  // Mismo mensaje exista o no la cuenta, para no revelar quién está registrado
  if (enviado) {
    return (
      <PantallaAcceso titulo="Revisa tu correo">
        <p className="aviso-info font-semibold">
          Si los datos corresponden a una cuenta, te enviamos un enlace para crear una contraseña nueva.
        </p>
        <p className="mt-4 text-sm text-[#0D0D0D]/70">
          Si no lo ves en unos minutos, revisa la carpeta de spam. El enlace tiene una duración limitada y solo se puede usar una vez.
        </p>
        <button type="button" onClick={() => setEnviado(false)} className="btn-contorno btn-compacto mt-5">
          Usar otro correo o RUT
        </button>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso titulo="Recuperar contraseña">
      <p className="text-sm text-[#0D0D0D]/70">
        Ingresa tu correo o RUT y te enviaremos un enlace para crear una contraseña nueva.
      </p>

      <form className="mt-5 space-y-4" onSubmit={enviarFormulario} noValidate>
        <div>
          <label htmlFor="identificador" className="campo-etiqueta">Correo o RUT</label>
          <input
            id="identificador"
            type="text"
            autoComplete="username"
            placeholder="tucorreo@ejemplo.cl"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            className="campo"
          />
        </div>

        {error && <p role="alert" className="aviso-error">{error}</p>}

        <button type="submit" disabled={enviando} className="btn-amarillo w-full">
          {enviando ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </PantallaAcceso>
  );
}

export default RecuperarClave;
