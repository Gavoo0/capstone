const test = require('node:test');
const assert = require('node:assert/strict');
const { validarSolicitud, buscarAsignacion, ahoraEnChile, fechaTextoValida, BLOQUES_HORARIOS } = require('../src/utils/reservaAlumno');

// Lunes 2 de noviembre de 2026, 10:00 en Chile (UTC-3 en esa fecha, horario de verano)
const AHORA = new Date('2026-11-02T13:00:00Z');
const bloque = { horaInicio: '15:00', horaFin: '16:30' };

test('calcula la fecha y hora de Chile', () => {
    assert.deepEqual(ahoraEnChile(AHORA), { fecha: '2026-11-02', minutos: 600 });
    assert.equal(ahoraEnChile(new Date('2026-11-03T02:00:00Z')).fecha, '2026-11-02'); // pasada la medianoche en UTC
});

test('acepta un bloque oficial en un día hábil futuro', () => {
    assert.equal(validarSolicitud({ fecha: '2026-11-03', ...bloque }, AHORA), null);
    assert.equal(validarSolicitud({ fecha: '2026-11-02', ...bloque }, AHORA), null); // hoy, con más de 2 horas
});

test('rechaza fechas inválidas, fines de semana y pasado', () => {
    assert.match(validarSolicitud({ fecha: '2026-13-40', ...bloque }, AHORA), /fecha no es válida/);
    assert.match(validarSolicitud({ fecha: 'mañana', ...bloque }, AHORA), /fecha no es válida/);
    assert.match(validarSolicitud({ fecha: '2026-11-07', ...bloque }, AHORA), /lunes a viernes/); // sábado
    assert.match(validarSolicitud({ fecha: '2026-11-08', ...bloque }, AHORA), /lunes a viernes/); // domingo
    assert.match(validarSolicitud({ fecha: '2026-10-30', ...bloque }, AHORA), /pasadas/);
});

test('rechaza horarios que no son bloques oficiales', () => {
    assert.match(validarSolicitud({ fecha: '2026-11-03', horaInicio: '15:00', horaFin: '17:00' }, AHORA), /bloques de clase/);
    assert.match(validarSolicitud({ fecha: '2026-11-03', horaInicio: '03:00', horaFin: '04:30' }, AHORA), /bloques de clase/);
});

test('exige 2 horas de anticipación el mismo día y máximo 30 días adelante', () => {
    assert.match(validarSolicitud({ fecha: '2026-11-02', horaInicio: '11:30', horaFin: '13:00' }, AHORA), /2 horas/);
    assert.match(validarSolicitud({ fecha: '2026-11-02', horaInicio: '09:40', horaFin: '11:10' }, AHORA), /2 horas/);
    assert.equal(validarSolicitud({ fecha: '2026-12-02', ...bloque }, AHORA), null); // justo 30 días
    assert.match(validarSolicitud({ fecha: '2026-12-03', ...bloque }, AHORA), /30 días/);
});

test('los bloques oficiales son los de la agenda', () => {
    assert.equal(BLOQUES_HORARIOS.length, 5);
    assert.ok(fechaTextoValida('2026-02-28'));
    assert.ok(!fechaTextoValida('2026-02-30'));
});

const base = {
    vehiculos: [{ ID_VEHICULO: 1 }, { ID_VEHICULO: 2 }],
    instructores: [{ ID_USUARIO: 10 }, { ID_USUARIO: 11 }],
    clases: [], bloqueos: [], fecha: '2026-11-03', horaInicio: '15:00', horaFin: '16:30',
};
const clase = (extra) => ({ FECHA: '2026-11-03', HORA_INICIO: '15:00', HORA_FIN: '16:30', ESTADO: 'AGENDADA', ID_ALUMNO: 99, ...extra });

test('asigna el primer vehículo e instructor libres', () => {
    assert.deepEqual(buscarAsignacion(base), { idVehiculo: 1, idInstructor: 10 });
});

test('salta los vehículos e instructores ocupados o bloqueados en ese horario', () => {
    const ocupado = [clase({ ID_VEHICULO: 1, ID_INSTRUCTOR: 10 })];
    assert.deepEqual(buscarAsignacion({ ...base, clases: ocupado }), { idVehiculo: 2, idInstructor: 11 });
    const bloqueos = [{ FECHA: '2026-11-03', HORA_INICIO: '14:00', HORA_FIN: '15:30', ID_VEHICULO: 1, ID_INSTRUCTOR: null }];
    assert.deepEqual(buscarAsignacion({ ...base, bloqueos }), { idVehiculo: 2, idInstructor: 10 });
});

test('ignora clases canceladas y de otros horarios o días', () => {
    const clases = [
        clase({ ID_VEHICULO: 1, ID_INSTRUCTOR: 10, ESTADO: 'CANCELADA' }),
        clase({ ID_VEHICULO: 1, ID_INSTRUCTOR: 10, FECHA: '2026-11-04' }),
    ];
    assert.deepEqual(buscarAsignacion({ ...base, clases }), { idVehiculo: 1, idInstructor: 10 });
    // Una clase pegada (16:30 a 18:00) no ocupa el bloque; solo cuenta para repartir la carga del día
    const pegada = [clase({ ID_VEHICULO: 1, ID_INSTRUCTOR: 10, HORA_INICIO: '16:30', HORA_FIN: '18:00' })];
    assert.deepEqual(buscarAsignacion({ ...base, clases: pegada }), { idVehiculo: 1, idInstructor: 11 });
});

test('devuelve null si no queda vehículo o instructor libre', () => {
    const sinVehiculos = [clase({ ID_VEHICULO: 1, ID_INSTRUCTOR: 10 }), clase({ ID_VEHICULO: 2, ID_INSTRUCTOR: 11 })];
    assert.equal(buscarAsignacion({ ...base, clases: sinVehiculos }), null);
    assert.equal(buscarAsignacion({ ...base, instructores: [] }), null);
    assert.equal(buscarAsignacion({ ...base, vehiculos: [] }), null);
});

test('reparte la carga: prefiere al instructor con menos clases ese día', () => {
    const clases = [clase({ ID_VEHICULO: 2, ID_INSTRUCTOR: 10, HORA_INICIO: '09:40', HORA_FIN: '11:10' })];
    assert.deepEqual(buscarAsignacion({ ...base, clases }), { idVehiculo: 1, idInstructor: 11 });
});
