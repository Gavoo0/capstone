const crypto = require('crypto');
const { pool } = require('../config/db');
const alumnosService = require('./alumnosService');
const { intervaloAgendaValido, fechaISO } = require('../utils/validaciones');
const { withAgendaTransaction } = require('../utils/agendaTransaction');

const ESTADOS_CLASE = new Set(['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'INASISTENCIA', 'CANCELADA']);
const idPositivo = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

const validarRecursos = async (connection, { idAlumno, idInstructor, idVehiculo, idSede }) => {
    if (![idAlumno, idInstructor, idVehiculo, idSede].every(idPositivo)) {
        throw Object.assign(new Error('Los IDs de alumno, instructor, vehículo y sede deben ser números positivos.'), { status: 400 });
    }
    const [rows] = await connection.query(
        `SELECT ua.ESTADO_ACTIVO AS ALUMNO_ACTIVO, ra.NOMBRE_ROL AS ROL_ALUMNO,
                ui.ESTADO_ACTIVO AS INSTRUCTOR_ACTIVO, ri.NOMBRE_ROL AS ROL_INSTRUCTOR,
                v.ESTADO_OPERATIVO, v.ID_SEDE AS SEDE_VEHICULO
         FROM usuarios ua JOIN roles ra ON ra.ID_ROL = ua.ID_ROL
         JOIN usuarios ui ON ui.ID_USUARIO = ? JOIN roles ri ON ri.ID_ROL = ui.ID_ROL
         JOIN vehiculos v ON v.ID_VEHICULO = ? WHERE ua.ID_USUARIO = ?`,
        [Number(idInstructor), Number(idVehiculo), Number(idAlumno)]
    );
    const recurso = rows[0];
    if (!recurso || !recurso.ALUMNO_ACTIVO || !String(recurso.ROL_ALUMNO).includes('ALUMNO')) {
        throw Object.assign(new Error('El alumno seleccionado no existe, no está activo o no tiene rol de alumno.'), { status: 400 });
    }
    if (!recurso.INSTRUCTOR_ACTIVO || !String(recurso.ROL_INSTRUCTOR).includes('INSTRUCTOR')) {
        throw Object.assign(new Error('El instructor seleccionado no existe, no está activo o no tiene rol de instructor.'), { status: 400 });
    }
    if (recurso.ESTADO_OPERATIVO !== 'OPERATIVO' || Number(recurso.SEDE_VEHICULO) !== Number(idSede)) {
        throw Object.assign(new Error('El vehículo no está operativo o no pertenece a la sede seleccionada.'), { status: 400 });
    }
};

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

    async cambiarEstadoPorToken(token, estado, motivo = null) {
        const [result] = await pool.query(
            `UPDATE clases_practicas SET ESTADO = ?${motivo !== null ? ', OBSERVACIONES = ?' : ''}
             WHERE TOKEN_AUTOGESTION = ? AND ESTADO = 'AGENDADA'`,
            motivo !== null ? [estado, motivo, token] : [estado, token]
        );
        const clase = await this.getByToken(token);
        return clase ? { clase, actualizada: result.affectedRows > 0 } : null;
    },

    async confirmarPorToken(token) {
        const marcaConfirmacion = 'Asistencia confirmada por el alumno';
        const [result] = await pool.query(
            `UPDATE clases_practicas SET ESTADO = 'AGENDADA', OBSERVACIONES = ?
             WHERE TOKEN_AUTOGESTION = ? AND ESTADO = 'AGENDADA'
               AND COALESCE(OBSERVACIONES, '') <> ?`,
            [marcaConfirmacion, token, marcaConfirmacion]
        );
        const clase = await this.getByToken(token);
        return clase ? { clase, actualizada: result.affectedRows > 0 } : null;
    },

    async cancelarPorToken(token, motivo = 'Cancelada por el alumno') {
        return this.cambiarEstadoPorToken(token, 'CANCELADA', motivo);
    },

    // Validar disponibilidad de instructor y vehículo
    async verificarDisponibilidad({ idAlumno, idInstructor, idVehiculo, fecha, horaInicio, horaFin, idClaseExcluir = null }, connection = pool) {
        // 1. Conflicto con otra clase del instructor
        let queryInstructor = `
            SELECT ID_CLASE FROM clases_practicas
            WHERE ID_INSTRUCTOR = ? 
              AND FECHA = ?
              AND ESTADO IN ('AGENDADA', 'CONFIRMADA')
              AND HORA_INICIO < ?
              AND HORA_FIN > ?
        `;
        const paramsInstructor = [idInstructor, fecha, horaFin, horaInicio];
        if (idClaseExcluir) {
            queryInstructor += ' AND ID_CLASE != ?';
            paramsInstructor.push(idClaseExcluir);
        }
        const [clasesInstructor] = await connection.query(queryInstructor, paramsInstructor);
        if (clasesInstructor.length > 0) {
            return { disponible: false, motivo: 'El instructor ya tiene una clase asignada en este bloque horario.' };
        }

        // 2. Conflicto con bloqueo de instructor
        const [bloqueosInstructor] = await connection.query(
            `SELECT ID_BLOQUEO FROM bloqueos_flota
             WHERE ID_INSTRUCTOR = ? AND FECHA = ? AND HORA_INICIO < ? AND HORA_FIN > ?`,
            [idInstructor, fecha, horaFin, horaInicio]
        );
        if (bloqueosInstructor.length > 0) {
            return { disponible: false, motivo: 'El instructor tiene un bloqueo de agenda en este horario.' };
        }

        // El alumno tampoco puede asistir a dos clases simultáneas aunque cambien instructor y vehículo.
        const [clasesAlumno] = await connection.query(
            `SELECT ID_CLASE FROM clases_practicas
             WHERE ID_ALUMNO = ? AND FECHA = ? AND ESTADO IN ('AGENDADA', 'CONFIRMADA')
               AND HORA_INICIO < ? AND HORA_FIN > ?${idClaseExcluir ? ' AND ID_CLASE != ?' : ''}`,
            idClaseExcluir ? [idAlumno, fecha, horaFin, horaInicio, idClaseExcluir] : [idAlumno, fecha, horaFin, horaInicio]
        );
        if (clasesAlumno.length > 0) {
            return { disponible: false, motivo: 'El alumno ya tiene una clase asignada en este bloque horario.' };
        }

        // 3. Conflicto con otra clase del vehículo
        let queryVehiculo = `
            SELECT ID_CLASE FROM clases_practicas
            WHERE ID_VEHICULO = ? 
              AND FECHA = ?
              AND ESTADO IN ('AGENDADA', 'CONFIRMADA')
              AND HORA_INICIO < ?
              AND HORA_FIN > ?
        `;
        const paramsVehiculo = [idVehiculo, fecha, horaFin, horaInicio];
        if (idClaseExcluir) {
            queryVehiculo += ' AND ID_CLASE != ?';
            paramsVehiculo.push(idClaseExcluir);
        }
        const [clasesVehiculo] = await connection.query(queryVehiculo, paramsVehiculo);
        if (clasesVehiculo.length > 0) {
            return { disponible: false, motivo: 'El vehículo seleccionado ya está reservado para otra clase en este bloque horario.' };
        }

        // 4. Conflicto con bloqueo del vehículo
        const [bloqueosVehiculo] = await connection.query(
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
    async agendarClase({ idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin, observaciones = null }) {
        if (!intervaloAgendaValido(fecha, horaInicio, horaFin)) {
            throw Object.assign(new Error('La fecha u horario no es válido. Use fecha YYYY-MM-DD y horas HH:MM con término posterior al inicio.'), { status: 400 });
        }
        if (observaciones !== null && (typeof observaciones !== 'string' || observaciones.length > 5000)) {
            throw Object.assign(new Error('Las observaciones deben ser texto de hasta 5000 caracteres.'), { status: 400 });
        }
        const idClase = await withAgendaTransaction(async (connection) => {
            await connection.query('SELECT ID_USUARIO FROM alumnos_detalle WHERE ID_USUARIO = ? FOR UPDATE', [idAlumno]);
            await validarRecursos(connection, { idAlumno, idInstructor, idVehiculo, idSede });
            const checkAlumno = await alumnosService.isHabilitadoParaPractica(idAlumno, 75.0, connection);
            if (!checkAlumno.habilitado) {
                throw Object.assign(new Error(`No se puede agendar la clase: ${checkAlumno.motivo}`), { status: 400 });
            }
            const checkDisponibilidad = await this.verificarDisponibilidad({ idAlumno, idInstructor, idVehiculo, fecha, horaInicio, horaFin }, connection);
            if (!checkDisponibilidad.disponible) throw Object.assign(new Error(checkDisponibilidad.motivo), { status: 409 });

            const tokenAutogestion = crypto.randomUUID();
            const [result] = await connection.query(
                `INSERT INTO clases_practicas
                 (ID_ALUMNO, ID_INSTRUCTOR, ID_VEHICULO, ID_SEDE, FECHA, HORA_INICIO, HORA_FIN, ESTADO, TOKEN_AUTOGESTION, OBSERVACIONES)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'AGENDADA', ?, ?)`,
                [idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin, tokenAutogestion, observaciones]
            );
            return result.insertId;
        });
        return this.getById(idClase);
    },

    // Cambiar estado de la clase (e.g. 'REALIZADA', 'CANCELADA', 'INASISTENCIA')
    async cambiarEstado(idClase, nuevoEstado, observaciones = null) {
        if (typeof nuevoEstado !== 'string' || !ESTADOS_CLASE.has(nuevoEstado)) {
            throw Object.assign(new Error('El estado indicado no es válido.'), { status: 400 });
        }
        const claseActual = await this.getById(idClase);
        if (!claseActual) return null;
        const transiciones = {
            AGENDADA: new Set(['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'INASISTENCIA', 'CANCELADA']),
            CONFIRMADA: new Set(['CONFIRMADA', 'REALIZADA', 'INASISTENCIA', 'CANCELADA'])
        };
        if (!transiciones[claseActual.ESTADO]?.has(nuevoEstado)) {
            throw Object.assign(new Error(`No se puede cambiar una clase ${claseActual.ESTADO} a ${nuevoEstado}.`), { status: 409 });
        }
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
        await withAgendaTransaction(async (connection) => {
            const actual = await this.getById(idClase);
            if (!actual) throw Object.assign(new Error('Clase no encontrada.'), { status: 404 });
            if (!['AGENDADA', 'CONFIRMADA'].includes(actual.ESTADO)) {
                throw Object.assign(new Error('Solo se pueden reprogramar clases agendadas o confirmadas.'), { status: 409 });
            }
            const idInstructor = nuevoIdInstructor || actual.ID_INSTRUCTOR;
            const idVehiculo = nuevoIdVehiculo || actual.ID_VEHICULO;
            const fecha = fechaISO(nuevaFecha || actual.FECHA);
            const horaInicio = nuevaHoraInicio || actual.HORA_INICIO;
            const horaFin = nuevaHoraFin || actual.HORA_FIN;
            if (!intervaloAgendaValido(fecha, horaInicio, horaFin)) {
                throw Object.assign(new Error('La fecha u horario no es válido.'), { status: 400 });
            }
            await validarRecursos(connection, { idAlumno: actual.ID_ALUMNO, idInstructor, idVehiculo, idSede: actual.ID_SEDE });
            const checkDisponibilidad = await this.verificarDisponibilidad({
                idAlumno: actual.ID_ALUMNO, idInstructor, idVehiculo, fecha, horaInicio, horaFin, idClaseExcluir: idClase
            }, connection);
            if (!checkDisponibilidad.disponible) throw Object.assign(new Error(checkDisponibilidad.motivo), { status: 409 });
            await connection.query(
                `UPDATE clases_practicas SET FECHA = ?, HORA_INICIO = ?, HORA_FIN = ?, ID_INSTRUCTOR = ?, ID_VEHICULO = ? WHERE ID_CLASE = ?`,
                [fecha, horaInicio, horaFin, idInstructor, idVehiculo, idClase]
            );
        });
        return this.getById(idClase);
    }
};

module.exports = clasesPracticasService;
