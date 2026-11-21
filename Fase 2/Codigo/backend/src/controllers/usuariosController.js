const { rutValido, normalizarRut, correoValido, nombreValido } = require('../utils/validaciones');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { usuariosService, rolesService } = require('../services');
const { createToken } = require('../middleware/auth');
const { sendPasswordReset } = require('../services/emailService');

const hashPassword = (password) => bcrypt.hash(password, 12);

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
            res.status(500).json({ error: 'Error al obtener usuarios', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
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
            res.status(500).json({ error: 'Error al obtener usuario', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    },

    // GET /api/usuarios/rut/:rut
    async getByRut(req, res) {
        try {
            const { rut } = req.params;
            if (!rutValido(rut)) return res.status(400).json({ mensaje: 'El RUT no es válido.' });
            const usuario = await usuariosService.getByRut(rut);
            if (!usuario) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No se encontró usuario con RUT ${rut}.` });
            }
            res.json(usuario);
        } catch (error) {
            console.error('Error en usuariosController.getByRut:', error);
            res.status(500).json({ error: 'Error al buscar por RUT', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    },

    async logout(req, res) {
        try {
            await usuariosService.revokeSessions(req.user.id);
            return res.json({ mensaje: 'La sesión se cerró correctamente.' });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            return res.status(500).json({ mensaje: 'No se pudo cerrar la sesión en el servidor.' });
        }
    },

    // POST /api/usuarios
    async create(req, res) {
        try {
            const { rut, nombre, apellido, email, password, idRol, idSede } = req.body;

            if (![rut, nombre, apellido, email, password].every((value) => typeof value === 'string' && value.trim()) || !idRol) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Todos los campos obligatorios deben estar presentes (rut, nombre, apellido, email, password, idRol).'
                });
            }
            if (Buffer.byteLength(password, 'utf8') > 72) {
                return res.status(400).json({ mensaje: 'La contraseña no puede superar 72 bytes.' });
            }
            if (password.length < 8) {
                return res.status(400).json({ error: 'Validación', mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
            }
            if (!rutValido(rut)) {
                return res.status(400).json({ error: 'Validación', mensaje: 'El RUT no es válido. Revise el número y el dígito verificador.' });
            }
            if (!nombreValido(nombre) || !nombreValido(apellido)) {
                return res.status(400).json({ error: 'Validación', mensaje: 'El nombre y el apellido solo pueden tener letras.' });
            }
            if (!correoValido(email)) {
                return res.status(400).json({ error: 'Validación', mensaje: 'Ingrese un correo electrónico válido.' });
            }

            // Identificar si el rol corresponde a 'ALUMNO'
            const rol = await rolesService.getById(idRol);
            const esAlumno = rol && rol.NOMBRE_ROL.toUpperCase().includes('ALUMNO');

            const passwordHash = await hashPassword(password);

            const nuevoUsuario = await usuariosService.create({
                rut: normalizarRut(rut),
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
            res.status(500).json({ error: 'Error al crear usuario', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    },

    // POST /api/usuarios/login
    // Acepta { identificador, password }, donde identificador es un correo o un RUT.
    // También sigue aceptando { email, password } para no romper llamadas anteriores.
    async login(req, res) {
        try {
            const { password } = req.body;
            const identificador = req.body.identificador ?? req.body.email;

            if (typeof identificador !== 'string' || !identificador.trim() || typeof password !== 'string' || !password) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Debe ingresar su correo o RUT y su contraseña.'
                });
            }

            const usuario = await usuariosService.getByIdentificador(identificador.trim());
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

            const passwordIsLegacy = /^[a-f0-9]{64}$/i.test(usuario.PASSWORD_HASH);
            const passwordValida = passwordIsLegacy
                ? hashesIguales(crypto.createHash('sha256').update(password).digest('hex'), usuario.PASSWORD_HASH.toLowerCase())
                : await bcrypt.compare(password, usuario.PASSWORD_HASH);
            if (!passwordValida) {
                return res.status(401).json({
                    error: 'Autenticación',
                    mensaje: 'Credenciales inválidas.'
                });
            }

            if (passwordIsLegacy) {
                await usuariosService.updatePassword(usuario.ID_USUARIO, await hashPassword(password));
            }
            const usuarioSesion = passwordIsLegacy
                ? await usuariosService.getByIdentificador(identificador.trim())
                : usuario;

            // Sanitizar respuesta (no enviar contraseña hasheada)
            const { PASSWORD_HASH, TOKEN_VERSION, ...datosUsuario } = usuario;

            res.json({
                mensaje: 'Inicio de sesión exitoso',
                usuario: datosUsuario,
                token: createToken(usuarioSesion)
            });
        } catch (error) {
            console.error('Error en usuariosController.login:', error);
            res.status(500).json({ error: 'Error durante el inicio de sesión', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    },

    // POST /api/usuarios/recuperar-clave
    async solicitarRecuperacion(req, res) {
        const { identificador } = req.body || {};
        if (typeof identificador !== 'string' || !identificador.trim() || identificador.length > 150) {
            return res.status(400).json({ mensaje: 'Ingresa un correo o RUT válido.' });
        }
        try {
            const usuario = await usuariosService.getByIdentificador(identificador.trim());
            if (usuario?.ESTADO_ACTIVO) {
                const token = crypto.randomBytes(32).toString('hex');
                const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
                const expiraEn = new Date(Date.now() + 20 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
                await usuariosService.createPasswordReset(usuario.ID_USUARIO, tokenHash, expiraEn);
                const link = new URL('/restablecer-clave', process.env.FRONTEND_URL || 'http://localhost:4000');
                link.searchParams.set('token', token);
                setImmediate(() => sendPasswordReset(usuario.EMAIL, link.toString()).catch(async (error) => {
                    await usuariosService.deletePasswordReset(tokenHash).catch((deleteError) => console.error('No se pudo limpiar el token de recuperación:', deleteError.message));
                    console.error('No se pudo enviar el correo de recuperación:', error.message);
                }));
            }
            return res.json({ mensaje: 'Si los datos corresponden a una cuenta activa, recibirá un enlace de recuperación.' });
        } catch (error) {
            console.error('Error al solicitar recuperación:', error);
            return res.status(500).json({ mensaje: 'No se pudo procesar la solicitud. Intente nuevamente.' });
        }
    },

    // POST /api/usuarios/restablecer-clave
    async restablecerClave(req, res) {
        const { token, password } = req.body || {};
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).json({ mensaje: 'El enlace de recuperación no es válido o expiró.' });
        }
        if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.' });
        }
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const actualizado = await usuariosService.consumePasswordReset(tokenHash, await hashPassword(password));
            if (!actualizado) return res.status(400).json({ mensaje: 'El enlace de recuperación no es válido o expiró.' });
            return res.json({ mensaje: 'La contraseña se actualizó correctamente. Inicie sesión nuevamente.' });
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            return res.status(500).json({ mensaje: 'No se pudo actualizar la contraseña. Intente nuevamente.' });
        }
    },

    // PUT /api/usuarios/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { rut, nombre, apellido, email, idRol, idSede, estadoActivo } = req.body;

            // Validar solo los datos que vienen en la petición
            if (rut !== undefined && !rutValido(rut)) {
                return res.status(400).json({ error: 'Validación', mensaje: 'El RUT no es válido. Revise el número y el dígito verificador.' });
            }
            if ((nombre !== undefined && !nombreValido(nombre)) || (apellido !== undefined && !nombreValido(apellido))) {
                return res.status(400).json({ error: 'Validación', mensaje: 'El nombre y el apellido solo pueden tener letras.' });
            }
            if (email !== undefined && !correoValido(email)) {
                return res.status(400).json({ error: 'Validación', mensaje: 'Ingrese un correo electrónico válido.' });
            }

            const usuarioActualizado = await usuariosService.update(id, {
                rut: rut !== undefined ? normalizarRut(rut) : undefined,
                nombre: nombre !== undefined ? nombre.trim() : undefined,
                apellido: apellido !== undefined ? apellido.trim() : undefined,
                email: email !== undefined ? email.trim().toLowerCase() : undefined,
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
            res.status(500).json({ error: 'Error al actualizar usuario', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    },

    // PATCH /api/usuarios/:id/estado
    async toggleEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (typeof activo !== 'boolean') {
                return res.status(400).json({ error: 'Validación', mensaje: 'Debe especificar el nuevo estado activo (true/false).' });
            }

            const ok = await usuariosService.toggleEstado(id, activo);
            if (!ok) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }

            res.json({ mensaje: `Estado del usuario ${id} actualizado a ${activo ? 'ACTIVO' : 'INACTIVO'}.` });
        } catch (error) {
            console.error('Error en usuariosController.toggleEstado:', error);
            res.status(500).json({ error: 'Error al cambiar estado de usuario', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    },

    // PATCH /api/usuarios/:id/password
    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (typeof newPassword !== 'string' || newPassword.length < 8) {
                return res.status(400).json({ error: 'Validación', mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
            }
            if (Buffer.byteLength(newPassword, 'utf8') > 72) {
                return res.status(400).json({ error: 'Validación', mensaje: 'La contraseña no puede superar 72 bytes.' });
            }

            const hash = await hashPassword(newPassword);
            const ok = await usuariosService.updatePassword(id, hash);
            if (!ok) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El usuario con ID ${id} no existe.` });
            }

            res.json({ mensaje: 'Contraseña actualizada correctamente.' });
        } catch (error) {
            console.error('Error en usuariosController.updatePassword:', error);
            res.status(500).json({ error: 'Error al actualizar contraseña', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
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
            res.status(500).json({ error: 'Error al eliminar usuario', mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
        }
    }
};

module.exports = usuariosController;
