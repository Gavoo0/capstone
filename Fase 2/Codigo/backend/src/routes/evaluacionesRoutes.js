const router = require('express').Router();
const controller = require('../controllers/evaluacionesController');
const { authorizeRoles, authorizeSelfOrRoles } = require('../middleware/auth');
const { authorizeInstructorRecord, scopeInstructorQuery, scopeInstructorBody } = require('../middleware/ownership');

router.get('/alumno/:idAlumno/informe', authorizeSelfOrRoles('idAlumno', 'ADMINISTRADOR', 'INSTRUCTOR'), controller.getInformeRendimiento);
router.get('/alumno/:idAlumno', authorizeSelfOrRoles('idAlumno', 'ADMINISTRADOR', 'INSTRUCTOR'), controller.getByAlumno);
router.use(authorizeRoles('ADMINISTRADOR', 'INSTRUCTOR'));
router.get('/', scopeInstructorQuery('idInstructor'), controller.getAll);
router.get('/:id', authorizeInstructorRecord('evaluaciones', 'ID_EVALUACION', 'ID_INSTRUCTOR'), controller.getById);
router.post('/', scopeInstructorBody('idInstructor'), controller.create);
router.put('/:id', authorizeInstructorRecord('evaluaciones', 'ID_EVALUACION', 'ID_INSTRUCTOR'), controller.update);
router.delete('/:id', authorizeInstructorRecord('evaluaciones', 'ID_EVALUACION', 'ID_INSTRUCTOR'), controller.delete);

module.exports = router;
