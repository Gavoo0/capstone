USE escuela_conductores;

-- Doble confirmación de asistencia a las clases prácticas.
-- Las tres columnas guardan hora de Chile como texto 'AAAA-MM-DD HH:MM' (igual que FECHA y HORA_INICIO):
--   AGENDADA_EL      cuándo se agendó la clase
--   CONFIRMACION_1   cuándo confirmó el alumno (hasta 24 h antes)
--   CONFIRMACION_2   cuándo reconfirmó el alumno (hasta 3 h antes)
-- Las clases que ya existían quedan con AGENDADA_EL en NULL: no se les aplica la liberación automática.
-- Se puede ejecutar más de una vez sin error.

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'clases_practicas' AND COLUMN_NAME = 'AGENDADA_EL'
);

SET @sentencia := IF(@existe = 0,
    'ALTER TABLE clases_practicas
        ADD COLUMN AGENDADA_EL VARCHAR(16) NULL,
        ADD COLUMN CONFIRMACION_1 VARCHAR(16) NULL,
        ADD COLUMN CONFIRMACION_2 VARCHAR(16) NULL',
    'SELECT 1');

PREPARE ejecutar FROM @sentencia;
EXECUTE ejecutar;
DEALLOCATE PREPARE ejecutar;
