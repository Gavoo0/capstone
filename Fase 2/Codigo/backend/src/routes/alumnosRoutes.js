const router = require('express').Router();
const controller = require('../controllers/alumnosController');

router.put('/:idUsuario/psicotecnico', controller.updatePsicotecnico);
router.put('/:idUsuario/asistencia-teorica', controller.updateAsistenciaTeorica);
router.get('/:idUsuario/habilitado', controller.checkHabilitado);
router.get('/:idUsuario/progreso', controller.getProgreso);
router.get('/', controller.getAll);
router.get('/:idUsuario', controller.getByUsuarioId);

module.exports = router;
