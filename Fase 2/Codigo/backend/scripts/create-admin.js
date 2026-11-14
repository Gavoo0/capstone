require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const required = ['ADMIN_RUT', 'ADMIN_NOMBRE', 'ADMIN_APELLIDO', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
if (process.env.ADMIN_PASSWORD.length < 10) throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres.');
if (Buffer.byteLength(process.env.ADMIN_PASSWORD, 'utf8') > 72) throw new Error('ADMIN_PASSWORD no puede superar 72 bytes.');

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'escuela_conductores'
    });

    try {
        const [admins] = await pool.query(
            `SELECT u.ID_USUARIO FROM usuarios u
             JOIN roles r ON r.ID_ROL = u.ID_ROL
             WHERE r.NOMBRE_ROL = 'ADMINISTRADOR' LIMIT 1`
        );
        if (admins.length) {
            console.log('Ya existe un administrador; no se creó otro.');
            return;
        }

        const [roles] = await pool.query("SELECT ID_ROL FROM roles WHERE NOMBRE_ROL = 'ADMINISTRADOR'");
        if (!roles.length) throw new Error('No existe el rol ADMINISTRADOR en la base de datos.');

        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
        await pool.query(
            `INSERT INTO usuarios (RUT, NOMBRE, APELLIDO, EMAIL, PASSWORD_HASH, ID_ROL, ESTADO_ACTIVO)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [process.env.ADMIN_RUT.trim(), process.env.ADMIN_NOMBRE.trim(), process.env.ADMIN_APELLIDO.trim(),
                process.env.ADMIN_EMAIL.trim().toLowerCase(), passwordHash, roles[0].ID_ROL]
        );
        console.log('Administrador inicial creado. Elimine las variables ADMIN_* de su terminal.');
    } finally {
        await pool.end();
    }
})().catch((error) => {
    console.error('No se pudo crear el administrador:', error.message);
    process.exitCode = 1;
});
