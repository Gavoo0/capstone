import { useState, useEffect } from "react";
import ModalFormulario from "./ModalFormulario";
import ModalConfirmar from "./ModalConfirmar";
import {
  fetchVehiculos,
  crearVehiculo,
  editarVehiculo,
  eliminarVehiculo,
  ESTADOS_VEHICULO,
  TRANSMISIONES,
} from "../../services/vehiculoService";
import { fetchSedes } from "../../services/sedeService";

const FORMULARIO_VACIO = {
  patente: "",
  modelo: "",
  transmision: "Manual",
  idSede: "",
  estadoOperativo: "OPERATIVO",
};

// Texto y estilo de la etiqueta de cada estado
const obtenerEtiquetaEstado = (estado) => {
  if (estado === "OPERATIVO") {
    return { texto: "Operativo", clase: "bg-[#FFC400] text-[#0D0D0D]" };
  } else if (estado === "MANTENCION") {
    return { texto: "En mantención", clase: "bg-[#0D0D0D] text-[#FAFAF8]" };
  } else if (estado === "DE_BAJA") {
    return { texto: "De baja", clase: "border border-[#E31B23] text-[#E31B23]" };
  } else {
    return { texto: estado || "-", clase: "border border-black/20" };
  }
};

function MantenedorVehiculos({ mostrarAlerta, onCambio }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Formulario
  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [idEditando, setIdEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Eliminar
  const [vehiculoPendiente, setVehiculoPendiente] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar vehículos y sedes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosVehiculos, datosSedes] = await Promise.all([fetchVehiculos(), fetchSedes()]);
        setVehiculos(datosVehiculos);
        setSedes(datosSedes);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar vehículos:", error);
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
    setFormData(FORMULARIO_VACIO);
    setIdEditando(null);
    setShowModal(true);
  };

  const abrirEditar = (vehiculo) => {
    setFormData({
      patente: vehiculo.PATENTE,
      modelo: vehiculo.MODELO,
      transmision: vehiculo.TRANSMISION,
      idSede: vehiculo.ID_SEDE ? String(vehiculo.ID_SEDE) : "",
      estadoOperativo: vehiculo.ESTADO_OPERATIVO,
    });
    setIdEditando(vehiculo.ID_VEHICULO);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIdEditando(null);
    setFormData(FORMULARIO_VACIO);
  };

  const guardarVehiculo = async () => {
    // Validar campos obligatorios
    if (!formData.patente.trim() || !formData.modelo.trim() || !formData.transmision) {
      mostrarAlerta("danger", "Completa patente, modelo y transmisión.");
      return;
    }

    const vehiculoFormateado = {
      patente: formData.patente.trim().toUpperCase(), // Patentes siempre en mayúscula
      modelo: formData.modelo.trim(),
      transmision: formData.transmision,
      idSede: formData.idSede ? Number(formData.idSede) : null,
      estadoOperativo: formData.estadoOperativo,
    };

    setGuardando(true);
    try {
      if (idEditando !== null) {
        await editarVehiculo(idEditando, vehiculoFormateado);
        mostrarAlerta("success", "Vehículo actualizado exitosamente");
      } else {
        await crearVehiculo(vehiculoFormateado);
        mostrarAlerta("success", "Vehículo creado exitosamente");
      }
      cerrarModal();
      refrescarLista();
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      mostrarAlerta("danger", error.message || "Error al guardar vehículo");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await eliminarVehiculo(vehiculoPendiente.ID_VEHICULO);
      mostrarAlerta("success", "Vehículo eliminado exitosamente");
      refrescarLista();
    } catch (error) {
      console.error("Error al eliminar vehículo:", error);
      mostrarAlerta("danger", error.message || "Error al eliminar vehículo");
    } finally {
      setEliminando(false);
      setVehiculoPendiente(null);
    }
  };

  return (
    <section>
      {/* Título y botón para crear */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Vehículos</h2>
          <p className="font-body text-sm text-[#0D0D0D]/60 mt-1">Flota de instrucción de cada sede y su estado.</p>
        </div>
        <button type="button" onClick={abrirCrear} className="btn-amarillo btn-compacto w-fit">
          + Nuevo vehículo
        </button>
      </div>

      {/* Tarjetas de vehículos */}
      {cargando && <p className="mt-6 font-body text-sm text-[#0D0D0D]/50">Cargando vehículos...</p>}
      {!cargando && errorCarga && <p className="mt-6 font-body text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}
      {!cargando && !errorCarga && vehiculos.length === 0 && (
        <p className="mt-6 font-body text-sm text-[#0D0D0D]/50">Todavía no hay vehículos registrados.</p>
      )}

      <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehiculos.map((vehiculo) => {
          const etiqueta = obtenerEtiquetaEstado(vehiculo.ESTADO_OPERATIVO);
          return (
            <article key={vehiculo.ID_VEHICULO} className="bg-white border border-black/10 rounded-md overflow-hidden font-body">
              {/* Patente estilo placa chilena */}
              <div className="flex items-center justify-between bg-[#0D0D0D] px-4 py-3">
                <span className="font-display text-lg tracking-widest bg-[#FAFAF8] text-[#0D0D0D] px-3 py-0.5 rounded-sm border-2 border-[#0D0D0D] outline outline-1 outline-[#FAFAF8]">
                  {vehiculo.PATENTE}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${etiqueta.clase}`}>{etiqueta.texto}</span>
              </div>

              <div className="px-4 py-4">
                <p className="font-display text-lg leading-tight">{vehiculo.MODELO}</p>
                <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                  <dt className="text-[#0D0D0D]/50">Transmisión</dt>
                  <dd className="font-semibold">{vehiculo.TRANSMISION}</dd>
                  <dt className="text-[#0D0D0D]/50">Sede</dt>
                  <dd className="font-semibold">{vehiculo.NOMBRE_SEDE || "Sin sede"}</dd>
                </dl>

                <div className="mt-4 flex gap-4 text-sm font-semibold">
                  <button type="button" onClick={() => abrirEditar(vehiculo)} className="hover:text-[#E6B000]">Editar</button>
                  <button type="button" onClick={() => setVehiculoPendiente(vehiculo)} className="text-[#E31B23] hover:underline">Eliminar</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal para crear o editar */}
      <ModalFormulario
        titulo={idEditando !== null ? "Editar vehículo" : "Nuevo vehículo"}
        abierto={showModal}
        guardando={guardando}
        onCerrar={cerrarModal}
        onGuardar={guardarVehiculo}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="v-patente" className="campo-etiqueta">Patente</label>
            <input id="v-patente" name="patente" className="campo uppercase" placeholder="ABCD12" value={formData.patente} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="v-transmision" className="campo-etiqueta">Transmisión</label>
            <select id="v-transmision" name="transmision" className="campo" value={formData.transmision} onChange={handleChange}>
              {TRANSMISIONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="v-modelo" className="campo-etiqueta">Modelo</label>
          <input id="v-modelo" name="modelo" className="campo" placeholder="Toyota Yaris 2022" value={formData.modelo} onChange={handleChange} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="v-sede" className="campo-etiqueta">Sede</label>
            <select id="v-sede" name="idSede" className="campo" value={formData.idSede} onChange={handleChange}>
              <option value="">Sin sede</option>
              {sedes.map((sede) => (
                <option key={sede.ID_SEDE} value={sede.ID_SEDE}>{sede.NOMBRE}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="v-estado" className="campo-etiqueta">Estado</label>
            <select id="v-estado" name="estadoOperativo" className="campo" value={formData.estadoOperativo} onChange={handleChange}>
              {ESTADOS_VEHICULO.map((estado) => (
                <option key={estado.valor} value={estado.valor}>{estado.texto}</option>
              ))}
            </select>
          </div>
        </div>
      </ModalFormulario>

      {/* Confirmar eliminación */}
      <ModalConfirmar
        abierto={vehiculoPendiente !== null}
        titulo="Eliminar vehículo"
        mensaje={vehiculoPendiente ? `¿Seguro que quieres eliminar el vehículo ${vehiculoPendiente.PATENTE}? Si tiene clases o bloqueos, mejor cámbialo a "De baja".` : ""}
        procesando={eliminando}
        onCancelar={() => setVehiculoPendiente(null)}
        onConfirmar={confirmarEliminacion}
      />
    </section>
  );
}

export default MantenedorVehiculos;
