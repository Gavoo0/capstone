import { useState } from "react";
import { obtenerSesion } from "../services/sesion";
import useAlerta from "../hooks/useAlerta";
import BarraPanel from "../components/panel/BarraPanel";
import MenuSecciones from "../components/panel/MenuSecciones";
import AlertaFlotante from "../components/panel/AlertaFlotante";
import AgendaInstructor from "../components/instructor/AgendaInstructor";
import AsistenciaTeorica from "../components/instructor/AsistenciaTeorica";
import NotasInstructor from "../components/instructor/NotasInstructor";
import DisponibilidadFlota from "../components/instructor/DisponibilidadFlota";

// Secciones del menú del panel
const SECCIONES = [
  { id: "agenda", titulo: "Mi agenda", icono: "🗓️" },
  { id: "asistencia", titulo: "Asistencia teórica", icono: "✅" },
  { id: "notas", titulo: "Notas", icono: "📝" },
  { id: "flota", titulo: "Disponibilidad de flota", icono: "🚗" },
];

// Panel del instructor (la ruta ya está protegida por RutaPrivada en App.jsx)
function PanelInstructor() {
  const sesion = obtenerSesion();
  const [seccionActiva, setSeccionActiva] = useState("agenda");
  const { mensajeAlerta, tipoAlerta, mostrarAlerta } = useAlerta();

  // Obtener el contenido de la sección elegida
  const mostrarSeccion = () => {
    if (seccionActiva === "asistencia") {
      return <AsistenciaTeorica sesion={sesion} mostrarAlerta={mostrarAlerta} />;
    } else if (seccionActiva === "notas") {
      return <NotasInstructor sesion={sesion} mostrarAlerta={mostrarAlerta} />;
    } else if (seccionActiva === "flota") {
      return <DisponibilidadFlota sesion={sesion} />;
    } else {
      return <AgendaInstructor sesion={sesion} mostrarAlerta={mostrarAlerta} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D] flex flex-col">
      <BarraPanel etiqueta="INSTRUCTOR" sesion={sesion} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <MenuSecciones secciones={SECCIONES} seccionActiva={seccionActiva} onCambiar={setSeccionActiva} />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          <p className="font-body text-sm text-[#0D0D0D]/50">Hola, {sesion.NOMBRE}</p>
          <div className="mt-2">{mostrarSeccion()}</div>
        </main>
      </div>

      <AlertaFlotante mensaje={mensajeAlerta} tipo={tipoAlerta} />
    </div>
  );
}

export default PanelInstructor;
