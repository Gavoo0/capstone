const router = require('express').Router();
const controller = require('../controllers/bloqueosFlotaController');
const { authorizeRoles } = require('../middleware/auth');

router.use(authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authorizeRoles('ADMINISTRADOR'), controller.create);
router.put('/:id', authorizeRoles('ADMINISTRADOR'), controller.update);
router.delete('/:id', authorizeRoles('ADMINISTRADOR'), controller.delete);

module.exports = router;
