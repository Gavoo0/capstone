const { pool } = require('../config/db');
const { rutValido } = require('../utils/validaciones');

const usuariosService = {
    // Listar usuarios con filtros opcionales (por rol, sede, estado activo)
    async getAll({ idRol, idSede, estadoActivo } = {}) {
        let query = `
            SELECT 
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.ID_ROL,
                r.NOMBRE_ROL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO,
                u.CREADO_EN
            FROM usuarios u
            LEFT JOIN roles r ON u.ID_ROL = r.ID_ROL
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            WHERE 1=1
        `;
        const params = [];

        if (idRol !== undefined) {
            query += ' AND u.ID_ROL = ?';
            params.push(idRol);
        }
        if (idSede !== undefined) {
            query += ' AND u.ID_SEDE = ?';
            params.push(idSede);
        }
        if (estadoActivo !== undefined) {
            query += ' AND u.ESTADO_ACTIVO = ?';
            params.push(estadoActivo);
        }

        query += ' ORDER BY u.CREADO_EN DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener usuario por ID (incluye rol y sede)
    async getById(idUsuario) {
        const query = `
            SELECT 
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.ID_ROL,
                r.NOMBRE_ROL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO,
                u.CREADO_EN
            FROM usuarios u
            LEFT JOIN roles r ON u.ID_ROL = r.ID_ROL
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            WHERE u.ID_USUARIO = ?
        `;
        const [rows] = await pool.query(query, [idUsuario]);
        return rows[0] || null;
    },

    // Obtener usuario por Email (incluye PASSWORD_HASH para autenticación/login)
    async getByEmail(email) {
        const query = `
            SELECT 
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.PASSWORD_HASH,
                u.ID_ROL,
                r.NOMBRE_ROL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO,
                u.TOKEN_VERSION
            FROM usuarios u
            LEFT JOIN roles r ON u.ID_ROL = r.ID_ROL
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            WHERE LOWER(u.EMAIL) = LOWER(?)
        `;
        const [rows] = await pool.query(query, [email]);
        return rows[0] || null;
    },

    // Obtener usuario para el login a partir de un correo o de un RUT (incluye PASSWORD_HASH).
    // El RUT se compara sin puntos, guiones ni espacios y sin distinguir mayúsculas, así
    // "21.140.826-K", "21140826-k" y "21140826K" encuentran al mismo usuario sin importar
    // cómo quedó guardado en la base.
    async getByIdentificador(identificador) {
        const valor = String(identificador || '').trim();
        if (!valor) return null;

        if (valor.includes('@')) {
            return this.getByEmail(valor);
        }

        if (!rutValido(valor)) return null;
        const rutNormalizado = valor.replace(/[.\-\s]/g, '').toLowerCase();
        const query = `
            SELECT
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.PASSWORD_HASH,
                u.ID_ROL,
                r.NOMBRE_ROL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO,
                u.TOKEN_VERSION
            FROM usuarios u
            LEFT JOIN roles r ON u.ID_ROL = r.ID_ROL
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            WHERE REPLACE(REPLACE(REPLACE(LOWER(u.RUT), '.', ''), '-', ''), ' ', '') = ?
        `;
        const [rows] = await pool.query(query, [rutNormalizado]);
        return rows[0] || null;
    },

    // Obtener usuario por RUT
    async getByRut(rut) {
        const rutNormalizado = String(rut || '').replace(/[.\-\s]/g, '').toUpperCase();
        const query = `
            SELECT 
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.ID_ROL,
                r.NOMBRE_ROL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO
            FROM usuarios u
            LEFT JOIN roles r ON u.ID_ROL = r.ID_ROL
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            WHERE REPLACE(REPLACE(REPLACE(UPPER(u.RUT), '.', ''), '-', ''), ' ', '') = ?
        `;
        const [rows] = await pool.query(query, [rutNormalizado]);
        return rows[0] || null;
    },

    async createPasswordReset(idUsuario, tokenHash, expiraEn) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM password_reset_tokens WHERE EXPIRA_EN <= UTC_TIMESTAMP() OR USADO_EN IS NOT NULL');
            await connection.query('DELETE FROM password_reset_tokens WHERE ID_USUARIO = ? AND USADO_EN IS NULL', [idUsuario]);
            await connection.query(
                'INSERT INTO password_reset_tokens (ID_USUARIO, TOKEN_HASH, EXPIRA_EN) VALUES (?, ?, ?)',
                [idUsuario, tokenHash, expiraEn]
            );
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async consumePasswordReset(tokenHash, passwordHash) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [tokens] = await connection.query(
                `SELECT ID_USUARIO FROM password_reset_tokens
                 WHERE TOKEN_HASH = ? AND USADO_EN IS NULL AND EXPIRA_EN > UTC_TIMESTAMP()
                 FOR UPDATE`,
                [tokenHash]
            );
            if (!tokens.length) {
                await connection.rollback();
                return false;
            }
            await connection.query(
                'UPDATE usuarios SET PASSWORD_HASH = ?, TOKEN_VERSION = TOKEN_VERSION + 1 WHERE ID_USUARIO = ?',
                [passwordHash, tokens[0].ID_USUARIO]
            );
            await connection.query('UPDATE password_reset_tokens SET USADO_EN = UTC_TIMESTAMP() WHERE TOKEN_HASH = ?', [tokenHash]);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async deletePasswordReset(tokenHash) {
        await pool.query('DELETE FROM password_reset_tokens WHERE TOKEN_HASH = ?', [tokenHash]);
    },

    // Crear un nuevo usuario (con transacción si es alumno para crear alumnos_detalle)
    async create({ rut, nombre, apellido, email, passwordHash, idRol, idSede = null, esAlumno = false }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO usuarios (RUT, NOMBRE, APELLIDO, EMAIL, PASSWORD_HASH, ID_ROL, ID_SEDE, ESTADO_ACTIVO) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [rut, nombre, apellido, email, passwordHash, idRol, idSede]
            );

            const nuevoIdUsuario = result.insertId;

            // Si es un alumno, creamos su ficha en alumnos_detalle
            if (esAlumno) {
                await connection.query(
                    `INSERT INTO alumnos_detalle (ID_USUARIO, ESTADO_PSICOTECNICO, PORCENTAJE_ASISTENCIA_TEORICA, FECHA_MATRICULA) 
                     VALUES (?, 'PENDIENTE', 0.00, CURDATE())`,
                    [nuevoIdUsuario]
                );
            }

            await connection.commit();
            return this.getById(nuevoIdUsuario);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Actualizar datos del usuario
    async update(idUsuario, { rut, nombre, apellido, email, idRol, idSede, estadoActivo }) {
        const fields = [];
        const values = [];

        if (rut !== undefined) { fields.push('RUT = ?'); values.push(rut); }
        if (nombre !== undefined) { fields.push('NOMBRE = ?'); values.push(nombre); }
        if (apellido !== undefined) { fields.push('APELLIDO = ?'); values.push(apellido); }
        if (email !== undefined) { fields.push('EMAIL = ?'); values.push(email); }
        if (idRol !== undefined) { fields.push('ID_ROL = ?'); values.push(idRol); }
        if (idSede !== undefined) { fields.push('ID_SEDE = ?'); values.push(idSede); }
        if (estadoActivo !== undefined) { fields.push('ESTADO_ACTIVO = ?'); values.push(estadoActivo); }

        if (fields.length === 0) return this.getById(idUsuario);

        values.push(idUsuario);
        const invalidaTokens = idRol !== undefined || estadoActivo !== undefined;
        await pool.query(`UPDATE usuarios SET ${fields.join(', ')}${invalidaTokens ? ', TOKEN_VERSION = TOKEN_VERSION + 1' : ''} WHERE ID_USUARIO = ?`, values);

        return this.getById(idUsuario);
    },

    // Actualizar contraseña
    async updatePassword(idUsuario, passwordHash) {
        const [result] = await pool.query(
            'UPDATE usuarios SET PASSWORD_HASH = ?, TOKEN_VERSION = TOKEN_VERSION + 1 WHERE ID_USUARIO = ?',
            [passwordHash, idUsuario]
        );
        return result.affectedRows > 0;
    },

    async revokeSessions(idUsuario) {
        const [result] = await pool.query(
            'UPDATE usuarios SET TOKEN_VERSION = TOKEN_VERSION + 1 WHERE ID_USUARIO = ?',
            [idUsuario]
        );
        return result.affectedRows > 0;
    },

    // Activar o desactivar cuenta (Baja lógica)
    async toggleEstado(idUsuario, estadoActivo) {
        const [result] = await pool.query(
            'UPDATE usuarios SET ESTADO_ACTIVO = ?, TOKEN_VERSION = TOKEN_VERSION + 1 WHERE ID_USUARIO = ?',
            [estadoActivo ? 1 : 0, idUsuario]
        );
        return result.affectedRows > 0;
    },

    // Eliminar usuario
    async delete(idUsuario) {
        const [result] = await pool.query('DELETE FROM usuarios WHERE ID_USUARIO = ?', [idUsuario]);
        return result.affectedRows > 0;
    }
};

module.exports = usuariosService;
