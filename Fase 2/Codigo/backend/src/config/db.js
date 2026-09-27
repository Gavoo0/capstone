const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del Pool de conexiones a MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'escuela_futuro_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para validar la conexión al iniciar el servidor
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión exitosa a la base de datos MySQL:', process.env.DB_NAME || 'escuela_futuro_db');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a MySQL:');
        if (error.code === 'ECONNREFUSED') {
            console.error('   -> No se pudo conectar al host o puerto de MySQL (¿está encendido el servicio?).');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   -> Usuario o contraseña incorrectos.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`   -> La base de datos "${process.env.DB_NAME}" no existe.`);
        } else {
            console.error(`   -> Detalle: ${error.message}`);
        }
        return false;
    }
};

module.exports = {
    pool,
    testConnection
};
