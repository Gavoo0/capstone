/**
 * Logica.gs — funciones puras (sin APIs de Google) para poder probarlas con Node.
 * Fechas siempre como texto 'AAAA-MM-DD'.
 */

var ESTADOS = ['Por hacer', 'En curso', 'En revisión', 'Completado', 'Bloqueado'];
var ESTADOS_CERRADOS = ['Completado'];

function fechaATexto_(d) {
  var m = d.getUTCMonth() + 1, dia = d.getUTCDate();
  return d.getUTCFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (dia < 10 ? '0' + dia : dia);
}

function textoAFecha_(t) {
  var p = String(t).split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
}

function diasEntre_(inicio, fin) {
  var res = [], d = textoAFecha_(inicio), f = textoAFecha_(fin);
  while (d <= f) { res.push(fechaATexto_(d)); d = new Date(d.getTime() + 86400000); }
  return res;
}

function esDiaHabil_(texto) {
  var n = textoAFecha_(texto).getUTCDay();
  return n !== 0 && n !== 6;
}

/** Una tarea cuenta para un sprint si está en él o si el sprint fue donde se comprometió. */
function perteneceASprint_(t, sprint) {
  return String(t.Sprint) === String(sprint.ID) || String(t.SprintInicial || '') === String(sprint.ID);
}

/** Terminada dentro del sprint: completada y con cierre hasta la fecha de fin del sprint. */
function cerradaEn_(t, sprint) {
  return ESTADOS_CERRADOS.indexOf(t.Estado) >= 0 && !!t.FechaCierre && t.FechaCierre <= sprint.Fin;
}

/**
 * Burndown de un sprint.
 * metrica: 'tareas' (cuenta) o 'horas' (suma de HorasEst).
 * hoy: 'AAAA-MM-DD' para no dibujar el real en el futuro.
 * Solo se cuentan días hábiles (lunes a viernes) para la línea ideal.
 */
function calcularBurndown_(sprint, tareas, metrica, hoy) {
  var propias = tareas.filter(function (t) { return perteneceASprint_(t, sprint); });
  var peso = function (t) { return metrica === 'horas' ? (Number(t.HorasEst) || 0) : 1; };
  var total = propias.reduce(function (a, t) { return a + peso(t); }, 0);
  var dias = diasEntre_(sprint.Inicio, sprint.Fin);
  var habiles = dias.filter(esDiaHabil_);
  var n = habiles.length;
  var puntos = [], idx = 0;
  dias.forEach(function (d) {
    var habil = esDiaHabil_(d);
    if (habil) idx++;
    var ideal = n > 0 ? Math.max(0, total - total * (habil ? idx : idx) / n) : 0;
    var real = null;
    if (d <= hoy) {
      real = propias.reduce(function (a, t) {
        var cerrada = cerradaEn_(t, sprint) && t.FechaCierre <= d;
        return a + (cerrada ? 0 : peso(t));
      }, 0);
    }
    puntos.push({ fecha: d, habil: habil, ideal: Math.round(ideal * 100) / 100, real: real });
  });
  var cerradas = propias.filter(function (t) { return cerradaEn_(t, sprint); }).length;
  return { total: total, tareas: propias.length, cerradas: cerradas, puntos: puntos, metrica: metrica };
}

/** Busca identificadores de tarea/HU en un mensaje de commit: SB2-07, S5-03, US-03. */
function extraerReferencias_(mensaje) {
  var m = String(mensaje || '').match(/\b(SB\d+-\d+|S\d+-\d+|US-\d+)\b/gi) || [];
  return m.map(function (x) { return x.toUpperCase(); });
}

/** Sprint al que pertenece una fecha ('AAAA-MM-DD'), o '' si ninguno. */
function sprintDeFecha_(fecha, sprints) {
  for (var i = 0; i < sprints.length; i++) {
    if (fecha >= sprints[i].Inicio && fecha <= sprints[i].Fin) return sprints[i].ID;
  }
  return '';
}

