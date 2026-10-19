import { useState, useEffect } from "react";
import ModalFormulario from "./ModalFormulario";
import ModalConfirmar from "./ModalConfirmar";
import { fetchSedes, crearSede, editarSede, eliminarSede } from "../../services/sedeService";

const FORMULARIO_VACIO = {
  nombre: "",
  direccion: "",
  telefono: "",
};

function MantenedorSedes({ mostrarAlerta, onCambio }) {
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
  const [sedePendiente, setSedePendiente] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar sedes
  useEffect(() => {
    const cargarSedes = async () => {
      try {
        const datos = await fetchSedes();
        setSedes(datos);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar sedes:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarSedes();
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

  const abrirEditar = (sede) => {
    setFormData({
      nombre: sede.NOMBRE,
      direccion: sede.DIRECCION,
      telefono: sede.TELEFONO || "",
    });
    setIdEditando(sede.ID_SEDE);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIdEditando(null);
    setFormData(FORMULARIO_VACIO);
  };

  const guardarSede = async () => {
    // Validar campos obligatorios
    if (!formData.nombre.trim() || !formData.direccion.trim()) {
      mostrarAlerta("danger", "Completa el nombre y la dirección de la sede.");
      return;
    }

    const sedeFormateada = {
      nombre: formData.nombre.trim(),
      direccion: formData.direccion.trim(),
      telefono: formData.telefono.trim() || null,
    };

    setGuardando(true);
    try {
      if (idEditando !== null) {
        await editarSede(idEditando, sedeFormateada);
        mostrarAlerta("success", "Sede actualizada exitosamente");
      } else {
        await crearSede(sedeFormateada);
        mostrarAlerta("success", "Sede creada exitosamente");
      }
      cerrarModal();
      refrescarLista();
    } catch (error) {
      console.error("Error al guardar sede:", error);
      mostrarAlerta("danger", error.message || "Error al guardar sede");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await eliminarSede(sedePendiente.ID_SEDE);
      mostrarAlerta("success", "Sede eliminada exitosamente");
      refrescarLista();
    } catch (error) {
      console.error("Error al eliminar sede:", error);
      mostrarAlerta("danger", error.message || "Error al eliminar sede");
    } finally {
      setEliminando(false);
      setSedePendiente(null);
    }
  };

  return (
    <section>
      {/* Título y botón para crear */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Sedes</h2>
          <p className="font-body text-sm text-[#0D0D0D]/60 mt-1">Sucursales que aparecen en la página pública y en los formularios.</p>
        </div>
        <button type="button" onClick={abrirCrear} className="btn-amarillo btn-compacto w-fit">
          + Nueva sede
        </button>
      </div>

      {cargando && <p className="mt-6 font-body text-sm text-[#0D0D0D]/50">Cargando sedes...</p>}
      {!cargando && errorCarga && <p className="mt-6 font-body text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}
      {!cargando && !errorCarga && sedes.length === 0 && (
        <p className="mt-6 font-body text-sm text-[#0D0D0D]/50">Todavía no hay sedes registradas.</p>
      )}

      {/* Tarjetas de sedes */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {sedes.map((sede) => (
          <article key={sede.ID_SEDE} className="tarjeta-sede bg-white font-body">
            <div className="flex-1">
              <h3 className="font-display text-2xl">Sede {sede.NOMBRE}</h3>
              <p className="mt-1 text-[#0D0D0D]/70">{sede.DIRECCION}</p>
              <p className="text-sm text-[#0D0D0D]/70">{sede.TELEFONO ? `Tel. ${sede.TELEFONO}` : "Sin teléfono registrado"}</p>

              <div className="mt-5 flex gap-4 text-sm font-semibold">
                <button type="button" onClick={() => abrirEditar(sede)} className="hover:text-[#E6B000]">Editar</button>
                <button type="button" onClick={() => setSedePendiente(sede)} className="text-[#E31B23] hover:underline">Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Modal para crear o editar */}
      <ModalFormulario
        titulo={idEditando !== null ? "Editar sede" : "Nueva sede"}
        abierto={showModal}
        guardando={guardando}
        onCerrar={cerrarModal}
        onGuardar={guardarSede}
      >
        <div>
          <label htmlFor="s-nombre" className="campo-etiqueta">Nombre</label>
          <input id="s-nombre" name="nombre" className="campo" placeholder="Macul" value={formData.nombre} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="s-direccion" className="campo-etiqueta">Dirección</label>
          <input id="s-direccion" name="direccion" className="campo" placeholder="Av. Macul 4186, Macul" value={formData.direccion} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="s-telefono" className="campo-etiqueta">Teléfono (opcional)</label>
          <input id="s-telefono" name="telefono" type="tel" className="campo" placeholder="+56 2 2345 6789" value={formData.telefono} onChange={handleChange} />
        </div>
      </ModalFormulario>

      {/* Confirmar eliminación */}
      <ModalConfirmar
        abierto={sedePendiente !== null}
        titulo="Eliminar sede"
        mensaje={sedePendiente ? `¿Seguro que quieres eliminar la sede ${sedePendiente.NOMBRE}? No se puede si tiene vehículos, clases o usuarios asociados.` : ""}
        procesando={eliminando}
        onCancelar={() => setSedePendiente(null)}
        onConfirmar={confirmarEliminacion}
      />
    </section>
  );
}

export default MantenedorSedes;
