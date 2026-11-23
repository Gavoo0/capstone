const crypto = require('crypto');
const { pool } = require('../config/db');
const alumnosService = require('./alumnosService');
const { intervaloAgendaValido, fechaISO } = require('../utils/validaciones');
const { withAgendaTransaction } = require('../utils/agendaTransaction');
const reserva = require('../utils/reservaAlumno');
const confirmacion = require('../utils/confirmacionClase');

// Agrega a la clase el estado de su doble confirmación (ver utils/confirmacionClase.js)
const conConfirmacion = (clase) => ({ ...clase, CONFIRMACION: confirmacion.evaluarConfirmacion({ ...clase, FECHA: clase.FECHA_TEXTO }) });

const COLUMNAS_CONFIRMACION = `cp.AGENDADA_EL,
                cp.CONFIRMACION_1,
                cp.CONFIRMACION_2,
                DATE_FORMAT(cp.FECHA, '%Y-%m-%d') AS FECHA_TEXTO`;

// Vehículos, instructores, clases y bloqueos de una sede en un rango de fechas (para elegir cupos)
const cargarRecursosSede = async (connection, idSede, desde, hasta) => {
    const [vehiculos] = await connection.query(
        "SELECT ID_VEHICULO FROM vehiculos WHERE ID_SEDE = ? AND ESTADO_OPERATIVO = 'OPERATIVO'", [idSede]);
    const [instructores] = await connection.query(
        `SELECT u.ID_USUARIO FROM usuarios u JOIN roles r ON r.ID_ROL = u.ID_ROL
         WHERE u.ID_SEDE = ? AND u.ESTADO_ACTIVO = 1 AND r.NOMBRE_ROL = 'INSTRUCTOR'`, [idSede]);
    const [clases] = await connection.query(
        `SELECT ID_ALUMNO, ID_INSTRUCTOR, ID_VEHICULO, DATE_FORMAT(FECHA, '%Y-%m-%d') AS FECHA, HORA_INICIO, HORA_FIN, ESTADO
         FROM clases_practicas WHERE FECHA BETWEEN ? AND ? AND ESTADO IN ('AGENDADA', 'CONFIRMADA')`, [desde, hasta]);
    const [bloqueos] = await connection.query(
        `SELECT ID_VEHICULO, ID_INSTRUCTOR, DATE_FORMAT(FECHA, '%Y-%m-%d') AS FECHA, HORA_INICIO, HORA_FIN
         FROM bloqueos_flota WHERE FECHA BETWEEN ? AND ?`, [desde, hasta]);
    return { vehiculos, instructores, clases, bloqueos };
};

