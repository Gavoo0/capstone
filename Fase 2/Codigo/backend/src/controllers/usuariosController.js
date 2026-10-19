const crypto = require('crypto');
const { usuariosService, rolesService } = require('../services');

// Función auxiliar para hashear contraseñas con sha256 (o compatible)
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Compara dos hashes en tiempo constante, para no filtrar información por el tiempo de respuesta.
const hashesIguales = (a, b) => {
    const bufA = Buffer.from(String(a || ''));
    const bufB = Buffer.from(String(b || ''));
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const usuariosController = {
    // GET /api/usuarios
    async getAll(req, res) {
        try {
            const { idRol, idSede, estadoActivo } = req.query;
            const usuarios = await usuariosService.getAll({
                idRol: idRol ? Number(idRol) : undefined,
                idSede: idSede ? Number(idSede) : undefined,
                estadoActivo: estadoActivo !== undefined ? Number(estadoActivo) : undefined
            });
            res.json(usuarios);
        } catch (error) {
            console.error('Error en usuariosController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener usuarios', detalle: error.message });
        }
    },

    // GET /api/usuarios/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await usuariosService.getById(id);
            if (!usuario) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }
            res.json(usuario);
        } catch (error) {
            console.error('Error en usuariosController.getById:', error);
            res.status(500).json({ error: 'Error al obtener usuario', detalle: error.message });
        }
    },

    // GET /api/usuarios/rut/:rut
    async getByRut(req, res) {
        try {
            const { rut } = req.params;
            const usuario = await usuariosService.getByRut(rut);
            if (!usuario) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No se encontró usuario con RUT ${rut}.` });
            }
            res.json(usuario);
        } catch (error) {
            console.error('Error en usuariosController.getByRut:', error);
            res.status(500).json({ error: 'Error al buscar por RUT', detalle: error.message });
        }
    },

    // POST /api/usuarios
    async create(req, res) {
        try {
            const { rut, nombre, apellido, email, password, idRol, idSede } = req.body;

            if (!rut || !nombre || !apellido || !email || !password || !idRol) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Todos los campos obligatorios deben estar presentes (rut, nombre, apellido, email, password, idRol).'
                });
            }

            // Identificar si el rol corresponde a 'ALUMNO'
            const rol = await rolesService.getById(idRol);
            const esAlumno = rol && rol.NOMBRE_ROL.toUpperCase().includes('ALUMNO');

            const passwordHash = hashPassword(password);

            const nuevoUsuario = await usuariosService.create({
                rut: rut.trim(),
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email.trim().toLowerCase(),
                passwordHash,
                idRol,
                idSede: idSede || null,
                esAlumno
            });

            res.status(201).json(nuevoUsuario);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    error: 'Duplicado',
                    mensaje: 'El RUT o correo electrónico ya se encuentra registrado.'
                });
            }
            console.error('Error en usuariosController.create:', error);
            res.status(500).json({ error: 'Error al crear usuario', detalle: error.message });
        }
    },

    // POST /api/usuarios/login
    // Acepta { identificador, password }, donde identificador es un correo o un RUT.
    // También sigue aceptando { email, password } para no romper llamadas anteriores.
    async login(req, res) {
        try {
            const { password } = req.body;
            const identificador = req.body.identificador ?? req.body.email;

            if (!identificador || !password) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Debe ingresar su correo o RUT y su contraseña.'
                });
            }

            const usuario = await usuariosService.getByIdentificador(String(identificador));
            if (!usuario) {
                return res.status(401).json({
                    error: 'Autenticación',
                    mensaje: 'Credenciales inválidas.'
                });
            }

            if (!usuario.ESTADO_ACTIVO) {
                return res.status(403).json({
                    error: 'Cuenta inactiva',
                    mensaje: 'Su cuenta está inactiva. Contacte a la administración.'
                });
            }

            const hashIngresado = hashPassword(String(password));
            if (!hashesIguales(hashIngresado, usuario.PASSWORD_HASH)) {
                return res.status(401).json({
                    error: 'Autenticación',
                    mensaje: 'Credenciales inválidas.'
                });
            }

            // Sanitizar respuesta (no enviar contraseña hasheada)
            const { PASSWORD_HASH, ...datosUsuario } = usuario;

            res.json({
                mensaje: 'Inicio de sesión exitoso',
                usuario: datosUsuario
            });
        } catch (error) {
            console.error('Error en usuariosController.login:', error);
            res.status(500).json({ error: 'Error durante el inicio de sesión', detalle: error.message });
        }
    },

    // PUT /api/usuarios/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { rut, nombre, apellido, email, idRol, idSede, estadoActivo } = req.body;

            const usuarioActualizado = await usuariosService.update(id, {
                rut,
                nombre,
                apellido,
                email,
                idRol,
                idSede,
                estadoActivo
            });

            if (!usuarioActualizado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }

            res.json(usuarioActualizado);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Duplicado', mensaje: 'El RUT o correo ingresado ya pertenece a otro usuario.' });
            }
            console.error('Error en usuariosController.update:', error);
            res.status(500).json({ error: 'Error al actualizar usuario', detalle: error.message });
        }
    },

    // PATCH /api/usuarios/:id/estado
    async toggleEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (activo === undefined) {
                return res.status(400).json({ error: 'Validación', mensaje: 'Debe especificar el nuevo estado activo (true/false).' });
            }

            const ok = await usuariosService.toggleEstado(id, activo);
            if (!ok) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }

            res.json({ mensaje: `Estado del usuario ${id} actualizado a ${activo ? 'ACTIVO' : 'INACTIVO'}.` });
        } catch (error) {
            console.error('Error en usuariosController.toggleEstado:', error);
            res.status(500).json({ error: 'Error al cambiar estado de usuario', detalle: error.message });
        }
    },

    // PATCH /api/usuarios/:id/password
    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ error: 'Validación', mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
            }

            const hash = hashPassword(newPassword);
            const ok = await usuariosService.updatePassword(id, hash);
            if (!ok) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }

            res.json({ mensaje: 'Contraseña actualizada correctamente.' });
        } catch (error) {
            console.error('Error en usuariosController.updatePassword:', error);
            res.status(500).json({ error: 'Error al actualizar contraseña', detalle: error.message });
        }
    },

    // DELETE /api/usuarios/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await usuariosService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Usuario con ID ${id} eliminado correctamente.` });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    error: 'Restricción de integridad',
                    mensaje: 'No se puede eliminar el usuario porque tiene clases, asistencias o evaluaciones registradas. Sugerimos desactivar la cuenta.'
                });
            }
            console.error('Error en usuariosController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar usuario', detalle: error.message });
        }
    }
};

module.exports = usuariosController;
