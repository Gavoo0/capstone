CREATE TABLE sedes (
    id_sede SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    telefono VARCHAR(20)
);
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
);
INSERT INTO sedes (nombre, direccion, telefono) VALUES ('Sede Macul', 'Av. Macul #2345', '+56 9 1111 2222'), ('Sede PeÃ±alolÃ©n', 'Av. Grecia #6789', '+56 9 3333 4444');
INSERT INTO roles (nombre_rol) VALUES ('ADMIN'), ('INSTRUCTOR'), ('ESTUDIANTE');
