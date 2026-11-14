const router = require('express').Router();
const controller = require('../controllers/usuariosController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.post('/login', controller.login);
router.use(authenticate, authorizeRoles('ADMINISTRADOR'));
router.get('/rut/:rut', controller.getByRut);
router.patch('/:id/estado', controller.toggleEstado);
router.patch('/:id/password', controller.updatePassword);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
