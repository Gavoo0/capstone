const test = require('node:test');
const assert = require('node:assert/strict');
const { rutValido, normalizarRut, intervaloAgendaValido } = require('../src/utils/validaciones');

test('valida RUT con y sin puntos y guion', () => {
    for (const rut of ['12.345.678-5', '12345678-5', '123456785', '21.140.826-K']) {
        assert.equal(rutValido(rut), true, rut);
    }
    assert.equal(normalizarRut('12.345.678-5'), '12345678-5');
});

test('rechaza RUT con dígito incorrecto o caracteres/separadores malformados', () => {
    for (const rut of ['12.345.678-4', 'abc12.345.678-5', '12...345678---5', '123 45678-5', '']) {
        assert.equal(rutValido(rut), false, rut);
    }
});

test('valida fecha real, formato de hora y orden del intervalo de agenda', () => {
    assert.equal(intervaloAgendaValido('2026-11-21', '09:00', '10:30'), true);
    for (const intervalo of [
        ['2026-02-30', '09:00', '10:00'],
        ['2026-11-21', '9:00', '10:00'],
        ['2026-11-21', '25:00', '26:00'],
        ['2026-11-21', '10:00', '10:00'],
        ['2026-11-21', '11:00', '10:00']
    ]) {
        assert.equal(intervaloAgendaValido(...intervalo), false, intervalo.join(' '));
    }
});
