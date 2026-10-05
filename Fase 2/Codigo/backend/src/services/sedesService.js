const { pool } = require('../config/db');

const sedesService = {
    // Listar todas las sedes
    async getAll() {
        const [rows] = await pool.query('SELECT ID_SEDE, NOMBRE, DIRECCION, TELEFONO, CREADO_EN FROM sedes ORDER BY NOMBRE ASC');
        return rows;
    },

    // Obtener sede por ID
    async getById(idSede) {
        const [rows] = await pool.query('SELECT ID_SEDE, NOMBRE, DIRECCION, TELEFONO, CREADO_EN FROM sedes WHERE ID_SEDE = ?', [idSede]);
        return rows[0] || null;
    },

    // Crear una nueva sede
    async create({ nombre, direccion, telefono = null }) {
        const [result] = await pool.query(
            'INSERT INTO sedes (NOMBRE, DIRECCION, TELEFONO) VALUES (?, ?, ?)',
            [nombre, direccion, telefono]
        );
        return {
            idSede: result.insertId,
            nombre,
            direccion,
            telefono
        };
    },

    // Actualizar sede
    async update(idSede, { nombre, direccion, telefono }) {
        const fields = [];
        const values = [];

        if (nombre !== undefined) { fields.push('NOMBRE = ?'); values.push(nombre); }
        if (direccion !== undefined) { fields.push('DIRECCION = ?'); values.push(direccion); }
        if (telefono !== undefined) { fields.push('TELEFONO = ?'); values.push(telefono); }

        if (fields.length === 0) return this.getById(idSede);

        values.push(idSede);
        const [result] = await pool.query(
            `UPDATE sedes SET ${fields.join(', ')} WHERE ID_SEDE = ?`,
            values
        );

        if (result.affectedRows === 0) return null;
        return this.getById(idSede);
    },

    // Eliminar sede
    async delete(idSede) {
        const [result] = await pool.query('DELETE FROM sedes WHERE ID_SEDE = ?', [idSede]);
        return result.affectedRows > 0;
    },

    // Obtener vehículos asignados a la sede
    async getVehiculos(idSede) {
        const [rows] = await pool.query(
            'SELECT ID_VEHICULO, PATENTE, MODELO, TRANSMISION, ESTADO_OPERATIVO FROM vehiculos WHERE ID_SEDE = ?',
            [idSede]
        );
        return rows;
    },

    // Obtener instructores o personal de la sede
    async getPersonal(idSede) {
        const [rows] = await pool.query(
            `SELECT u.ID_USUARIO, u.RUT, u.NOMBRE, u.APELLIDO, u.EMAIL, r.NOMBRE_ROL, u.ESTADO_ACTIVO
             FROM usuarios u
             JOIN roles r ON u.ID_ROL = r.ID_ROL
             WHERE u.ID_SEDE = ?
             ORDER BY u.APELLIDO, u.NOMBRE`,
            [idSede]
        );
        return rows;
    }
};

module.exports = sedesService;
