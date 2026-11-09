import { useState, useEffect } from "react";
import { obtenerSesion } from "../services/sesion";
import { fetchUsuarios } from "../services/usuarioService";
import { fetchVehiculos } from "../services/vehiculoService";
import { fetchBloqueos } from "../services/bloqueoService";
import { fetchClases } from "../services/claseService";
import { fechaParaInput, fechaHoy } from "../utils/fechas";
import useAlerta from "../hooks/useAlerta";
import BarraPanel from "../components/panel/BarraPanel";
import MenuSecciones from "../components/panel/MenuSecciones";
import AlertaFlotante from "../components/panel/AlertaFlotante";
import MatrizAgendamiento from "../components/admin/MatrizAgendamiento";
import MantenedorAlumnos from "../components/admin/MantenedorAlumnos";
import MantenedorUsuarios from "../components/admin/MantenedorUsuarios";
import MantenedorVehiculos from "../components/admin/MantenedorVehiculos";
import MantenedorSedes from "../components/admin/MantenedorSedes";
import MantenedorBloqueos from "../components/admin/MantenedorBloqueos";

// Secciones del menú del panel
const SECCIONES = [
  { id: "agenda", titulo: "Agenda semanal", icono: "🗓️" },
  { id: "bloqueos", titulo: "Bloqueos de flota", icono: "⛔" },
  { id: "alumnos", titulo: "Alumnos", icono: "🎓" },
  { id: "vehiculos", titulo: "Vehículos", icono: "🚗" },
  { id: "usuarios", titulo: "Usuarios", icono: "👤" },
  { id: "sedes", titulo: "Sedes", icono: "📍" },
];

// Panel del administrador (la ruta ya está protegida por RutaPrivada en App.jsx)
function AgendamientoAdmin() {
  const sesion = obtenerSesion();
  const [seccionActiva, setSeccionActiva] = useState("agenda");
  const { mensajeAlerta, tipoAlerta, mostrarAlerta } = useAlerta();

  // Resumen de la parte superior
  const [resumen, setResumen] = useState(null);
  const [recargarResumen, setRecargarResumen] = useState(0);

  // Cargar el resumen (se vuelve a cargar cada vez que una sección guarda algo)
  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const hoy = fechaHoy();
        const [usuarios, vehiculos, bloqueos, clasesHoy] = await Promise.all([
          fetchUsuarios(),
          fetchVehiculos(),
          fetchBloqueos(),
          fetchClases({ fecha: hoy }),
        ]);

        // Contar vehículos operativos y cuántos de ellos tienen algún bloqueo hoy
        const operativos = vehiculos.filter((v) => v.ESTADO_OPERATIVO === "OPERATIVO");
        const bloqueosHoy = bloqueos.filter((b) => fechaParaInput(b.FECHA) === hoy);
        const vehiculosBloqueadosHoy = new Set(bloqueosHoy.map((b) => b.ID_VEHICULO));

        setResumen({
          usuariosActivos: usuarios.filter((u) => u.ESTADO_ACTIVO).length,
          alumnos: usuarios.filter((u) => String(u.NOMBRE_ROL || "").toUpperCase().includes("ALUMNO")).length,
          vehiculosOperativos: operativos.length,
          vehiculosLibresHoy: operativos.filter((v) => !vehiculosBloqueadosHoy.has(v.ID_VEHICULO)).length,
          bloqueosHoy: bloqueosHoy.length,
          clasesHoy: clasesHoy.filter((c) => c.ESTADO !== "CANCELADA").length,
        });
      } catch (error) {
        console.error("Error al cargar resumen:", error);
        setResumen(null); // Si falla, cada sección muestra su propio error
      }
    };

    cargarResumen();
  }, [recargarResumen]);

  const actualizarResumen = () => {
    setRecargarResumen(recargarResumen + 1);
  };

  // Obtener el contenido de la sección elegida
  const mostrarSeccion = () => {
    if (seccionActiva === "bloqueos") {
      return <MantenedorBloqueos mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else if (seccionActiva === "alumnos") {
      return <MantenedorAlumnos mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else if (seccionActiva === "vehiculos") {
      return <MantenedorVehiculos mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else if (seccionActiva === "usuarios") {
      return <MantenedorUsuarios mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else if (seccionActiva === "sedes") {
      return <MantenedorSedes mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else {
      return <MatrizAgendamiento mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} onIrABloqueos={() => setSeccionActiva("bloqueos")} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D] flex flex-col">
      <BarraPanel etiqueta="ADMIN" sesion={sesion} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <MenuSecciones secciones={SECCIONES} seccionActiva={seccionActiva} onCambiar={setSeccionActiva} />

        {/* Contenido */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          {/* Resumen del día */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-[#0D0D0D] text-[#FAFAF8] rounded-md p-4">
              <p className="font-body text-xs text-[#FAFAF8]/60">Flota libre hoy</p>
              <p className="font-display text-3xl mt-1">
                {resumen ? resumen.vehiculosLibresHoy : "-"}
                <span className="text-lg text-[#FAFAF8]/50"> / {resumen ? resumen.vehiculosOperativos : "-"}</span>
              </p>
              <p className="font-body text-xs text-[#FFC400] mt-1">vehículos sin bloqueos</p>
            </div>
            <div className="bg-white border border-black/10 rounded-md p-4">
              <p className="font-body text-xs text-[#0D0D0D]/50">Clases prácticas hoy</p>
              <p className="font-display text-3xl mt-1">{resumen ? resumen.clasesHoy : "-"}</p>
              <p className="font-body text-xs text-[#0D0D0D]/50 mt-1">en ambas sedes</p>
            </div>
            <div className="bg-white border border-black/10 rounded-md p-4">
              <p className="font-body text-xs text-[#0D0D0D]/50">Bloqueos hoy</p>
              <p className={resumen && resumen.bloqueosHoy > 0 ? "font-display text-3xl mt-1 text-[#E31B23]" : "font-display text-3xl mt-1"}>
                {resumen ? resumen.bloqueosHoy : "-"}
              </p>
              <p className="font-body text-xs text-[#0D0D0D]/50 mt-1">salidas a examen u otros</p>
            </div>
            <div className="bg-white border border-black/10 rounded-md p-4">
              <p className="font-body text-xs text-[#0D0D0D]/50">Usuarios activos</p>
              <p className="font-display text-3xl mt-1">{resumen ? resumen.usuariosActivos : "-"}</p>
              <p className="font-body text-xs text-[#0D0D0D]/50 mt-1">{resumen ? `${resumen.alumnos} alumnos` : "-"}</p>
            </div>
          </div>

          {/* Sección elegida */}
          <div className="mt-10">{mostrarSeccion()}</div>
        </main>
      </div>

      <AlertaFlotante mensaje={mensajeAlerta} tipo={tipoAlerta} />
    </div>
  );
}

export default AgendamientoAdmin;
