const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluarConfirmacion, registrarConfirmacion, datosIniciales, ahoraTexto } = require('../src/utils/confirmacionClase');

// Chile está en UTC-3 en noviembre. La clase es el miércoles 25-11-2026 a las 15:00 (hora de Chile).
// Plazo 1: martes 24-11 a las 15:00. Plazo 2: miércoles 25-11 a las 12:00.
const enChile = (fecha, hora) => {
    const [h, m] = hora.split(':').map(Number);
    return new Date(`${fecha}T${String(h + 3).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
};
const clase = (extra = {}) => ({ FECHA: '2026-11-25', HORA_INICIO: '15:00', ESTADO: 'AGENDADA', AGENDADA_EL: '2026-11-20 10:00', CONFIRMACION_1: null, CONFIRMACION_2: null, ...extra });

test('convierte la hora actual a hora de Chile', () => {
    assert.equal(ahoraTexto(new Date('2026-11-24T18:00:00Z')), '2026-11-24 15:00');
});

test('fase 1: antes de las 24 horas se pide la primera confirmación', () => {
    const e = evaluarConfirmacion(clase(), enChile('2026-11-23', '10:00'));
    assert.deepEqual([e.aplica, e.fase, e.confirmada, e.liberar, e.vence], [true, 1, false, false, '2026-11-24 15:00']);
    assert.equal(evaluarConfirmacion(clase({ CONFIRMACION_1: '2026-11-21 09:00' }), enChile('2026-11-23', '10:00')).confirmada, true);
});

test('pasadas las 24 horas sin la primera confirmación se libera el cupo', () => {
    const e = evaluarConfirmacion(clase(), enChile('2026-11-24', '15:01'));
    assert.equal(e.liberar, true);
    assert.equal(evaluarConfirmacion(clase(), enChile('2026-11-24', '14:59')).liberar, false);
});

test('fase 2: confirmó la primera y ahora debe reconfirmar hasta 3 horas antes', () => {
    const c = clase({ CONFIRMACION_1: '2026-11-21 09:00' });
    const e = evaluarConfirmacion(c, enChile('2026-11-25', '08:00'));
    assert.deepEqual([e.fase, e.confirmada, e.liberar, e.vence, e.reconfirmarDesde], [2, false, false, '2026-11-25 12:00', '2026-11-24 15:00']);
    assert.equal(evaluarConfirmacion({ ...c, CONFIRMACION_2: '2026-11-25 08:30' }, enChile('2026-11-25', '09:00')).confirmada, true);
});

test('si no reconfirma antes de las 3 horas se libera; si reconfirmó, no', () => {
    const c = clase({ CONFIRMACION_1: '2026-11-21 09:00' });
    assert.equal(evaluarConfirmacion(c, enChile('2026-11-25', '12:01')).liberar, true);
    assert.equal(evaluarConfirmacion({ ...c, CONFIRMACION_2: '2026-11-25 11:00' }, enChile('2026-11-25', '12:01')).liberar, false);
});

test('no se libera una clase confirmada por la primera vez si todavía no vence la segunda', () => {
    const c = clase({ CONFIRMACION_1: '2026-11-21 09:00' });
    assert.equal(evaluarConfirmacion(c, enChile('2026-11-25', '11:59')).liberar, false);
});

test('clases canceladas, ya iniciadas o antiguas (sin AGENDADA_EL) no se tocan', () => {
    assert.equal(evaluarConfirmacion(clase({ ESTADO: 'CANCELADA' }), enChile('2026-11-25', '13:00')).liberar, false);
    assert.equal(evaluarConfirmacion(clase(), enChile('2026-11-25', '15:00')).aplica, false);
    assert.equal(evaluarConfirmacion(clase({ AGENDADA_EL: null }), enChile('2026-11-25', '13:00')).aplica, false);
    assert.equal(evaluarConfirmacion(clase({ AGENDADA_EL: null }), enChile('2026-11-25', '13:00')).liberar, false);
});

test('una clase agendada con poca anticipación no se castiga por plazos que ya habían pasado', () => {
    // Agendada el martes 24-11 a las 18:00: el plazo de 24 horas ya no existía
    const tarde = clase({ AGENDADA_EL: '2026-11-24 18:00' });
    assert.equal(evaluarConfirmacion(tarde, enChile('2026-11-24', '20:00')).liberar, false);
    // Agendada el miércoles a las 13:00: ya pasó el plazo de las 3 horas, no se exige nada
    const muyTarde = clase({ AGENDADA_EL: '2026-11-25 13:00' });
    const e = evaluarConfirmacion(muyTarde, enChile('2026-11-25', '13:30'));
    assert.deepEqual([e.liberar, e.confirmada], [false, true]);
});

test('registrar confirmación: fase 1 guarda la primera, fase 2 guarda la segunda', () => {
    assert.deepEqual(registrarConfirmacion(clase(), enChile('2026-11-23', '10:00')), { CONFIRMACION_1: '2026-11-23 10:00' });
    const c = clase({ CONFIRMACION_1: '2026-11-21 09:00' });
    assert.deepEqual(registrarConfirmacion(c, enChile('2026-11-25', '09:00')), { CONFIRMACION_1: '2026-11-21 09:00', CONFIRMACION_2: '2026-11-25 09:00' });
    assert.equal(registrarConfirmacion({ ...c, CONFIRMACION_2: '2026-11-25 08:00' }, enChile('2026-11-25', '09:00')), null); // ya confirmada
    assert.equal(registrarConfirmacion(clase(), enChile('2026-11-25', '16:00')), null); // clase ya empezada
});

test('al reservar el alumno, la clase nace confirmada; en la fase 2 también la segunda', () => {
    const lejos = datosIniciales({ fecha: '2026-11-25', horaInicio: '15:00', reservaElAlumno: true }, enChile('2026-11-20', '10:00'));
    assert.deepEqual(lejos, { AGENDADA_EL: '2026-11-20 10:00', CONFIRMACION_1: '2026-11-20 10:00', CONFIRMACION_2: null });
    const cerca = datosIniciales({ fecha: '2026-11-25', horaInicio: '15:00', reservaElAlumno: true }, enChile('2026-11-25', '08:00'));
    assert.equal(cerca.CONFIRMACION_2, '2026-11-25 08:00');
    const admin = datosIniciales({ fecha: '2026-11-25', horaInicio: '15:00', reservaElAlumno: false }, enChile('2026-11-20', '10:00'));
    assert.deepEqual(admin, { AGENDADA_EL: '2026-11-20 10:00', CONFIRMACION_1: null, CONFIRMACION_2: null });
});
