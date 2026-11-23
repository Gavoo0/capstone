# Tablero de sprints «Futuro» (réplica ligera de Jira en Apps Script)

Reemplaza lo que el equipo necesitaba de Jira: tablero Kanban, backlog, sprints, burndown, daily, registro de impedimentos, commits de GitHub, y generación de Sprint Planning, Review, Retrospective y Release como Google Docs.

La **hoja de Google es la base de datos**. Todos los integrantes ven y editan lo mismo.

## Qué trae cargado y de dónde sale

| Dato | Origen |
|---|---|
| Sprint 1 y 2, backlog y estados del Sprint 2 | Documentos ya entregados (Sprint Planning 2, Scrumboard, Sprint Backlog) |
| Tareas de Sprint 1, 4 y 5, fechas y autores | Commits reales de `Gavoo0/capstone` |
| Fecha de cierre de las tareas «Inferido» | Deducida de un commit. **Confirmar con el equipo** |
| Daily meetings | **No se cargó ninguna**: no hay evidencia de que se registraran |

Cada fila tiene su columna `Origen`. Lo que no esté confirmado, corríjalo en el tablero.

## Instalación (10 minutos)

1. Cree una hoja de cálculo nueva en Google Sheets (nómbrela «Sprints Futuro»).
2. Menú **Extensiones > Apps Script**.
3. En el editor cree estos archivos y pegue el contenido de cada uno:
   - `Codigo.gs`, `Logica.gs`, `Datos.gs` (botón **+** > Script)
   - `Index` (botón **+** > HTML; el nombre debe ser exactamente `Index`)
4. Ícono de engranaje **Configuración del proyecto** > marque «Mostrar el archivo de manifiesto appsscript.json» y reemplace su contenido por el de `appsscript.json`.
5. Guarde y recargue la hoja. Aparece el menú **Sprints Futuro**.
6. **Sprints Futuro > 1. Preparar hojas y cargar datos iniciales**. Acepte los permisos la primera vez.
7. **Implementar > Nueva implementación > Aplicación web**:
   - Ejecutar como: **Usuario que accede a la aplicación web**
   - Quién tiene acceso: **Cualquier usuario con cuenta de Google**
8. Copie la URL y compártala con el equipo.
9. **Comparta la hoja** con Gabriel y Máximo como **editores**: quien no tenga acceso a la hoja no podrá usar el tablero.

## Uso diario

- **Tablero**: arrastre las tarjetas entre columnas. Al pasar a *Completado* se registra la fecha de cierre, que alimenta el burndown.
- **Sprints**: cree el sprint siguiente (por ejemplo `S6`) con su objetivo y fechas.
- **Daily**: cada integrante registra lo que hizo, lo que hará y sus impedimentos.
- **Impedimentos**: regístrelos al detectarlos y ciérrelos al resolverlos.
- **GitHub > Sincronizar**: trae los commits. Para enlazar un commit con una tarea escriba su ID en el mensaje (por ejemplo `S5-09: aplicar migración 004`).
- **Informes y retro**: agregue notas de retrospectiva, review y release, y genere los Google Docs. Quedan en la carpeta de Drive «Futuro - Informes de Sprint».

## GitHub

El repositorio es público, así que no necesita clave. Si algún día supera el límite de la API, cree un token de solo lectura y guárdelo en **Configuración del proyecto > Propiedades de la secuencia de comandos** con el nombre `GITHUB_TOKEN`.

Para traer commits de ramas aún no fusionadas, en la hoja `Config` cambie `GitHubRama` a, por ejemplo, `main,feature/frontend-completo`.

## Estructura de la hoja

`Sprints`, `Historias`, `Tareas`, `Impedimentos`, `Daily`, `Notas` (retro, review y release), `Commits`, `Historial` (cambios de estado) y `Config`. Si edita directamente la hoja, respete las columnas y use fechas `AAAA-MM-DD`.

## Pruebas realizadas

La lógica y la interfaz se probaron con un simulador de Google Sheets: carga de datos sin duplicar, creación, validación y movimiento de tareas, sincronización de GitHub sin duplicados y con enlace de commit a tarea, burndown, y la interfaz completa en Chrome (arrastre de tarjetas, modales y pestañas) sin errores. **Lo que no se pudo probar fuera de Google**: los permisos de OAuth, la creación real de Google Docs y el gráfico de Charts. Si algo falla al generar un informe, revise **Ejecuciones** en el editor de Apps Script y avíselo.
