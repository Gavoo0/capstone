import { useState, useEffect } from "react";
import ModalAgendarClase from "./ModalAgendarClase";
import ModalDetalleClase from "../clases/ModalDetalleClase";
import { fetchClases, obtenerEtiquetaClase, estaConfirmada } from "../../services/claseService";
import { fetchSedes } from "../../services/sedeService";
import { fetchVehiculos } from "../../services/vehiculoService";
import { fetchBloqueos } from "../../services/bloqueoService";
import { fetchAlumnos } from "../../services/alumnoService";
import { fetchUsuarios } from "../../services/usuarioService";
import { BLOQUES_HORARIOS, DIAS_AGENDA } from "../../data/agenda";
import {
  fechaParaInput,
  fechaHoy,
  sumarDias,
  inicioSemana,
  formatearDiaCorto,
  formatearFecha,
  formatearFechaLarga,
  horariosSeCruzan,
} from "../../utils/fechas";

// Descargar la planilla del día como CSV (se abre en Excel)
const descargarPlanilla = (nombreArchivo, filas) => {
  const contenido = filas.map((fila) => fila.map((celda) => `"${String(celda ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const archivo = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8" }); // \uFEFF para que Excel lea bien los tildes
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function MatrizAgendamiento({ mostrarAlerta, onCambio, onIrABloqueos }) {
  const hoy = fechaHoy();

  // Datos de la API
  const [sedes, setSedes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clases, setClases] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Semana, día y sede que se están mirando
  const [semana, setSemana] = useState(inicioSemana(hoy)); // Lunes de la semana
  const [diaActivo, setDiaActivo] = useState(hoy);
  const [idSede, setIdSede] = useState("");

  // Modales
  const [agendando, setAgendando] = useState(null); // Valores iniciales del formulario, o null si está cerrado
  const [claseVer, setClaseVer] = useState(null);

  // Cargar todo lo que necesita la matriz (se vuelve a cargar al cambiar de semana o al guardar algo)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosSedes, datosVehiculos, datosClases, datosBloqueos, datosAlumnos, datosUsuarios] = await Promise.all([
          fetchSedes(),
          fetchVehiculos(),
          fetchClases({ fechaDesde: semana, fechaHasta: sumarDias(semana, DIAS_AGENDA - 1) }),
          fetchBloqueos(),
          fetchAlumnos(),
          fetchUsuarios(),
        ]);
        setSedes(datosSedes);
        setVehiculos(datosVehiculos);
        setClases(datosClases);
        setBloqueos(datosBloqueos);
        setAlumnos(datosAlumnos.filter((a) => a.ESTADO_ACTIVO));

        // Dejar solo los instructores activos
        const soloInstructores = datosUsuarios.filter((u) => u.ESTADO_ACTIVO && String(u.NOMBRE_ROL || "").toUpperCase().includes("INSTRUCTOR"));
        setInstructores(soloInstructores);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar la agenda:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [semana, recargar]);

  const refrescar = () => {
    setRecargar(recargar + 1);
    onCambio();
  };

  // Moverse de semana manteniendo el mismo día de la semana
  const cambiarSemana = (dias) => {
    setCargando(true);
    setSemana(sumarDias(semana, dias));
    setDiaActivo(sumarDias(diaActivo, dias));
  };

  const irAHoy = () => {
    if (inicioSemana(hoy) !== semana) {
      setCargando(true);
    }
    setSemana(inicioSemana(hoy));
    setDiaActivo(hoy);
  };

  // Días de la semana (lunes a viernes) y día que se muestra en la tabla
  const dias = [];
  for (let i = 0; i < DIAS_AGENDA; i++) {
    dias.push(sumarDias(semana, i));
  }
  let diaVisible = dias[0];
  if (dias.includes(diaActivo)) {
    diaVisible = diaActivo;
  }

  // Sede elegida (por defecto la primera)
  let sedeElegida = idSede;
  if (!sedeElegida && sedes.length > 0) {
    sedeElegida = String(sedes[0].ID_SEDE);
  }

  // Vehículos de la sede que no están dados de baja (son las columnas de la tabla)
  const vehiculosSede = vehiculos.filter((v) => String(v.ID_SEDE) === sedeElegida && v.ESTADO_OPERATIVO !== "DE_BAJA");
  const operativosSede = vehiculosSede.filter((v) => v.ESTADO_OPERATIVO === "OPERATIVO");

  // Clases que ocupan un cupo (las canceladas ya liberaron el suyo)
  const clasesActivas = clases.filter((c) => c.ESTADO !== "CANCELADA");

  const clasesDelDia = (dia) => {
    return clasesActivas.filter((c) => fechaParaInput(c.FECHA) === dia && String(c.ID_SEDE) === sedeElegida);
  };

  const buscarClase = (vehiculo, dia, bloque) => {
    return clasesActivas.find(
      (c) => c.ID_VEHICULO === vehiculo.ID_VEHICULO && fechaParaInput(c.FECHA) === dia && horariosSeCruzan(c.HORA_INICIO, c.HORA_FIN, bloque.inicio, bloque.fin)
    );
  };

  const buscarBloqueo = (vehiculo, dia, bloque) => {
    return bloqueos.find(
      (b) => b.ID_VEHICULO === vehiculo.ID_VEHICULO && fechaParaInput(b.FECHA) === dia && horariosSeCruzan(b.HORA_INICIO, b.HORA_FIN, bloque.inicio, bloque.fin)
    );
  };

  const abrirAgendar = (valores) => {
    setAgendando({ idSede: sedeElegida, fecha: diaVisible >= hoy ? diaVisible : hoy, ...valores });
  };

  // Después de agendar se abre el detalle para poder mandarle el enlace al alumno
  const handleAgendada = (nuevaClase) => {
    setAgendando(null);
    setClaseVer(nuevaClase);
    refrescar();
  };

  const handleCambioClase = () => {
    setClaseVer(null);
    refrescar();
  };

  const exportarPlanilla = () => {
    const clasesDia = clasesDelDia(diaVisible).sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
    if (clasesDia.length === 0) {
      mostrarAlerta("danger", "No hay clases agendadas ese día para exportar");
      return;
    }

    const nombreSede = sedes.find((s) => String(s.ID_SEDE) === sedeElegida)?.NOMBRE || "sede";
    const filas = [["Fecha", "Inicio", "Término", "Vehículo", "Patente", "Alumno", "RUT", "Instructor", "Estado"]];
    clasesDia.forEach((c) => {
      filas.push([
        formatearFecha(c.FECHA),
        c.HORA_INICIO,
        c.HORA_FIN,
        c.MODELO_VEHICULO,
        c.PATENTE_VEHICULO,
        `${c.NOMBRE_ALUMNO} ${c.APELLIDO_ALUMNO}`,
        c.RUT_ALUMNO,
        `${c.NOMBRE_INSTRUCTOR} ${c.APELLIDO_INSTRUCTOR}`,
        obtenerEtiquetaClase(c).texto,
      ]);
    });
    descargarPlanilla(`planilla_${nombreSede}_${diaVisible}.csv`, filas);
  };

  const esDiaPasado = diaVisible < hoy;

  return (
    <section>
      {/* Título y acciones */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Agenda semanal</h2>
          <p className="font-body text-sm text-[#0D0D0D]/60 mt-1 max-w-xl">
            Clases prácticas por vehículo y bloque horario. Los vehículos bloqueados por salida a examen no se pueden agendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => abrirAgendar({})} className="btn-amarillo btn-compacto">
            + Agendar clase
          </button>
          <button type="button" onClick={onIrABloqueos} className="btn-contorno btn-compacto">
            Bloquear por salida a examen
          </button>
          <button type="button" onClick={exportarPlanilla} className="btn-contorno btn-compacto">
            Exportar planilla del día
          </button>
        </div>
      </div>

      {/* Sede y semana */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
        <select className="campo md:max-w-[12rem]" value={sedeElegida} onChange={(e) => setIdSede(e.target.value)} aria-label="Sede">
          {sedes.map((s) => (
            <option key={s.ID_SEDE} value={s.ID_SEDE}>Sede {s.NOMBRE}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 font-body text-sm">
          <button type="button" onClick={() => cambiarSemana(-7)} aria-label="Semana anterior" className="btn-redondo">←</button>
          <span className="font-semibold min-w-[11rem] text-center">
            {formatearFecha(semana)} al {formatearFecha(sumarDias(semana, DIAS_AGENDA - 1))}
          </span>
          <button type="button" onClick={() => cambiarSemana(7)} aria-label="Semana siguiente" className="btn-redondo">→</button>
          <button type="button" onClick={irAHoy} className="ml-2 font-semibold underline decoration-[#FFC400] decoration-2 underline-offset-4">Hoy</button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {dias.map((dia) => {
          const cantidad = clasesDelDia(dia).length;
          return (
            <button key={dia} type="button" onClick={() => setDiaActivo(dia)} aria-pressed={dia === diaVisible} className="chip-curso shrink-0 text-left !text-sm !py-1.5 !px-3">
              <span className="block">{formatearDiaCorto(dia)}{dia === hoy ? " · hoy" : ""}</span>
              <span className="block font-body text-xs font-semibold opacity-70">{cantidad} {cantidad === 1 ? "clase" : "clases"}</span>
            </button>
          );
        })}
      </div>

      {/* Matriz: bloques horarios × vehículos */}
      <p className="mt-6 font-display text-lg">{formatearFechaLarga(diaVisible)}</p>
      {cargando && <p className="mt-3 font-body text-sm text-[#0D0D0D]/50">Cargando agenda...</p>}
      {!cargando && errorCarga && <p className="mt-3 font-body text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}
      {!cargando && !errorCarga && vehiculosSede.length === 0 && (
        <p className="mt-3 font-body text-sm text-[#0D0D0D]/50">Esta sede no tiene vehículos registrados. Agrégalos en la sección Vehículos.</p>
      )}

      {!cargando && !errorCarga && vehiculosSede.length > 0 && (
        <div className="mt-3 overflow-x-auto border border-black/10 rounded-md bg-white">
          <table className="w-full min-w-[640px] text-left font-body text-sm">
            <thead className="bg-[#0D0D0D] text-[#FAFAF8]">
              <tr>
                <th className="px-4 py-3 font-semibold w-32">Bloque</th>
                {vehiculosSede.map((v) => (
                  <th key={v.ID_VEHICULO} className="px-4 py-3 font-semibold">
                    {v.MODELO}
                    <span className="block text-xs font-normal text-[#FAFAF8]/60">{v.PATENTE} · {v.TRANSMISION}</span>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold w-36">Capacidad flota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {BLOQUES_HORARIOS.map((bloque) => {
                // Contar cuántos vehículos operativos quedan sin bloqueo en este horario
                const libres = operativosSede.filter((v) => !buscarBloqueo(v, diaVisible, bloque)).length;
                const restringida = libres < operativosSede.length;

                return (
                  <tr key={bloque.inicio} className="align-top">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{bloque.inicio} - {bloque.fin}</td>

                    {vehiculosSede.map((v) => {
                      const clase = buscarClase(v, diaVisible, bloque);
                      const bloqueo = buscarBloqueo(v, diaVisible, bloque);

                      // Celda con una clase agendada
                      if (clase) {
                        const etiqueta = obtenerEtiquetaClase(clase);
                        return (
                          <td key={v.ID_VEHICULO} className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => setClaseVer(clase)}
                              className={
                                estaConfirmada(clase)
                                  ? "w-full text-left rounded-sm px-3 py-2 bg-[#FFC400]/25 border border-[#FFC400] hover:bg-[#FFC400]/40"
                                  : "w-full text-left rounded-sm px-3 py-2 bg-[#0D0D0D]/[0.04] border border-black/10 hover:bg-[#0D0D0D]/10"
                              }
                            >
                              <span className="block font-semibold">{clase.NOMBRE_ALUMNO} {clase.APELLIDO_ALUMNO}</span>
                              <span className="block text-xs text-[#0D0D0D]/60">Inst. {clase.NOMBRE_INSTRUCTOR} {clase.APELLIDO_INSTRUCTOR}</span>
                              <span className="block text-[11px] font-semibold mt-1">{etiqueta.texto}</span>
                            </button>
                          </td>
                        );
                      }

                      // Celda bloqueada por salida a examen u otro motivo
                      if (bloqueo) {
                        return (
                          <td key={v.ID_VEHICULO} className="px-2 py-2">
                            <div className="rounded-sm px-3 py-2 bg-[#E31B23]/10 border border-[#E31B23]/40" title={bloqueo.MOTIVO}>
                              <span className="block font-bold text-[#E31B23] text-xs uppercase">Bloqueado</span>
                              <span className="block text-xs text-[#0D0D0D]/70 line-clamp-2">{bloqueo.MOTIVO}</span>
                            </div>
                          </td>
                        );
                      }

                      // Vehículo en mantención
                      if (v.ESTADO_OPERATIVO === "MANTENCION") {
                        return (
                          <td key={v.ID_VEHICULO} className="px-4 py-3 text-xs text-[#0D0D0D]/40">En mantención</td>
                        );
                      }

                      // Días pasados: no se agenda
                      if (esDiaPasado) {
                        return <td key={v.ID_VEHICULO} className="px-4 py-3 text-[#0D0D0D]/30">—</td>;
                      }

                      // Bloque libre
                      return (
                        <td key={v.ID_VEHICULO} className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => abrirAgendar({ idVehiculo: String(v.ID_VEHICULO), fecha: diaVisible, bloque: `${bloque.inicio}-${bloque.fin}` })}
                            className="w-full rounded-sm px-3 py-2 border-2 border-dashed border-black/15 text-xs font-bold tracking-wide text-[#0D0D0D]/50 hover:border-[#0D0D0D] hover:text-[#0D0D0D] hover:bg-[#FFC400]/10"
                          >
                            DISPONIBLE
                          </button>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 whitespace-nowrap">
                      {restringida ? (
                        <span className="font-semibold text-[#E31B23]">{libres} / {operativosSede.length} activos<span className="block text-xs">Restringida</span></span>
                      ) : (
                        <span className="text-[#0D0D0D]/70">{libres} / {operativosSede.length} activos</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-body text-xs text-[#0D0D0D]/60">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FFC400]/40 border border-[#FFC400]" /> Confirmada por el alumno</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#0D0D0D]/[0.06] border border-black/10" /> Agendada, por confirmar</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#E31B23]/10 border border-[#E31B23]/40" /> Bloqueada</span>
      </div>

      {/* Modales */}
      {agendando && (
        <ModalAgendarClase
          valoresIniciales={agendando}
          sedes={sedes}
          vehiculos={vehiculos}
          alumnos={alumnos}
          instructores={instructores}
          mostrarAlerta={mostrarAlerta}
          onCerrar={() => setAgendando(null)}
          onAgendada={handleAgendada}
        />
      )}
      {claseVer && (
        <ModalDetalleClase
          key={claseVer.ID_CLASE}
          clase={claseVer}
          mostrarAlerta={mostrarAlerta}
          onCerrar={() => setClaseVer(null)}
          onCambio={handleCambioClase}
        />
      )}
    </section>
  );
}

export default MatrizAgendamiento;
