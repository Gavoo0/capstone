const { pool } = require('../config/db');

const evaluacionesService = {
    // Listar evaluaciones con filtros
    async getAll({ idAlumno, idInstructor, tipoEvaluacion, fechaDesde, fechaHasta } = {}) {
        let query = `
            SELECT 
                e.ID_EVALUACION,
                e.ID_ALUMNO,
                ua.NOMBRE AS NOMBRE_ALUMNO,
                ua.APELLIDO AS APELLIDO_ALUMNO,
                ua.RUT AS RUT_ALUMNO,
                e.ID_INSTRUCTOR,
                ui.NOMBRE AS NOMBRE_INSTRUCTOR,
                ui.APELLIDO AS APELLIDO_INSTRUCTOR,
                e.TIPO_EVALUACION,
                e.NOTA,
                e.FECHA,
                e.OBSERVACIONES,
                e.CREADO_EN
            FROM evaluaciones e
            JOIN usuarios ua ON e.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON e.ID_INSTRUCTOR = ui.ID_USUARIO
            WHERE 1=1
        `;
        const params = [];

        if (idAlumno !== undefined) { query += ' AND e.ID_ALUMNO = ?'; params.push(idAlumno); }
        if (idInstructor !== undefined) { query += ' AND e.ID_INSTRUCTOR = ?'; params.push(idInstructor); }
        if (tipoEvaluacion !== undefined) { query += ' AND UPPER(e.TIPO_EVALUACION) = UPPER(?)'; params.push(tipoEvaluacion); }
        if (fechaDesde !== undefined) { query += ' AND e.FECHA >= ?'; params.push(fechaDesde); }
        if (fechaHasta !== undefined) { query += ' AND e.FECHA <= ?'; params.push(fechaHasta); }

        query += ' ORDER BY e.FECHA DESC, e.CREADO_EN DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener evaluación por ID
    async getById(idEvaluacion) {
        const query = `
            SELECT 
                e.ID_EVALUACION,
                e.ID_ALUMNO,
                ua.NOMBRE AS NOMBRE_ALUMNO,
                ua.APELLIDO AS APELLIDO_ALUMNO,
                ua.RUT AS RUT_ALUMNO,
                e.ID_INSTRUCTOR,
                ui.NOMBRE AS NOMBRE_INSTRUCTOR,
                ui.APELLIDO AS APELLIDO_INSTRUCTOR,
                e.TIPO_EVALUACION,
                e.NOTA,
                e.FECHA,
                e.OBSERVACIONES,
                e.CREADO_EN
            FROM evaluaciones e
            JOIN usuarios ua ON e.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON e.ID_INSTRUCTOR = ui.ID_USUARIO
            WHERE e.ID_EVALUACION = ?
        `;
        const [rows] = await pool.query(query, [idEvaluacion]);
        return rows[0] || null;
    },

    // Obtener evaluaciones de un alumno específico
    async getByAlumno(idAlumno) {
        return this.getAll({ idAlumno });
    },

    // Registrar nueva evaluación
    async create({ idAlumno, idInstructor, tipoEvaluacion, nota, fecha, observaciones = null }) {
        const notaNumerica = parseFloat(nota);
        if (isNaN(notaNumerica) || notaNumerica < 1.0 || notaNumerica > 7.0) {
            throw new Error('La nota debe ser un valor numérico válido entre 1.0 y 7.0.');
        }

        const [result] = await pool.query(
            `INSERT INTO evaluaciones (ID_ALUMNO, ID_INSTRUCTOR, TIPO_EVALUACION, NOTA, FECHA, OBSERVACIONES)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idAlumno, idInstructor, tipoEvaluacion, notaNumerica, fecha, observaciones]
        );

        return this.getById(result.insertId);
    },

    // Actualizar evaluación
    async update(idEvaluacion, { tipoEvaluacion, nota, fecha, observaciones }) {
        const fields = [];
        const values = [];

        if (tipoEvaluacion !== undefined) { fields.push('TIPO_EVALUACION = ?'); values.push(tipoEvaluacion); }
        if (nota !== undefined) {
            const notaNum = parseFloat(nota);
            if (isNaN(notaNum) || notaNum < 1.0 || notaNum > 7.0) {
                throw new Error('La nota debe ser un valor entre 1.0 y 7.0.');
            }
            fields.push('NOTA = ?');
            values.push(notaNum);
        }
        if (fecha !== undefined) { fields.push('FECHA = ?'); values.push(fecha); }
        if (observaciones !== undefined) { fields.push('OBSERVACIONES = ?'); values.push(observaciones); }

        if (fields.length === 0) return this.getById(idEvaluacion);

        values.push(idEvaluacion);
        await pool.query(`UPDATE evaluaciones SET ${fields.join(', ')} WHERE ID_EVALUACION = ?`, values);
        return this.getById(idEvaluacion);
    },

    // Eliminar evaluación
    async delete(idEvaluacion) {
        const [result] = await pool.query('DELETE FROM evaluaciones WHERE ID_EVALUACION = ?', [idEvaluacion]);
        return result.affectedRows > 0;
    },

    // Informe resumido de rendimiento del estudiante
    async getInformeRendimiento(idAlumno) {
        const evaluaciones = await this.getByAlumno(idAlumno);
        if (evaluaciones.length === 0) {
            return {
                totalEvaluaciones: 0,
                promedio: null,
                aprobado: false,
                evaluaciones: []
            };
        }

        const suma = evaluaciones.reduce((acc, curr) => acc + parseFloat(curr.NOTA), 0);
        const promedio = (suma / evaluaciones.length).toFixed(2);
        const aprobado = parseFloat(promedio) >= 4.0;

        return {
            totalEvaluaciones: evaluaciones.length,
            promedio: parseFloat(promedio),
            aprobado,
            evaluaciones
        };
    }
};

module.exports = evaluacionesService;
