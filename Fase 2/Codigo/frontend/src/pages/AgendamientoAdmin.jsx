import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { obtenerSesion, cerrarSesion, rutaPorRol } from "../services/sesion";
import { fetchUsuarios } from "../services/usuarioService";
import { fetchVehiculos } from "../services/vehiculoService";
import { fetchBloqueos } from "../services/bloqueoService";
import { fechaParaInput, fechaHoy } from "../utils/fechas";
import MantenedorUsuarios from "../components/admin/MantenedorUsuarios";
import MantenedorVehiculos from "../components/admin/MantenedorVehiculos";
import MantenedorSedes from "../components/admin/MantenedorSedes";
import MantenedorBloqueos from "../components/admin/MantenedorBloqueos";

// Secciones del menú del panel
const SECCIONES = [
  { id: "bloqueos", titulo: "Bloqueos de flota", icono: "⛔" },
  { id: "vehiculos", titulo: "Vehículos", icono: "🚗" },
  { id: "usuarios", titulo: "Usuarios", icono: "👤" },
  { id: "sedes", titulo: "Sedes", icono: "📍" },
];

// Revisar que haya sesión de administrador antes de mostrar el panel
// (esto solo ordena la navegación, la seguridad real la tiene que dar el backend con JWT)
function AgendamientoAdmin() {
  const sesion = obtenerSesion();

  if (!sesion || rutaPorRol(sesion.NOMBRE_ROL) !== "/admin/agendamiento") {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <PanelAdmin sesion={sesion} />;
}

function PanelAdmin({ sesion }) {
  const navigate = useNavigate();
  const [seccionActiva, setSeccionActiva] = useState("bloqueos");

  // Alerta flotante
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [tipoAlerta, setTipoAlerta] = useState("success");

  // Resumen de la parte superior
  const [resumen, setResumen] = useState(null);
  const [recargarResumen, setRecargarResumen] = useState(0);

  // Cargar el resumen (se vuelve a cargar cada vez que un mantenedor guarda algo)
  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const [usuarios, vehiculos, bloqueos] = await Promise.all([fetchUsuarios(), fetchVehiculos(), fetchBloqueos()]);
        const hoy = fechaHoy();

        // Contar vehículos operativos y cuántos de ellos tienen algún bloqueo hoy
        const operativos = vehiculos.filter((v) => v.ESTADO_OPERATIVO === "OPERATIVO");
        const bloqueosHoy = bloqueos.filter((b) => fechaParaInput(b.FECHA) === hoy);
        const vehiculosBloqueadosHoy = new Set(bloqueosHoy.map((b) => b.ID_VEHICULO));

        setResumen({
          usuariosActivos: usuarios.filter((u) => u.ESTADO_ACTIVO).length,
          alumnos: usuarios.filter((u) => String(u.NOMBRE_ROL || "").toUpperCase().includes("ALUMNO")).length,
          vehiculosOperativos: operativos.length,
          totalVehiculos: vehiculos.length,
          bloqueosHoy: bloqueosHoy.length,
          vehiculosLibresHoy: operativos.filter((v) => !vehiculosBloqueadosHoy.has(v.ID_VEHICULO)).length,
        });
      } catch (error) {
        console.error("Error al cargar resumen:", error);
        setResumen(null); // Si falla, cada sección muestra su propio error
      }
    };

    cargarResumen();
  }, [recargarResumen]);

  const mostrarAlerta = (tipo, mensaje) => {
    setTipoAlerta(tipo);
    setMensajeAlerta(mensaje);
    setTimeout(() => setMensajeAlerta(null), 4000);
  };

  const actualizarResumen = () => {
    setRecargarResumen(recargarResumen + 1);
  };

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate("/iniciar-sesion");
  };

  // Obtener el mantenedor de la sección elegida
  const mostrarSeccion = () => {
    if (seccionActiva === "usuarios") {
      return <MantenedorUsuarios mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else if (seccionActiva === "vehiculos") {
      return <MantenedorVehiculos mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else if (seccionActiva === "sedes") {
      return <MantenedorSedes mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    } else {
      return <MantenedorBloqueos mostrarAlerta={mostrarAlerta} onCambio={actualizarResumen} />;
    }
  };

  const nombreAdmin = `${sesion.NOMBRE || ""} ${sesion.APELLIDO || ""}`.trim() || "Administrador";

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D] flex flex-col">
      <div className="h-2 w-full stripe-hazard shrink-0" />

      {/* Barra superior */}
      <header className="bg-[#0D0D0D] text-[#FAFAF8]">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-display text-lg">
            <img src="/logo/logo-nav.png" alt="" className="h-8 w-8 object-contain" />
            <span className="hidden sm:inline">
              Futuro <span className="text-[#FFC400]">·</span> Conductores
            </span>
            <span className="ml-1 px-2 py-0.5 rounded-sm bg-[#FFC400] text-[#0D0D0D] font-body text-xs font-bold">ADMIN</span>
          </Link>
          <div className="flex items-center gap-4 font-body text-sm">
            <span className="hidden md:inline text-[#FAFAF8]/70">{nombreAdmin}</span>
            <button type="button" onClick={handleCerrarSesion} className="text-[#FAFAF8]/60 hover:text-[#FFC400]">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Menú lateral (en celular queda como pestañas arriba) */}
        <nav className="bg-[#1E1E1B] lg:w-60 shrink-0">
          <ul className="flex lg:flex-col overflow-x-auto lg:overflow-visible px-3 py-3 lg:py-6 gap-1 font-body text-sm">
            {SECCIONES.map((seccion) => (
              <li key={seccion.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSeccionActiva(seccion.id)}
                  aria-current={seccionActiva === seccion.id ? "page" : undefined}
                  className={
                    seccionActiva === seccion.id
                      ? "w-full flex items-center gap-3 px-4 py-2.5 rounded-sm bg-[#FFC400] text-[#0D0D0D] font-semibold"
                      : "w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-[#FAFAF8]/70 hover:bg-white/10 hover:text-[#FAFAF8]"
                  }
                >
                  <span aria-hidden="true">{seccion.icono}</span>
                  <span className="whitespace-nowrap">{seccion.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contenido */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          {/* Resumen de la escuela */}
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
              <p className="font-body text-xs text-[#0D0D0D]/50">Bloqueos hoy</p>
              <p className={resumen && resumen.bloqueosHoy > 0 ? "font-display text-3xl mt-1 text-[#E31B23]" : "font-display text-3xl mt-1"}>
                {resumen ? resumen.bloqueosHoy : "-"}
              </p>
              <p className="font-body text-xs text-[#0D0D0D]/50 mt-1">salidas a examen u otros</p>
            </div>
            <div className="bg-white border border-black/10 rounded-md p-4">
              <p className="font-body text-xs text-[#0D0D0D]/50">Vehículos operativos</p>
              <p className="font-display text-3xl mt-1">
                {resumen ? resumen.vehiculosOperativos : "-"}
                <span className="text-lg text-[#0D0D0D]/40"> / {resumen ? resumen.totalVehiculos : "-"}</span>
              </p>
              <p className="font-body text-xs text-[#0D0D0D]/50 mt-1">del total de la flota</p>
            </div>
            <div className="bg-white border border-black/10 rounded-md p-4">
              <p className="font-body text-xs text-[#0D0D0D]/50">Usuarios activos</p>
              <p className="font-display text-3xl mt-1">{resumen ? resumen.usuariosActivos : "-"}</p>
              <p className="font-body text-xs text-[#0D0D0D]/50 mt-1">{resumen ? `${resumen.alumnos} alumnos` : "-"}</p>
            </div>
          </div>

          {/* Mantenedor de la sección elegida */}
          <div className="mt-10">{mostrarSeccion()}</div>
        </main>
      </div>

      {/* Alerta flotante de éxito o error */}
      {mensajeAlerta && (
        <div
          role="status"
          className={
            tipoAlerta === "danger"
              ? "fixed bottom-6 right-6 z-[60] max-w-sm rounded-sm px-4 py-3 font-body text-sm font-semibold shadow-lg bg-[#E31B23] text-[#FAFAF8]"
              : "fixed bottom-6 right-6 z-[60] max-w-sm rounded-sm px-4 py-3 font-body text-sm font-semibold shadow-lg bg-[#FFC400] text-[#0D0D0D] border-2 border-[#0D0D0D]"
          }
        >
          {mensajeAlerta}
        </div>
      )}
    </div>
  );
}

export default AgendamientoAdmin;