/** Une autores de Git con integrantes usando la tabla de alias de Config. */
function resolverAutor_(autor, alias) {
  var a = String(autor || '').toLowerCase();
  for (var k in alias) { if (k.toLowerCase() === a) return alias[k]; }
  return autor;
}

/** Normaliza un commit de la API de GitHub a una fila del libro. */
function commitAFila_(c, sprints, alias, tareas) {
  var fecha = String(c.commit.author.date).slice(0, 10);
  var mensaje = String(c.commit.message).split('\n')[0];
  var refs = extraerReferencias_(c.commit.message);
  var ids = tareas.map(function (t) { return String(t.ID).toUpperCase(); });
  var tarea = '';
  for (var i = 0; i < refs.length; i++) { if (ids.indexOf(refs[i]) >= 0) { tarea = refs[i]; break; } }
  return {
    SHA: c.sha.slice(0, 7), Fecha: fecha,
    Autor: resolverAutor_(c.commit.author.name || (c.author && c.author.login), alias),
    Mensaje: mensaje, Url: c.html_url, Tarea: tarea,
    Sprint: sprintDeFecha_(fecha, sprints)
  };
}

/** Resumen de un sprint: avance, por responsable, por estado. */
function resumenSprint_(sprint, tareas, commits) {
  var propias = tareas.filter(function (t) { return perteneceASprint_(t, sprint); });
  var porEstado = {}; ESTADOS.forEach(function (e) { porEstado[e] = 0; });
  porEstado['Arrastrada'] = 0;
  var porPersona = {};
  propias.forEach(function (t) {
    var carry = String(t.Sprint) !== String(sprint.ID) ||
      (ESTADOS_CERRADOS.indexOf(t.Estado) >= 0 && !cerradaEn_(t, sprint));
    var est = carry ? 'Arrastrada' : t.Estado;
    porEstado[est] = (porEstado[est] || 0) + 1;
    var p = t.Responsable || 'Sin asignar';
    porPersona[p] = porPersona[p] || { total: 0, completadas: 0 };
    porPersona[p].total++;
    if (cerradaEn_(t, sprint)) porPersona[p].completadas++;
  });
  var cs = commits.filter(function (c) { return String(c.Sprint) === String(sprint.ID); });
  var porAutor = {};
  cs.forEach(function (c) { porAutor[c.Autor] = (porAutor[c.Autor] || 0) + 1; });
  var total = propias.length, hechas = propias.filter(function (t) { return cerradaEn_(t, sprint); }).length;
  return {
    total: total, completadas: hechas,
    avance: total ? Math.round(hechas * 100 / total) : 0,
    porEstado: porEstado, porPersona: porPersona,
    commits: cs.length, commitsPorAutor: porAutor
  };
}

/** Velocidad: tareas completadas por sprint cerrado. */
function velocidad_(sprints, tareas) {
  return sprints.map(function (s) {
    var propias = tareas.filter(function (t) { return perteneceASprint_(t, s); });
    return { sprint: s.ID, comprometidas: propias.length,
      completadas: propias.filter(function (t) { return cerradaEn_(t, s); }).length };
  });
}

/** Valida una tarea antes de guardarla; devuelve texto de error o ''. */
function validarTarea_(t) {
  if (!t || !String(t.Titulo || '').trim()) return 'La tarea necesita un título.';
  if (ESTADOS.indexOf(t.Estado) < 0) return 'Estado no válido.';
  if (t.FechaCierre && !/^\d{4}-\d{2}-\d{2}$/.test(t.FechaCierre)) return 'La fecha de cierre debe ser AAAA-MM-DD.';
  if (t.HorasEst !== '' && t.HorasEst != null && (isNaN(Number(t.HorasEst)) || Number(t.HorasEst) < 0)) return 'Las horas deben ser un número positivo.';
  return '';
}
