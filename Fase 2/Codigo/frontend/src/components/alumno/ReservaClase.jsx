import { useState, useEffect } from "react";
import { fetchBloquesDisponibles, solicitarClase } from "../../services/claseService";
import { fechaHoy, sumarDias, inicioSemana, formatearDiaCorto, formatearFechaLarga } from "../../utils/fechas";
import { DIAS_AGENDA } from "../../data/agenda";

// Cuántos días hacia adelante deja reservar el backend
const DIAS_MAXIMOS_ADELANTE = 30;

// Texto y estilo de cada estado de un bloque
const ESTADOS_BLOQUE = {
  DISPONIBLE: { texto: "Disponible", clase: "text-[#0D0D0D]" },
  SIN_CUPO: { texto: "Sin cupo", clase: "text-[#0D0D0D]/40" },
  TUYA: { texto: "Ya tienes una clase", clase: "font-semibold" },
  NO_DISPONIBLE: { texto: "No disponible", clase: "text-[#0D0D0D]/40" },
};

// Si hoy es fin de semana se parte desde el lunes siguiente
const primerLunes = () => {
  const hoy = fechaHoy();
  const lunes = inicioSemana(hoy);
  return sumarDias(lunes, 4) < hoy ? sumarDias(lunes, 7) : lunes;
};

