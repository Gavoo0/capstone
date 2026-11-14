const { pool } = require('../config/db');

const authorizeInstructorRecord = (table, idColumn, ownerColumn) => async (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR') return next();

    try {
        const [rows] = await pool.query(
            `SELECT ${ownerColumn} AS ownerId FROM ${table} WHERE ${idColumn} = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ mensaje: 'No se encontró el registro solicitado.' });
        if (Number(rows[0].ownerId) !== req.user.id) {
            return res.status(403).json({ mensaje: 'Solo puede modificar los registros que tiene asignados.' });
        }
        return next();
    } catch (error) {
        console.error('Error al comprobar propiedad del registro:', error);
        return res.status(500).json({ mensaje: 'Ocurrió un error interno. Intente nuevamente.' });
    }
};

const scopeInstructorQuery = (field) => (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR') return next();
    if (req.query[field] !== undefined && Number(req.query[field]) !== req.user.id) {
        return res.status(403).json({ mensaje: 'Solo puede consultar sus propios registros.' });
    }
    req.instructorScopeId = req.user.id;
    return next();
};

const scopeInstructorBody = (field) => (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR') return next();
    req.body ??= {};
    if (req.body?.[field] !== undefined && Number(req.body[field]) !== req.user.id) {
        return res.status(403).json({ mensaje: 'Solo puede registrar información a su propio nombre.' });
    }
    req.body[field] = req.user.id;
    return next();
};

module.exports = { authorizeInstructorRecord, scopeInstructorQuery, scopeInstructorBody };
