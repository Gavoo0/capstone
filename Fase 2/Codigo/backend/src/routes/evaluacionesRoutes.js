const router = require('express').Router();
const controller = require('../controllers/evaluacionesController');

router.get('/alumno/:idAlumno/informe', controller.getInformeRendimiento);
router.get('/alumno/:idAlumno', controller.getByAlumno);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
