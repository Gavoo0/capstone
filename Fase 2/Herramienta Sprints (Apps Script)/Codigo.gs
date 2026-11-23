/**
 * Codigo.gs — Tablero de sprints "Futuro" (réplica ligera de Jira) en Apps Script.
 * Script vinculado a una hoja de Google: la hoja es la base de datos.
 * Despliegue: ver LEEME.md.
 */

var HOJAS = {
  Config: ['Clave', 'Valor'],
  Sprints: ['ID', 'Nombre', 'Objetivo', 'Inicio', 'Fin', 'Estado', 'Origen'],
  Historias: ['ID', 'Epica', 'Titulo', 'Prioridad', 'Horas', 'Estado'],
  Tareas: ['ID', 'Sprint', 'SprintInicial', 'HU', 'Titulo', 'Area', 'Responsable', 'Estado', 'HorasEst', 'FechaCierre', 'Evidencia', 'Origen', 'Orden'],
  Impedimentos: ['ID', 'Fecha', 'Sprint', 'Descripcion', 'Impacto', 'Prioridad', 'Responsable', 'Estado', 'Accion', 'FechaCierre', 'Evidencia'],
  Daily: ['ID', 'Fecha', 'Sprint', 'Persona', 'Ayer', 'Hoy', 'Impedimentos'],
  Notas: ['ID', 'Sprint', 'Tipo', 'Texto', 'Autor'],
  Commits: ['SHA', 'Fecha', 'Autor', 'Mensaje', 'Url', 'Tarea', 'Sprint'],
  Historial: ['Fecha', 'Tarea', 'De', 'A', 'Usuario']
};
var COLUMNAS_NUMERICAS = { Horas: 1, HorasEst: 1, Orden: 1 };
var PREFIJOS = { Sprints: 'S', Tareas: 'T', Impedimentos: 'IMP-', Daily: 'D-', Notas: 'N-', Historias: 'US-' };
var ZONA = 'America/Santiago';

// ---------- arranque ----------
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Sprints Futuro')
    .addItem('1. Preparar hojas y cargar datos iniciales', 'prepararLibro')
    .addItem('2. Sincronizar commits de GitHub', 'sincronizarGitHub')
    .addItem('Mostrar enlace del tablero', 'mostrarEnlace')
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Tablero de sprints · Futuro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function mostrarEnlace() {
  var url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(url ? 'Tablero: ' + url : 'Aún no hay despliegue. Usa Implementar > Nueva implementación > Aplicación web.');
}

function prepararLibro() {
  asegurarHojas_();
  var ss = SpreadsheetApp.getActive();
  var vacio = leerHoja_('Tareas').length === 0 && leerHoja_('Sprints').length === 0;
  if (!vacio) {
    SpreadsheetApp.getUi().alert('Las hojas ya tienen datos. No se cargó nada para no pisarlos.');
    return;
  }
  var d = datosIniciales_();
  d.sprints.forEach(function (x) { escribirFila_('Sprints', x); });
  d.historias.forEach(function (x) { escribirFila_('Historias', x); });
  d.tareas.forEach(function (x) { escribirFila_('Tareas', x); });
  d.impedimentos.forEach(function (x) { escribirFila_('Impedimentos', x); });
  Object.keys(d.config).forEach(function (k) { escribirFila_('Config', { Clave: k, Valor: d.config[k] }); });
  SpreadsheetApp.getUi().alert('Listo: ' + d.tareas.length + ' tareas, ' + d.sprints.length + ' sprints y ' + d.impedimentos.length + ' impedimentos cargados.');
}

// ---------- acceso a hojas ----------
function asegurarHojas_() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(HOJAS).forEach(function (nombre) {
    var h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
    var cols = HOJAS[nombre];
    if (h.getLastRow() === 0) {
      h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#FFC400');
      h.setFrozenRows(1);
    }
    h.getRange(2, 1, Math.max(h.getMaxRows() - 1, 1), cols.length).setNumberFormat('@');
  });
  var inicial = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (inicial && ss.getSheets().length > 1) ss.deleteSheet(inicial);
}

function leerHoja_(nombre) {
  var h = SpreadsheetApp.getActive().getSheetByName(nombre);
  if (!h || h.getLastRow() < 2) return [];
  var cols = HOJAS[nombre];
  var vals = h.getRange(2, 1, h.getLastRow() - 1, cols.length).getValues();
  return vals.filter(function (f) { return String(f[0]) !== ''; }).map(function (f) {
    var o = {};
    cols.forEach(function (c, i) {
      var v = f[i];
      if (v instanceof Date) v = Utilities.formatDate(v, ZONA, 'yyyy-MM-dd');
      o[c] = COLUMNAS_NUMERICAS[c] && v !== '' ? Number(v) : String(v);
    });
    return o;
  });
}

