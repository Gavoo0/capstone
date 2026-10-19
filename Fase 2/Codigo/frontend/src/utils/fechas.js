// Funciones para trabajar con las fechas que manda el backend
//
// MySQL devuelve las fechas como "2026-10-20T03:00:00.000Z" (medianoche de Chile en UTC),
// por eso se leen con la hora local para no correrse un día.

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

// Mostrar una fecha en formato chileno (20-10-2026)
export const formatearFecha = (valor) => {
  const fecha = fechaParaInput(valor);
  if (!fecha) {
    return "-";
  }

  const [anio, mes, dia] = fecha.split("-");
  return `${dia}-${mes}-${anio}`;
};

// Fecha de hoy en formato YYYY-MM-DD
export const fechaHoy = () => {
  return fechaParaInput(new Date());
};
