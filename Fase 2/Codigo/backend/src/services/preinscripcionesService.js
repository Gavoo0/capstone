const { pool } = require('../config/db');

const create = async ({ nombre, rut, correo, telefono, idSede }) => {
    const [sedes] = await pool.query('SELECT ID_SEDE, NOMBRE FROM sedes WHERE ID_SEDE = ?', [idSede]);
    if (!sedes.length) throw Object.assign(new Error('La sede seleccionada no existe.'), { status: 400 });

    const [result] = await pool.query(
        `INSERT INTO preinscripciones (NOMBRE, CONTACTO, SEDE_PREFERIDA, RUT, CORREO, TELEFONO, ID_SEDE)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, `${correo} / ${telefono}`, sedes[0].NOMBRE, rut, correo, telefono, idSede]
    );
    return { id: result.insertId };
};

module.exports = { create };
