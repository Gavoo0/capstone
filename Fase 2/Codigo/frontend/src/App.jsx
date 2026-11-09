import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Inicio from './pages/Inicio';
import IniciarSesion from './pages/IniciarSesion';
import DashboardAlumno from './pages/DashboardAlumno';
import PanelInstructor from './pages/PanelInstructor';
import AgendamientoAdmin from './pages/AgendamientoAdmin';
import AutogestionClase from './pages/AutogestionClase';
import RutaPrivada from './components/RutaPrivada';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />

        {/* Ruta del enlace de autogestión que llega por WhatsApp (no necesita sesión) */}
        <Route path="/alumno/autogestion-clase" element={<AutogestionClase />} />

        {/* Rutas privadas de cada panel según el rol */}
        <Route path="/dashboard-alumno" element={
          <RutaPrivada rutaPanel="/dashboard-alumno">
            <DashboardAlumno />
          </RutaPrivada>
        } />
        <Route path="/panel-instructor" element={
          <RutaPrivada rutaPanel="/panel-instructor">
            <PanelInstructor />
          </RutaPrivada>
        } />
        <Route path="/admin/agendamiento" element={
          <RutaPrivada rutaPanel="/admin/agendamiento">
            <AgendamientoAdmin />
          </RutaPrivada>
        } />

        {/* Cualquier otra dirección vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
