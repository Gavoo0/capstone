const nodemailer = require('nodemailer');

const configured = () => Boolean(process.env.MAIL_HOST && process.env.MAIL_FROM);

const createTransporter = () => {
    if (!configured()) return null;
    const auth = process.env.MAIL_USER && process.env.MAIL_PASSWORD
        ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
        : undefined;
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT || 587),
        secure: process.env.MAIL_SECURE === 'true',
        auth,
        requireTLS: process.env.MAIL_SECURE !== 'true'
    });
};

const sendPasswordReset = async (to, url) => {
    const transporter = createTransporter();
    if (!transporter) {
        if (process.env.NODE_ENV === 'production') throw new Error('Falta configurar el servicio de correo.');
        console.info(`[DEV] Enlace de recuperación de contraseña: ${url}`);
        return;
    }
    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: 'Restablecer contraseña · Escuela Futuro',
        text: `Solicitaste cambiar tu contraseña. Abre este enlace dentro de 20 minutos: ${url}\nSi no realizaste esta solicitud, ignora este correo.`,
        html: `<p>Solicitaste cambiar tu contraseña.</p><p><a href="${url}">Crear contraseña nueva</a></p><p>El enlace vence en 20 minutos y solo puede usarse una vez.</p><p>Si no realizaste esta solicitud, ignora este correo.</p>`
    });
};

const verifyConnection = async () => {
    const transporter = createTransporter();
    if (!transporter) throw new Error('Configura MAIL_HOST y MAIL_FROM para producción.');
    await transporter.verify();
};

module.exports = { sendPasswordReset, verifyConnection };