function escribirFila_(nombre, obj) {
  var h = SpreadsheetApp.getActive().getSheetByName(nombre);
  var cols = HOJAS[nombre];
  var fila = cols.map(function (c) { return obj[c] == null ? '' : obj[c]; });
  var llave = String(obj[cols[0]]);
  var ultima = h.getLastRow();
  if (ultima >= 2) {
    var ids = h.getRange(2, 1, ultima - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === llave) { h.getRange(i + 2, 1, 1, cols.length).setValues([fila]); return; }
    }
  }
  h.getRange(ultima + 1, 1, 1, cols.length).setNumberFormat('@').setValues([fila]);
}

function siguienteId_(nombre, sprint) {
  var pre = nombre === 'Tareas' && sprint ? sprint + '-' : (PREFIJOS[nombre] || '');
  var max = 0;
  leerHoja_(nombre).forEach(function (f) {
    var m = String(f.ID).match(/(\d+)$/);
    if (m && String(f.ID).indexOf(pre) === 0) max = Math.max(max, Number(m[1]));
  });
  var n = max + 1;
  var cero = nombre === 'Impedimentos' || nombre === 'Tareas';
  return pre + (cero && n < 10 ? '0' + n : n);
}

function hoy_() { return Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd'); }

function conBloqueo_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function configuracion_() {
  var c = {};
  leerHoja_('Config').forEach(function (f) { c[f.Clave] = f.Valor; });
  return c;
}

// ---------- API para la interfaz (google.script.run) ----------
function getEstado() {
  var cfg = configuracion_();
  var tareas = leerHoja_('Tareas').sort(function (a, b) { return a.Orden - b.Orden; });
  var sprints = leerHoja_('Sprints');
  var commits = leerHoja_('Commits');
  return {
    hoy: hoy_(),
    usuario: Session.getActiveUser().getEmail(),
    estados: ESTADOS,
    config: { GitHubRepo: cfg.GitHubRepo, GitHubRama: cfg.GitHubRama, Integrantes: JSON.parse(cfg.Integrantes || '[]') },
    sprints: sprints, historias: leerHoja_('Historias'), tareas: tareas,
    impedimentos: leerHoja_('Impedimentos'), daily: leerHoja_('Daily'),
    notas: leerHoja_('Notas'), commits: commits.sort(function (a, b) { return a.Fecha < b.Fecha ? 1 : -1; }),
    resumenes: sprints.map(function (s) { return { sprint: s.ID, r: resumenSprint_(s, tareas, commits) }; }),
    velocidad: velocidad_(sprints, tareas)
  };
}

function guardarFila(nombre, obj) {
  if (!HOJAS[nombre] || nombre === 'Config' || nombre === 'Commits' || nombre === 'Historial') throw new Error('Hoja no permitida.');
  if (nombre === 'Tareas') {
    var e = validarTarea_(obj);
    if (e) throw new Error(e);
  }
  return conBloqueo_(function () {
    if (!obj.ID) obj.ID = siguienteId_(nombre, obj.Sprint);
    if (nombre === 'Tareas') {
      if (!obj.SprintInicial) obj.SprintInicial = obj.Sprint;
      if (!obj.Orden) obj.Orden = leerHoja_('Tareas').length + 1;
      if (obj.Estado === 'Completado' && !obj.FechaCierre) obj.FechaCierre = hoy_();
      if (obj.Estado !== 'Completado') obj.FechaCierre = '';
    }
    escribirFila_(nombre, obj);
    return obj.ID;
  });
}

function eliminarFila(nombre, id) {
  if (!HOJAS[nombre] || nombre === 'Config') throw new Error('Hoja no permitida.');
  return conBloqueo_(function () {
    var h = SpreadsheetApp.getActive().getSheetByName(nombre);
    var ids = h.getRange(2, 1, Math.max(h.getLastRow() - 1, 1), 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) { h.deleteRow(i + 2); return true; }
    }
    return false;
  });
}

function moverTarea(id, estadoNuevo) {
  if (ESTADOS.indexOf(estadoNuevo) < 0) throw new Error('Estado no válido.');
  return conBloqueo_(function () {
    var t = leerHoja_('Tareas').filter(function (x) { return x.ID === id; })[0];
    if (!t) throw new Error('No existe la tarea ' + id);
    var anterior = t.Estado;
    t.Estado = estadoNuevo;
    t.FechaCierre = estadoNuevo === 'Completado' ? hoy_() : '';
    escribirFila_('Tareas', t);
    escribirFila_('Historial', { Fecha: hoy_(), Tarea: id, De: anterior, A: estadoNuevo, Usuario: Session.getActiveUser().getEmail() });
    return t;
  });
}

