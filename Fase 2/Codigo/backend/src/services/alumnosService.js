const { pool } = require('../config/db');

const alumnosService = {
    // Listar todos los alumnos con sus datos personales y ficha académica
    async getAll() {
        const query = `
            SELECT 
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO,
                ad.ESTADO_PSICOTECNICO,
                ad.FECHA_EVALUACION_PSICOTECNICA,
                ad.OBSERVACION_PSICOTECNICA,
                ad.PORCENTAJE_ASISTENCIA_TEORICA,
                ad.FECHA_MATRICULA
            FROM alumnos_detalle ad
            JOIN usuarios u ON ad.ID_USUARIO = u.ID_USUARIO
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            ORDER BY u.APELLIDO, u.NOMBRE
        `;
        const [rows] = await pool.query(query);
        return rows;
    },

    // Obtener la ficha completa de un alumno por ID_USUARIO
    async getByUsuarioId(idUsuario) {
        const query = `
            SELECT 
                u.ID_USUARIO,
                u.RUT,
                u.NOMBRE,
                u.APELLIDO,
                u.EMAIL,
                u.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                u.ESTADO_ACTIVO,
                ad.ESTADO_PSICOTECNICO,
                ad.FECHA_EVALUACION_PSICOTECNICA,
                ad.OBSERVACION_PSICOTECNICA,
                ad.PORCENTAJE_ASISTENCIA_TEORICA,
                ad.FECHA_MATRICULA
            FROM alumnos_detalle ad
            JOIN usuarios u ON ad.ID_USUARIO = u.ID_USUARIO
            LEFT JOIN sedes s ON u.ID_SEDE = s.ID_SEDE
            WHERE ad.ID_USUARIO = ?
        `;
        const [rows] = await pool.query(query, [idUsuario]);
        return rows[0] || null;
    },

    // Actualizar resultado del examen psicotécnico
    async updatePsicotecnico(idUsuario, { estadoPsicotecnico, fechaEvaluacion, observacion = null }) {
        const [result] = await pool.query(
            `UPDATE alumnos_detalle 
             SET ESTADO_PSICOTECNICO = ?, 
                 FECHA_EVALUACION_PSICOTECNICA = ?, 
                 OBSERVACION_PSICOTECNICA = ?
             WHERE ID_USUARIO = ?`,
            [estadoPsicotecnico, fechaEvaluacion, observacion, idUsuario]
        );
        if (result.affectedRows === 0) return null;
        return this.getByUsuarioId(idUsuario);
    },

    // Actualizar porcentaje de asistencia teórica acumulada
    async updateAsistenciaTeorica(idUsuario, porcentaje) {
        const [result] = await pool.query(
            'UPDATE alumnos_detalle SET PORCENTAJE_ASISTENCIA_TEORICA = ? WHERE ID_USUARIO = ?',
            [porcentaje, idUsuario]
        );
        if (result.affectedRows === 0) return null;
        return this.getByUsuarioId(idUsuario);
    },

    // Validar si el alumno está habilitado para agendar clases prácticas
    // Regla de negocio: Psicotécnico 'APROBADO' y asistencia teórica mínima (ej. 75%)
    async isHabilitadoParaPractica(idUsuario, umbralAsistencia = 75.0) {
        const alumno = await this.getByUsuarioId(idUsuario);
        if (!alumno) {
            return { habilitado: false, motivo: 'El alumno no existe o no tiene ficha registrada.' };
        }

        if (!alumno.ESTADO_ACTIVO) {
            return { habilitado: false, motivo: 'La cuenta del alumno se encuentra inactiva.' };
        }

        const psicotecnicoAprobado = alumno.ESTADO_PSICOTECNICO && alumno.ESTADO_PSICOTECNICO.toUpperCase() === 'APROBADO';
        if (!psicotecnicoAprobado) {
            return { 
                habilitado: false, 
                motivo: `Examen psicotécnico no aprobado (Estado actual: ${alumno.ESTADO_PSICOTECNICO || 'PENDIENTE'}).` 
            };
        }

        const asistenciaActual = parseFloat(alumno.PORCENTAJE_ASISTENCIA_TEORICA) || 0;
        if (asistenciaActual < umbralAsistencia) {
            return { 
                habilitado: false, 
                motivo: `Asistencia teórica insuficiente (${asistenciaActual}% de un mínimo requerido de ${umbralAsistencia}%).` 
            };
        }

        return { habilitado: true, motivo: 'Alumno habilitado para clases prácticas.' };
    },

    // Resumen del progreso completo del alumno
    async getProgresoGeneral(idUsuario) {
        const alumno = await this.getByUsuarioId(idUsuario);
        if (!alumno) return null;

        // Cantidad de clases prácticas realizadas y agendadas
        const [clases] = await pool.query(
            `SELECT 
                COUNT(*) AS total_clases,
                SUM(CASE WHEN ESTADO = 'REALIZADA' THEN 1 ELSE 0 END) AS clases_completadas,
                SUM(CASE WHEN ESTADO = 'AGENDADA' THEN 1 ELSE 0 END) AS clases_pendientes
             FROM clases_practicas
             WHERE ID_ALUMNO = ?`,
            [idUsuario]
        );

        // Promedio de evaluaciones
        const [evals] = await pool.query(
            'SELECT AVG(NOTA) AS promedio_notas, COUNT(*) AS total_evaluaciones FROM evaluaciones WHERE ID_ALUMNO = ?',
            [idUsuario]
        );

        return {
            alumno,
            clasesPracticas: clases[0],
            evaluaciones: {
                promedio: evals[0].promedio_notas ? parseFloat(evals[0].promedio_notas).toFixed(2) : null,
                total: evals[0].total_evaluaciones
            }
        };
    }
};

module.exports = alumnosService;
