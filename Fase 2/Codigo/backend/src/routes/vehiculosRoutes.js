const router = require('express').Router();
const controller = require('../controllers/vehiculosController');
const { authorizeRoles } = require('../middleware/auth');

router.get('/disponibles', controller.getDisponibles);
router.get('/patente/:patente', controller.getByPatente);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.use(authorizeRoles('ADMINISTRADOR'));
router.patch('/:id/estado', controller.updateEstado);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
