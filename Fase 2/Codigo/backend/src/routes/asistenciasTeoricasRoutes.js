const router = require('express').Router();
const controller = require('../controllers/asistenciasTeoricasController');

router.get('/alumno/:idAlumno', controller.getByAlumno);
router.post('/masiva', controller.registrarMasiva);
router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

module.exports = router;
