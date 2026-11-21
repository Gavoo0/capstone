const test = require('node:test');
const assert = require('node:assert/strict');
const { withAgendaTransaction } = require('../src/utils/agendaTransaction');

const createMockPool = () => {
    let ocupado = false;
    const espera = [];
    return {
        getConnection: async () => ({
            query: async (sql) => {
                if (sql.includes('GET_LOCK')) {
                    if (ocupado) await new Promise((resolve) => espera.push(resolve));
                    ocupado = true;
                    return [[{ acquired: 1 }]];
                }
                if (sql.includes('RELEASE_LOCK')) {
                    if (espera.length) espera.shift()();
                    else ocupado = false;
                    return [[{ released: 1 }]];
                }
                return [[]];
            },
            beginTransaction: async () => {},
            commit: async () => {},
            rollback: async () => {},
            release: () => {}
        })
    };
};

test('serializa escrituras de agenda y libera el lock tras errores', async () => {
    const pool = createMockPool();
    let activas = 0;
    let maxActivas = 0;
    const escribir = async (falla = false) => withAgendaTransaction(async () => {
        activas += 1;
        maxActivas = Math.max(maxActivas, activas);
        await new Promise((resolve) => setTimeout(resolve, 5));
        activas -= 1;
        if (falla) throw new Error('error simulado');
    }, pool);

    await assert.rejects(escribir(true), /error simulado/);
    await Promise.all([escribir(), escribir()]);
    assert.equal(maxActivas, 1);
});