const sedeDelAlumno = async (connection, idAlumno) => {
    const [rows] = await connection.query('SELECT ID_SEDE FROM usuarios WHERE ID_USUARIO = ?', [idAlumno]);
    const idSede = rows[0]?.ID_SEDE;
    if (!idSede) {
        throw Object.assign(new Error('Tu cuenta no tiene una sede asignada. Contacta a la administración.'), { status: 400 });
    }
    return idSede;
};

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
                ${COLUMNAS_CONFIRMACION},
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
        return rows.map(conConfirmacion);
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
                ${COLUMNAS_CONFIRMACION},
                cp.CREADO_EN
            FROM clases_practicas cp
            JOIN usuarios ua ON cp.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON cp.ID_INSTRUCTOR = ui.ID_USUARIO
            JOIN vehiculos v ON cp.ID_VEHICULO = v.ID_VEHICULO
            JOIN sedes s ON cp.ID_SEDE = s.ID_SEDE
            WHERE cp.ID_CLASE = ?
        `;
        const [rows] = await pool.query(query, [idClase]);
        return rows[0] ? conConfirmacion(rows[0]) : null;
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
                cp.OBSERVACIONES,
                ${COLUMNAS_CONFIRMACION}
            FROM clases_practicas cp
            JOIN usuarios ua ON cp.ID_ALUMNO = ua.ID_USUARIO
            JOIN usuarios ui ON cp.ID_INSTRUCTOR = ui.ID_USUARIO
            JOIN vehiculos v ON cp.ID_VEHICULO = v.ID_VEHICULO
            JOIN sedes s ON cp.ID_SEDE = s.ID_SEDE
            WHERE cp.TOKEN_AUTOGESTION = ?
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0] ? conConfirmacion(rows[0]) : null;
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
        const actual = await this.getByToken(token);
        if (!actual) return null;

        // Clases antiguas (anteriores a la doble confirmación): se conserva la marca en las observaciones
        if (!actual.AGENDADA_EL) {
            const marca = 'Asistencia confirmada por el alumno';
            const [result] = await pool.query(
                `UPDATE clases_practicas SET OBSERVACIONES = ?
                 WHERE TOKEN_AUTOGESTION = ? AND ESTADO = 'AGENDADA' AND COALESCE(OBSERVACIONES, '') <> ?`,
                [marca, token, marca]
            );
            return { clase: await this.getByToken(token), actualizada: result.affectedRows > 0 };
        }

        const campos = actual.ESTADO === 'AGENDADA' ? confirmacion.registrarConfirmacion({ ...actual, FECHA: actual.FECHA_TEXTO }) : null;
        if (!campos) return { clase: actual, actualizada: false };

        // Si el proceso de liberación canceló la clase justo antes, el estado ya no es AGENDADA y no se actualiza nada
        const [result] = await pool.query(
            `UPDATE clases_practicas SET CONFIRMACION_1 = ?, CONFIRMACION_2 = ?
             WHERE TOKEN_AUTOGESTION = ? AND ESTADO = 'AGENDADA'`,
            [campos.CONFIRMACION_1 ?? actual.CONFIRMACION_1 ?? null, campos.CONFIRMACION_2 ?? actual.CONFIRMACION_2 ?? null, token]
        );
        return { clase: await this.getByToken(token), actualizada: result.affectedRows > 0 };
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
            const datos = confirmacion.datosIniciales({ fecha, horaInicio, reservaElAlumno: false });
            const [result] = await connection.query(
                `INSERT INTO clases_practicas
                 (ID_ALUMNO, ID_INSTRUCTOR, ID_VEHICULO, ID_SEDE, FECHA, HORA_INICIO, HORA_FIN, ESTADO, TOKEN_AUTOGESTION, OBSERVACIONES, AGENDADA_EL, CONFIRMACION_1, CONFIRMACION_2)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'AGENDADA', ?, ?, ?, ?, ?)`,
                [idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin, tokenAutogestion, observaciones, datos.AGENDADA_EL, datos.CONFIRMACION_1, datos.CONFIRMACION_2]
            );
            return result.insertId;
        });
        return this.getById(idClase);
    },

    // Bloques que el alumno puede reservar en su sede entre dos fechas.
    // Estado de cada bloque: DISPONIBLE, SIN_CUPO, TUYA (ya tiene una clase en ese horario) o NO_DISPONIBLE (muy pronto, muy lejos o fin de semana)
    async getBloquesDisponibles({ idAlumno, desde, hasta }) {
        if (!reserva.fechaTextoValida(desde) || !reserva.fechaTextoValida(hasta) || hasta < desde) {
            throw Object.assign(new Error('Indique un rango de fechas válido (desde y hasta, formato AAAA-MM-DD).'), { status: 400 });
        }
        if (hasta > reserva.sumarDias(desde, reserva.DIAS_MAXIMOS_CONSULTA - 1)) {
            throw Object.assign(new Error(`El rango no puede superar ${reserva.DIAS_MAXIMOS_CONSULTA} días.`), { status: 400 });
        }

        const idSede = await sedeDelAlumno(pool, idAlumno);
        const recursos = await cargarRecursosSede(pool, idSede, desde, hasta);
        const dias = [];
        for (let fecha = desde; fecha <= hasta; fecha = reserva.sumarDias(fecha, 1)) {
            const bloques = reserva.BLOQUES_HORARIOS.map(({ inicio, fin }) => {
                let estado;
                if (reserva.validarSolicitud({ fecha, horaInicio: inicio, horaFin: fin })) {
                    estado = 'NO_DISPONIBLE';
                } else if (recursos.clases.some((c) => c.ID_ALUMNO === idAlumno && c.FECHA === fecha && c.HORA_INICIO < fin && c.HORA_FIN > inicio)) {
                    estado = 'TUYA';
                } else if (reserva.buscarAsignacion({ ...recursos, fecha, horaInicio: inicio, horaFin: fin })) {
                    estado = 'DISPONIBLE';
                } else {
                    estado = 'SIN_CUPO';
                }
                return { inicio, fin, estado };
            });
            dias.push({ fecha, bloques });
        }
        return { idSede, dias };
    },

    // El alumno reserva un bloque: el sistema le asigna un vehículo y un instructor libres de su sede.
    // Se hace dentro del mismo bloqueo de agenda que usa el administrador, así dos reservas simultáneas no chocan.
    async solicitarClase({ idAlumno, fecha, horaInicio, horaFin }) {
        const problema = reserva.validarSolicitud({ fecha, horaInicio, horaFin });
        if (problema) throw Object.assign(new Error(problema), { status: 400 });

        const idClase = await withAgendaTransaction(async (connection) => {
            await connection.query('SELECT ID_USUARIO FROM alumnos_detalle WHERE ID_USUARIO = ? FOR UPDATE', [idAlumno]);
            const idSede = await sedeDelAlumno(connection, idAlumno);

            const habilitado = await alumnosService.isHabilitadoParaPractica(idAlumno, 75.0, connection);
            if (!habilitado.habilitado) {
                throw Object.assign(new Error(`No puedes reservar clases todavía: ${habilitado.motivo}`), { status: 400 });
            }

            const hoy = reserva.ahoraEnChile().fecha;
            const [[pendientes]] = await connection.query(
                `SELECT COUNT(*) AS total FROM clases_practicas
                 WHERE ID_ALUMNO = ? AND ESTADO IN ('AGENDADA', 'CONFIRMADA') AND FECHA >= ?`, [idAlumno, hoy]);
            if (pendientes.total >= reserva.MAX_CLASES_PENDIENTES) {
                throw Object.assign(new Error(`Ya tienes ${reserva.MAX_CLASES_PENDIENTES} clases pendientes. Cuando realices o canceles una podrás reservar otra.`), { status: 409 });
            }

            const recursos = await cargarRecursosSede(connection, idSede, fecha, fecha);
            const asignacion = reserva.buscarAsignacion({ ...recursos, fecha, horaInicio, horaFin });
            if (!asignacion) {
                throw Object.assign(new Error('Ese bloque ya no tiene cupo disponible. Elige otro horario.'), { status: 409 });
            }

            await validarRecursos(connection, { idAlumno, idInstructor: asignacion.idInstructor, idVehiculo: asignacion.idVehiculo, idSede });
            const chequeo = await this.verificarDisponibilidad({ idAlumno, ...asignacion, fecha, horaInicio, horaFin }, connection);
            if (!chequeo.disponible) throw Object.assign(new Error(chequeo.motivo), { status: 409 });

            // Como la eligió el propio alumno, la clase nace con su confirmación (ver utils/confirmacionClase.js)
            const datos = confirmacion.datosIniciales({ fecha, horaInicio, reservaElAlumno: true });
            const [result] = await connection.query(
                `INSERT INTO clases_practicas
                 (ID_ALUMNO, ID_INSTRUCTOR, ID_VEHICULO, ID_SEDE, FECHA, HORA_INICIO, HORA_FIN, ESTADO, TOKEN_AUTOGESTION, OBSERVACIONES, AGENDADA_EL, CONFIRMACION_1, CONFIRMACION_2)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'AGENDADA', ?, ?, ?, ?, ?)`,
                [idAlumno, asignacion.idInstructor, asignacion.idVehiculo, idSede, fecha, horaInicio, horaFin, crypto.randomUUID(), null, datos.AGENDADA_EL, datos.CONFIRMACION_1, datos.CONFIRMACION_2]
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
    // Libera (cancela) las clases cuyo alumno no cumplió la doble confirmación a tiempo. Devuelve cuántas liberó.
    // Se llama cada pocos minutos desde server.js. Cada clase se revisa de nuevo dentro del bloqueo de agenda,
    // así una confirmación que llegó justo antes no se pierde.
    async liberarClasesSinConfirmar(ahora = new Date()) {
        const hoy = reserva.ahoraEnChile(ahora).fecha;
        const [candidatas] = await pool.query(
            `SELECT cp.ID_CLASE FROM clases_practicas cp
             WHERE cp.ESTADO IN ('AGENDADA', 'CONFIRMADA') AND cp.AGENDADA_EL IS NOT NULL AND cp.FECHA BETWEEN ? AND ?`,
            [hoy, reserva.sumarDias(hoy, 2)]
        );

        let liberadas = 0;
        for (const { ID_CLASE: idClase } of candidatas) {
            const liberada = await withAgendaTransaction(async (connection) => {
                const [rows] = await connection.query(
                    `SELECT ID_CLASE, ESTADO, HORA_INICIO, AGENDADA_EL, CONFIRMACION_1, CONFIRMACION_2,
                            DATE_FORMAT(FECHA, '%Y-%m-%d') AS FECHA
                     FROM clases_practicas WHERE ID_CLASE = ? FOR UPDATE`, [idClase]);
                if (!rows[0] || !confirmacion.evaluarConfirmacion(rows[0], ahora).liberar) return false;
                await connection.query(
                    `UPDATE clases_practicas SET ESTADO = 'CANCELADA', OBSERVACIONES = ? WHERE ID_CLASE = ? AND ESTADO IN ('AGENDADA', 'CONFIRMADA')`,
                    ['Cupo liberado automáticamente: el alumno no confirmó su asistencia a tiempo.', idClase]
                );
                return true;
            });
            if (liberada) liberadas += 1;
        }
        return liberadas;
    },

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
                `UPDATE clases_practicas SET FECHA = ?, HORA_INICIO = ?, HORA_FIN = ?, ID_INSTRUCTOR = ?, ID_VEHICULO = ?,
                        AGENDADA_EL = ?, CONFIRMACION_1 = NULL, CONFIRMACION_2 = NULL
                 WHERE ID_CLASE = ?`,
                [fecha, horaInicio, horaFin, idInstructor, idVehiculo, confirmacion.ahoraTexto(), idClase]
            );
        });
        return this.getById(idClase);
    }
};

module.exports = clasesPracticasService;
