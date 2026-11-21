import { Link, useNavigate } from "react-router-dom";
import { cerrarSesion } from "../../services/sesion";
import { api } from "../../services/api";
import { useState } from "react";

// Barra superior de los paneles privados (admin, instructor y alumno)
function BarraPanel({ etiqueta, sesion }) {
  const navigate = useNavigate();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const nombreUsuario = `${sesion.NOMBRE || ""} ${sesion.APELLIDO || ""}`.trim();

  const handleCerrarSesion = async () => {
    if (cerrandoSesion) return;
    setCerrandoSesion(true);
    try {
      await api.post("/usuarios/logout", {});
    } catch (error) {
      console.error("No se pudo revocar la sesión en el servidor:", error);
    } finally {
      cerrarSesion();
      navigate("/iniciar-sesion");
    }
  };

  return (
    <>
      <div className="h-2 w-full stripe-hazard shrink-0 print:hidden" />
      <header className="bg-[#0D0D0D] text-[#FAFAF8] print:hidden">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 font-display text-lg">
            <img src="/logo/logo-nav.png" alt="" className="h-8 w-8 object-contain" />
            <span className="hidden sm:inline">
              Futuro <span className="text-[#FFC400]">·</span> Conductores
            </span>
            <span className="ml-1 px-2 py-0.5 rounded-sm bg-[#FFC400] text-[#0D0D0D] font-body text-xs font-bold">{etiqueta}</span>
          </Link>
          <div className="flex items-center gap-4 font-body text-sm">
            {sesion.NOMBRE_SEDE && <span className="hidden md:inline text-[#FAFAF8]/50">Sede {sesion.NOMBRE_SEDE}</span>}
            {nombreUsuario && <span className="hidden sm:inline text-[#FAFAF8]/80">{nombreUsuario}</span>}
            <button type="button" onClick={handleCerrarSesion} disabled={cerrandoSesion} className="text-[#FAFAF8]/60 hover:text-[#FFC400] disabled:opacity-50">
              {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default BarraPanel;
