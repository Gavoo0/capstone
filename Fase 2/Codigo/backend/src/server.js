require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe estar configurado y tener al menos 32 caracteres.');
}

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
            mensaje: 'No se pudo consultar la base de datos. Intente nuevamente.'
        });
    }
});

// Rutas de los controllers existentes.
app.use('/api', require('./routes'));
app.use('/api', (req, res) => res.status(404).json({ mensaje: 'La ruta solicitada no existe.' }));

// Servir el frontend desde la misma dirección que la API.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Permitir recargar las páginas de React sin interceptar rutas de la API.
app.get('/{*splat}', (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
});

// Iniciar servidor y verificar conexión a MySQL
app.listen(PORT, async () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    await testConnection();
});
