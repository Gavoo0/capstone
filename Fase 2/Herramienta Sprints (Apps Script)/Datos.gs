/**
 * Datos.gs — datos iniciales de "Escuela de Conductores Futuro".
 * Origen de cada fila:
 *   'Documento'  = tomado de los documentos de sprint ya entregados (Fase 1 y 2).
 *   'Git'        = reconstruido desde commits reales de github.com/Gavoo0/capstone.
 *   'Inferido'   = fecha de cierre deducida de un commit; CONFIRMAR con el equipo.
 *   'Planificado'= trabajo pendiente a la fecha de carga (22/11/2026).
 * No se incluyen Daily Meetings: no hay evidencia de que se hayan registrado.
 */
function datosIniciales_() {
  var M = 'Maximiliano Valdebenito', G = 'Gabriel Godoy', O = 'Máximo Ortega';
  var sprints = [
    { ID: 'S1', Nombre: 'Sprint 1 · Tarjetas técnicas e historias', Objetivo: 'Base técnica del proyecto: frontend inicial, conexión a base de datos, portada pública y plan de pruebas.', Inicio: '2026-09-21', Fin: '2026-10-05', Estado: 'Cerrado', Origen: 'Documento (Sprint Planning 2) + Git' },
    { ID: 'S2', Nombre: 'Sprint 2 · Conexión frontend–backend', Objetivo: 'Conectar el backend con las interfaces: acceso seguro, gestión de flota y disponibilidad para el agendamiento.', Inicio: '2026-10-06', Fin: '2026-10-19', Estado: 'Cerrado', Origen: 'Documento (Sprint Planning 2)' },
    { ID: 'S3', Nombre: 'Sprint 3 · Desarrollo del frontend completo', Objetivo: 'Construir los paneles de administrador, instructor y alumno. El trabajo se hizo en este periodo, pero se subió a GitHub recién el 09/11 (commit e9457c9).', Inicio: '2026-10-20', Fin: '2026-11-02', Estado: 'Cerrado', Origen: 'Declarado por el equipo + Git (subida tardía)' },
    { ID: 'S4', Nombre: 'Sprint 4 · Frontend completo e integración', Objetivo: 'Integrar seguridad y autogestión de clases en el backend, y actualizar documentación (README).', Inicio: '2026-11-03', Fin: '2026-11-16', Estado: 'Cerrado', Origen: 'Git' },
    { ID: 'S5', Nombre: 'Sprint 5 · Cierre y calidad', Objetivo: 'Reserva del alumno con doble confirmación, seguridad, QA y documentación de cierre de la Fase 2.', Inicio: '2026-11-17', Fin: '2026-11-30', Estado: 'Activo', Origen: 'Planificado' }
  ];

  var historias = [
    ['US-01', 'EP-04', 'Gestión de la flota de vehículos e instructores', 'ALTA', 12, 'Implementada (por validar)'],
    ['US-02', 'EP-03', 'Bloqueo de disponibilidad por salida municipal', 'ALTA', 16, 'Implementada (por validar)'],
    ['US-03', 'EP-02', 'Acceso a Tarjeta Web mediante inicio de sesión', 'ALTA', 8, 'Implementada (por validar)'],
    ['US-04', 'EP-03', 'Visualización de agenda diaria (instructor)', 'ALTA', 8, 'Implementada (por validar)'],
    ['US-05', 'EP-04', 'Registro de asistencia a bloques (instructor)', 'ALTA', 8, 'Implementada (por validar)'],
    ['US-06', 'EP-03', 'Consulta de disponibilidad de vehículos', 'ALTA', 8, 'Implementada (por validar)'],
    ['US-07', 'EP-02', 'Consulta de horarios prácticos agendados', 'ALTA', 4, 'Implementada (por validar)'],
    ['US-08', 'EP-02', 'Autogestión y cancelación de horas', 'ALTA', 16, 'Implementada (por validar)'],
    ['US-09', 'EP-04', 'Ingreso y evaluación psicotécnica', 'ALTA', 8, 'Por verificar'],
    ['US-10', 'EP-01', 'Exploración del catálogo y sucursales', 'MEDIO', 4, 'Implementada (por validar)'],
    ['US-11', 'EP-01', 'Preinscripción mediante formulario público', 'MEDIO', 8, 'Por verificar'],
    ['US-12', 'EP-04', 'Gestión de formularios de preinscripción', 'MEDIO', 8, 'Por verificar'],
    ['US-13', 'EP-04', 'Ingreso de notas de exámenes (instructor)', 'MEDIO', 4, 'Por verificar'],
    ['US-14', 'EP-04', 'Panel de métricas de rendimiento (admin)', 'MEDIO', 24, 'Pendiente'],
    ['US-15', 'EP-04', 'Revisión del perfil del alumno (instructor)', 'BAJO', 8, 'Por verificar']
  ].map(function (f) { return { ID: f[0], Epica: f[1], Titulo: f[2], Prioridad: f[3], Horas: f[4], Estado: f[5] }; });

  // t(id, sprint, hu, titulo, area, resp, estado, cierre, evidencia, origen)
  var t = function (id, sp, hu, tit, area, resp, est, cierre, ev, org, h) {
    return { ID: id, Sprint: sp, HU: hu, Titulo: tit, Area: area, Responsable: resp, Estado: est,
      HorasEst: h || '', FechaCierre: cierre || '', Evidencia: ev || '', Origen: org || '', Orden: 0 };
  };
  var CR = 'Por confirmar';
  var tareas = [
    // ---- Sprint 1 (Git) ----
    t('S1-01', 'S1', 'US-03', 'Inicializar frontend React + Vite + Tailwind y vista Tarjeta del Alumno', 'Frontend', CR, 'Completado', '2026-09-21', 'Commit 130667e', 'Git'),
    t('S1-02', 'S1', 'US-03', 'Incorporar las 6 vistas principales y enrutamiento con React Router', 'Frontend', CR, 'Completado', '2026-09-21', 'Commit 816c203', 'Git'),
    t('S1-03', 'S1', 'Soporte', 'Presentación del proyecto (Fase 1)', 'Gestión', CR, 'Completado', '2026-09-21', 'Commit e223721', 'Git'),
    t('S1-04', 'S1', 'Soporte', 'Conexión del backend a MySQL con mysql2 y variables de entorno', 'Backend', G, 'Completado', '2026-09-27', 'Commits 8bb637d, f8277e6', 'Git'),
    t('S1-05', 'S1', 'US-10', 'Hub público: carrusel de cursos, sedes con datos reales y logo', 'Frontend', M, 'Completado', '2026-09-27', 'Commits 14d21f3, 7b5c4d0 (PR #4)', 'Git'),
    t('S1-06', 'S1', 'QA', 'Plan de pruebas del Sprint 1 (6 casos, US-01 a US-06)', 'QA', CR, 'Completado', '2026-09-28', 'Commit 3dcce51', 'Git'),
    t('S1-07', 'S1', 'US-03', 'Pantalla de inicio de sesión y CSS de marca compartido', 'Frontend', M, 'Completado', '2026-10-04', 'Commit 0435131 (PR #5)', 'Git'),
    t('S1-08', 'S1', 'US-01', 'Servicios y controladores del backend para todas las tablas', 'Backend', G, 'Completado', '2026-10-04', 'Commit cabedeb', 'Git'),
    // ---- Sprint 2 (Documento: Scrumboard Sprint 2) ----
    t('SB2-01', 'S2', 'US-01', 'Conectar la pantalla administrativa de vehículos con la API', 'Frontend', CR, 'Completado', '2026-10-18', 'Commit b2ab984 (panel admin). Fecha inferida', 'Inferido'),
    t('SB2-05', 'S2', 'US-02', 'Aplicar bloqueos en disponibilidad y agendamiento', 'Backend', CR, 'Completado', '2026-10-11', 'Commit cfe98b7. Fecha inferida', 'Inferido'),
    t('SB2-06', 'S2', 'US-02', 'Verificar un bloqueo y sus efectos en la agenda', 'QA', CR, 'Completado', '2026-10-19', 'Documentos de QA del 19/10. Fecha inferida', 'Inferido'),
    t('SB2-07', 'S2', 'US-03', 'Conectar inicio de sesión con /api/usuarios/login', 'Frontend', CR, 'Completado', '2026-10-11', 'Commit cfe98b7. Fecha inferida', 'Inferido'),
    t('SB2-08', 'S2', 'US-03', 'Proteger rutas según rol y revisar seguridad de acceso', 'Backend', CR, 'Completado', '2026-10-11', 'Commit cfe98b7. Fecha inferida', 'Inferido'),
    t('SB2-15', 'S2', 'Soporte', 'Alinear esquema SQL y configuración de base de datos', 'Backend / Infra', G, 'Completado', '2026-10-11', 'Commit cfe98b7. Fecha inferida', 'Inferido'),
    // ---- Arrastradas del Sprint 2 y terminadas en Sprint 3 (frontend, subido el 09/11) o Sprint 4 ----
    t('SB2-02', 'S4', 'US-01', 'Validar asignación de recursos a Macul o Peñalolén (arrastrada del Sprint 2)', 'Backend / QA', G, 'Completado', '2026-11-14', 'Commit dcec154. Fecha inferida', 'Inferido'),
    t('SB2-03', 'S3', 'US-01', 'Integrar gestión de instructores con el módulo de flota (arrastrada del Sprint 2)', 'Full stack', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-04', 'S3', 'US-02', 'Formulario administrativo de bloqueos (arrastrada del Sprint 2)', 'Frontend', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-09', 'S3', 'US-03', 'Mostrar la Tarjeta Web y progreso del alumno (arrastrada del Sprint 2)', 'Full stack', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-10', 'S3', 'US-04', 'Agenda diaria del instructor (arrastrada del Sprint 2)', 'Frontend', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-11', 'S4', 'US-04', 'Consultar clases desde backend por instructor (arrastrada del Sprint 2)', 'Full stack', G, 'Completado', '2026-11-14', 'Commit dcec154. Fecha inferida', 'Inferido'),
    t('SB2-12', 'S3', 'US-06', 'Disponibilidad de vehículos por bloque (arrastrada del Sprint 2)', 'Frontend', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-13', 'S3', 'US-06', 'Advertencias de bloqueos o conflictos (arrastrada del Sprint 2)', 'Frontend / QA', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-14', 'S3', 'US-10', 'Revisar catálogo, requisitos y datos de sucursales (arrastrada del Sprint 2)', 'Frontend / QA', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('SB2-16', 'S5', 'QA', 'Preparar y ejecutar pruebas del alcance confirmado (arrastrada del Sprint 2)', 'QA', O, 'Completado', '2026-11-19', 'PR #8 qa/pruebas-maximo. Fecha inferida', 'Inferido'),
    t('SB2-17', 'S5', 'QA', 'Registrar defectos e informar retests (arrastrada del Sprint 2)', 'QA', O, 'Por hacer', '', 'Sin registro de defectos recuperado', 'Documento'),
    t('SB2-18', 'S5', 'Gestión', 'Actualizar estados del tablero y enlaces de evidencia (arrastrada del Sprint 2)', 'Equipo', CR, 'En curso', '', 'Se reemplaza por esta herramienta', 'Documento'),
    // ---- Sprint 4 (Git) ----
    t('S3-01', 'S3', 'US-03', 'Frontend completo: paneles de administrador, instructor y alumno', 'Frontend', M, 'Completado', '2026-11-02', 'Desarrollado en el Sprint 3 (declarado por el equipo); commit e9457c9 subido el 09/11. Fecha de cierre estimada', 'Declarado'),
    t('S4-02', 'S4', 'Gestión', 'Actualizar README del proyecto', 'Equipo', M, 'Completado', '2026-11-09', 'Commit 5bacd89', 'Git'),
    t('S4-03', 'S4', 'US-08', 'Integración y seguridad del sistema; autogestión de clase', 'Backend', G, 'Completado', '2026-11-14', 'Commit dcec154 (PR #7)', 'Git'),
    // ---- Sprint 5 ----
    t('S5-01', 'S5', 'QA', 'Pruebas de QA y corrección de errores de tipeo', 'QA', O, 'Completado', '2026-11-19', 'Commit 5317488 (PR #8)', 'Git'),
    t('S5-02', 'S5', 'US-03', 'Recuperación de contraseña y validación de RUT, correo y celular', 'Frontend', M, 'Completado', '2026-11-21', 'Commits 77cd85c, 3956a6a (PR #9)', 'Git'),
    t('S5-03', 'S5', 'US-03', 'Refuerzo de seguridad y validaciones del backend (auditoría)', 'Backend', G, 'Completado', '2026-11-21', 'Commit 877de7d (PR #10)', 'Git'),
    t('S5-04', 'S5', 'QA', 'Corrección de errores detectados en QA', 'QA', O, 'Completado', '2026-11-22', 'Commit a5c514e', 'Git'),
    t('S5-05', 'S5', 'US-01', 'Catálogo de vehículos: marca, modelo y año con API NHTSA', 'Full stack', M, 'Completado', '2026-11-22', 'Commit fcfff01', 'Git'),
    t('S5-06', 'S5', 'US-08', 'Reserva de clases por el alumno con reglas de negocio', 'Full stack', M, 'Completado', '2026-11-22', 'Commit fcfff01', 'Git'),
    t('S5-07', 'S5', 'US-08', 'Doble confirmación de asistencia y liberación automática de cupos', 'Full stack', M, 'Completado', '2026-11-22', 'Commit fcfff01. Falta prueba de punta a punta', 'Git'),
    t('S5-08', 'S5', 'Gestión', 'Diario de reflexión de la Fase 2', 'Equipo', G, 'Completado', '2026-11-22', 'Commit d39c022', 'Git'),
    t('S5-09', 'S5', 'US-08', 'Aplicar migración 004 y probar la doble confirmación de punta a punta', 'Full stack', M, 'Por hacer', '', 'Migración backend/database/migrations/004', 'Planificado'),
    t('S5-10', 'S5', 'QA', 'Redactar el Plan de pruebas (unitarias, caja negra, integración, rendimiento, seguridad)', 'QA', O, 'Por hacer', '', '', 'Planificado'),
    t('S5-11', 'S5', 'Soporte', 'Diagrama de arquitectura (despliegue y componentes)', 'Equipo', G, 'Por hacer', '', '', 'Planificado'),
    t('S5-12', 'S5', 'Soporte', 'Diagramas de secuencia de las 2 funcionalidades principales', 'Equipo', M, 'Por hacer', '', '', 'Planificado'),
    t('S5-13', 'S5', 'Gestión', 'Informe final del Proyecto APT (incluye sección de innovación)', 'Equipo', CR, 'Por hacer', '', '', 'Planificado'),
    t('S5-14', 'S5', 'Gestión', 'Presentación final para la comisión', 'Equipo', M, 'En revisión', '', 'Borrador de 15 láminas listo', 'Planificado'),
    t('S5-15', 'S5', 'Gestión', 'Ensayo de la presentación y preparación de la demo', 'Equipo', CR, 'Por hacer', '', '', 'Planificado'),
    t('S5-16', 'S5', 'Gestión', 'Registrar daily, impedimentos y burndown reales con esta herramienta', 'Equipo', CR, 'En curso', '', '', 'Planificado')
  ];
  tareas.forEach(function (x, i) {
    x.Orden = i + 1;
    x.SprintInicial = /arrastrada del Sprint 2/.test(x.Titulo) ? 'S2' : x.Sprint;
  });

  var imp = function (id, fecha, sp, desc, impacto, prio, resp, est, accion, cierre, ev) {
    return { ID: id, Fecha: fecha, Sprint: sp, Descripcion: desc, Impacto: impacto, Prioridad: prio,
      Responsable: resp, Estado: est, Accion: accion, FechaCierre: cierre, Evidencia: ev };
  };
  var impedimentos = [
    imp('IMP-01', '2026-10-06', 'S2', 'La configuración local de base de datos declaraba dos motores distintos (PostgreSQL en Docker, MySQL en el backend).', 'Entorno no reproducible', 'Alta', G, 'Resuelto', 'Se estandarizó MySQL 8 en Docker Compose y scripts init.', '2026-11-22', 'Impediment_Log_Sprint_2 · OBS-01; verificado en entorno local'),
    imp('IMP-02', '2026-10-06', 'S2', 'El formulario de inicio de sesión no estaba conectado a la API.', 'Bloqueaba US-03', 'Alta', CR, 'Resuelto', 'Se integró el login con la API y rutas protegidas.', '2026-10-11', 'Commit cfe98b7'),
    imp('IMP-03', '2026-10-06', 'S2', 'La vista administrativa de agendamiento era un marcador «Próximamente».', 'Bloqueaba US-02 y US-06', 'Media', M, 'Resuelto', 'Se implementó el frontend completo.', '2026-11-09', 'Commit e9457c9'),
    imp('IMP-04', '2026-10-06', 'S2', 'La suscripción a Jira no estuvo disponible a tiempo; tablero y burndown no se mantuvieron.', 'Sin trazabilidad diaria de sprints', 'Alta', CR, 'Resuelto', 'Se construyó esta herramienta propia en Apps Script con datos reconstruidos desde Git.', '2026-11-22', 'Fecha de detección por confirmar'),
    imp('IMP-05', '2026-11-22', 'S5', 'Puerto y clave de la base local no coincidían con Docker (3306 frente a 3307).', 'El backend no iniciaba', 'Media', M, 'Resuelto', 'Se corrigió DB_PORT y DB_PASSWORD en el .env local.', '2026-11-22', ''),
    imp('IMP-06', '2026-11-22', 'S5', 'Conflicto de edición del formateo de RUT con el cambio de un compañero.', 'Riesgo de pisar trabajo ajeno', 'Baja', M, 'Resuelto', 'Se revirtió el cambio propio y se usó la versión del compañero.', '2026-11-22', ''),
    imp('IMP-07', '2026-11-22', 'S5', 'Riesgo de reservas simultáneas del mismo bloque y vehículo.', 'Posible doble reserva', 'Alta', G, 'Resuelto', 'Bloqueo de agenda con transacción (GET_LOCK) y pruebas de carrera.', '2026-11-22', 'Pruebas de concurrencia, 10 rondas'),
    imp('IMP-09', '2026-11-02', 'S3', 'El frontend desarrollado durante el Sprint 3 no se subió a GitHub a tiempo; no había commits entre el 20/10 y el 08/11.', 'Sin trazabilidad en Git y sin visibilidad para el equipo', 'Media', M, 'Resuelto', 'Se subió el 09/11 (PR #6). Acordar commits y push al menos una vez por semana.', '2026-11-09', 'Commit e9457c9 / PR #6'),
    imp('IMP-08', '2026-11-22', 'S5', 'Falta aplicar la migración 004 en las bases de datos del equipo.', 'Las consultas de clases fallan sin ella', 'Alta', M, 'Abierto', 'Aplicar la migración y reiniciar el backend.', '', 'S5-09')
  ];

  var config = {
    GitHubRepo: 'Gavoo0/capstone',
    GitHubRama: 'main',
    GitHubToken: '',
    AliasGit: JSON.stringify({
      'Maximiliano-Sai': M, 'Gabriel': G, 'Govoyl': G, 'mortega': O, 'Máximo Ortega': O
    }),
    Integrantes: JSON.stringify([M, G, O])
  };
  return { sprints: sprints, historias: historias, tareas: tareas, impedimentos: impedimentos, config: config };
}
