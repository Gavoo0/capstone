const crypto = require('crypto');
const { pool } = require('../config/db');
const alumnosService = require('./alumnosService');

const clasesPracticasService = {
    // Listar clases con filtros completos
    async getAll({ idSede, idAlumno, idInstructor, idVehiculo, fecha, fechaDesde, fechaHasta, estado } = {}) {
        let query = `
            SELECT 
                cp.ID_CLASE,
                cp.ID_ALUMNO,
                ua.NOMBRE AS NOMBRE_ALUMNO,
                ua.APELLIDO AS APELLIDO_ALUMNO,
                ua.RUT AS RUT_ALUMNO,
                cp.ID_INSTRUCTOR,
                ui.NOMBRE AS NOMBRE_INSTRUCTOR,
                ui.APELLIDO AS APELLIDO_INSTRUCTOR,
                cp.ID_VEHICULO,
                v.PATENTE AS PATENTE_VEHICULO,
                v.MODELO AS MODELO_VEHICULO,
                v.TRANSMISION AS TRANSMISION_VEHICULO,
                cp.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                cp.FECHA,
                cp.HORA_INICIO,
                cp.HORA_FIN,
                cp.ESTADO,
                cp.TOKEN_AUTOGESTION,
                cp.OBSERVACIONES,
                cp.CREADO_EN
            FROM clases_practicas cp
            JOIN usuarios ua ON cp.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON cp.ID_INSTRUCTOR = ui.ID_USUARIO
            JOIN vehiculos v ON cp.ID_VEHICULO = v.ID_VEHICULO
            JOIN sedes s ON cp.ID_SEDE = s.ID_SEDE
            WHERE 1=1
        `;
        const params = [];

        if (idSede !== undefined) { query += ' AND cp.ID_SEDE = ?'; params.push(idSede); }
        if (idAlumno !== undefined) { query += ' AND cp.ID_ALUMNO = ?'; params.push(idAlumno); }
        if (idInstructor !== undefined) { query += ' AND cp.ID_INSTRUCTOR = ?'; params.push(idInstructor); }
        if (idVehiculo !== undefined) { query += ' AND cp.ID_VEHICULO = ?'; params.push(idVehiculo); }
        if (estado !== undefined) { query += ' AND cp.ESTADO = ?'; params.push(estado); }
        if (fecha !== undefined) { query += ' AND cp.FECHA = ?'; params.push(fecha); }
        if (fechaDesde !== undefined) { query += ' AND cp.FECHA >= ?'; params.push(fechaDesde); }
        if (fechaHasta !== undefined) { query += ' AND cp.FECHA <= ?'; params.push(fechaHasta); }

        query += ' ORDER BY cp.FECHA DESC, cp.HORA_INICIO ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener clase por ID
    async getById(idClase) {
        const query = `
            SELECT 
                cp.ID_CLASE,
                cp.ID_ALUMNO,
                ua.NOMBRE AS NOMBRE_ALUMNO,
                ua.APELLIDO AS APELLIDO_ALUMNO,
                ua.RUT AS RUT_ALUMNO,
                ua.EMAIL AS EMAIL_ALUMNO,
                cp.ID_INSTRUCTOR,
                ui.NOMBRE AS NOMBRE_INSTRUCTOR,
                ui.APELLIDO AS APELLIDO_INSTRUCTOR,
                cp.ID_VEHICULO,
                v.PATENTE AS PATENTE_VEHICULO,
                v.MODELO AS MODELO_VEHICULO,
                v.TRANSMISION AS TRANSMISION_VEHICULO,
                cp.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                cp.FECHA,
                cp.HORA_INICIO,
                cp.HORA_FIN,
                cp.ESTADO,
                cp.TOKEN_AUTOGESTION,
                cp.OBSERVACIONES,
                cp.CREADO_EN
            FROM clases_practicas cp
            JOIN usuarios ua ON cp.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON cp.ID_INSTRUCTOR = ui.ID_USUARIO
            JOIN vehiculos v ON cp.ID_VEHICULO = v.ID_VEHICULO
            JOIN sedes s ON cp.ID_SEDE = s.ID_SEDE
            WHERE cp.ID_CLASE = ?
        `;
        const [rows] = await pool.query(query, [idClase]);
        return rows[0] || null;
    },

    // Buscar clase mediante token de autogestión
    async getByToken(token) {
        const query = `
            SELECT 
                cp.ID_CLASE,
                cp.ID_ALUMNO,
                ua.NOMBRE AS NOMBRE_ALUMNO,
                ua.APELLIDO AS APELLIDO_ALUMNO,
                cp.ID_INSTRUCTOR,
                ui.NOMBRE AS NOMBRE_INSTRUCTOR,
                ui.APELLIDO AS APELLIDO_INSTRUCTOR,
                cp.ID_VEHICULO,
                v.PATENTE AS PATENTE_VEHICULO,
                v.MODELO AS MODELO_VEHICULO,
                cp.ID_SEDE,
                s.NOMBRE AS NOMBRE_SEDE,
                cp.FECHA,
                cp.HORA_INICIO,
                cp.HORA_FIN,
                cp.ESTADO,
                cp.TOKEN_AUTOGESTION,
                cp.OBSERVACIONES
            FROM clases_practicas cp
            JOIN usuarios ua ON cp.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON cp.ID_INSTRUCTOR = ui.ID_USUARIO
            JOIN vehiculos v ON cp.ID_VEHICULO = v.ID_VEHICULO
            JOIN sedes s ON cp.ID_SEDE = s.ID_SEDE
            WHERE cp.TOKEN_AUTOGESTION = ?
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0] || null;
    },

    // Validar disponibilidad de instructor y vehículo
    async verificarDisponibilidad({ idInstructor, idVehiculo, fecha, horaInicio, horaFin, idClaseExcluir = null }) {
        // 1. Conflicto con otra clase del instructor
        let queryInstructor = `
            SELECT ID_CLASE FROM clases_practicas
            WHERE ID_INSTRUCTOR = ? 
              AND FECHA = ?
              AND ESTADO = 'AGENDADA'
              AND HORA_INICIO < ?
              AND HORA_FIN > ?
        `;
        const paramsInstructor = [idInstructor, fecha, horaFin, horaInicio];
        if (idClaseExcluir) {
            queryInstructor += ' AND ID_CLASE != ?';
            paramsInstructor.push(idClaseExcluir);
        }
        const [clasesInstructor] = await pool.query(queryInstructor, paramsInstructor);
        if (clasesInstructor.length > 0) {
            return { disponible: false, motivo: 'El instructor ya tiene una clase asignada en este bloque horario.' };
        }

        // 2. Conflicto con bloqueo de instructor
        const [bloqueosInstructor] = await pool.query(
            `SELECT ID_BLOQUEO FROM bloqueos_flota
             WHERE ID_INSTRUCTOR = ? AND FECHA = ? AND HORA_INICIO < ? AND HORA_FIN > ?`,
            [idInstructor, fecha, horaFin, horaInicio]
        );
        if (bloqueosInstructor.length > 0) {
            return { disponible: false, motivo: 'El instructor tiene un bloqueo de agenda en este horario.' };
        }

        // 3. Conflicto con otra clase del vehículo
        let queryVehiculo = `
            SELECT ID_CLASE FROM clases_practicas
            WHERE ID_VEHICULO = ? 
              AND FECHA = ?
              AND ESTADO = 'AGENDADA'
              AND HORA_INICIO < ?
              AND HORA_FIN > ?
        `;
        const paramsVehiculo = [idVehiculo, fecha, horaFin, horaInicio];
        if (idClaseExcluir) {
            queryVehiculo += ' AND ID_CLASE != ?';
            paramsVehiculo.push(idClaseExcluir);
        }
        const [clasesVehiculo] = await pool.query(queryVehiculo, paramsVehiculo);
        if (clasesVehiculo.length > 0) {
            return { disponible: false, motivo: 'El vehículo seleccionado ya está reservado para otra clase en este bloque horario.' };
        }

        // 4. Conflicto con bloqueo del vehículo
        const [bloqueosVehiculo] = await pool.query(
            `SELECT ID_BLOQUEO FROM bloqueos_flota
             WHERE ID_VEHICULO = ? AND FECHA = ? AND HORA_INICIO < ? AND HORA_FIN > ?`,
            [idVehiculo, fecha, horaFin, horaInicio]
        );
        if (bloqueosVehiculo.length > 0) {
            return { disponible: false, motivo: 'El vehículo seleccionado se encuentra bloqueado por mantención o taller en este horario.' };
        }

        return { disponible: true };
    },

    // Agendar una nueva clase práctica aplicando todas las reglas de negocio
    async agendarClase({ idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin, observaciones = null, omitirValidacionAlumno = false }) {
        // Regla 1: Validar que el alumno cumpla los requisitos (psicotécnico + asistencia teórica)
        if (!omitirValidacionAlumno) {
            const checkAlumno = await alumnosService.isHabilitadoParaPractica(idAlumno);
            if (!checkAlumno.habilitado) {
                const error = new Error(`No se puede agendar la clase: ${checkAlumno.motivo}`);
                error.status = 400;
                throw error;
            }
        }

        // Regla 2: Validar disponibilidad de instructor y vehículo
        const checkDisponibilidad = await this.verificarDisponibilidad({
            idInstructor,
            idVehiculo,
            fecha,
            horaInicio,
            horaFin
        });

        if (!checkDisponibilidad.disponible) {
            const error = new Error(checkDisponibilidad.motivo);
            error.status = 409;
            throw error;
        }

        // Generar token único para que el alumno pueda autogestionar la clase
        const tokenAutogestion = crypto.randomUUID();

        const [result] = await pool.query(
            `INSERT INTO clases_practicas 
             (ID_ALUMNO, ID_INSTRUCTOR, ID_VEHICULO, ID_SEDE, FECHA, HORA_INICIO, HORA_FIN, ESTADO, TOKEN_AUTOGESTION, OBSERVACIONES)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'AGENDADA', ?, ?)`,
            [idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin, tokenAutogestion, observaciones]
        );

        return this.getById(result.insertId);
    },

    // Cambiar estado de la clase (e.g. 'REALIZADA', 'CANCELADA', 'INASISTENCIA')
    async cambiarEstado(idClase, nuevoEstado, observaciones = null) {
        let query = 'UPDATE clases_practicas SET ESTADO = ?';
        const params = [nuevoEstado];

        if (observaciones !== null) {
            query += ', OBSERVACIONES = ?';
            params.push(observaciones);
        }

        query += ' WHERE ID_CLASE = ?';
        params.push(idClase);

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) return null;
        return this.getById(idClase);
    },

    // Cancelar clase práctica
    async cancelarClase(idClase, motivo = 'Cancelada por el usuario') {
        return this.cambiarEstado(idClase, 'CANCELADA', motivo);
    },

    // Reprogramar fecha/hora de una clase existente
    async reprogramarClase(idClase, { nuevaFecha, nuevaHoraInicio, nuevaHoraFin, nuevoIdInstructor, nuevoIdVehiculo }) {
        const claseActual = await this.getById(idClase);
        if (!claseActual) {
            throw new Error('Clase no encontrada.');
        }

        const idInstructor = nuevoIdInstructor || claseActual.ID_INSTRUCTOR;
        const idVehiculo = nuevoIdVehiculo || claseActual.ID_VEHICULO;
        const fecha = nuevaFecha || claseActual.FECHA;
        const horaInicio = nuevaHoraInicio || claseActual.HORA_INICIO;
        const horaFin = nuevaHoraFin || claseActual.HORA_FIN;

        const checkDisponibilidad = await this.verificarDisponibilidad({
            idInstructor,
            idVehiculo,
            fecha,
            horaInicio,
            horaFin,
            idClaseExcluir: idClase
        });

        if (!checkDisponibilidad.disponible) {
            const error = new Error(checkDisponibilidad.motivo);
            error.status = 409;
            throw error;
        }

        await pool.query(
            `UPDATE clases_practicas
             SET FECHA = ?, HORA_INICIO = ?, HORA_FIN = ?, ID_INSTRUCTOR = ?, ID_VEHICULO = ?, ESTADO = 'AGENDADA'
             WHERE ID_CLASE = ?`,
            [fecha, horaInicio, horaFin, idInstructor, idVehiculo, idClase]
        );

        return this.getById(idClase);
    }
};

module.exports = clasesPracticasService;
