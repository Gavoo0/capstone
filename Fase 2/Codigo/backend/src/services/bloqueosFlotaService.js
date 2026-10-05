const { pool } = require('../config/db');

const bloqueosFlotaService = {
    // Listar bloqueos con filtros
    async getAll({ idVehiculo, idInstructor, fecha, fechaDesde, fechaHasta } = {}) {
        let query = `
            SELECT 
                bf.ID_BLOQUEO,
                bf.ID_VEHICULO,
                v.PATENTE,
                v.MODELO,
                bf.ID_INSTRUCTOR,
                u.NOMBRE AS NOMBRE_INSTRUCTOR,
                u.APELLIDO AS APELLIDO_INSTRUCTOR,
                bf.FECHA,
                bf.HORA_INICIO,
                bf.HORA_FIN,
                bf.MOTIVO,
                bf.CREADO_EN
            FROM bloqueos_flota bf
            JOIN vehiculos v ON bf.ID_VEHICULO = v.ID_VEHICULO
            LEFT JOIN usuarios u ON bf.ID_INSTRUCTOR = u.ID_USUARIO
            WHERE 1=1
        `;
        const params = [];

        if (idVehiculo !== undefined) {
            query += ' AND bf.ID_VEHICULO = ?';
            params.push(idVehiculo);
        }
        if (idInstructor !== undefined) {
            query += ' AND bf.ID_INSTRUCTOR = ?';
            params.push(idInstructor);
        }
        if (fecha !== undefined) {
            query += ' AND bf.FECHA = ?';
            params.push(fecha);
        }
        if (fechaDesde !== undefined) {
            query += ' AND bf.FECHA >= ?';
            params.push(fechaDesde);
        }
        if (fechaHasta !== undefined) {
            query += ' AND bf.FECHA <= ?';
            params.push(fechaHasta);
        }

        query += ' ORDER BY bf.FECHA DESC, bf.HORA_INICIO DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener bloqueo por ID
    async getById(idBloqueo) {
        const query = `
            SELECT 
                bf.ID_BLOQUEO,
                bf.ID_VEHICULO,
                v.PATENTE,
                v.MODELO,
                bf.ID_INSTRUCTOR,
                u.NOMBRE AS NOMBRE_INSTRUCTOR,
                u.APELLIDO AS APELLIDO_INSTRUCTOR,
                bf.FECHA,
                bf.HORA_INICIO,
                bf.HORA_FIN,
                bf.MOTIVO,
                bf.CREADO_EN
            FROM bloqueos_flota bf
            JOIN vehiculos v ON bf.ID_VEHICULO = v.ID_VEHICULO
            LEFT JOIN usuarios u ON bf.ID_INSTRUCTOR = u.ID_USUARIO
            WHERE bf.ID_BLOQUEO = ?
        `;
        const [rows] = await pool.query(query, [idBloqueo]);
        return rows[0] || null;
    },

    // Comprobar si hay clases prácticas agendadas que colisionen con este bloqueo
    async getClasesEnConflicto({ idVehiculo, idInstructor, fecha, horaInicio, horaFin }) {
        let query = `
            SELECT 
                ID_CLASE, ID_ALUMNO, ID_INSTRUCTOR, ID_VEHICULO, FECHA, HORA_INICIO, HORA_FIN, ESTADO
            FROM clases_practicas
            WHERE FECHA = ?
              AND ESTADO = 'AGENDADA'
              AND HORA_INICIO < ?
              AND HORA_FIN > ?
              AND (ID_VEHICULO = ? ${idInstructor ? 'OR ID_INSTRUCTOR = ?' : ''})
        `;
        const params = [fecha, horaFin, horaInicio, idVehiculo];
        if (idInstructor) {
            params.push(idInstructor);
        }

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Crear un nuevo bloqueo de flota
    async create({ idVehiculo, idInstructor = null, fecha, horaInicio, horaFin, motivo }) {
        // Validación: verificar si colisiona con clases existentes
        const conflictos = await this.getClasesEnConflicto({
            idVehiculo,
            idInstructor,
            fecha,
            horaInicio,
            horaFin
        });

        if (conflictos.length > 0) {
            const error = new Error('No se puede crear el bloqueo: existen clases prácticas agendadas en este horario.');
            error.conflictos = conflictos;
            throw error;
        }

        const [result] = await pool.query(
            `INSERT INTO bloqueos_flota (ID_VEHICULO, ID_INSTRUCTOR, FECHA, HORA_INICIO, HORA_FIN, MOTIVO)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idVehiculo, idInstructor, fecha, horaInicio, horaFin, motivo]
        );

        return this.getById(result.insertId);
    },

    // Actualizar datos del bloqueo
    async update(idBloqueo, { idVehiculo, idInstructor, fecha, horaInicio, horaFin, motivo }) {
        const fields = [];
        const values = [];

        if (idVehiculo !== undefined) { fields.push('ID_VEHICULO = ?'); values.push(idVehiculo); }
        if (idInstructor !== undefined) { fields.push('ID_INSTRUCTOR = ?'); values.push(idInstructor); }
        if (fecha !== undefined) { fields.push('FECHA = ?'); values.push(fecha); }
        if (horaInicio !== undefined) { fields.push('HORA_INICIO = ?'); values.push(horaInicio); }
        if (horaFin !== undefined) { fields.push('HORA_FIN = ?'); values.push(horaFin); }
        if (motivo !== undefined) { fields.push('MOTIVO = ?'); values.push(motivo); }

        if (fields.length === 0) return this.getById(idBloqueo);

        values.push(idBloqueo);
        await pool.query(`UPDATE bloqueos_flota SET ${fields.join(', ')} WHERE ID_BLOQUEO = ?`, values);
        return this.getById(idBloqueo);
    },

    // Eliminar bloqueo (liberar flota o instructor)
    async delete(idBloqueo) {
        const [result] = await pool.query('DELETE FROM bloqueos_flota WHERE ID_BLOQUEO = ?', [idBloqueo]);
        return result.affectedRows > 0;
    }
};

module.exports = bloqueosFlotaService;
