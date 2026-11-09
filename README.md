# Futuro · Conductores

**Plataforma web para gestionar las clases, los alumnos y los vehículos de la Escuela de Conductores Futuro.**

---

## ¿Qué es este proyecto?

La Escuela de Conductores Futuro enseña a manejar (licencia Clase B y profesionales A2, A3 y A4) en dos sedes: **Macul** y **Peñalolén**. Hasta ahora, toda la información de los alumnos vivía en fichas de papel.

Esto causaba problemas cotidianos:

- Cada sede tenía su propia información, y no se podía ver el avance completo de un alumno.
- La escuela tiene solo **dos vehículos**, y cuando uno sale a acompañar a un alumno a su examen práctico, queda **uno solo**. Sin un sistema que lo considere, se agendaban dos clases al mismo tiempo en un auto que no estaba.
- Cuando un alumno faltaba sin avisar, la hora se perdía.

Este sistema reemplaza el papel por una plataforma en línea donde todo queda ordenado y a la vista.

## ¿Qué permite hacer?

**Para el alumno**
- Ver su avance en las tres etapas del curso: evaluación psicotécnica, clases teóricas y clases prácticas.
- Revisar sus próximas clases, su asistencia y sus notas.
- Confirmar o cancelar una clase desde un enlace (por ejemplo, el que recibe por WhatsApp). Si cancela, la hora queda libre para otra persona.
- Descargar o imprimir su certificado de avance.

**Para el instructor**
- Ver su agenda de clases prácticas.
- Registrar la asistencia a las clases teóricas y las notas de los alumnos.
- Consultar qué vehículos están disponibles cada día.

**Para el administrador**
- Agendar clases en una agenda semanal, cuidando que no se crucen horarios de instructores ni vehículos.
- Bloquear un vehículo cuando sale a un examen práctico.
- Administrar alumnos, usuarios, vehículos y sedes.

**Para cualquier visitante**
- Conocer los cursos, sus requisitos y las sedes con sus horarios.
- Enviar una solicitud de preinscripción.

Cada persona entra con su correo o RUT y ve solo el panel que le corresponde según su rol.

## ¿Cómo funciona por dentro?

El sistema tiene tres partes que conversan entre sí:

```
 Lo que ve el usuario     →     El cerebro del sistema     →     Donde se guarda todo
 (Frontend, React)              (Backend, Express)               (Base de datos, MySQL)
```

| Parte | Tecnologías |
|---|---|
| Frontend (pantallas) | React, Vite, React Router, Tailwind CSS |
| Backend (lógica) | Node.js, Express |
| Base de datos | MySQL |

## Cómo probarlo en tu computador

### Qué necesitas instalar
[Node.js](https://nodejs.org/) (versión 20 o superior), [MySQL](https://dev.mysql.com/downloads/) 8 y Git.

### Paso a paso

**1. Descargar el proyecto**
```bash
git clone https://github.com/Gavoo0/capstone.git
cd capstone
```

**2. Crear la base de datos**
```bash
mysql -u root -p < "Fase 2/Evidencias Grupales/script_base_datos.sql"
mysql -u root -p < "Fase 2/Codigo/database/datos_prueba.sql"
```
El primer archivo crea las tablas y el segundo agrega datos de ejemplo.

**3. Encender el backend**
```bash
cd "Fase 2/Codigo/backend"
cp .env.example .env     # abre .env y escribe tus datos de MySQL
npm install
npm run dev
```
Para comprobar que funciona, abre `http://localhost:4000/api/health`.

**4. Encender el frontend** (en otra terminal)
```bash
cd "Fase 2/Codigo/frontend"
npm install
npm run dev
```
Luego abre `http://localhost:5173` en tu navegador.

### Usuarios de ejemplo

| Rol | Correo |
|---|---|
| Administrador | `admin@futuro.cl` |
| Instructor | `instructor@futuro.cl` |
| Alumno | `alumno@futuro.cl` |

La contraseña de ejemplo está al inicio del archivo `Fase 2/Codigo/database/datos_prueba.sql`. Estos usuarios son solo para pruebas locales.

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Página de inicio, cursos y sedes | Listo |
| Inicio de sesión por rol | Listo |
| Panel del administrador (agenda, bloqueos, alumnos, vehículos, usuarios, sedes) | Listo |
| Panel del alumno | Listo |
| Panel del instructor | Listo |
| Confirmación y cancelación de clases por enlace | Listo |
| Formulario de preinscripción | Parcial: pantalla lista, falta conectarla al servidor |
| Seguridad avanzada (tokens de sesión y contraseñas más robustas) | Pendiente |
| Envío automático de mensajes por WhatsApp | Pendiente |

## Estructura de carpetas

```
Fase 1/                 Análisis y definición del proyecto
Fase 2/
 ├─ Codigo/
 │   ├─ backend/        Servidor y reglas del sistema
 │   ├─ frontend/       Pantallas que ve el usuario
 │   └─ database/       Datos de ejemplo
 └─ Evidencias Grupales/  Modelo de datos, diagramas y documentos de sprint
Fase 3/                 Evidencias de cierre
```

## Equipo

| Integrante | Rol |
|---|---|
| Maximiliano Valdebenito | Desarrollo Frontend |
| Gabriel Godoy | Base de datos y Backend |
| Máximo Ortega | Calidad y Seguridad |

Proyecto desarrollado como Portafolio de Título (Capstone) en Duoc UC, para la **Escuela de Conductores Futuro**.
