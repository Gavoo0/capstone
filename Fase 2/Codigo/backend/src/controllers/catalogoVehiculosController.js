const catalogoVehiculosService = require('../services/catalogoVehiculosService');

const catalogoVehiculosController = {
    // GET /api/catalogo-vehiculos/marcas
    getMarcas(req, res) {
        res.json({ marcas: catalogoVehiculosService.getMarcas() });
    },

    // GET /api/catalogo-vehiculos/marcas/:marca/modelos
    async getModelos(req, res) {
        try {
            const resultado = await catalogoVehiculosService.getModelos(req.params.marca);
            if (!resultado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: 'Esa marca no está en el catálogo.' });
            }
            res.json(resultado);
        } catch (error) {
            console.error('Error en catalogoVehiculosController.getModelos:', error);
            res.status(500).json({ error: 'Error al obtener modelos', mensaje: 'No se pudo cargar el catálogo de modelos. Intente nuevamente.' });
        }
    },
};

module.exports = catalogoVehiculosController;
