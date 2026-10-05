const { pool } = require('../config/db');

const vehiculosService = {
    // Listar vehículos con filtros opcionales
    async getAll({ idSede, estadoOperativo, transmision } = {}) {
        let query = `
            SELECT 
                v.ID_VEHICULO,
                v.PATENTE,
                v.MODELO,
                v.TRANSMISION,
                v.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                v.ESTADO_OPERATIVO,
                v.CREADO_EN
            FROM vehiculos v
            LEFT JOIN sedes s ON v.ID_SEDE = s.ID_SEDE
            WHERE 1=1
        `;
        const params = [];

        if (idSede !== undefined) {
            query += ' AND v.ID_SEDE = ?';
            params.push(idSede);
        }
        if (estadoOperativo !== undefined) {
            query += ' AND v.ESTADO_OPERATIVO = ?';
            params.push(estadoOperativo);
        }
        if (transmision !== undefined) {
            query += ' AND UPPER(v.TRANSMISION) = UPPER(?)';
            params.push(transmision);
        }

        query += ' ORDER BY v.MODELO ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener vehículo por ID
    async getById(idVehiculo) {
        const query = `
            SELECT 
                v.ID_VEHICULO,
                v.PATENTE,
                v.MODELO,
                v.TRANSMISION,
                v.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                v.ESTADO_OPERATIVO,
                v.CREADO_EN
            FROM vehiculos v
            LEFT JOIN sedes s ON v.ID_SEDE = s.ID_SEDE
            WHERE v.ID_VEHICULO = ?
        `;
        const [rows] = await pool.query(query, [idVehiculo]);
        return rows[0] || null;
    },

    // Obtener vehículo por patente
    async getByPatente(patente) {
        const query = `
            SELECT 
                v.ID_VEHICULO,
                v.PATENTE,
                v.MODELO,
                v.TRANSMISION,
                v.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                v.ESTADO_OPERATIVO
            FROM vehiculos v
            LEFT JOIN sedes s ON v.ID_SEDE = s.ID_SEDE
            WHERE UPPER(v.PATENTE) = UPPER(?)
        `;
        const [rows] = await pool.query(query, [patente]);
        return rows[0] || null;
    },

    // Registrar nuevo vehículo
    async create({ patente, modelo, transmision, idSede = null, estadoOperativo = 'OPERATIVO' }) {
        const [result] = await pool.query(
            `INSERT INTO vehiculos (PATENTE, MODELO, TRANSMISION, ID_SEDE, ESTADO_OPERATIVO) 
             VALUES (?, ?, ?, ?, ?)`,
            [patente.toUpperCase(), modelo, transmision, idSede, estadoOperativo]
        );
        return this.getById(result.insertId);
    },

    // Actualizar datos del vehículo
    async update(idVehiculo, { patente, modelo, transmision, idSede, estadoOperativo }) {
        const fields = [];
        const values = [];

        if (patente !== undefined) { fields.push('PATENTE = ?'); values.push(patente.toUpperCase()); }
        if (modelo !== undefined) { fields.push('MODELO = ?'); values.push(modelo); }
        if (transmision !== undefined) { fields.push('TRANSMISION = ?'); values.push(transmision); }
        if (idSede !== undefined) { fields.push('ID_SEDE = ?'); values.push(idSede); }
        if (estadoOperativo !== undefined) { fields.push('ESTADO_OPERATIVO = ?'); values.push(estadoOperativo); }

        if (fields.length === 0) return this.getById(idVehiculo);

        values.push(idVehiculo);
        await pool.query(`UPDATE vehiculos SET ${fields.join(', ')} WHERE ID_VEHICULO = ?`, values);
        return this.getById(idVehiculo);
    },

    // Actualizar solo estado operativo (ej: 'OPERATIVO', 'MANTENCION', 'DE_BAJA')
    async updateEstadoOperativo(idVehiculo, estadoOperativo) {
        const [result] = await pool.query(
            'UPDATE vehiculos SET ESTADO_OPERATIVO = ? WHERE ID_VEHICULO = ?',
            [estadoOperativo, idVehiculo]
        );
        return result.affectedRows > 0;
    },

    // Eliminar vehículo
    async delete(idVehiculo) {
        const [result] = await pool.query('DELETE FROM vehiculos WHERE ID_VEHICULO = ?', [idVehiculo]);
        return result.affectedRows > 0;
    },

    // Obtener vehículos disponibles en una sede para una fecha y horario específicos
    // Comprueba:
    // 1. Que esté 'OPERATIVO'
    // 2. Que no tenga una clase agendada solapada
    // 3. Que no tenga un bloqueo de flota solapado
    async getDisponiblesParaHorario({ idSede, fecha, horaInicio, horaFin, transmision } = {}) {
        let query = `
            SELECT 
                v.ID_VEHICULO,
                v.PATENTE,
                v.MODELO,
                v.TRANSMISION,
                v.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE
            FROM vehiculos v
            JOIN sedes s ON v.ID_SEDE = s.ID_SEDE
            WHERE v.ESTADO_OPERATIVO = 'OPERATIVO'
        `;
        const params = [];

        if (idSede) {
            query += ' AND v.ID_SEDE = ?';
            params.push(idSede);
        }

        if (transmision) {
            query += ' AND UPPER(v.TRANSMISION) = UPPER(?)';
            params.push(transmision);
        }

        // Subconsulta 1: Excluir vehículos con clase en ese horario
        query += `
            AND v.ID_VEHICULO NOT IN (
                SELECT cp.ID_VEHICULO 
                FROM clases_practicas cp
                WHERE cp.FECHA = ?
                  AND cp.ESTADO = 'AGENDADA'
                  AND cp.HORA_INICIO < ?
                  AND cp.HORA_FIN > ?
            )
        `;
        params.push(fecha, horaFin, horaInicio);

        // Subconsulta 2: Excluir vehículos con bloqueo de flota en ese horario
        query += `
            AND v.ID_VEHICULO NOT IN (
                SELECT bf.ID_VEHICULO 
                FROM bloqueos_flota bf
                WHERE bf.FECHA = ?
                  AND bf.HORA_INICIO < ?
                  AND bf.HORA_FIN > ?
            )
        `;
        params.push(fecha, horaFin, horaInicio);

        query += ' ORDER BY v.MODELO ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    }
};

module.exports = vehiculosService;
