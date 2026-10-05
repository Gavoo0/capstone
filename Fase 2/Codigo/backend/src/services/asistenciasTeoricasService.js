const { pool } = require('../config/db');

const asistenciasTeoricasService = {
    // Listar asistencias teóricas con filtros
    async getAll({ idAlumno, idInstructor, fecha, estado } = {}) {
        let query = `
            SELECT 
                at.ID_ASISTENCIA,
                at.ID_ALUMNO,
                ua.NOMBRE AS NOMBRE_ALUMNO,
                ua.APELLIDO AS APELLIDO_ALUMNO,
                ua.RUT AS RUT_ALUMNO,
                at.ID_INSTRUCTOR,
                ui.NOMBRE AS NOMBRE_INSTRUCTOR,
                ui.APELLIDO AS APELLIDO_INSTRUCTOR,
                at.NOMBRE_BLOQUE,
                at.FECHA,
                at.ESTADO,
                at.REGISTRADO_EN
            FROM asistencias_teoricas at
            JOIN usuarios ua ON at.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON at.ID_INSTRUCTOR = ui.ID_USUARIO
            WHERE 1=1
        `;
        const params = [];

        if (idAlumno !== undefined) { query += ' AND at.ID_ALUMNO = ?'; params.push(idAlumno); }
        if (idInstructor !== undefined) { query += ' AND at.ID_INSTRUCTOR = ?'; params.push(idInstructor); }
        if (fecha !== undefined) { query += ' AND at.FECHA = ?'; params.push(fecha); }
        if (estado !== undefined) { query += ' AND at.ESTADO = ?'; params.push(estado); }

        query += ' ORDER BY at.FECHA DESC, at.REGISTRADO_EN DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener historial de asistencias de un alumno específico
    async getByAlumno(idAlumno) {
        return this.getAll({ idAlumno });
    },

    // Recalcular y actualizar el porcentaje de asistencia teórica en alumnos_detalle
    async recalcularPorcentajeAsistencia(idAlumno, conn = null) {
        const executor = conn || pool;
        const [rows] = await executor.query(
            `SELECT 
                COUNT(*) AS total_clases,
                SUM(CASE WHEN UPPER(ESTADO) = 'PRESENTE' THEN 1 ELSE 0 END) AS total_presentes
             FROM asistencias_teoricas
             WHERE ID_ALUMNO = ?`,
            [idAlumno]
        );

        const totalClases = rows[0].total_clases || 0;
        const totalPresentes = rows[0].total_presentes || 0;

        let nuevoPorcentaje = 0.00;
        if (totalClases > 0) {
            nuevoPorcentaje = ((totalPresentes / totalClases) * 100).toFixed(2);
        }

        await executor.query(
            'UPDATE alumnos_detalle SET PORCENTAJE_ASISTENCIA_TEORICA = ? WHERE ID_USUARIO = ?',
            [nuevoPorcentaje, idAlumno]
        );

        return nuevoPorcentaje;
    },

    // Registrar asistencia individual
    async create({ idAlumno, idInstructor, nombreBloque, fecha, estado }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO asistencias_teoricas (ID_ALUMNO, ID_INSTRUCTOR, NOMBRE_BLOQUE, FECHA, ESTADO)
                 VALUES (?, ?, ?, ?, ?)`,
                [idAlumno, idInstructor, nombreBloque, fecha, estado]
            );

            // Actualizar porcentaje en la ficha del alumno
            const nuevoPorcentaje = await this.recalcularPorcentajeAsistencia(idAlumno, connection);

            await connection.commit();

            return {
                idAsistencia: result.insertId,
                idAlumno,
                idInstructor,
                nombreBloque,
                fecha,
                estado,
                nuevoPorcentajeAsistencia: nuevoPorcentaje
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Registrar asistencia masiva para un bloque/clase
    async registrarMasiva(asistenciasList, { idInstructor, nombreBloque, fecha }) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const item of asistenciasList) {
                // item: { idAlumno, estado }
                await connection.query(
                    `INSERT INTO asistencias_teoricas (ID_ALUMNO, ID_INSTRUCTOR, NOMBRE_BLOQUE, FECHA, ESTADO)
                     VALUES (?, ?, ?, ?, ?)`,
                    [item.idAlumno, idInstructor, nombreBloque, fecha, item.estado]
                );

                await this.recalcularPorcentajeAsistencia(item.idAlumno, connection);
            }

            await connection.commit();
            return { totalRegistrados: asistenciasList.length };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Eliminar asistencia y recalcular
    async delete(idAsistencia) {
        const [rows] = await pool.query('SELECT ID_ALUMNO FROM asistencias_teoricas WHERE ID_ASISTENCIA = ?', [idAsistencia]);
        if (rows.length === 0) return false;

        const idAlumno = rows[0].ID_ALUMNO;
        await pool.query('DELETE FROM asistencias_teoricas WHERE ID_ASISTENCIA = ?', [idAsistencia]);
        await this.recalcularPorcentajeAsistencia(idAlumno);
        return true;
    }
};

module.exports = asistenciasTeoricasService;
