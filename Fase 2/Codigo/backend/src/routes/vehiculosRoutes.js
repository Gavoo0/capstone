const router = require('express').Router();
const controller = require('../controllers/vehiculosController');

router.get('/disponibles', controller.getDisponibles);
router.get('/patente/:patente', controller.getByPatente);
router.patch('/:id/estado', controller.updateEstado);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
