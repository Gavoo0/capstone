const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const createToken = (user) => jwt.sign(
    { idRol: user.ID_ROL, role: user.NOMBRE_ROL, tokenVersion: Number(user.TOKEN_VERSION || 0) },
    process.env.JWT_SECRET,
    // shortcut: el token no se revoca antes de expirar; agregar lista de bloqueo si se requiere cierre inmediato.
    { subject: String(user.ID_USUARIO), expiresIn: '8h', algorithm: 'HS256' }
);

const authenticate = async (req, res, next) => {
    const match = (req.headers.authorization || '').match(/^Bearer ([^\s]+)$/i);
    if (!match) return res.status(401).json({ mensaje: 'Debe iniciar sesión para acceder a este recurso.' });

    let payload;
    try {
        payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).json({ mensaje: 'El token no es válido o expiró.' });
    }
    if (!payload.sub || !payload.role || !Number.isInteger(payload.tokenVersion)) {
        return res.status(401).json({ mensaje: 'El token no es válido o expiró.' });
    }
    try {
        const [rows] = await pool.query(
            `SELECT u.ID_USUARIO, u.ID_ROL, u.TOKEN_VERSION, r.NOMBRE_ROL
             FROM usuarios u JOIN roles r ON r.ID_ROL = u.ID_ROL
             WHERE u.ID_USUARIO = ? AND u.ESTADO_ACTIVO = 1`,
            [payload.sub]
        );
        const current = rows[0];
        if (!current || Number(current.TOKEN_VERSION) !== payload.tokenVersion) {
            return res.status(401).json({ mensaje: 'La sesión ya no está activa. Inicie sesión nuevamente.' });
        }
        req.user = { id: current.ID_USUARIO, idRol: current.ID_ROL, role: current.NOMBRE_ROL };
        return next();
    } catch (error) {
        console.error('Error al verificar estado de sesión:', error);
        return res.status(503).json({ mensaje: 'No se pudo verificar la sesión. Intente nuevamente.' });
    }
};

const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ mensaje: 'No tiene permisos para realizar esta acción.' });
    }
    next();
};

const authorizeSelfOrRoles = (param, ...roles) => (req, res, next) => {
    if (req.user && (roles.includes(req.user.role) || req.user.id === Number(req.params[param]))) return next();
    return res.status(403).json({ mensaje: 'No tiene permisos para consultar este registro.' });
};

module.exports = { authenticate, authorizeRoles, authorizeSelfOrRoles, createToken };
