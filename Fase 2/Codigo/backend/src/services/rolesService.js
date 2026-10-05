const { pool } = require('../config/db');

const rolesService = {
    // Obtener todos los roles
    async getAll() {
        const [rows] = await pool.query('SELECT ID_ROL, NOMBRE_ROL FROM roles ORDER BY ID_ROL ASC');
        return rows;
    },

    // Obtener rol por ID
    async getById(idRol) {
        const [rows] = await pool.query('SELECT ID_ROL, NOMBRE_ROL FROM roles WHERE ID_ROL = ?', [idRol]);
        return rows[0] || null;
    },

    // Obtener rol por nombre
    async getByName(nombreRol) {
        const [rows] = await pool.query('SELECT ID_ROL, NOMBRE_ROL FROM roles WHERE UPPER(NOMBRE_ROL) = UPPER(?)', [nombreRol]);
        return rows[0] || null;
    },

    // Crear un nuevo rol
    async create(nombreRol) {
        const [result] = await pool.query('INSERT INTO roles (NOMBRE_ROL) VALUES (?)', [nombreRol]);
        return {
            idRol: result.insertId,
            nombreRol
        };
    },

    // Actualizar nombre de rol
    async update(idRol, nombreRol) {
        const [result] = await pool.query('UPDATE roles SET NOMBRE_ROL = ? WHERE ID_ROL = ?', [nombreRol, idRol]);
        if (result.affectedRows === 0) return null;
        return { idRol, nombreRol };
    },

    // Eliminar rol
    async delete(idRol) {
        const [result] = await pool.query('DELETE FROM roles WHERE ID_ROL = ?', [idRol]);
        return result.affectedRows > 0;
    }
};

module.exports = rolesService;
