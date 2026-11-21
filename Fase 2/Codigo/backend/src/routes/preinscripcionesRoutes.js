const router = require('express').Router();
const controller = require('../controllers/preinscripcionesController');
const { preinscriptionLimiter } = require('../middleware/rateLimits');

router.post('/', preinscriptionLimiter, controller.create);

module.exports = router;
