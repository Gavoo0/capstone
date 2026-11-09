import { useState, useEffect } from "react";
import ModalFormulario from "../admin/ModalFormulario";
import ModalConfirmar from "../admin/ModalConfirmar";
import ModalPerfilAlumno from "./ModalPerfilAlumno";
import { fetchAlumnos } from "../../services/alumnoService";
import {
  fetchEvaluaciones,
  crearEvaluacion,
  editarEvaluacion,
  eliminarEvaluacion,
  formatearNota,
  TIPOS_EVALUACION,
} from "../../services/evaluacionService";
import { fechaParaInput, fechaHoy, formatearFecha } from "../../utils/fechas";

const FORMULARIO_VACIO = {
  idAlumno: "",
  tipoEvaluacion: TIPOS_EVALUACION[0],
  nota: "",
  fecha: "",
  observaciones: "",
};

// Ingreso de notas de exámenes teóricos y prácticos
function NotasInstructor({ sesion, mostrarAlerta }) {
  const idInstructor = sesion.ID_USUARIO;

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);
  const [busqueda, setBusqueda] = useState("");

  // Formulario
  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [idEditando, setIdEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Eliminar y ver perfil
  const [evaluacionPendiente, setEvaluacionPendiente] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [idAlumnoVer, setIdAlumnoVer] = useState(null);

  // Cargar las notas que puso este instructor y la lista de alumnos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosEvaluaciones, datosAlumnos] = await Promise.all([fetchEvaluaciones({ idInstructor }), fetchAlumnos()]);
        setEvaluaciones(datosEvaluaciones);
        setAlumnos(datosAlumnos.filter((a) => a.ESTADO_ACTIVO));
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar evaluaciones:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [idInstructor, recargar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirCrear = () => {
    setFormData({ ...FORMULARIO_VACIO, fecha: fechaHoy() });
    setIdEditando(null);
    setShowModal(true);
  };

  const abrirEditar = (evaluacion) => {
    setFormData({
      idAlumno: String(evaluacion.ID_ALUMNO),
      tipoEvaluacion: evaluacion.TIPO_EVALUACION,
      nota: String(evaluacion.NOTA),
      fecha: fechaParaInput(evaluacion.FECHA),
      observaciones: evaluacion.OBSERVACIONES || "",
    });
    setIdEditando(evaluacion.ID_EVALUACION);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIdEditando(null);
    setFormData(FORMULARIO_VACIO);
  };

  const guardarEvaluacion = async () => {
    // Validar campos obligatorios
    if (!formData.idAlumno || !formData.tipoEvaluacion.trim() || !formData.nota || !formData.fecha) {
      mostrarAlerta("danger", "Completa alumno, tipo de evaluación, nota y fecha.");
      return;
    }

    // Validar la nota (se acepta coma o punto: 5,5 o 5.5)
    const nota = parseFloat(String(formData.nota).replace(",", "."));
    if (isNaN(nota) || nota < 1 || nota > 7) {
      mostrarAlerta("danger", "La nota debe estar entre 1,0 y 7,0.");
      return;
    }

    const evaluacionFormateada = {
      tipoEvaluacion: formData.tipoEvaluacion.trim(),
      nota,
      fecha: formData.fecha,
      observaciones: formData.observaciones.trim() || null,
    };

    setGuardando(true);
    try {
      if (idEditando !== null) {
        await editarEvaluacion(idEditando, evaluacionFormateada);
        mostrarAlerta("success", "Nota actualizada exitosamente");
      } else {
        await crearEvaluacion({ ...evaluacionFormateada, idAlumno: Number(formData.idAlumno), idInstructor });
        mostrarAlerta("success", "Nota registrada exitosamente");
      }
      cerrarModal();
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al guardar evaluación:", error);
      mostrarAlerta("danger", error.message || "Error al guardar la nota");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await eliminarEvaluacion(evaluacionPendiente.ID_EVALUACION);
      mostrarAlerta("success", "Nota eliminada");
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al eliminar evaluación:", error);
      mostrarAlerta("danger", error.message || "Error al eliminar la nota");
    } finally {
      setEliminando(false);
      setEvaluacionPendiente(null);
    }
  };

  // Buscar por alumno o tipo de evaluación
  const textoBusqueda = busqueda.trim().toLowerCase();
  const evaluacionesFiltradas = evaluaciones.filter((e) => {
    const texto = `${e.NOMBRE_ALUMNO} ${e.APELLIDO_ALUMNO} ${e.RUT_ALUMNO} ${e.TIPO_EVALUACION}`.toLowerCase();
    return textoBusqueda === "" || texto.includes(textoBusqueda);
  });

  return (
    <section>
      {/* Título y botón para crear */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Notas</h2>
          <p className="font-body text-sm text-[#0D0D0D]/60 mt-1">Notas de los exámenes que has tomado (escala de 1,0 a 7,0).</p>
        </div>
        <button type="button" onClick={abrirCrear} className="btn-amarillo btn-compacto w-fit">
          + Ingresar nota
        </button>
      </div>

      <input type="search" className="campo sm:max-w-xs mt-6" placeholder="Buscar por alumno o evaluación" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

      {/* Tabla de notas */}
      <div className="mt-4 overflow-x-auto border border-black/10 rounded-md bg-white">
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-[#0D0D0D] text-[#FAFAF8]">
            <tr>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Alumno</th>
              <th className="px-4 py-3 font-semibold">Evaluación</th>
              <th className="px-4 py-3 font-semibold text-right">Nota</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {cargando && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-[#0D0D0D]/50">Cargando notas...</td></tr>
            )}
            {!cargando && errorCarga && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-[#E31B23] font-semibold">{errorCarga}</td></tr>
            )}
            {!cargando && !errorCarga && evaluacionesFiltradas.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-[#0D0D0D]/50">Todavía no ingresas notas.</td></tr>
            )}
            {!cargando && !errorCarga && evaluacionesFiltradas.map((e) => (
              <tr key={e.ID_EVALUACION} className="hover:bg-[#FFC400]/10">
                <td className="px-4 py-3 whitespace-nowrap">{formatearFecha(e.FECHA)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button type="button" onClick={() => setIdAlumnoVer(e.ID_ALUMNO)} className="font-semibold hover:underline decoration-[#FFC400] decoration-2 underline-offset-4">
                    {e.NOMBRE_ALUMNO} {e.APELLIDO_ALUMNO}
                  </button>
                  <span className="block text-xs text-[#0D0D0D]/50">{e.RUT_ALUMNO}</span>
                </td>
                <td className="px-4 py-3">
                  {e.TIPO_EVALUACION}
                  {e.OBSERVACIONES && <span className="block text-xs text-[#0D0D0D]/50">{e.OBSERVACIONES}</span>}
                </td>
                <td className={parseFloat(e.NOTA) >= 4 ? "px-4 py-3 text-right font-display text-lg" : "px-4 py-3 text-right font-display text-lg text-[#E31B23]"}>
                  {formatearNota(e.NOTA)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 whitespace-nowrap font-semibold">
                    <button type="button" onClick={() => abrirEditar(e)} className="hover:text-[#E6B000]">Editar</button>
                    <button type="button" onClick={() => setEvaluacionPendiente(e)} className="text-[#E31B23] hover:underline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear o editar */}
      <ModalFormulario
        titulo={idEditando !== null ? "Editar nota" : "Ingresar nota"}
        abierto={showModal}
        guardando={guardando}
        onCerrar={cerrarModal}
        onGuardar={guardarEvaluacion}
      >
        <div>
          <label htmlFor="n-alumno" className="campo-etiqueta">Alumno</label>
          <select id="n-alumno" name="idAlumno" className="campo" value={formData.idAlumno} onChange={handleChange} disabled={idEditando !== null}>
            <option value="">Selecciona un alumno</option>
            {alumnos.map((a) => (
              <option key={a.ID_USUARIO} value={a.ID_USUARIO}>{a.APELLIDO}, {a.NOMBRE} · {a.RUT}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="n-tipo" className="campo-etiqueta">Tipo de evaluación</label>
          <input id="n-tipo" name="tipoEvaluacion" list="tipos-evaluacion" className="campo" value={formData.tipoEvaluacion} onChange={handleChange} />
          <datalist id="tipos-evaluacion">
            {TIPOS_EVALUACION.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="n-nota" className="campo-etiqueta">Nota</label>
            <input id="n-nota" name="nota" inputMode="decimal" className="campo" placeholder="Ej: 5,5" value={formData.nota} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="n-fecha" className="campo-etiqueta">Fecha</label>
            <input id="n-fecha" name="fecha" type="date" className="campo" value={formData.fecha} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label htmlFor="n-observaciones" className="campo-etiqueta">Observaciones (opcional)</label>
          <textarea id="n-observaciones" name="observaciones" rows="2" className="campo" value={formData.observaciones} onChange={handleChange} />
        </div>
      </ModalFormulario>

      {/* Confirmar eliminación */}
      <ModalConfirmar
        abierto={evaluacionPendiente !== null}
        titulo="Eliminar nota"
        mensaje={evaluacionPendiente ? `¿Seguro que quieres eliminar la nota ${formatearNota(evaluacionPendiente.NOTA)} de ${evaluacionPendiente.NOMBRE_ALUMNO} (${evaluacionPendiente.TIPO_EVALUACION})?` : ""}
        procesando={eliminando}
        onCancelar={() => setEvaluacionPendiente(null)}
        onConfirmar={confirmarEliminacion}
      />

      {idAlumnoVer && <ModalPerfilAlumno key={idAlumnoVer} idAlumno={idAlumnoVer} onCerrar={() => setIdAlumnoVer(null)} />}
    </section>
  );
}

export default NotasInstructor;
