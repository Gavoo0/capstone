import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchClasePorToken, confirmarClase, cancelarClase, estaConfirmada } from "../services/claseService";
import { fechaParaInput, fechaHoy, formatearFechaLarga } from "../utils/fechas";

// Página del enlace que le llega al alumno por WhatsApp para confirmar o cancelar su clase
// Ejemplo: /alumno/autogestion-clase?token=abc-123
function AutogestionClase() {
  const [parametros] = useSearchParams();
  const token = parametros.get("token");

  const [clase, setClase] = useState(null);
  const [cargando, setCargando] = useState(Boolean(token));
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  const [procesando, setProcesando] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [mensajeResultado, setMensajeResultado] = useState(""); // Mensaje después de confirmar o cancelar

  // Buscar la clase del enlace
  useEffect(() => {
    if (!token) {
      return;
    }

    const cargarClase = async () => {
      try {
        const datos = await fetchClasePorToken(token);
        setClase(datos);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al buscar la clase:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarClase();
  }, [token, recargar]);

  const handleConfirmar = async () => {
    setProcesando(true);
    try {
      await confirmarClase(clase.ID_CLASE);
      setMensajeResultado("¡Gracias! Confirmaste tu asistencia. Te esperamos.");
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al confirmar clase:", error);
      setErrorCarga(error.message || "No pudimos confirmar tu clase. Inténtalo nuevamente.");
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async () => {
    setProcesando(true);
    try {
      await cancelarClase(clase.ID_CLASE, "Cancelada por el alumno desde el enlace de autogestión");
      setMensajeResultado("Tu clase fue cancelada y la hora quedó disponible para otro alumno.");
      setConfirmandoCancelar(false);
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al cancelar clase:", error);
      setErrorCarga(error.message || "No pudimos cancelar tu clase. Inténtalo nuevamente.");
    } finally {
      setProcesando(false);
    }
  };

  // Mensaje según el estado de la clase (null si todavía se puede confirmar o cancelar)
  const obtenerAvisoEstado = () => {
    if (clase.ESTADO === "CANCELADA") {
      return "Esta clase está cancelada. Si quieres reagendarla, comunícate con tu sede.";
    } else if (clase.ESTADO === "REALIZADA") {
      return "Esta clase ya fue realizada.";
    } else if (clase.ESTADO === "INASISTENCIA") {
      return "Esta clase quedó registrada como inasistencia.";
    } else if (fechaParaInput(clase.FECHA) < fechaHoy()) {
      return "La fecha de esta clase ya pasó.";
    } else {
      return null;
    }
  };

  // Contenido de la tarjeta según el caso
  const mostrarContenido = () => {
    if (!token) {
      return <p className="text-[#E31B23] font-semibold">El enlace no es válido. Revisa que lo hayas abierto completo desde el mensaje.</p>;
    }
    if (cargando) {
      return <p className="text-[#0D0D0D]/50">Buscando tu clase...</p>;
    }
    if (!clase) {
      return <p className="text-[#E31B23] font-semibold">{errorCarga || "No encontramos la clase de este enlace."}</p>;
    }

    const aviso = obtenerAvisoEstado();
    const confirmada = estaConfirmada(clase);

    return (
      <>
        <p>
          Hola <strong>{clase.NOMBRE_ALUMNO}</strong>,
          <br />
          tienes una clase práctica agendada:
        </p>

        <dl className="mt-5 border-y border-dashed border-black/20 py-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="font-semibold">Sede</dt>
          <dd>{clase.NOMBRE_SEDE}</dd>
          <dt className="font-semibold">Fecha</dt>
          <dd>{formatearFechaLarga(clase.FECHA)}</dd>
          <dt className="font-semibold">Horario</dt>
          <dd>{clase.HORA_INICIO} a {clase.HORA_FIN} hrs</dd>
          <dt className="font-semibold">Instructor</dt>
          <dd>{clase.NOMBRE_INSTRUCTOR} {clase.APELLIDO_INSTRUCTOR}</dd>
          <dt className="font-semibold">Vehículo</dt>
          <dd>{clase.MODELO_VEHICULO} ({clase.PATENTE_VEHICULO})</dd>
        </dl>

        {/* Resultado de la última acción */}
        {mensajeResultado && <p className="mt-5 aviso-info font-semibold">{mensajeResultado}</p>}
        {errorCarga && <p className="mt-5 aviso-error">{errorCarga}</p>}

        {/* La clase ya no se puede gestionar */}
        {aviso && !mensajeResultado && <p className="mt-5 aviso-info">{aviso}</p>}

        {/* Acciones */}
        {!aviso && !confirmandoCancelar && (
          <div className="mt-5">
            {confirmada ? (
              <p className="text-sm font-semibold">✓ Ya confirmaste tu asistencia.</p>
            ) : (
              <p className="text-sm">Por favor confirma tu asistencia para mantener tu cupo:</p>
            )}
            <div className="mt-4 flex flex-col gap-3">
              {!confirmada && (
                <button type="button" onClick={handleConfirmar} disabled={procesando} className="btn-amarillo w-full">
                  {procesando ? "Confirmando..." : "Sí, asistiré a la clase"}
                </button>
              )}
              <button type="button" onClick={() => setConfirmandoCancelar(true)} className="btn-contorno w-full">
                Cancelar y liberar cupo
              </button>
            </div>
            <p className="mt-4 text-xs text-[#0D0D0D]/60 italic">Al cancelar, la hora quedará disponible para otro alumno.</p>
          </div>
        )}

        {/* Confirmar cancelación */}
        {!aviso && confirmandoCancelar && (
          <div className="mt-5 border border-[#E31B23]/40 bg-[#E31B23]/5 rounded-md p-4">
            <p className="font-semibold text-[#E31B23]">¿Seguro que quieres cancelar?</p>
            <p className="text-sm text-[#0D0D0D]/70 mt-1">Para reagendar tendrás que comunicarte con la escuela.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => setConfirmandoCancelar(false)} className="btn-contorno btn-compacto">
                No, mantener mi clase
              </button>
              <button
                type="button"
                onClick={handleCancelar}
                disabled={procesando}
                className="btn-compacto inline-flex items-center justify-center rounded-sm bg-[#E31B23] text-[#FAFAF8] font-semibold hover:bg-[#C4151C] disabled:opacity-60"
              >
                {procesando ? "Cancelando..." : "Sí, cancelar clase"}
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#0D0D0D]">
      <div className="h-2 w-full stripe-hazard shrink-0" />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-3 font-display text-lg mb-6">
            <img src="/logo/logo-nav.png" alt="" className="h-9 w-9 object-contain" />
            <span>
              Futuro <span className="text-[#E6B000]">·</span> Conductores
            </span>
          </Link>

          <div className="bg-white border-2 border-[#0D0D0D] rounded-md overflow-hidden">
            <h1 className="bg-[#0D0D0D] text-[#FAFAF8] font-display text-xl px-6 py-4">Confirmación de clase práctica</h1>
            <div className="px-6 py-6 font-body">{mostrarContenido()}</div>
          </div>

          <p className="mt-6 text-center font-body text-xs text-[#0D0D0D]/50">
            ¿Dudas? Comunícate con tu sede de lunes a viernes, de 9:40 a 13:00 y de 15:00 a 20:20.
          </p>
        </div>
      </main>
    </div>
  );
}

export default AutogestionClase;
