import { useState, useEffect } from "react";
import ModalFormulario from "./ModalFormulario";
import ModalConfirmar from "./ModalConfirmar";
import {
  fetchUsuarios,
  fetchRoles,
  crearUsuario,
  editarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../../services/usuarioService";
import { fetchSedes } from "../../services/sedeService";

const FORMULARIO_VACIO = {
  rut: "",
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  idRol: "",
  idSede: "",
};

function MantenedorUsuarios({ mostrarAlerta, onCambio }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [recargar, setRecargar] = useState(0); // Se cambia para volver a pedir la lista

  // Filtros de la tabla
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  // Formulario
  const [formData, setFormData] = useState(FORMULARIO_VACIO);
  const [idEditando, setIdEditando] = useState(null); // null = creando uno nuevo
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Eliminar
  const [usuarioPendiente, setUsuarioPendiente] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar usuarios, roles y sedes
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [datosUsuarios, datosRoles, datosSedes] = await Promise.all([fetchUsuarios(), fetchRoles(), fetchSedes()]);
        setUsuarios(datosUsuarios);
        setRoles(datosRoles);
        setSedes(datosSedes);
        setErrorCarga("");
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [recargar]);

  const refrescarLista = () => {
    setRecargar(recargar + 1);
    onCambio();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirCrear = () => {
    setFormData(FORMULARIO_VACIO);
    setIdEditando(null);
    setShowModal(true);
  };

  const abrirEditar = (usuario) => {
    setFormData({
      rut: usuario.RUT,
      nombre: usuario.NOMBRE,
      apellido: usuario.APELLIDO,
      email: usuario.EMAIL,
      password: "", // La contraseña no se edita desde acá
      idRol: String(usuario.ID_ROL),
      idSede: usuario.ID_SEDE ? String(usuario.ID_SEDE) : "",
    });
    setIdEditando(usuario.ID_USUARIO);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIdEditando(null);
    setFormData(FORMULARIO_VACIO);
  };

  const guardarUsuario = async () => {
    // Validar campos obligatorios
    if (!formData.rut.trim() || !formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim() || !formData.idRol) {
      mostrarAlerta("danger", "Completa RUT, nombre, apellido, correo y rol.");
      return;
    }

    // La contraseña solo se pide al crear
    if (idEditando === null && formData.password.length < 6) {
      mostrarAlerta("danger", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const usuarioFormateado = {
      rut: formData.rut.trim(),
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: formData.email.trim(),
      idRol: Number(formData.idRol),
      idSede: formData.idSede ? Number(formData.idSede) : null,
    };

    setGuardando(true);
    try {
      if (idEditando !== null) {
        await editarUsuario(idEditando, usuarioFormateado);
        mostrarAlerta("success", "Usuario actualizado exitosamente");
      } else {
        await crearUsuario({ ...usuarioFormateado, password: formData.password });
        mostrarAlerta("success", "Usuario creado exitosamente");
      }
      cerrarModal();
      refrescarLista();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      mostrarAlerta("danger", error.message || "Error al guardar usuario");
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (usuario) => {
    const activar = !usuario.ESTADO_ACTIVO;
    try {
      await cambiarEstadoUsuario(usuario.ID_USUARIO, activar);
      if (activar) {
        mostrarAlerta("success", `${usuario.NOMBRE} ahora está activo`);
      } else {
        mostrarAlerta("success", `${usuario.NOMBRE} fue desactivado`);
      }
      refrescarLista();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      mostrarAlerta("danger", error.message || "Error al cambiar el estado");
    }
  };

  const confirmarEliminacion = async () => {
    setEliminando(true);
    try {
      await eliminarUsuario(usuarioPendiente.ID_USUARIO);
      mostrarAlerta("success", "Usuario eliminado exitosamente");
      refrescarLista();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      mostrarAlerta("danger", error.message || "Error al eliminar usuario");
    } finally {
      setEliminando(false);
      setUsuarioPendiente(null);
    }
  };

  // Aplicar búsqueda (nombre, apellido, RUT o correo) y filtro por rol
  const textoBusqueda = busqueda.trim().toLowerCase();
  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideRol = filtroRol === "" || String(u.ID_ROL) === filtroRol;
    const textoUsuario = `${u.NOMBRE} ${u.APELLIDO} ${u.RUT} ${u.EMAIL}`.toLowerCase();
    const coincideBusqueda = textoBusqueda === "" || textoUsuario.includes(textoBusqueda);
    return coincideRol && coincideBusqueda;
  });

  return (
    <section>
      {/* Título y botón para crear */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">Usuarios</h2>
          <p className="font-body text-sm text-[#0D0D0D]/60 mt-1">Alumnos, instructores y administradores de ambas sedes.</p>
        </div>
        <button type="button" onClick={abrirCrear} className="btn-amarillo btn-compacto w-fit">
          + Nuevo usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          className="campo sm:max-w-xs"
          placeholder="Buscar por nombre, RUT o correo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select className="campo sm:max-w-[12rem]" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {roles.map((rol) => (
            <option key={rol.ID_ROL} value={rol.ID_ROL}>{rol.NOMBRE_ROL}</option>
          ))}
        </select>
      </div>

      {/* Tabla de usuarios */}
      <div className="mt-4 overflow-x-auto border border-black/10 rounded-md bg-white">
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-[#0D0D0D] text-[#FAFAF8]">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">RUT</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Sede</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {cargando && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-[#0D0D0D]/50">Cargando usuarios...</td></tr>
            )}
            {!cargando && errorCarga && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-[#E31B23] font-semibold">{errorCarga}</td></tr>
            )}
            {!cargando && !errorCarga && usuariosFiltrados.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-[#0D0D0D]/50">No hay usuarios para mostrar.</td></tr>
            )}
            {!cargando && !errorCarga && usuariosFiltrados.map((usuario) => (
              <tr key={usuario.ID_USUARIO} className="hover:bg-[#FFC400]/10">
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{usuario.NOMBRE} {usuario.APELLIDO}</td>
                <td className="px-4 py-3 whitespace-nowrap">{usuario.RUT}</td>
                <td className="px-4 py-3">{usuario.EMAIL}</td>
                <td className="px-4 py-3">{usuario.NOMBRE_ROL}</td>
                <td className="px-4 py-3">{usuario.NOMBRE_SEDE || "-"}</td>
                <td className="px-4 py-3">
                  {usuario.ESTADO_ACTIVO ? (
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-[#FFC400] text-xs font-semibold">Activo</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-sm border border-[#E31B23] text-[#E31B23] text-xs font-semibold">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 whitespace-nowrap font-semibold">
                    <button type="button" onClick={() => abrirEditar(usuario)} className="hover:text-[#E6B000]">Editar</button>
                    <button type="button" onClick={() => alternarEstado(usuario)} className="hover:text-[#E6B000]">
                      {usuario.ESTADO_ACTIVO ? "Desactivar" : "Activar"}
                    </button>
                    <button type="button" onClick={() => setUsuarioPendiente(usuario)} className="text-[#E31B23] hover:underline">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para crear o editar */}
      <ModalFormulario
        titulo={idEditando !== null ? "Editar usuario" : "Nuevo usuario"}
        abierto={showModal}
        guardando={guardando}
        onCerrar={cerrarModal}
        onGuardar={guardarUsuario}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="u-nombre" className="campo-etiqueta">Nombre</label>
            <input id="u-nombre" name="nombre" className="campo" value={formData.nombre} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="u-apellido" className="campo-etiqueta">Apellido</label>
            <input id="u-apellido" name="apellido" className="campo" value={formData.apellido} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label htmlFor="u-rut" className="campo-etiqueta">RUT</label>
          <input id="u-rut" name="rut" className="campo" placeholder="12.345.678-5" value={formData.rut} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="u-email" className="campo-etiqueta">Correo</label>
          <input id="u-email" name="email" type="email" className="campo" value={formData.email} onChange={handleChange} />
        </div>
        {idEditando === null && (
          <div>
            <label htmlFor="u-password" className="campo-etiqueta">Contraseña inicial</label>
            <input id="u-password" name="password" type="password" className="campo" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={handleChange} />
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="u-rol" className="campo-etiqueta">Rol</label>
            <select id="u-rol" name="idRol" className="campo" value={formData.idRol} onChange={handleChange}>
              <option value="">Selecciona un rol</option>
              {roles.map((rol) => (
                <option key={rol.ID_ROL} value={rol.ID_ROL}>{rol.NOMBRE_ROL}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="u-sede" className="campo-etiqueta">Sede</label>
            <select id="u-sede" name="idSede" className="campo" value={formData.idSede} onChange={handleChange}>
              <option value="">Sin sede</option>
              {sedes.map((sede) => (
                <option key={sede.ID_SEDE} value={sede.ID_SEDE}>{sede.NOMBRE}</option>
              ))}
            </select>
          </div>
        </div>
      </ModalFormulario>

      {/* Confirmar eliminación */}
      <ModalConfirmar
        abierto={usuarioPendiente !== null}
        titulo="Eliminar usuario"
        mensaje={usuarioPendiente ? `¿Seguro que quieres eliminar a ${usuarioPendiente.NOMBRE} ${usuarioPendiente.APELLIDO}? Si tiene clases o evaluaciones registradas, mejor desactívalo.` : ""}
        procesando={eliminando}
        onCancelar={() => setUsuarioPendiente(null)}
        onConfirmar={confirmarEliminacion}
      />
    </section>
  );
}

export default MantenedorUsuarios;
