// Validaciones y formato de datos de entrada (RUT, correo, celular, nombres)
// Se usa en los formularios del frontend. El backend tiene su propia copia (utils/validaciones.js),
// porque la validación real debe hacerse siempre en el servidor.

// Deja solo números y K: "12.345.678-k" -> "12345678K"
export const limpiarRut = (texto) => {
  return String(texto || "").replace(/[.\-\s]/g, "").toUpperCase();
};

const formatoRutValido = (texto) => /^(?:\d{1,2}(?:\.\d{3}){2}|\d{7,8})-?[0-9kK]$/i.test(String(texto || "").trim());

// Valida el RUT chileno con el dígito verificador (módulo 11)
// Acepta "12.345.678-5", "12345678-5" o "123456785"
export const rutValido = (texto) => {
  if (!formatoRutValido(texto)) return false;
  const limpio = limpiarRut(texto);
  if (limpio.length < 8 || limpio.length > 9) {
    return false;
  }

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) {
    return false;
  }

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = 11 - (suma % 11);
  let dvEsperado = String(resto);
  if (resto === 11) {
    dvEsperado = "0";
  } else if (resto === 10) {
    dvEsperado = "K";
  }

  return dv === dvEsperado;
};

// Formato para guardar y enviar al backend: "12345678-5"
export const normalizarRut = (texto) => {
  const limpio = limpiarRut(texto);
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
};

// Formato para mostrar mientras se escribe: "12.345.678-5"
export const formatearRut = (texto) => {
  const original = String(texto || "");
  if (!/^[0-9kK]*$/.test(original) && !/^(?:\d{1,2}(?:\.\d{3}){2}|\d{7,8})-?[0-9kK]$/i.test(original.trim())) return original;
  if (limpiarRut(original).length > 9) return original;
  const limpio = limpiarRut(texto).slice(0, 9);
  if (limpio.length <= 1) {
    return limpio;
  }
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
};

export const correoValido = (texto) => {
  const correo = String(texto || "").trim();
  return correo.length <= 150 && /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(correo);
};

// Celular chileno: 9 dígitos que parten con 9 (acepta +56 y espacios)
export const celularValido = (texto) => {
  let numeros = String(texto || "").replace(/\D/g, "");
  if (numeros.startsWith("56")) {
    numeros = numeros.slice(2);
  }
  return /^9\d{8}$/.test(numeros);
};

// Formato para guardar: "+56912345678"
export const normalizarCelular = (texto) => {
  let numeros = String(texto || "").replace(/\D/g, "");
  if (numeros.startsWith("56")) {
    numeros = numeros.slice(2);
  }
  return `+56${numeros}`;
};

// Teléfono de una sede: celular o fijo, 9 dígitos después del +56 (ej. +56 2 2345 6789)
export const telefonoValido = (texto) => {
  let numeros = String(texto || "").replace(/\D/g, "");
  if (numeros.startsWith("56")) {
    numeros = numeros.slice(2);
  }
  return /^\d{9}$/.test(numeros);
};

// Nombre o apellido: letras (con tildes y ñ), espacios, guion y apóstrofe, entre 2 y 60 caracteres
export const nombreValido = (texto) => {
  const nombre = String(texto || "").trim();
  return nombre.length >= 2 && nombre.length <= 60 && /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(nombre);
};
