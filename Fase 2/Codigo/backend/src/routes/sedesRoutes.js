const router = require('express').Router();
const controller = require('../controllers/sedesController');
const { authorizeRoles } = require('../middleware/auth');

router.get('/:id/vehiculos', controller.getVehiculos);
router.get('/:id/personal', authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'), controller.getPersonal);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.use(authorizeRoles('ADMINISTRADOR'));
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
