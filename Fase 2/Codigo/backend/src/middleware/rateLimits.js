const { rateLimit } = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const crypto = require('node:crypto');

const createLimiter = (windowMs, limit, mensaje, keyGenerator) => rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { mensaje },
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (req, res, next, options) => res.status(options.statusCode).json(options.message)
});

module.exports = {
    loginIpLimiter: createLimiter(15 * 60 * 1000, 100, 'Demasiados intentos desde esta conexión. Espere 15 minutos e intente nuevamente.'),
    loginAccountLimiter: createLimiter(15 * 60 * 1000, 10, 'Demasiados intentos para esta cuenta. Espere 15 minutos e intente nuevamente.', (req) => {
        const identifier = String(req.body?.identificador ?? req.body?.email ?? '').trim().toLowerCase();
        const accountKey = crypto.createHash('sha256').update(identifier).digest('hex');
        return `${ipKeyGenerator(req.ip)}:${accountKey}`;
    }),
    recoveryLimiter: createLimiter(15 * 60 * 1000, 10, 'Demasiadas solicitudes. Espere 15 minutos e intente nuevamente.'),
    preinscriptionLimiter: createLimiter(60 * 60 * 1000, 20, 'Se alcanzó el límite de solicitudes. Intente nuevamente más tarde.')
};
