const jwt = require('jsonwebtoken');

const createToken = (user) => jwt.sign(
    { idRol: user.ID_ROL, role: user.NOMBRE_ROL },
    process.env.JWT_SECRET,
    // shortcut: el token no se revoca antes de expirar; agregar lista de bloqueo si se requiere cierre inmediato.
    { subject: String(user.ID_USUARIO), expiresIn: '8h', algorithm: 'HS256' }
);

const authenticate = (req, res, next) => {
    const match = (req.headers.authorization || '').match(/^Bearer ([^\s]+)$/i);
    if (!match) return res.status(401).json({ mensaje: 'Debe iniciar sesión para acceder a este recurso.' });

    try {
        const payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!payload.sub || !payload.role) throw new Error('Token incompleto');
        req.user = { id: Number(payload.sub), idRol: payload.idRol, role: payload.role };
        return next();
    } catch {
        return res.status(401).json({ mensaje: 'El token no es válido o expiró.' });
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
