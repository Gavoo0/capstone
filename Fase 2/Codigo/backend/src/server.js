require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { pool, testConnection } = require('./config/db');
const { verifyConnection: verifyEmailConnection } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
    throw new Error('JWT_SECRET debe estar configurado y tener al menos 32 caracteres.');
}

// No confiar cabeceras de proxy salvo que se configure el número real de saltos de infraestructura.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:4000,http://localhost:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS debe configurarse para producción.');
}
if (process.env.NODE_ENV === 'production') {
    let frontendOrigin;
    try {
        frontendOrigin = new URL(process.env.FRONTEND_URL).origin;
    } catch {
        throw new Error('FRONTEND_URL debe ser la URL HTTPS del sitio publicado.');
    }
    if (!process.env.FRONTEND_URL.startsWith('https://') || !allowedOrigins.includes(frontendOrigin)) {
        throw new Error('FRONTEND_URL debe usar HTTPS y su origen debe estar en ALLOWED_ORIGINS.');
    }
}

// Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'style-src-attr': ["'unsafe-inline'"],
            'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:']
        }
    }
}));
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '64kb' }));

// Ruta de estado general
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API REST Escuela de Conductores Futuro en línea'
    });
});

app.get('/api/ready', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'READY' });
    } catch {
        res.status(503).json({ status: 'NOT_READY', mensaje: 'La base de datos no está disponible.' });
    }
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

// Verificar dependencias antes de aceptar tráfico; evitar publicar un proceso que no puede operar.
const start = async () => {
    const dbReady = await testConnection();
    if (!dbReady) throw new Error('No se pudo iniciar: MySQL no está disponible.');
    if (process.env.NODE_ENV === 'production') await verifyEmailConnection();
    app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));
};

start().catch((error) => {
    console.error('Error de inicio:', error.message);
    process.exit(1);
});
