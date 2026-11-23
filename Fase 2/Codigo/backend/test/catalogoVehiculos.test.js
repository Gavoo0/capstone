const test = require('node:test');
const assert = require('node:assert/strict');
const { CATALOGO_CHILE, getMarcas, buscarMarca, getModelos } = require('../src/services/catalogoVehiculosService');
const { textoVehiculoValido, anioVehiculoValido } = require('../src/utils/validaciones');

test('el catalogo tiene marcas ordenadas y modelos sin repetir', () => {
    const marcas = getMarcas();
    assert.ok(marcas.length >= 20);
    assert.deepEqual(marcas, [...marcas].sort((a, b) => a.localeCompare(b, 'es')));
    for (const [marca, modelos] of Object.entries(CATALOGO_CHILE)) {
        assert.ok(modelos.length > 0, marca);
        assert.equal(new Set(modelos).size, modelos.length, `modelos repetidos en ${marca}`);
        assert.ok(textoVehiculoValido(marca), marca);
        modelos.forEach((modelo) => assert.ok(textoVehiculoValido(modelo), `${marca} ${modelo}`));
    }
});

test('busca la marca sin importar mayusculas ni tildes y rechaza las que no existen', () => {
    assert.equal(buscarMarca('citroen'), 'Citroën');
    assert.equal(buscarMarca(' TOYOTA '), 'Toyota');
    assert.equal(buscarMarca('Marca Inventada'), null);
    assert.equal(buscarMarca(''), null);
});

test('si la API externa falla, devuelve solo los modelos habituales', async () => {
    const original = global.fetch;
    global.fetch = async () => { throw new Error('sin red'); };
    const silencio = console.error;
    console.error = () => {};
    try {
        const resultado = await getModelos('Kia');
        assert.equal(resultado.fuenteExterna, false);
        assert.deepEqual(resultado.otros, []);
        assert.ok(resultado.recomendados.includes('Morning'));
    } finally {
        global.fetch = original;
        console.error = silencio;
    }
});

test('con la API externa, agrega los modelos que no estan en la lista y no repite los que si', async () => {
    const original = global.fetch;
    global.fetch = async () => ({
        ok: true,
        json: async () => ({ Results: [{ Model_Name: 'Rio' }, { Model_Name: 'Stinger' }, { Model_Name: 'Stinger' }, { Model_Name: ' ' }] }),
    });
    try {
        const resultado = await getModelos('Kia');
        assert.equal(resultado.fuenteExterna, true);
        assert.deepEqual(resultado.otros, ['Stinger']);
        assert.equal(await getModelos('Marca Inventada'), null);
    } finally {
        global.fetch = original;
    }
});

test('valida el anio y el texto de marca o modelo del vehiculo', () => {
    assert.equal(anioVehiculoValido(2022), true);
    assert.equal(anioVehiculoValido('2022'), true);
    for (const anio of [1980, 2100, 'abc', 2022.5, '', null]) assert.equal(anioVehiculoValido(anio), false, String(anio));
    assert.equal(textoVehiculoValido('Grand i10'), true);
    for (const texto of ['', '   ', '<script>', 'a'.repeat(61), 5, undefined]) assert.equal(textoVehiculoValido(texto), false, String(texto));
});
