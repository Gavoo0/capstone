import { useState, useEffect } from "react";
import ModalFormulario from "./ModalFormulario";
import EtiquetaEstado from "../panel/EtiquetaEstado";
import {
  fetchAlumnos,
  actualizarPsicotecnico,
  estaHabilitado,
  obtenerEtiquetaPsicotecnico,
  ESTADOS_PSICOTECNICO,
  ASISTENCIA_MINIMA,
} from "../../services/alumnoService";
import { fechaParaInput, formatearFecha, fechaHoy } from "../../utils/fechas";

const FORMULARIO_VACIO = {
  estadoPsicotecnico: "PENDIENTE",
  fechaEvaluacion: "",
  observacion: "",
};

function MantenedorAlumnos({ mostrarAlerta, onCambio }) {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Formulario del psicotécnico
  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Cargar alumnos con su ficha académica
  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const datos = await fetchAlumnos();
        setAlumnos(datos);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar alumnos:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarAlumnos();
  }, [recargar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirPsicotecnico = (alumno) => {
    setFormData({
      estadoPsicotecnico: String(alumno.ESTADO_PSICOTECNICO || "PENDIENTE").toUpperCase(),
      fechaEvaluacion: fechaParaInput(alumno.FECHA_EVALUACION_PSICOTECNICA) || fechaHoy(),
      observacion: alumno.OBSERVACION_PSICOTECNICA || "",
    });
    setAlumnoEditando(alumno);
  };

  const cerrarModal = () => {
    setAlumnoEditando(null);
    setFormData(FORMULARIO_VACIO);
  };

  const guardarPsicotecnico = async () => {
    // Validar campos obligatorios
    if (!formData.estadoPsicotecnico || !formData.fechaEvaluacion) {
      mostrarAlerta("danger", "Completa el resultado y la fecha de la evaluación.");
      return;
    }

    const psicotecnicoFormateado = {
      estadoPsicotecnico: formData.estadoPsicotecnico,
      fechaEvaluacion: formData.fechaEvaluacion,
      observacion: formData.observacion.trim() || null,
    };

    setGuardando(true);
    try {
      await actualizarPsicotecnico(alumnoEditando.ID_USUARIO, psicotecnicoFormateado);
      mostrarAlerta("success", `Psicotécnico de ${alumnoEditando.NOMBRE} actualizado`);
      cerrarModal();
      setRecargar(recargar + 1);
      onCambio();
    } catch (error) {
      console.error("Error al guardar psicotécnico:", error);
      mostrarAlerta("danger", error.message || "Error al guardar el psicotécnico");
    } finally {
      setGuardando(false);
    }
  };

  // Aplicar búsqueda (nombre, apellido o RUT) y filtro por estado del psicotécnico
  const textoBusqueda = busqueda.trim().toLowerCase();
  const alumnosFiltrados = alumnos.filter((a) => {
    const estado = String(a.ESTADO_PSICOTECNICO || "PENDIENTE").toUpperCase();
    const coincideEstado = filtroEstado === "" || estado === filtroEstado;
    const textoAlumno = `${a.NOMBRE} ${a.APELLIDO} ${a.RUT}`.toLowerCase();
    const coincideBusqueda = textoBusqueda === "" || textoAlumno.includes(textoBusqueda);
    return coincideEstado && coincideBusqueda;
  });

  return (
    <section>
      {/* Título */}
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Alumnos</h2>
        <p className="font-body text-sm text-[#0D0D0D]/60 mt-1 max-w-xl">
          Ficha académica de cada alumno. Para agendar prácticas necesita el psicotécnico aprobado y al menos {ASISTENCIA_MINIMA}% de asistencia teórica.
          Los alumnos nuevos se crean en la sección Usuarios con el rol ALUMNO.
        </p>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input type="search" className="campo sm:max-w-xs" placeholder="Buscar por nombre o RUT" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        <select className="campo sm:max-w-[14rem]" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos los psicotécnicos</option>
          {ESTADOS_PSICOTECNICO.map((estado) => (
            <option key={estado.valor} value={estado.valor}>{estado.texto}</option>
          ))}
        </select>
      </div>

      {/* Tabla de alumnos */}
      <div className="mt-4 overflow-x-auto border border-black/10 rounded-md bg-white">
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-[#0D0D0D] text-[#FAFAF8]">
            <tr>
              <th className="px-4 py-3 font-semibold">Alumno</th>
              <th className="px-4 py-3 font-semibold">Sede</th>
              <th className="px-4 py-3 font-semibold">Psicotécnico</th>
              <th className="px-4 py-3 font-semibold">Asistencia teórica</th>
              <th className="px-4 py-3 font-semibold">Prácticas</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {cargando && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-[#0D0D0D]/50">Cargando alumnos...</td></tr>
            )}
            {!cargando && errorCarga && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-[#E31B23] font-semibold">{errorCarga}</td></tr>
            )}
            {!cargando && !errorCarga && alumnosFiltrados.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-[#0D0D0D]/50">No hay alumnos para mostrar.</td></tr>
            )}
            {!cargando && !errorCarga && alumnosFiltrados.map((alumno) => {
              const asistencia = parseFloat(alumno.PORCENTAJE_ASISTENCIA_TEORICA) || 0;
              const habilitado = estaHabilitado(alumno);
              return (
                <tr key={alumno.ID_USUARIO} className="hover:bg-[#FFC400]/10">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="block font-semibold">{alumno.NOMBRE} {alumno.APELLIDO}</span>
                    <span className="block text-xs text-[#0D0D0D]/50">{alumno.RUT}{alumno.ESTADO_ACTIVO ? "" : " · cuenta inactiva"}</span>
                  </td>
                  <td className="px-4 py-3">{alumno.NOMBRE_SEDE || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EtiquetaEstado etiqueta={obtenerEtiquetaPsicotecnico(alumno.ESTADO_PSICOTECNICO)} />
                    {alumno.FECHA_EVALUACION_PSICOTECNICA && (
                      <span className="block text-xs text-[#0D0D0D]/50 mt-1">{formatearFecha(alumno.FECHA_EVALUACION_PSICOTECNICA)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-[9rem]">
                    <span className="font-semibold">{asistencia.toFixed(0)}%</span>
                    <div className="mt-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.min(asistencia, 100)}%`, backgroundColor: asistencia >= ASISTENCIA_MINIMA ? "#FFC400" : "#E31B23" }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {habilitado ? (
                      <span className="font-semibold">Habilitado</span>
                    ) : (
                      <span className="text-[#E31B23] font-semibold">No habilitado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => abrirPsicotecnico(alumno)} className="font-semibold whitespace-nowrap hover:text-[#E6B000]">
                      Registrar psicotécnico
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal del psicotécnico */}
      <ModalFormulario
        titulo={alumnoEditando ? `Psicotécnico de ${alumnoEditando.NOMBRE} ${alumnoEditando.APELLIDO}` : ""}
        abierto={alumnoEditando !== null}
        guardando={guardando}
        onCerrar={cerrarModal}
        onGuardar={guardarPsicotecnico}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-estado" className="campo-etiqueta">Resultado</label>
            <select id="p-estado" name="estadoPsicotecnico" className="campo" value={formData.estadoPsicotecnico} onChange={handleChange}>
              {ESTADOS_PSICOTECNICO.map((estado) => (
                <option key={estado.valor} value={estado.valor}>{estado.texto}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-fecha" className="campo-etiqueta">Fecha de evaluación</label>
            <input id="p-fecha" name="fechaEvaluacion" type="date" className="campo" value={formData.fechaEvaluacion} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label htmlFor="p-observacion" className="campo-etiqueta">Observación (opcional)</label>
          <textarea id="p-observacion" name="observacion" rows="3" className="campo" placeholder="Ej: Válido para Dirección de Tránsito" value={formData.observacion} onChange={handleChange} />
        </div>
      </ModalFormulario>
    </section>
  );
}

export default MantenedorAlumnos;
