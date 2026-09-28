import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import Inicio from './pages/Inicio'
import IniciarSesion from './pages/IniciarSesion'
import DashboardAlumno from './pages/DashboardAlumno'
import PanelInstructor from './pages/PanelInstructor'
import AgendamientoAdmin from './pages/AgendamientoAdmin'
import AutogestionClase from './pages/AutogestionClase'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />
        <Route path="/dashboard-alumno" element={<DashboardAlumno />} />
        <Route path="/panel-instructor" element={<PanelInstructor />} />
        <Route path="/admin/agendamiento" element={<AgendamientoAdmin />} />
        <Route path="/alumno/autogestion-clase" element={<AutogestionClase />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App