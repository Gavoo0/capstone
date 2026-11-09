import { useState } from "react";
import ModalFormulario from "./ModalFormulario";
import { agendarClase } from "../../services/claseService";
import { estaHabilitado, ASISTENCIA_MINIMA } from "../../services/alumnoService";
import { BLOQUES_HORARIOS } from "../../data/agenda";

// Formulario para agendar una clase práctica
// valoresIniciales llega desde la matriz cuando se aprieta un bloque "Disponible"
function ModalAgendarClase({ valoresIniciales, sedes, vehiculos, alumnos, instructores, mostrarAlerta, onCerrar, onAgendada }) {
  const [formData, setFormData] = useState({
    idAlumno: "",
    idInstructor: "",
    idSede: valoresIniciales.idSede || "",
    idVehiculo: valoresIniciales.idVehiculo || "",
    fecha: valoresIniciales.fecha || "",
    bloque: valoresIniciales.bloque || "",
    observaciones: "",
  });
  const [guardando, setGuardando] = useState(false);

  // Al cambiar la sede se limpia el vehículo, porque cada vehículo pertenece a una sede
  const handleChange = (e) => {
    if (e.target.name === "idSede") {
      setFormData({ ...formData, idSede: e.target.value, idVehiculo: "" });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Vehículos que se pueden usar en la sede elegida
  const vehiculosSede = vehiculos.filter((v) => String(v.ID_SEDE) === formData.idSede && v.ESTADO_OPERATIVO === "OPERATIVO");

  // Alumno elegido, para avisar si todavía no cumple los requisitos
  const alumnoElegido = alumnos.find((a) => String(a.ID_USUARIO) === formData.idAlumno);

  const guardarClase = async () => {
    // Validar campos obligatorios
    if (!formData.idAlumno || !formData.idInstructor || !formData.idSede || !formData.idVehiculo || !formData.fecha || !formData.bloque) {
      mostrarAlerta("danger", "Completa alumno, instructor, sede, vehículo, fecha y bloque.");
      return;
    }

    const [horaInicio, horaFin] = formData.bloque.split("-");

    const claseFormateada = {
      idAlumno: Number(formData.idAlumno),
      idInstructor: Number(formData.idInstructor),
      idSede: Number(formData.idSede),
      idVehiculo: Number(formData.idVehiculo),
      fecha: formData.fecha,
      horaInicio,
      horaFin,
      observaciones: formData.observaciones.trim() || null,
    };

    setGuardando(true);
    try {
      const nuevaClase = await agendarClase(claseFormateada);
      mostrarAlerta("success", "Clase agendada exitosamente");
      onAgendada(nuevaClase);
    } catch (error) {
      // El backend avisa si el alumno no está habilitado o si hay choque de horario
      console.error("Error al agendar clase:", error);
      mostrarAlerta("danger", error.message || "Error al agendar la clase");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ModalFormulario titulo="Agendar clase práctica" abierto={true} guardando={guardando} onCerrar={onCerrar} onGuardar={guardarClase}>
      <div>
        <label htmlFor="c-alumno" className="campo-etiqueta">Alumno</label>
        <select id="c-alumno" name="idAlumno" className="campo" value={formData.idAlumno} onChange={handleChange}>
          <option value="">Selecciona un alumno</option>
          {alumnos.map((a) => (
            <option key={a.ID_USUARIO} value={a.ID_USUARIO}>
              {a.APELLIDO}, {a.NOMBRE} · {a.RUT}{estaHabilitado(a) ? "" : " (no habilitado)"}
            </option>
          ))}
        </select>
        {alumnoElegido && !estaHabilitado(alumnoElegido) && (
          <p className="mt-2 text-xs text-[#E31B23] font-semibold">
            Este alumno todavía no cumple los requisitos para practicar (psicotécnico aprobado y al menos {ASISTENCIA_MINIMA}% de asistencia teórica). El sistema no dejará agendar.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="c-instructor" className="campo-etiqueta">Instructor</label>
        <select id="c-instructor" name="idInstructor" className="campo" value={formData.idInstructor} onChange={handleChange}>
          <option value="">Selecciona un instructor</option>
          {instructores.map((i) => (
            <option key={i.ID_USUARIO} value={i.ID_USUARIO}>
              {i.NOMBRE} {i.APELLIDO}{i.NOMBRE_SEDE ? ` (${i.NOMBRE_SEDE})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="c-sede" className="campo-etiqueta">Sede</label>
          <select id="c-sede" name="idSede" className="campo" value={formData.idSede} onChange={handleChange}>
            <option value="">Selecciona una sede</option>
            {sedes.map((s) => (
              <option key={s.ID_SEDE} value={s.ID_SEDE}>{s.NOMBRE}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-vehiculo" className="campo-etiqueta">Vehículo</label>
          <select id="c-vehiculo" name="idVehiculo" className="campo" value={formData.idVehiculo} onChange={handleChange} disabled={!formData.idSede}>
            <option value="">{formData.idSede ? "Selecciona un vehículo" : "Elige primero la sede"}</option>
            {vehiculosSede.map((v) => (
              <option key={v.ID_VEHICULO} value={v.ID_VEHICULO}>{v.PATENTE} · {v.MODELO} ({v.TRANSMISION})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="c-fecha" className="campo-etiqueta">Fecha</label>
          <input id="c-fecha" name="fecha" type="date" className="campo" value={formData.fecha} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="c-bloque" className="campo-etiqueta">Bloque horario</label>
          <select id="c-bloque" name="bloque" className="campo" value={formData.bloque} onChange={handleChange}>
            <option value="">Selecciona un bloque</option>
            {BLOQUES_HORARIOS.map((b) => (
              <option key={b.inicio} value={`${b.inicio}-${b.fin}`}>{b.inicio} a {b.fin}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="c-observaciones" className="campo-etiqueta">Observaciones (opcional)</label>
        <input id="c-observaciones" name="observaciones" className="campo" placeholder="Ej: primera clase en calle" value={formData.observaciones} onChange={handleChange} />
      </div>
    </ModalFormulario>
  );
}

export default ModalAgendarClase;
