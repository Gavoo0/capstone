import { useState, useEffect } from "react";
import ModalFormulario from "./ModalFormulario";
import ModalConfirmar from "./ModalConfirmar";
import { fetchBloqueos, crearBloqueo, editarBloqueo, eliminarBloqueo } from "../../services/bloqueoService";
import { fetchVehiculos } from "../../services/vehiculoService";
import { fetchUsuarios } from "../../services/usuarioService";
import { fechaParaInput, formatearFecha, fechaHoy } from "../../utils/fechas";

const MOTIVO_EXAMEN = "Salida a examen práctico municipal";

const FORMULARIO_VACIO = {
  idVehiculo: "",
  idInstructor: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  motivo: MOTIVO_EXAMEN,
};

function MantenedorBloqueos({ mostrarAlerta, onCambio }) {
  const [bloqueos, setBloqueos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);
  const [verPasados, setVerPasados] = useState(false); // Mostrar también bloqueos de días anteriores

  // Formulario
  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [idEditando, setIdEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Levantar bloqueo
  const [bloqueoPendiente, setBloqueoPendiente] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar bloqueos, vehículos e instructores
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosBloqueos, datosVehiculos, datosUsuarios] = await Promise.all([fetchBloqueos(), fetchVehiculos(), fetchUsuarios()]);
        setBloqueos(datosBloqueos);
        setVehiculos(datosVehiculos);

        // Dejar solo los usuarios con rol instructor
        const soloInstructores = datosUsuarios.filter((u) => String(u.NOMBRE_ROL || "").toUpperCase().includes("INSTRUCTOR"));
        setInstructores(soloInstructores);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar bloqueos:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [recargar]);

  const refrescarLista = () => {
    setRecargar(recargar + 1);
    onCambio();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirCrear = () => {
    setFormData({ ...FORMULARIO_VACIO, fecha: fechaHoy() });
    setIdEditando(null);
    setShowModal(true);
  };

  const abrirEditar = (bloqueo) => {
    setFormData({
      idVehiculo: String(bloqueo.ID_VEHICULO),
      idInstructor: bloqueo.ID_INSTRUCTOR ? String(bloqueo.ID_INSTRUCTOR) : "",
      fecha: fechaParaInput(bloqueo.FECHA),
      horaInicio: bloqueo.HORA_INICIO,
      horaFin: bloqueo.HORA_FIN,
      motivo: bloqueo.MOTIVO,
    });
    setIdEditando(bloqueo.ID_BLOQUEO);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIdEditando(null);
    setFormData(FORMULARIO_VACIO);
  };

  const guardarBloqueo = async () => {
    // Validar campos obligatorios
    if (!formData.idVehiculo || !formData.fecha || !formData.horaInicio || !formData.horaFin || !formData.motivo.trim()) {
      mostrarAlerta("danger", "Completa vehículo, fecha, horario y motivo.");
      return;
    }

    // Validar que la hora de término sea después de la de inicio (formato HH:MM)
    if (formData.horaFin <= formData.horaInicio) {
      mostrarAlerta("danger", "La hora de término debe ser después de la hora de inicio.");
      return;
    }

    const bloqueoFormateado = {
      idVehiculo: Number(formData.idVehiculo),
      idInstructor: formData.idInstructor ? Number(formData.idInstructor) : null,
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      motivo: formData.motivo.trim(),
    };

    setGuardando(true);
    try {
      if (idEditando !== null) {
        await editarBloqueo(idEditando, bloqueoFormateado);
        mostrarAlerta("success", "Bloqueo actualizado exitosamente");
      } else {
        await crearBloqueo(bloqueoFormateado);
        mostrarAlerta("success", "Bloqueo creado: el vehículo queda fuera de la agenda en ese horario");
      }
      cerrarModal();
      refrescarLista();
    } catch (error) {
      // Si choca con clases ya agendadas, el backend devuelve el motivo en el mensaje
      console.error("Error al guardar bloqueo:", error);
      mostrarAlerta("danger", error.message || "Error al guardar bloqueo");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarLevantar = async () => {
    setEliminando(true);
    try {
      await eliminarBloqueo(bloqueoPendiente.ID_BLOQUEO);
      mostrarAlerta("success", "Bloqueo levantado: el vehículo vuelve a estar disponible");
      refrescarLista();
    } catch (error) {
      console.error("Error al levantar bloqueo:", error);
      mostrarAlerta("danger", error.message || "Error al levantar bloqueo");
    } finally {
      setEliminando(false);
      setBloqueoPendiente(null);
    }
  };

  // Filtrar por fecha (por defecto solo hoy y días siguientes) y ordenar del más próximo al más lejano
  const hoy = fechaHoy();
  const bloqueosVisibles = bloqueos
    .filter((b) => verPasados || fechaParaInput(b.FECHA) >= hoy)
    .sort((a, b) => {
      const claveA = `${fechaParaInput(a.FECHA)} ${a.HORA_INICIO}`;
      const claveB = `${fechaParaInput(b.FECHA)} ${b.HORA_INICIO}`;
      return claveA.localeCompare(claveB);
    });

  return (
    <section>
      {/* Título y botón para crear */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Bloqueos de flota</h2>
          <p className="font-body text-sm text-[#0D0D0D]/60 mt-1 max-w-xl">
            Bloquea un vehículo (y su instructor) cuando sale a examen práctico en la Dirección de Tránsito, para que no se agenden clases en ese horario.
          </p>
        </div>
        <button type="button" onClick={abrirCrear} className="btn-amarillo btn-compacto w-fit">
          + Nuevo bloqueo
        </button>
      </div>

      {/* Filtro de pasados */}
      <label className="mt-6 inline-flex items-center gap-2 font-body text-sm text-[#0D0D0D]/70">
        <input type="checkbox" checked={verPasados} onChange={(e) => setVerPasados(e.target.checked)} className="w-4 h-4 accent-[#0D0D0D]" />
        Mostrar bloqueos de días anteriores
      </label>

      {/* Tabla de bloqueos */}
      <div className="mt-4 overflow-x-auto border border-black/10 rounded-md bg-white">
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-[#0D0D0D] text-[#FAFAF8]">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Horario</th>
              <th className="px-4 py-3 font-semibold">Vehículo</th>
              <th className="px-4 py-3 font-semibold">Instructor</th>
              <th className="px-4 py-3 font-semibold">Motivo</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {cargando && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-[#0D0D0D]/50">Cargando bloqueos...</td></tr>
            )}
            {!cargando && errorCarga && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-[#E31B23] font-semibold">{errorCarga}</td></tr>
            )}
            {!cargando && !errorCarga && bloqueosVisibles.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-[#0D0D0D]/50">No hay bloqueos programados: la flota está completa.</td></tr>
            )}
            {!cargando && !errorCarga && bloqueosVisibles.map((bloqueo) => {
              const esHoy = fechaParaInput(bloqueo.FECHA) === hoy;
              return (
                <tr key={bloqueo.ID_BLOQUEO} className="hover:bg-[#FFC400]/10">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold">{formatearFecha(bloqueo.FECHA)}</span>
                    {esHoy && <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-[#E31B23] text-[#FAFAF8] text-[11px] font-semibold">HOY</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{bloqueo.HORA_INICIO} - {bloqueo.HORA_FIN}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold">{bloqueo.PATENTE}</span>
                    <span className="text-[#0D0D0D]/50"> · {bloqueo.MODELO}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {bloqueo.ID_INSTRUCTOR ? `${bloqueo.NOMBRE_INSTRUCTOR} ${bloqueo.APELLIDO_INSTRUCTOR}` : "-"}
                  </td>
                  <td className="px-4 py-3">{bloqueo.MOTIVO}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 whitespace-nowrap font-semibold">
                      <button type="button" onClick={() => abrirEditar(bloqueo)} className="hover:text-[#E6B000]">Editar</button>
                      <button type="button" onClick={() => setBloqueoPendiente(bloqueo)} className="text-[#E31B23] hover:underline">Levantar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal para crear o editar */}
      <ModalFormulario
        titulo={idEditando !== null ? "Editar bloqueo" : "Nuevo bloqueo"}
        abierto={showModal}
        guardando={guardando}
        onCerrar={cerrarModal}
        onGuardar={guardarBloqueo}
      >
        <div>
          <label htmlFor="b-vehiculo" className="campo-etiqueta">Vehículo</label>
          <select id="b-vehiculo" name="idVehiculo" className="campo" value={formData.idVehiculo} onChange={handleChange}>
            <option value="">Selecciona un vehículo</option>
            {vehiculos.map((v) => (
              <option key={v.ID_VEHICULO} value={v.ID_VEHICULO}>
                {v.PATENTE} · {v.MODELO}{v.NOMBRE_SEDE ? ` (${v.NOMBRE_SEDE})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="b-instructor" className="campo-etiqueta">Instructor que acompaña (opcional)</label>
          <select id="b-instructor" name="idInstructor" className="campo" value={formData.idInstructor} onChange={handleChange}>
            <option value="">Sin instructor</option>
            {instructores.map((i) => (
              <option key={i.ID_USUARIO} value={i.ID_USUARIO}>{i.NOMBRE} {i.APELLIDO}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="b-fecha" className="campo-etiqueta">Fecha</label>
            <input id="b-fecha" name="fecha" type="date" className="campo" value={formData.fecha} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="b-inicio" className="campo-etiqueta">Desde</label>
            <input id="b-inicio" name="horaInicio" type="time" className="campo" value={formData.horaInicio} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="b-fin" className="campo-etiqueta">Hasta</label>
            <input id="b-fin" name="horaFin" type="time" className="campo" value={formData.horaFin} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label htmlFor="b-motivo" className="campo-etiqueta">Motivo</label>
          <input id="b-motivo" name="motivo" className="campo" value={formData.motivo} onChange={handleChange} />
        </div>
      </ModalFormulario>

      {/* Confirmar levantar bloqueo */}
      <ModalConfirmar
        abierto={bloqueoPendiente !== null}
        titulo="Levantar bloqueo"
        mensaje={bloqueoPendiente ? `El vehículo ${bloqueoPendiente.PATENTE} volverá a estar disponible el ${formatearFecha(bloqueoPendiente.FECHA)} de ${bloqueoPendiente.HORA_INICIO} a ${bloqueoPendiente.HORA_FIN}.` : ""}
        textoBoton="Levantar bloqueo"
        procesando={eliminando}
        onCancelar={() => setBloqueoPendiente(null)}
        onConfirmar={confirmarLevantar}
      />
    </section>
  );
}

export default MantenedorBloqueos;