function getBurndown(sprintId, metrica) {
  var sprint = leerHoja_('Sprints').filter(function (s) { return s.ID === sprintId; })[0];
  if (!sprint) throw new Error('No existe el sprint ' + sprintId);
  return calcularBurndown_(sprint, leerHoja_('Tareas'), metrica || 'tareas', hoy_());
}

// ---------- GitHub ----------
function sincronizarGitHub() {
  var cfg = configuracion_();
  if (!cfg.GitHubRepo) throw new Error('Falta GitHubRepo en la hoja Config.');
  var sprints = leerHoja_('Sprints');
  var tareas = leerHoja_('Tareas');
  var alias = JSON.parse(cfg.AliasGit || '{}');
  var desde = sprints.map(function (s) { return s.Inicio; }).sort()[0] || '2026-09-01';
  var ramas = String(cfg.GitHubRama || 'main').split(',').map(function (r) { return r.trim(); }).filter(String);
  var cabeceras = { Accept: 'application/vnd.github+json' };
  var token = cfg.GitHubToken || PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (token) cabeceras.Authorization = 'Bearer ' + token;
  var vistos = {}, nuevos = 0;
  var existentes = {};
  leerHoja_('Commits').forEach(function (c) { existentes[c.SHA] = true; });
  ramas.forEach(function (rama) {
    for (var pagina = 1; pagina <= 10; pagina++) {
      var url = 'https://api.github.com/repos/' + cfg.GitHubRepo + '/commits?sha=' + encodeURIComponent(rama) +
        '&since=' + desde + 'T00:00:00Z&per_page=100&page=' + pagina;
      var r = UrlFetchApp.fetch(url, { headers: cabeceras, muteHttpExceptions: true });
      if (r.getResponseCode() !== 200) {
        if (pagina === 1 && ramas.length === 1) throw new Error('GitHub respondió ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
        break;
      }
      var lista = JSON.parse(r.getContentText());
      lista.forEach(function (c) {
        var fila = commitAFila_(c, sprints, alias, tareas);
        if (vistos[fila.SHA]) return;
        vistos[fila.SHA] = true;
        if (!existentes[fila.SHA]) nuevos++;
        conBloqueo_(function () { escribirFila_('Commits', fila); });
      });
      if (lista.length < 100) break;
    }
  });
  return { total: Object.keys(vistos).length, nuevos: nuevos };
}

function vincularCommit(sha, tareaId) {
  return conBloqueo_(function () {
    var c = leerHoja_('Commits').filter(function (x) { return x.SHA === sha; })[0];
    if (!c) throw new Error('Commit no encontrado.');
    c.Tarea = tareaId || '';
    escribirFila_('Commits', c);
    return true;
  });
}

// ---------- informes en Google Docs ----------
function carpetaInformes_() {
  var it = DriveApp.getFoldersByName('Futuro - Informes de Sprint');
  return it.hasNext() ? it.next() : DriveApp.createFolder('Futuro - Informes de Sprint');
}

function tablaDoc_(body, encabezado, filas) {
  var t = body.appendTable([encabezado].concat(filas.length ? filas : [encabezado.map(function () { return '—'; })]));
  var h = t.getRow(0);
  for (var i = 0; i < h.getNumCells(); i++) { h.getCell(i).setBackgroundColor('#FFC400').editAsText().setBold(true); }
  return t;
}

/** tipo: planning | review | retrospective | release | impedimentos */
function generarInforme(sprintId, tipo) {
  var sprints = leerHoja_('Sprints'), tareas = leerHoja_('Tareas'), commits = leerHoja_('Commits');
  var sprint = sprints.filter(function (s) { return s.ID === sprintId; })[0];
  if (!sprint) throw new Error('No existe el sprint ' + sprintId);
  var titulos = { planning: 'Sprint Planning', review: 'Sprint Review', retrospective: 'Sprint Retrospective', release: 'Release', impedimentos: 'Registro de impedimentos' };
  if (!titulos[tipo]) throw new Error('Tipo de informe no válido.');
  var doc = DocumentApp.create(titulos[tipo] + ' · ' + sprint.Nombre);
  var body = doc.getBody();
  body.appendParagraph(titulos[tipo]).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('Escuela de Conductores Futuro · ' + sprint.Nombre).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  var res = resumenSprint_(sprint, tareas, commits);
  var propias = tareas.filter(function (t) { return perteneceASprint_(t, sprint); });
  var notas = leerHoja_('Notas').filter(function (n) { return n.Sprint === sprintId; });
  var fuente = sprint.Origen ? ' Origen de los datos del sprint: ' + sprint.Origen + '.' : '';

  body.appendParagraph('Información general').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  tablaDoc_(body, ['Campo', 'Dato'], [
    ['Sprint', sprint.Nombre], ['Periodo', sprint.Inicio + ' al ' + sprint.Fin], ['Estado', sprint.Estado],
    ['Objetivo', sprint.Objetivo], ['Tareas comprometidas', String(res.total)],
    ['Completadas en el sprint', res.completadas + ' (' + res.avance + '%)'], ['Commits en el periodo', String(res.commits)]
  ]);
  body.appendParagraph(fuente.trim());

  if (tipo === 'planning') {
    body.appendParagraph('Sprint backlog').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tablaDoc_(body, ['ID', 'HU', 'Tarea', 'Área', 'Responsable', 'Horas'],
      propias.map(function (t) { return [t.ID, t.HU, t.Titulo, t.Area, t.Responsable, String(t.HorasEst === '' ? '—' : t.HorasEst)]; }));
  }
  if (tipo === 'review') {
    body.appendParagraph('Incremento entregado').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tablaDoc_(body, ['ID', 'HU', 'Tarea', 'Cierre', 'Evidencia'],
      propias.filter(function (t) { return cerradaEn_(t, sprint); })
        .map(function (t) { return [t.ID, t.HU, t.Titulo, t.FechaCierre, t.Evidencia]; }));
    body.appendParagraph('No completado (pasa al siguiente sprint)').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tablaDoc_(body, ['ID', 'HU', 'Tarea', 'Estado actual'],
      propias.filter(function (t) { return !cerradaEn_(t, sprint); }).map(function (t) { return [t.ID, t.HU, t.Titulo, t.Estado]; }));
    body.appendParagraph('Comentarios de la revisión').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    notas.filter(function (n) { return n.Tipo === 'Review'; }).forEach(function (n) { body.appendListItem(n.Texto); });
  }
  if (tipo === 'retrospective') {
    ['Bien', 'Mal', 'Mejorar'].forEach(function (k) {
      body.appendParagraph({ Bien: 'Qué salió bien', Mal: 'Qué salió mal', Mejorar: 'Qué mejoramos' }[k]).setHeading(DocumentApp.ParagraphHeading.HEADING1);
      var items = notas.filter(function (n) { return n.Tipo === k; });
      if (!items.length) body.appendParagraph('Sin registros.');
      items.forEach(function (n) { body.appendListItem(n.Texto + (n.Autor ? ' (' + n.Autor + ')' : '')); });
    });
  }
  if (tipo === 'release') {
    body.appendParagraph('Contenido de la entrega').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tablaDoc_(body, ['ID', 'HU', 'Funcionalidad', 'Cierre'],
      propias.filter(function (t) { return cerradaEn_(t, sprint); }).map(function (t) { return [t.ID, t.HU, t.Titulo, t.FechaCierre]; }));
    body.appendParagraph('Commits del periodo').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tablaDoc_(body, ['SHA', 'Fecha', 'Autor', 'Mensaje'],
      commits.filter(function (c) { return c.Sprint === sprintId; }).map(function (c) { return [c.SHA, c.Fecha, c.Autor, c.Mensaje]; }));
    notas.filter(function (n) { return n.Tipo === 'Release'; }).forEach(function (n) { body.appendListItem(n.Texto); });
  }
  if (tipo === 'impedimentos') {
    body.appendParagraph('Impedimentos').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tablaDoc_(body, ['ID', 'Detectado', 'Descripción', 'Prioridad', 'Responsable', 'Estado', 'Acción', 'Cierre'],
      leerHoja_('Impedimentos').filter(function (i) { return i.Sprint === sprintId; })
        .map(function (i) { return [i.ID, i.Fecha, i.Descripcion, i.Prioridad, i.Responsable, i.Estado, i.Accion, i.FechaCierre]; }));
  }

  // Burndown como imagen
  if (tipo === 'review' || tipo === 'planning') {
    var b = calcularBurndown_(sprint, tareas, 'tareas', hoy_());
    var tabla = Charts.newDataTable().addColumn(Charts.ColumnType.STRING, 'Fecha')
      .addColumn(Charts.ColumnType.NUMBER, 'Ideal').addColumn(Charts.ColumnType.NUMBER, 'Real');
    b.puntos.forEach(function (p) { tabla.addRow([p.fecha.slice(5), p.ideal, p.real]); });
    var grafico = Charts.newLineChart().setDataTable(tabla.build()).setTitle('Burndown ' + sprint.ID + ' (tareas pendientes)')
      .setColors(['#888888', '#0D0D0D']).setDimensions(640, 320).build();
    body.appendParagraph('Burndown').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendImage(grafico.getAs('image/png'));
  }
  doc.saveAndClose();
  var archivo = DriveApp.getFileById(doc.getId());
  carpetaInformes_().addFile(archivo);
  DriveApp.getRootFolder().removeFile(archivo);
  return doc.getUrl();
}
