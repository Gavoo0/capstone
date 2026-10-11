const router = require('express').Router();
const controller = require('../controllers/sedesController');

router.get('/:id/vehiculos', controller.getVehiculos);
router.get('/:id/personal', controller.getPersonal);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
