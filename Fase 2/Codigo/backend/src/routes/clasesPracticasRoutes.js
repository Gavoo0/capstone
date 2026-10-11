const router = require('express').Router();
const controller = require('../controllers/clasesPracticasController');

router.get('/autogestion/:token', controller.getByToken);
router.patch('/:id/estado', controller.cambiarEstado);
router.patch('/:id/cancelar', controller.cancelar);
router.patch('/:id/reprogramar', controller.reprogramar);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.agendar);

module.exports = router;
