-- Datos de prueba para desarrollo local (ejecutar DESPUÉS de script_base_datos.sql)
-- Contraseña de los tres usuarios: Futuro2026

USE escuela_conductores;

INSERT INTO ROLES (NOMBRE_ROL) VALUES ('ADMINISTRADOR'), ('INSTRUCTOR'), ('ALUMNO');

INSERT INTO SEDES (NOMBRE, DIRECCION) VALUES
('Macul', 'Av. Macul 4186, Macul'),
('Peñalolén', 'Av. Grecia 5566, Peñalolén');

INSERT INTO USUARIOS (RUT, NOMBRE, APELLIDO, EMAIL, PASSWORD_HASH, ID_ROL, ID_SEDE) VALUES
('11111111-1', 'Admin', 'Prueba', 'admin@futuro.cl', '77af0907450cdaf0e70ba6f7bd9db26c9bc5db1f0af203fba72f78c169f379d7', 1, 1),
('22222222-2', 'Instructor', 'Prueba', 'instructor@futuro.cl', '77af0907450cdaf0e70ba6f7bd9db26c9bc5db1f0af203fba72f78c169f379d7', 2, 1),
('12345678-5', 'Alumno', 'Prueba', 'alumno@futuro.cl', '77af0907450cdaf0e70ba6f7bd9db26c9bc5db1f0af203fba72f78c169f379d7', 3, 1);

INSERT INTO ALUMNOS_DETALLE (ID_USUARIO, ESTADO_PSICOTECNICO, PORCENTAJE_ASISTENCIA_TEORICA, FECHA_MATRICULA)
VALUES (3, 'PENDIENTE', 0.00, CURDATE());
