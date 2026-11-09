import { useState, useEffect } from "react";
import { fetchAlumnos, ASISTENCIA_MINIMA } from "../../services/alumnoService";
import { fetchAsistencias, registrarAsistenciaMasiva } from "../../services/asistenciaService";
import { fechaParaInput, fechaHoy, formatearFecha } from "../../utils/fechas";

// Nombres sugeridos para los bloques teóricos (se puede escribir cualquier otro)
const BLOQUES_SUGERIDOS = [
  "Ley de tránsito",
  "Señalética y normas de tránsito",
  "Conducción defensiva",
  "Mecánica básica",
  "Primeros auxilios",
];

// Registro de asistencia de un bloque teórico (reemplaza la planilla de papel)
function AsistenciaTeorica({ sesion, mostrarAlerta }) {
  const idInstructor = sesion.ID_USUARIO;

  const [alumnos, setAlumnos] = useState([]);
  const [registros, setRegistros] = useState([]); // Asistencias que ya registró este instructor
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0);

  // Datos del bloque
  const [nombreBloque, setNombreBloque] = useState("");
  const [fecha, setFecha] = useState(fechaHoy());
  const [soloMiSede, setSoloMiSede] = useState(Boolean(sesion.ID_SEDE));
  const [busqueda, setBusqueda] = useState("");
  const [marcas, setMarcas] = useState({}); // { idAlumno: "PRESENTE" | "AUSENTE" }
  const [guardando, setGuardando] = useState(false);

  // Cargar alumnos y los registros anteriores del instructor
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosAlumnos, datosRegistros] = await Promise.all([fetchAlumnos(), fetchAsistencias({ idInstructor })]);
        setAlumnos(datosAlumnos.filter((a) => a.ESTADO_ACTIVO));
        setRegistros(datosRegistros);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar alumnos:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [idInstructor, recargar]);

  // Marcar o desmarcar (si se aprieta el mismo estado otra vez, el alumno queda sin registrar)
  const marcarAlumno = (idAlumno, estado) => {
    const nuevasMarcas = { ...marcas };
    if (nuevasMarcas[idAlumno] === estado) {
      delete nuevasMarcas[idAlumno];
    } else {
      nuevasMarcas[idAlumno] = estado;
    }
    setMarcas(nuevasMarcas);
  };

  // Alumnos que se muestran en la lista (por sede y búsqueda)
  const textoBusqueda = busqueda.trim().toLowerCase();
  const alumnosVisibles = alumnos.filter((a) => {
    const coincideSede = !soloMiSede || a.ID_SEDE === sesion.ID_SEDE;
    const coincideBusqueda = textoBusqueda === "" || `${a.NOMBRE} ${a.APELLIDO} ${a.RUT}`.toLowerCase().includes(textoBusqueda);
    return coincideSede && coincideBusqueda;
  });

  const marcarTodosPresentes = () => {
    const nuevasMarcas = { ...marcas };
    alumnosVisibles.forEach((a) => {
      nuevasMarcas[a.ID_USUARIO] = "PRESENTE";
    });
    setMarcas(nuevasMarcas);
  };

  const cantidadMarcados = Object.keys(marcas).length;

  const guardarAsistencia = async () => {
    // Validar datos del bloque
    if (!nombreBloque.trim() || !fecha) {
      mostrarAlerta("danger", "Completa el nombre del bloque y la fecha.");
      return;
    }
    if (cantidadMarcados === 0) {
      mostrarAlerta("danger", "Marca al menos un alumno como presente o ausente.");
      return;
    }

    const asistenciaFormateada = {
      idInstructor,
      nombreBloque: nombreBloque.trim(),
      fecha,
      asistencias: Object.entries(marcas).map(([idAlumno, estado]) => ({ idAlumno: Number(idAlumno), estado })),
    };

    setGuardando(true);
    try {
      await registrarAsistenciaMasiva(asistenciaFormateada);
      mostrarAlerta("success", `Asistencia registrada para ${cantidadMarcados} ${cantidadMarcados === 1 ? "alumno" : "alumnos"}`);
      setMarcas({});
      setRecargar(recargar + 1);
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      mostrarAlerta("danger", error.message || "Error al registrar la asistencia");
    } finally {
      setGuardando(false);
    }
  };

  // Agrupar los registros anteriores por bloque y fecha (solo los últimos 8 bloques)
  const bloquesRegistrados = [];
  registros.forEach((r) => {
    const clave = `${fechaParaInput(r.FECHA)}|${r.NOMBRE_BLOQUE}`;
    let grupo = bloquesRegistrados.find((g) => g.clave === clave);
    if (!grupo) {
      grupo = { clave, fecha: r.FECHA, nombre: r.NOMBRE_BLOQUE, presentes: 0, total: 0 };
      bloquesRegistrados.push(grupo);
    }
    grupo.total += 1;
    if (String(r.ESTADO).toUpperCase() === "PRESENTE") {
      grupo.presentes += 1;
    }
  });

  return (
    <section>
      {/* Título */}
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Asistencia teórica</h2>
        <p className="font-body text-sm text-[#0D0D0D]/60 mt-1 max-w-xl">
          Registra quién asistió al bloque. El porcentaje de asistencia de cada alumno se actualiza solo en su tarjeta de avance.
        </p>
      </div>

      <div className="mt-6 grid xl:grid-cols-[1fr_300px] gap-8">
        <div className="min-w-0">
          {/* Datos del bloque */}
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 bg-white border border-black/10 rounded-md p-4">
            <div>
              <label htmlFor="a-bloque" className="campo-etiqueta">Bloque teórico</label>
              <input id="a-bloque" list="bloques-sugeridos" className="campo" placeholder="Ej: Ley de tránsito" value={nombreBloque} onChange={(e) => setNombreBloque(e.target.value)} />
              <datalist id="bloques-sugeridos">
                {BLOQUES_SUGERIDOS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="a-fecha" className="campo-etiqueta">Fecha</label>
              <input id="a-fecha" type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          {/* Filtros de la lista */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <input type="search" className="campo sm:max-w-xs !mt-0" placeholder="Buscar alumno" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            {sesion.ID_SEDE && (
              <label className="inline-flex items-center gap-2 font-body text-sm text-[#0D0D0D]/70">
                <input type="checkbox" checked={soloMiSede} onChange={(e) => setSoloMiSede(e.target.checked)} className="w-4 h-4 accent-[#0D0D0D]" />
                Solo alumnos de mi sede
              </label>
            )}
            <button type="button" onClick={marcarTodosPresentes} className="sm:ml-auto font-body text-sm font-semibold underline decoration-[#FFC400] decoration-2 underline-offset-4">
              Marcar todos presentes
            </button>
          </div>

          {/* Lista de alumnos */}
          <div className="mt-4 border border-black/10 rounded-md bg-white divide-y divide-black/10">
            {cargando && <p className="px-4 py-6 text-center font-body text-sm text-[#0D0D0D]/50">Cargando alumnos...</p>}
            {!cargando && errorCarga && <p className="px-4 py-6 text-center font-body text-sm text-[#E31B23] font-semibold">{errorCarga}</p>}
            {!cargando && !errorCarga && alumnosVisibles.length === 0 && (
              <p className="px-4 py-6 text-center font-body text-sm text-[#0D0D0D]/50">No hay alumnos para mostrar.</p>
            )}
            {!cargando && !errorCarga && alumnosVisibles.map((a) => {
              const marca = marcas[a.ID_USUARIO];
              const asistencia = parseFloat(a.PORCENTAJE_ASISTENCIA_TEORICA) || 0;
              return (
                <div key={a.ID_USUARIO} className="flex items-center gap-4 px-4 py-3 font-body">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.NOMBRE} {a.APELLIDO}</p>
                    <p className="text-xs text-[#0D0D0D]/50">
                      {a.RUT} · <span className={asistencia >= ASISTENCIA_MINIMA ? "" : "text-[#E31B23] font-semibold"}>{asistencia.toFixed(0)}% asistencia</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 rounded-sm border-2 border-[#0D0D0D] overflow-hidden text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => marcarAlumno(a.ID_USUARIO, "PRESENTE")}
                      aria-pressed={marca === "PRESENTE"}
                      className={marca === "PRESENTE" ? "px-3 py-1.5 bg-[#FFC400]" : "px-3 py-1.5 hover:bg-black/5"}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() => marcarAlumno(a.ID_USUARIO, "AUSENTE")}
                      aria-pressed={marca === "AUSENTE"}
                      className={marca === "AUSENTE" ? "px-3 py-1.5 border-l-2 border-[#0D0D0D] bg-[#E31B23] text-[#FAFAF8]" : "px-3 py-1.5 border-l-2 border-[#0D0D0D] hover:bg-black/5"}
                    >
                      Ausente
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guardar */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-4">
            <span className="font-body text-sm text-[#0D0D0D]/60">{cantidadMarcados} {cantidadMarcados === 1 ? "alumno marcado" : "alumnos marcados"}</span>
            {cantidadMarcados > 0 && (
              <button type="button" onClick={() => setMarcas({})} className="font-body text-sm font-semibold hover:text-[#E31B23]">
                Limpiar
              </button>
            )}
            <button type="button" onClick={guardarAsistencia} disabled={guardando} className="btn-amarillo btn-compacto">
              {guardando ? "Guardando..." : "Guardar asistencia"}
            </button>
          </div>
        </div>

        {/* Bloques ya registrados */}
        <aside>
          <h3 className="font-display text-lg">Bloques registrados</h3>
          {!cargando && bloquesRegistrados.length === 0 && (
            <p className="mt-2 font-body text-sm text-[#0D0D0D]/50">Todavía no registras asistencias.</p>
          )}
          <ul className="mt-2 space-y-2">
            {bloquesRegistrados.slice(0, 8).map((g) => (
              <li key={g.clave} className="border border-black/10 rounded-md bg-white px-4 py-3 font-body">
                <p className="text-sm font-semibold">{g.nombre}</p>
                <p className="text-xs text-[#0D0D0D]/60">{formatearFecha(g.fecha)} · {g.presentes} de {g.total} presentes</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

export default AsistenciaTeorica;
