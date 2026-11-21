const preinscripcionesService = require('../services/preinscripcionesService');
const { rutValido, normalizarRut, correoValido, celularValido, normalizarCelular, nombreValido } = require('../utils/validaciones');

const create = async (req, res) => {
    const { nombre, rut, correo, telefono, idSede } = req.body;
    if (![nombre, rut, correo, telefono].every((value) => typeof value === 'string' && value.trim())
        || !Number.isInteger(Number(idSede)) || Number(idSede) < 1) {
        return res.status(400).json({ mensaje: 'Debe ingresar nombre, RUT, correo, teléfono y sede preferida.' });
    }
    if (nombre.trim().length > 150 || rut.trim().length > 12 || correo.trim().length > 150 || telefono.trim().length > 20) {
        return res.status(400).json({ mensaje: 'Uno o más campos superan el largo permitido.' });
    }
    if (!nombreValido(nombre)) {
        return res.status(400).json({ mensaje: 'Ingrese un nombre válido, solo con letras.' });
    }
    if (!rutValido(rut)) {
        return res.status(400).json({ mensaje: 'El RUT no es válido. Revise el número y el dígito verificador.' });
    }
    if (!correoValido(correo)) {
        return res.status(400).json({ mensaje: 'Ingrese un correo electrónico válido.' });
    }
    if (!celularValido(telefono)) {
        return res.status(400).json({ mensaje: 'Ingrese un celular chileno válido (9 dígitos, que parte con 9).' });
    }

    try {
        const preinscripcion = await preinscripcionesService.create({
            nombre: nombre.trim(),
            rut: normalizarRut(rut),
            correo: correo.trim().toLowerCase(),
            telefono: normalizarCelular(telefono),
            idSede: Number(idSede)
        });
        return res.status(201).json({ mensaje: 'Preinscripción recibida correctamente.', preinscripcion });
    } catch (error) {
        if (error.status === 400) return res.status(400).json({ mensaje: error.message });
        console.error('Error al registrar preinscripción:', error);
        return res.status(500).json({ mensaje: 'No se pudo registrar la preinscripción. Intente nuevamente.' });
    }
};

module.exports = { create };
