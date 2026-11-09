import { useState, useEffect } from "react";
import { fetchSedes } from "../../services/sedeService";
import { fetchVehiculos } from "../../services/vehiculoService";
import { fetchBloqueos } from "../../services/bloqueoService";
import { fetchClases } from "../../services/claseService";
import { fechaParaInput, fechaHoy, formatearFechaLarga } from "../../utils/fechas";

// Disponibilidad de la flota del día: si la escuela queda con 1 de 2 vehículos por salidas a examen
function DisponibilidadFlota({ sesion }) {
  const [fecha, setFecha] = useState(fechaHoy());
  const [sedes, setSedes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  // Cargar flota, bloqueos y clases del día
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosSedes, datosVehiculos, datosBloqueos, datosClases] = await Promise.all([
          fetchSedes(),
          fetchVehiculos(),
          fetchBloqueos(),
          fetchClases({ fecha }),
        ]);
        setSedes(datosSedes);
        setVehiculos(datosVehiculos.filter((v) => v.ESTADO_OPERATIVO !== "DE_BAJA"));
        setBloqueos(datosBloqueos.filter((b) => fechaParaInput(b.FECHA) === fecha));
        setClases(datosClases.filter((c) => c.ESTADO !== "CANCELADA"));
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar la flota:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [fecha]);

  const cambiarFecha = (nuevaFecha) => {
    if (nuevaFecha && nuevaFecha !== fecha) {
      setCargando(true);
      setFecha(nuevaFecha);
    }
  };

  // Mostrar primero la sede del instructor
  const sedesOrdenadas = [...sedes].sort((a, b) => {
    if (a.ID_SEDE === sesion.ID_SEDE) {
      return -1;
    } else if (b.ID_SEDE === sesion.ID_SEDE) {
      return 1;
    } else {
      return 0;
    }
  });

  return (
    <section>
      {/* Título */}
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Disponibilidad de flota</h2>
        <p className="font-body text-sm text-[#0D0D0D]/60 mt-1 max-w-xl">
          Revisa qué vehículos quedan libres cuando uno sale a examen práctico en la Dirección de Tránsito.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input type="date" className="campo !w-auto !mt-0" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} aria-label="Fecha" />
        <span className="font-display text-lg">{formatearFechaLarga(fecha)}</span>
      </div>

      {cargando && <p className="mt-4 font-body text-sm text-[#0D0D0D]/50">Cargando flota...</p>}
      {!cargando && errorCarga && <p className="mt-4 font-body text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}

      {!cargando && !errorCarga && (
        <div className="mt-6 grid xl:grid-cols-2 gap-6">
          {sedesOrdenadas.map((sede) => {
            const vehiculosSede = vehiculos.filter((v) => v.ID_SEDE === sede.ID_SEDE);
            const operativos = vehiculosSede.filter((v) => v.ESTADO_OPERATIVO === "OPERATIVO");
            const conBloqueo = operativos.filter((v) => bloqueos.some((b) => b.ID_VEHICULO === v.ID_VEHICULO));
            const restringida = conBloqueo.length > 0;

            return (
              <article key={sede.ID_SEDE} className="bg-white border border-black/10 rounded-md overflow-hidden font-body">
                {/* Estado de la flota de la sede */}
                <div className={restringida ? "px-5 py-4 bg-[#E31B23] text-[#FAFAF8]" : "px-5 py-4 bg-[#0D0D0D] text-[#FAFAF8]"}>
                  <p className="font-display text-xl">
                    Sede {sede.NOMBRE}
                    {sede.ID_SEDE === sesion.ID_SEDE && <span className="ml-2 font-body text-xs font-semibold text-[#FFC400]">Tu sede</span>}
                  </p>
                  <p className="text-sm mt-0.5">
                    {restringida
                      ? `Flota restringida: ${operativos.length - conBloqueo.length} de ${operativos.length} vehículos sin bloqueos`
                      : `Flota completa: ${operativos.length} de ${operativos.length} vehículos activos`}
                  </p>
                </div>

                {vehiculosSede.length === 0 && <p className="px-5 py-4 text-sm text-[#0D0D0D]/50">Sin vehículos registrados.</p>}

                <ul className="divide-y divide-black/10">
                  {vehiculosSede.map((v) => {
                    const bloqueosVehiculo = bloqueos.filter((b) => b.ID_VEHICULO === v.ID_VEHICULO);
                    const clasesVehiculo = clases
                      .filter((c) => c.ID_VEHICULO === v.ID_VEHICULO)
                      .sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));

                    return (
                      <li key={v.ID_VEHICULO} className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{v.MODELO}</p>
                            <p className="text-xs text-[#0D0D0D]/50">{v.PATENTE} · {v.TRANSMISION}</p>
                          </div>
                          {v.ESTADO_OPERATIVO === "MANTENCION" && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#0D0D0D] text-[#FAFAF8]">En mantención</span>
                          )}
                          {v.ESTADO_OPERATIVO === "OPERATIVO" && bloqueosVehiculo.length === 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-[#FFC400]">Disponible</span>
                          )}
                          {v.ESTADO_OPERATIVO === "OPERATIVO" && bloqueosVehiculo.length > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-sm border border-[#E31B23] text-[#E31B23]">Con bloqueo</span>
                          )}
                        </div>

                        {/* Bloqueos del vehículo */}
                        {bloqueosVehiculo.map((b) => (
                          <p key={b.ID_BLOQUEO} className="mt-2 text-sm text-[#E31B23]">
                            <span className="font-semibold">{b.HORA_INICIO} - {b.HORA_FIN}</span> · {b.MOTIVO}
                            {b.ID_INSTRUCTOR ? ` (${b.NOMBRE_INSTRUCTOR} ${b.APELLIDO_INSTRUCTOR})` : ""}
                          </p>
                        ))}

                        {/* Clases ya agendadas en el vehículo */}
                        {clasesVehiculo.length > 0 && (
                          <p className="mt-2 text-xs text-[#0D0D0D]/60">
                            Clases: {clasesVehiculo.map((c) => `${c.HORA_INICIO} (${c.NOMBRE_INSTRUCTOR})`).join(" · ")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DisponibilidadFlota;
