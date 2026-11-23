// Reglas para que el alumno reserve sus propias clases prácticas.
// Son funciones puras (sin base de datos) para poder probarlas fácilmente.

// Mismos bloques que usa la agenda del administrador (frontend/src/data/agenda.js)
const BLOQUES_HORARIOS = [
    { inicio: '09:40', fin: '11:10' },
    { inicio: '11:30', fin: '13:00' },
    { inicio: '15:00', fin: '16:30' },
    { inicio: '16:45', fin: '18:15' },
    { inicio: '18:30', fin: '20:00' },
];

const ZONA_HORARIA = 'America/Santiago';
const MINUTOS_MINIMOS_ANTES = 120; // La clase se puede reservar hasta 2 horas antes de empezar
const DIAS_MAXIMOS_ADELANTE = 30; // y hasta 30 días hacia adelante
const MAX_CLASES_PENDIENTES = 3; // Clases agendadas a futuro al mismo tiempo, para que nadie acapare cupos
const DIAS_MAXIMOS_CONSULTA = 14; // Rango máximo que se puede consultar de una vez
const ESTADOS_ACTIVOS = ['AGENDADA', 'CONFIRMADA'];

const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

const fechaTextoValida = (texto) => {
    if (typeof texto !== 'string' || !formatoFecha.test(texto)) return false;
    const fecha = new Date(`${texto}T12:00:00Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
};

const sumarDias = (texto, cantidad) => {
    const fecha = new Date(`${texto}T12:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + cantidad);
    return fecha.toISOString().slice(0, 10);
};

// Día de la semana de una fecha YYYY-MM-DD (0 = domingo ... 6 = sábado)
const diaSemana = (texto) => new Date(`${texto}T12:00:00Z`).getUTCDay();

// Fecha y hora actuales en Chile: { fecha: 'YYYY-MM-DD', minutos: minutos desde medianoche }
const ahoraEnChile = (ahora = new Date()) => {
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(ahora).map((p) => [p.type, p.value])
    );
    return { fecha: `${partes.year}-${partes.month}-${partes.day}`, minutos: Number(partes.hour) * 60 + Number(partes.minute) };
};

const aMinutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

const esBloqueOficial = (horaInicio, horaFin) => BLOQUES_HORARIOS.some((b) => b.inicio === horaInicio && b.fin === horaFin);

// Devuelve un texto con el problema, o null si el bloque se puede reservar
const validarSolicitud = ({ fecha, horaInicio, horaFin }, ahora = new Date()) => {
    if (!fechaTextoValida(fecha)) return 'La fecha no es válida. Use el formato AAAA-MM-DD.';
    if (!esBloqueOficial(horaInicio, horaFin)) return 'Ese horario no es uno de los bloques de clase de la escuela.';
    const dia = diaSemana(fecha);
    if (dia === 0 || dia === 6) return 'Las clases prácticas se reservan de lunes a viernes.';

    const hoy = ahoraEnChile(ahora);
    if (fecha < hoy.fecha) return 'No se pueden reservar clases en fechas pasadas.';
    if (fecha === hoy.fecha && aMinutos(horaInicio) - hoy.minutos < MINUTOS_MINIMOS_ANTES) {
        return 'Ese bloque ya no se puede reservar: debe hacerse con al menos 2 horas de anticipación.';
    }
    if (fecha > sumarDias(hoy.fecha, DIAS_MAXIMOS_ADELANTE)) {
        return `Solo se puede reservar con hasta ${DIAS_MAXIMOS_ADELANTE} días de anticipación.`;
    }
    return null;
};

const seCruzan = (inicioA, finA, inicioB, finB) => inicioA < finB && finA > inicioB;

// Elige un vehículo y un instructor libres para el bloque (o null si no queda cupo).
// vehiculos: [{ ID_VEHICULO }]  instructores: [{ ID_USUARIO }]
// clases y bloqueos: filas de ese día con FECHA como 'YYYY-MM-DD'
const buscarAsignacion = ({ vehiculos, instructores, clases, bloqueos, fecha, horaInicio, horaFin }) => {
    const activas = clases.filter((c) => c.FECHA === fecha && ESTADOS_ACTIVOS.includes(c.ESTADO));
    const choquenClases = activas.filter((c) => seCruzan(c.HORA_INICIO, c.HORA_FIN, horaInicio, horaFin));
    const choquenBloqueos = bloqueos.filter((b) => b.FECHA === fecha && seCruzan(b.HORA_INICIO, b.HORA_FIN, horaInicio, horaFin));

    const vehiculosLibres = vehiculos.filter((v) =>
        !choquenClases.some((c) => c.ID_VEHICULO === v.ID_VEHICULO) && !choquenBloqueos.some((b) => b.ID_VEHICULO === v.ID_VEHICULO));
    const instructoresLibres = instructores.filter((i) =>
        !choquenClases.some((c) => c.ID_INSTRUCTOR === i.ID_USUARIO) && !choquenBloqueos.some((b) => b.ID_INSTRUCTOR === i.ID_USUARIO));
    if (!vehiculosLibres.length || !instructoresLibres.length) return null;

    // Se reparte el trabajo: primero el instructor con menos clases ese día
    const cargaDelDia = (i) => activas.filter((c) => c.ID_INSTRUCTOR === i.ID_USUARIO).length;
    instructoresLibres.sort((a, b) => cargaDelDia(a) - cargaDelDia(b) || a.ID_USUARIO - b.ID_USUARIO);
    vehiculosLibres.sort((a, b) => a.ID_VEHICULO - b.ID_VEHICULO);
    return { idVehiculo: vehiculosLibres[0].ID_VEHICULO, idInstructor: instructoresLibres[0].ID_USUARIO };
};

module.exports = {
    BLOQUES_HORARIOS, MAX_CLASES_PENDIENTES, DIAS_MAXIMOS_CONSULTA, ESTADOS_ACTIVOS,
    fechaTextoValida, sumarDias, diaSemana, ahoraEnChile, esBloqueOficial, validarSolicitud, buscarAsignacion,
};
