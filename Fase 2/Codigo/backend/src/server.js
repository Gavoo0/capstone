require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de estado general
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API REST Escuela de Conductores Futuro en línea'
    });
});

// Ruta de prueba para verificar consultas a MySQL
app.get('/api/db-test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS resultado, NOW() AS fecha_servidor');
        res.json({
            status: 'success',
            message: 'Consulta a MySQL ejecutada con éxito',
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al consultar MySQL',
            error: error.message
        });
    }
});

// Iniciar servidor y verificar conexión a MySQL
app.listen(PORT, async () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    await testConnection();
});
