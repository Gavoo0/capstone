import { useState } from "react";
import { Link } from "react-router-dom";
import { ENLACES } from "../../data/inicio";
import { obtenerSesion, rutaPorRol } from "../../services/sesion";

const IconoUsuario = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Encabezado() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Si el alumno ya inició sesión, el botón lo lleva directo a su panel.
  const sesion = obtenerSesion();
  const rutaPanel = sesion ? rutaPorRol(sesion.NOMBRE_ROL) : null;
  const destino = rutaPanel || "/iniciar-sesion";
  const textoAcceso = rutaPanel ? "Mi panel" : "Iniciar sesión";

  return (
    <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <a href="#inicio" className="flex items-center gap-3 font-display text-xl text-[#FAFAF8]">
          <img src="/logo/logo-nav.png" alt="" className="h-9 w-9 object-contain" />
          <span>
            Futuro <span className="text-[#FFC400]">·</span> Conductores
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8 font-body text-sm text-[#FAFAF8]/80">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href} className="hover:text-[#FFC400] transition-colors">
              {e.texto}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to={destino} className="btn-contorno-claro btn-compacto">
            <IconoUsuario />
            {textoAcceso}
          </Link>
          <a href="#contacto" className="btn-amarillo btn-compacto">
            Inscríbete
          </a>
        </div>

        <button onClick={() => setMenuAbierto((v) => !v)} className="lg:hidden text-[#FAFAF8]" aria-label="Abrir menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuAbierto && (
        <div className="lg:hidden bg-[#0D0D0D] border-t border-white/10 px-6 py-4 flex flex-col gap-4 font-body text-[#FAFAF8]/90">
          {ENLACES.map((e) => (
            <a key={e.href} href={e.href} onClick={() => setMenuAbierto(false)}>
              {e.texto}
            </a>
          ))}
          <Link to={destino} onClick={() => setMenuAbierto(false)}>
            {textoAcceso}
          </Link>
          <a href="#contacto" onClick={() => setMenuAbierto(false)} className="text-[#FFC400] font-semibold">
            Inscríbete
          </a>
        </div>
      )}
    </header>
  );
}
