USE escuela_conductores;

-- Marca, modelo y anio del vehiculo en columnas separadas, para elegirlos de un catalogo
-- y evitar errores de tipeo. La columna MODELO se mantiene como texto para mostrar
-- (por ejemplo "Toyota Yaris 2022"), asi las pantallas y consultas actuales no cambian.
-- Los vehiculos ya registrados quedan con las columnas nuevas en NULL.
-- Se puede ejecutar mas de una vez sin error.

SET @existe := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'vehiculos' AND COLUMN_NAME = 'MARCA'
);

SET @sentencia := IF(@existe = 0,
    'ALTER TABLE vehiculos
        ADD COLUMN MARCA VARCHAR(60) NULL AFTER PATENTE,
        ADD COLUMN MODELO_NOMBRE VARCHAR(80) NULL AFTER MARCA,
        ADD COLUMN ANIO SMALLINT NULL AFTER MODELO',
    'SELECT 1');

PREPARE ejecutar FROM @sentencia;
EXECUTE ejecutar;
DEALLOCATE PREPARE ejecutar;
