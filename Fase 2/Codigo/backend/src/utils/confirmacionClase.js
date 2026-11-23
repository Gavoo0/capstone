// Doble confirmación de asistencia a una clase práctica.
//
//   1ª confirmación: hasta 24 horas antes de la clase.
//   2ª confirmación ("sigo en pie"): entre 24 y 3 horas antes de la clase.
//
// Si el alumno no cumple una de las dos a tiempo, el sistema libera el cupo para que otro alumno lo tome.
// Todas las horas se manejan como "hora de pared" de Chile en texto 'AAAA-MM-DD HH:MM', igual que FECHA y HORA_INICIO,
// así no dependen de la zona horaria de MySQL ni del servidor.

const { ahoraEnChile } = require('./reservaAlumno');

const HORAS_PRIMERA_CONFIRMACION = 24;
const HORAS_SEGUNDA_CONFIRMACION = 3;
const ESTADOS_ACTIVOS = ['AGENDADA', 'CONFIRMADA'];

// Minutos transcurridos desde 1970 de una hora de pared (no es un instante real; sirve para sumar y comparar)
const aMinutos = (fecha, hora) => {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [h, m] = hora.split(':').map(Number);
    return Date.UTC(anio, mes - 1, dia, h, m) / 60000;
};

const aTexto = (minutos) => new Date(minutos * 60000).toISOString().slice(0, 16).replace('T', ' ');
const textoAMinutos = (texto) => aMinutos(texto.slice(0, 10), texto.slice(11, 16));

const ahoraTexto = (ahora = new Date()) => {
    const { fecha, minutos } = ahoraEnChile(ahora);
    return aTexto(aMinutos(fecha, '00:00') + minutos);
};

// clase: { FECHA 'AAAA-MM-DD', HORA_INICIO, ESTADO, CONFIRMACION_1, CONFIRMACION_2, AGENDADA_EL } (los tres últimos son texto o null)
// Devuelve:
//   aplica     false si la regla no corresponde (clase ya empezó, no está activa o es antigua, sin AGENDADA_EL)
//   fase       1 (confirmar hasta 24 h antes) o 2 (reconfirmar hasta 3 h antes)
//   confirmada si el alumno ya cumplió lo que se le pide en esta fase
//   vence      hasta cuándo debe hacerlo (texto) en esta fase
//   reconfirmarDesde  desde cuándo se abre la 2ª confirmación (texto)
//   venceSegunda      hasta cuándo se puede hacer la 2ª confirmación (texto)
//   liberar    true si ya venció un plazo sin confirmar y hay que liberar el cupo
const evaluarConfirmacion = (clase, ahora = new Date()) => {
    const sinRegla = { aplica: false, fase: null, confirmada: false, vence: null, reconfirmarDesde: null, venceSegunda: null, liberar: false };
    if (!clase || !ESTADOS_ACTIVOS.includes(clase.ESTADO) || !clase.AGENDADA_EL) return sinRegla;

    const ahoraMin = textoAMinutos(ahoraTexto(ahora));
    const inicio = aMinutos(clase.FECHA, clase.HORA_INICIO);
    if (ahoraMin >= inicio) return sinRegla;

    const limite1 = inicio - HORAS_PRIMERA_CONFIRMACION * 60;
    const limite2 = inicio - HORAS_SEGUNDA_CONFIRMACION * 60;
    const creada = textoAMinutos(clase.AGENDADA_EL);

    // Una confirmación solo se exige si la clase ya existía antes de su plazo (si se reserva con poca anticipación no se castiga)
    const exige1 = creada < limite1;
    const exige2 = creada < limite2;
    const falta1 = exige1 && !clase.CONFIRMACION_1;
    const falta2 = exige2 && !clase.CONFIRMACION_2;

    if (ahoraMin < limite1) {
        return { aplica: true, fase: 1, confirmada: Boolean(clase.CONFIRMACION_1), vence: aTexto(limite1), reconfirmarDesde: aTexto(limite1), venceSegunda: aTexto(limite2), liberar: false };
    }
    if (ahoraMin < limite2) {
        return { aplica: true, fase: 2, confirmada: Boolean(clase.CONFIRMACION_2), vence: aTexto(limite2), reconfirmarDesde: aTexto(limite1), venceSegunda: aTexto(limite2), liberar: falta1 };
    }
    return { aplica: true, fase: 2, confirmada: Boolean(clase.CONFIRMACION_2) || !exige2, vence: aTexto(limite2), reconfirmarDesde: aTexto(limite1), venceSegunda: aTexto(limite2), liberar: falta1 || falta2 };
};

// Campos que se guardan cuando el alumno confirma ahora. Devuelve null si ya no corresponde confirmar.
const registrarConfirmacion = (clase, ahora = new Date()) => {
    const estado = evaluarConfirmacion(clase, ahora);
    if (!estado.aplica || estado.confirmada) return null;
    const ahoraT = ahoraTexto(ahora);
    if (estado.fase === 1) return { CONFIRMACION_1: ahoraT };
    // En la 2ª fase se completa también la 1ª si faltaba (el plazo se revisa cada pocos minutos; se le da el beneficio de la duda)
    return { CONFIRMACION_1: clase.CONFIRMACION_1 || ahoraT, CONFIRMACION_2: ahoraT };
};

// Datos con los que nace una clase. Si la reserva la hace el propio alumno, ya cuenta como confirmación suya.
const datosIniciales = ({ fecha, horaInicio, reservaElAlumno }, ahora = new Date()) => {
    const ahoraT = ahoraTexto(ahora);
    const datos = { AGENDADA_EL: ahoraT, CONFIRMACION_1: null, CONFIRMACION_2: null };
    if (reservaElAlumno) {
        datos.CONFIRMACION_1 = ahoraT;
        const limite1 = aMinutos(fecha, horaInicio) - HORAS_PRIMERA_CONFIRMACION * 60;
        if (textoAMinutos(ahoraT) >= limite1) datos.CONFIRMACION_2 = ahoraT;
    }
    return datos;
};

module.exports = {
    HORAS_PRIMERA_CONFIRMACION, HORAS_SEGUNDA_CONFIRMACION, ESTADOS_ACTIVOS,
    ahoraTexto, evaluarConfirmacion, registrarConfirmacion, datosIniciales,
};
