import { useState, useEffect, useRef } from "react";
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
import { fetchMarcas, fetchModelos } from "../../services/catalogoVehiculoService";
import { textoVehiculoValido, anioVehiculoValido } from "../../utils/validaciones";

// Valor especial de los selects para escribir la marca o el modelo a mano
const OTRO = "__otro__";
const ANIO_MINIMO = 1990;

const FORMULARIO_VACIO = {
  patente: "",
  marca: "",
  marcaOtra: "",
  modelo: "",
  modeloOtro: "",
  anio: "",
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

  // Catálogo de marcas y modelos
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState({ recomendados: [], otros: [], fuenteExterna: true });
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const consultaModelos = useRef(0); // Evita que una respuesta vieja pise a una más nueva

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

  // Cargar las marcas una sola vez; si falla, el formulario queda en modo manual
  useEffect(() => {
    const cargarMarcas = async () => {
      try {
        setMarcas(await fetchMarcas());
      } catch (error) {
        console.error("Error al cargar el catálogo de marcas:", error);
      }
    };

    cargarMarcas();
  }, []);

  const refrescarLista = () => {
    setRecargar(recargar + 1);
    onCambio();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Carga los modelos de una marca. Si llega "modeloInicial" (al editar), lo deja seleccionado
  // o, si no está en el catálogo, lo pasa a "Otro modelo".
  const cargarModelos = async (marca, modeloInicial = "") => {
    const numeroConsulta = consultaModelos.current + 1;
    consultaModelos.current = numeroConsulta;
    setModelos({ recomendados: [], otros: [], fuenteExterna: true });

    if (!marca || marca === OTRO) {
      setCargandoModelos(false);
      return;
    }

    setCargandoModelos(true);
    try {
      const resultado = await fetchModelos(marca);
      if (numeroConsulta !== consultaModelos.current) return;
      setModelos(resultado);
      if (modeloInicial) {
        const estaEnCatalogo = [...resultado.recomendados, ...resultado.otros].includes(modeloInicial);
        setFormData((anterior) => ({
          ...anterior,
          modelo: estaEnCatalogo ? modeloInicial : OTRO,
          modeloOtro: estaEnCatalogo ? "" : modeloInicial,
        }));
      }
    } catch (error) {
      if (numeroConsulta !== consultaModelos.current) return;
      console.error("Error al cargar modelos:", error);
      mostrarAlerta("danger", "No se pudo cargar el catálogo de modelos. Puedes escribir el modelo a mano.");
      if (modeloInicial) {
        setFormData((anterior) => ({ ...anterior, modelo: OTRO, modeloOtro: modeloInicial }));
      }
    } finally {
      if (numeroConsulta === consultaModelos.current) setCargandoModelos(false);
    }
  };

  const cambiarMarca = (e) => {
    const marca = e.target.value;
    setFormData({ ...formData, marca, marcaOtra: "", modelo: "", modeloOtro: "" });
    cargarModelos(marca);
  };

  const abrirCrear = () => {
    cargarModelos("");
    setFormData(FORMULARIO_VACIO);
    setIdEditando(null);
    setShowModal(true);
  };

  const abrirEditar = (vehiculo) => {
    // Vehículos antiguos no tienen marca/modelo/año separados: se deben completar al editar
    const marca = vehiculo.MARCA || "";
    const marcaEnCatalogo = marcas.includes(marca);
    setFormData({
      patente: vehiculo.PATENTE,
      marca: marca && !marcaEnCatalogo ? OTRO : marca,
      marcaOtra: marca && !marcaEnCatalogo ? marca : "",
      modelo: "",
      modeloOtro: marca && !marcaEnCatalogo ? vehiculo.MODELO_NOMBRE || "" : "",
      anio: vehiculo.ANIO ? String(vehiculo.ANIO) : "",
      transmision: vehiculo.TRANSMISION,
      idSede: vehiculo.ID_SEDE ? String(vehiculo.ID_SEDE) : "",
      estadoOperativo: vehiculo.ESTADO_OPERATIVO,
    });
    setIdEditando(vehiculo.ID_VEHICULO);
    setShowModal(true);
    cargarModelos(marcaEnCatalogo ? marca : "", vehiculo.MODELO_NOMBRE || "");
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIdEditando(null);
    setFormData(FORMULARIO_VACIO);
    cargarModelos("");
  };

  const guardarVehiculo = async () => {
    // Validar campos obligatorios
    const marca = (formData.marca === OTRO ? formData.marcaOtra : formData.marca).trim();
    const modeloNombre = (formData.modelo === OTRO ? formData.modeloOtro : formData.modelo).trim();

    if (!formData.patente.trim() || !marca || !modeloNombre || !formData.anio || !formData.transmision) {
      mostrarAlerta("danger", "Completa patente, marca, modelo, año y transmisión.");
      return;
    }
    if (!textoVehiculoValido(marca) || !textoVehiculoValido(modeloNombre)) {
      mostrarAlerta("danger", "La marca y el modelo solo pueden llevar letras, números, espacios y . ' / + -");
      return;
    }
    if (!anioVehiculoValido(formData.anio)) {
      mostrarAlerta("danger", `El año debe estar entre ${ANIO_MINIMO} y ${new Date().getFullYear() + 1}.`);
      return;
    }

    const vehiculoFormateado = {
      patente: formData.patente.trim().toUpperCase(), // Patentes siempre en mayúscula
      marca,
      modeloNombre,
      anio: Number(formData.anio),
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
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="v-marca" className="campo-etiqueta">Marca</label>
            <select id="v-marca" name="marca" className="campo" value={formData.marca} onChange={cambiarMarca}>
              <option value="">Selecciona una marca</option>
              {marcas.map((marca) => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
              <option value={OTRO}>Otra marca...</option>
            </select>
            {formData.marca === OTRO && (
              <input name="marcaOtra" className="campo mt-2" placeholder="Escribe la marca" aria-label="Otra marca" value={formData.marcaOtra} onChange={handleChange} />
            )}
          </div>
          <div>
            <label htmlFor="v-modelo" className="campo-etiqueta">Modelo</label>
            {formData.marca === OTRO ? (
              <input id="v-modelo" name="modeloOtro" className="campo" placeholder="Escribe el modelo" value={formData.modeloOtro} onChange={(e) => setFormData({ ...formData, modelo: OTRO, modeloOtro: e.target.value })} />
            ) : (
              <select id="v-modelo" name="modelo" className="campo" value={formData.modelo} onChange={handleChange} disabled={!formData.marca || cargandoModelos}>
                <option value="">{cargandoModelos ? "Cargando..." : formData.marca ? "Selecciona un modelo" : "Elige primero la marca"}</option>
                {modelos.recomendados.length > 0 && (
                  <optgroup label="Habituales en Chile">
                    {modelos.recomendados.map((modelo) => (
                      <option key={modelo} value={modelo}>{modelo}</option>
                    ))}
                  </optgroup>
                )}
                {modelos.otros.length > 0 && (
                  <optgroup label="Otros modelos">
                    {modelos.otros.map((modelo) => (
                      <option key={modelo} value={modelo}>{modelo}</option>
                    ))}
                  </optgroup>
                )}
                {formData.marca && <option value={OTRO}>Otro modelo...</option>}
              </select>
            )}
            {formData.marca !== OTRO && formData.modelo === OTRO && (
              <input name="modeloOtro" className="campo mt-2" placeholder="Escribe el modelo" aria-label="Otro modelo" value={formData.modeloOtro} onChange={handleChange} />
            )}
          </div>
          <div>
            <label htmlFor="v-anio" className="campo-etiqueta">Año</label>
            <select id="v-anio" name="anio" className="campo" value={formData.anio} onChange={handleChange}>
              <option value="">Año</option>
              {Array.from({ length: new Date().getFullYear() + 1 - ANIO_MINIMO + 1 }, (_, i) => new Date().getFullYear() + 1 - i).map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>
        </div>
        {!modelos.fuenteExterna && formData.marca && formData.marca !== OTRO && (
          <p className="aviso-info">No se pudo consultar el catálogo externo; se muestran solo los modelos habituales. Si falta uno, usa "Otro modelo".</p>
        )}
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
