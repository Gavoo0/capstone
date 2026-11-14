const router = require('express').Router();
const controller = require('../controllers/asistenciasTeoricasController');
const { authorizeRoles, authorizeSelfOrRoles } = require('../middleware/auth');
const { authorizeInstructorRecord, scopeInstructorQuery, scopeInstructorBody } = require('../middleware/ownership');

router.get('/alumno/:idAlumno', authorizeSelfOrRoles('idAlumno', 'ADMINISTRADOR', 'INSTRUCTOR'), controller.getByAlumno);
router.use(authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'));
router.post('/masiva', scopeInstructorBody('idInstructor'), controller.registrarMasiva);
router.get('/', scopeInstructorQuery('idInstructor'), controller.getAll);
router.post('/', scopeInstructorBody('idInstructor'), controller.create);
router.delete('/:id', authorizeInstructorRecord('asistencias_teoricas', 'ID_ASISTENCIA', 'ID_INSTRUCTOR'), controller.delete);

module.exports = router;
