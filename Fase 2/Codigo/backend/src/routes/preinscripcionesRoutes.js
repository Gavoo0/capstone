const router = require('express').Router();
const controller = require('../controllers/preinscripcionesController');

router.post('/', controller.create);

module.exports = router;
