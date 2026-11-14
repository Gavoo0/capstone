const router = require('express').Router();
const controller = require('../controllers/clasesPracticasController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { authorizeInstructorRecord, scopeInstructorQuery } = require('../middleware/ownership');

router.get('/autogestion/:token', controller.getByToken);
router.post('/autogestion/:token/confirmar', controller.confirmarPorToken);
router.post('/autogestion/:token/cancelar', controller.cancelarPorToken);
router.get('/', authenticate, (req, res, next) => {
    if (req.user.role === 'ADMINISTRADOR') return next();
    if (req.user.role === 'INSTRUCTOR') return scopeInstructorQuery('idInstructor')(req, res, next);
    if (req.user.role === 'ALUMNO' && Number(req.query.idAlumno) === req.user.id) return next();
    return res.status(403).json({ mensaje: 'Solo puede consultar las clases de su propia cuenta.' });
}, controller.getAll);
router.use(authenticate, authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'));
router.patch('/:id/estado', authorizeInstructorRecord('clases_practicas', 'ID_CLASE', 'ID_INSTRUCTOR'), controller.cambiarEstado);
router.patch('/:id/cancelar', authorizeRoles('ADMINISTRADOR'), controller.cancelar);
router.patch('/:id/reprogramar', authorizeRoles('ADMINISTRADOR'), controller.reprogramar);
router.get('/:id', authorizeInstructorRecord('clases_practicas', 'ID_CLASE', 'ID_INSTRUCTOR'), controller.getById);
router.post('/', authorizeRoles('ADMINISTRADOR'), controller.agendar);

module.exports = router;
