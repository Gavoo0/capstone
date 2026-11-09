// Funciones para trabajar con las fechas que manda el backend
//
// MySQL devuelve las fechas como "2026-10-20T03:00:00.000Z" (medianoche de Chile en UTC),
// por eso se leen con la hora local para no correrse un día.

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Pasar una fecha del backend al formato del input type="date" (YYYY-MM-DD)
export const fechaParaInput = (valor) => {
  if (!valor) {
    return "";
  }

  // Si ya viene como YYYY-MM-DD se usa tal cual
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor;
  }

  const fecha = new Date(valor);
  if (isNaN(fecha)) {
    return "";
  }

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

// Pasar un texto YYYY-MM-DD a Date (a mediodía, para no correrse por la zona horaria)
const textoADate = (texto) => {
  const [anio, mes, dia] = fechaParaInput(texto).split("-").map(Number);
  return new Date(anio, mes - 1, dia, 12);
};

// Mostrar una fecha en formato chileno (20-10-2026)
export const formatearFecha = (valor) => {
  const fecha = fechaParaInput(valor);
  if (!fecha) {
    return "-";
  }

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}-${mes}-${anio}`;
};

// Mostrar una fecha larga (Viernes 4 de septiembre, 2026)
export const formatearFechaLarga = (valor) => {
  if (!fechaParaInput(valor)) {
    return "-";
  }

  const fecha = textoADate(valor);
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}, ${fecha.getFullYear()}`;
};

// Mostrar día y mes cortos (ej: "Lun 02 nov")
export const formatearDiaCorto = (valor) => {
  if (!fechaParaInput(valor)) {
    return "-";
  }

  const fecha = textoADate(valor);
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${DIAS[fecha.getDay()].slice(0, 3)} ${dia} ${MESES[fecha.getMonth()].slice(0, 3)}`;
};

// Fecha de hoy en formato YYYY-MM-DD
export const fechaHoy = () => {
  return fechaParaInput(new Date());
};

// Sumar (o restar) días a una fecha YYYY-MM-DD
export const sumarDias = (valor, cantidad) => {
  const fecha = textoADate(valor);
  fecha.setDate(fecha.getDate() + cantidad);
  return fechaParaInput(fecha);
};

// Obtener el lunes de la semana de una fecha
export const inicioSemana = (valor) => {
  const fecha = textoADate(valor);
  const diaSemana = fecha.getDay(); // 0 = domingo
  let diferencia = 1 - diaSemana;
  if (diaSemana === 0) {
    diferencia = -6; // El domingo pertenece a la semana que empezó el lunes anterior
  }
  return sumarDias(valor, diferencia);
};

// Saber si dos horarios (HH:MM) se cruzan
export const horariosSeCruzan = (inicioA, finA, inicioB, finB) => {
  return inicioA < finB && finA > inicioB;
};
