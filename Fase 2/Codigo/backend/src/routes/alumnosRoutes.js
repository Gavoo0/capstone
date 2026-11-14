const router = require('express').Router();
const controller = require('../controllers/alumnosController');
const { authorizeRoles, authorizeSelfOrRoles } = require('../middleware/auth');

router.put('/:idUsuario/psicotecnico', authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'), controller.updatePsicotecnico);
router.put('/:idUsuario/asistencia-teorica', authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'), controller.updateAsistenciaTeorica);
router.get('/:idUsuario/habilitado', authorizeSelfOrRoles('idUsuario', 'ADMINISTRADOR', 'INSTRUCTOR'), controller.checkHabilitado);
router.get('/:idUsuario/progreso', authorizeSelfOrRoles('idUsuario', 'ADMINISTRADOR', 'INSTRUCTOR'), controller.getProgreso);
router.get('/', authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'), controller.getAll);
router.get('/:idUsuario', authorizeSelfOrRoles('idUsuario', 'ADMINISTRADOR', 'INSTRUCTOR'), controller.getByUsuarioId);

module.exports = router;
