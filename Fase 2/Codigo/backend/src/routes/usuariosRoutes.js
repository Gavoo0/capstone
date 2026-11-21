const router = require('express').Router();
const controller = require('../controllers/usuariosController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { loginIpLimiter, loginAccountLimiter, recoveryLimiter } = require('../middleware/rateLimits');

router.post('/login', loginIpLimiter, loginAccountLimiter, controller.login);
router.post('/recuperar-clave', recoveryLimiter, controller.solicitarRecuperacion);
router.post('/restablecer-clave', recoveryLimiter, controller.restablecerClave);
router.post('/logout', authenticate, controller.logout);
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