function ReservaClase({ motivoBloqueo, mostrarAlerta, onReservada }) {
  const [lunes, setLunes] = useState(primerLunes);
  const [dias, setDias] = useState([]);
  const [diaElegido, setDiaElegido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Bloque que el alumno está por reservar
  const [bloquePendiente, setBloquePendiente] = useState(null);
  const [reservando, setReservando] = useState(false);

  // Cargar los bloques de la semana mostrada
  useEffect(() => {
    if (motivoBloqueo) {
      return;
    }

    const cargarBloques = async () => {
      try {
        const datos = await fetchBloquesDisponibles(lunes, sumarDias(lunes, DIAS_AGENDA - 1));
        setDias(datos.dias);
        setDiaElegido((actual) => {
          if (actual && datos.dias.some((d) => d.fecha === actual)) {
            return actual;
          }
          const hoy = fechaHoy();
          const conCupo = datos.dias.find((d) => d.fecha >= hoy && d.bloques.some((b) => b.estado === "DISPONIBLE"));
          return (conCupo || datos.dias[0]).fecha;
        });
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar los horarios disponibles:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarBloques();
  }, [lunes, recargar, motivoBloqueo]);

  if (motivoBloqueo) {
    return (
      <div className="mt-8 aviso-info font-body">
        <p className="font-semibold">Todavía no puedes reservar clases prácticas</p>
        <p className="mt-1 text-sm">{motivoBloqueo}</p>
      </div>
    );
  }

  const hoy = fechaHoy();
  const puedeRetroceder = sumarDias(lunes, -3) >= hoy; // El viernes de la semana anterior todavía no pasó
  const puedeAvanzar = sumarDias(lunes, 7) <= sumarDias(hoy, DIAS_MAXIMOS_ADELANTE);
  const dia = dias.find((d) => d.fecha === diaElegido);

  const cambiarSemana = (cantidad) => {
    setBloquePendiente(null);
    setCargando(true);
    setLunes(sumarDias(lunes, cantidad));
  };

  const confirmarReserva = async () => {
    setReservando(true);
    try {
      await solicitarClase({ fecha: bloquePendiente.fecha, horaInicio: bloquePendiente.inicio, horaFin: bloquePendiente.fin });
      mostrarAlerta("success", "¡Clase reservada! Ya quedó confirmada en tu agenda");
      setBloquePendiente(null);
      setRecargar(recargar + 1);
      onReservada();
    } catch (error) {
      console.error("Error al reservar la clase:", error);
      mostrarAlerta("danger", error.message || "No se pudo reservar la clase");
      setBloquePendiente(null);
      setRecargar(recargar + 1); // El bloque pudo llenarse mientras elegías: se vuelve a consultar
    } finally {
      setReservando(false);
    }
  };

  return (
    <section className="mt-8 font-body">
      <h2 className="font-display text-lg">Reserva tu próxima clase práctica</h2>
      <p className="text-sm text-[#0D0D0D]/60 mt-1">
        Elige un bloque con cupo. El sistema te asigna un instructor y un vehículo de tu sede, y la clase queda confirmada.
      </p>

      {/* Semana */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => cambiarSemana(-7)} disabled={!puedeRetroceder} className="btn-contorno btn-compacto disabled:opacity-40" aria-label="Semana anterior">←</button>
        <p className="text-sm font-semibold text-center">
          {formatearDiaCorto(lunes)} al {formatearDiaCorto(sumarDias(lunes, DIAS_AGENDA - 1))}
        </p>
        <button type="button" onClick={() => cambiarSemana(7)} disabled={!puedeAvanzar} className="btn-contorno btn-compacto disabled:opacity-40" aria-label="Semana siguiente">→</button>
      </div>

      {cargando && <p className="mt-6 text-sm text-[#0D0D0D]/50">Cargando horarios...</p>}
      {!cargando && errorCarga && <p className="mt-6 text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}

      {!cargando && !errorCarga && dia && (
        <>
          {/* Días de la semana */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {dias.map((d) => {
              const hayCupo = d.bloques.some((b) => b.estado === "DISPONIBLE");
              return (
                <button
                  key={d.fecha}
                  type="button"
                  onClick={() => { setDiaElegido(d.fecha); setBloquePendiente(null); }}
                  className={
                    d.fecha === diaElegido
                      ? "shrink-0 px-3 py-2 rounded-sm text-sm bg-[#0D0D0D] text-[#FAFAF8] font-semibold"
                      : "shrink-0 px-3 py-2 rounded-sm text-sm border border-black/15 bg-white hover:border-[#0D0D0D]"
                  }
                >
                  <span className="block">{formatearDiaCorto(d.fecha)}</span>
                  <span className={d.fecha === diaElegido ? "block text-[11px] opacity-70" : "block text-[11px] text-[#0D0D0D]/50"}>
                    {hayCupo ? "Con cupos" : "Sin cupos"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bloques del día */}
          <p className="mt-6 text-sm font-semibold">{formatearFechaLarga(dia.fecha)}</p>
          <div className="mt-2 border border-black/10 rounded-md divide-y divide-black/10 bg-white">
            {dia.bloques.map((bloque) => {
              const estado = ESTADOS_BLOQUE[bloque.estado] || ESTADOS_BLOQUE.NO_DISPONIBLE;
              const elegido = bloquePendiente && bloquePendiente.fecha === dia.fecha && bloquePendiente.inicio === bloque.inicio;
              return (
                <div key={bloque.inicio} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{bloque.inicio} a {bloque.fin} hrs</p>
                      <p className={`text-xs ${estado.clase}`}>{estado.texto}</p>
                    </div>
                    {bloque.estado === "DISPONIBLE" && !elegido && (
                      <button type="button" onClick={() => setBloquePendiente({ fecha: dia.fecha, ...bloque })} className="btn-amarillo btn-compacto">
                        Reservar
                      </button>
                    )}
                  </div>
                  {elegido && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold">¿Reservar este bloque?</span>
                      <button type="button" onClick={() => setBloquePendiente(null)} className="btn-contorno btn-compacto">No</button>
                      <button type="button" disabled={reservando} onClick={confirmarReserva} className="btn-amarillo btn-compacto disabled:opacity-60">
                        {reservando ? "Reservando..." : "Sí, reservar"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[#0D0D0D]/50">
            Puedes tener hasta 3 clases pendientes a la vez y reservar con al menos 2 horas de anticipación. Debes reconfirmar tu asistencia hasta 3 horas antes de la clase; si no lo haces, el cupo se libera para otro alumno. Si no puedes asistir, cancélala desde "Mi avance".
          </p>
        </>
      )}
    </section>
  );
}

export default ReservaClase;
