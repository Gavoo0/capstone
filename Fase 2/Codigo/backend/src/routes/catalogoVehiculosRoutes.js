const router = require('express').Router();
const controller = require('../controllers/catalogoVehiculosController');

router.get('/marcas', controller.getMarcas);
router.get('/marcas/:marca/modelos', controller.getModelos);

module.exports = router;
