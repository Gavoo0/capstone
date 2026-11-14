# Futuro · Conductores

Plataforma web para gestionar los alumnos, clases prácticas, asistencia, evaluaciones y vehículos de la Escuela de Conductores Futuro.

## Funcionalidades

- **Visitantes:** consultar cursos y sedes y enviar una preinscripción, que se guarda en MySQL.
- **Alumnos:** consultar su avance psicotécnico, asistencia teórica, evaluaciones y clases; confirmar o cancelar una clase con un enlace personal; imprimir o guardar su certificado de avance como PDF.
- **Instructores:** revisar su agenda, registrar clases realizadas e inasistencias, ingresar asistencia teórica y notas, y consultar la disponibilidad de flota.
- **Administradores:** agendar clases, administrar usuarios, alumnos, vehículos y sedes, y gestionar bloqueos de vehículos e instructores.
- **Agenda:** el backend evita solapamientos de clases y bloqueos para instructores y vehículos; solo permite agendar alumnos que cumplan los requisitos académicos.

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React, React Router, Vite, Tailwind CSS |
| Backend | Node.js, Express, API REST |
| Base de datos | MySQL 8, `mysql2/promise` |
| Seguridad | JWT para rutas privadas, bcrypt para contraseñas; los hashes SHA-256 antiguos se migran al iniciar sesión correctamente |

## Requisitos

- Node.js 20 o superior y npm.
- MySQL 8 local o Docker Desktop con Docker Compose.
- Git para descargar el proyecto.

## Instalación local con MySQL (Windows PowerShell)

Desde PowerShell, en la carpeta donde quieras guardar el proyecto:

```powershell
git clone https://github.com/Gavoo0/capstone.git
Set-Location capstone

# Crear el esquema, agregar la tabla de preinscripciones y cargar datos locales.
cmd /c 'mysql --default-character-set=utf8mb4 -u root -p < "Fase 2\Evidencias Grupales\script_base_datos.sql"'
cmd /c 'mysql --default-character-set=utf8mb4 -u root -p escuela_conductores < "Fase 2\Codigo\backend\database\init\002_preinscripciones.sql"'
cmd /c 'mysql --default-character-set=utf8mb4 -u root -p escuela_conductores < "Fase 2\Codigo\database\datos_prueba.sql"'

# Instalar frontend y backend; el backend compila el frontend al iniciar.
Set-Location "Fase 2\Codigo\frontend"
npm ci
Set-Location ..\backend
npm ci
Copy-Item .env.example .env
```

Si la base ya tenía una tabla `preinscripciones` con el formato anterior, no ejecutes de nuevo el inicializador; aplica una sola vez `Fase 2/Codigo/backend/database/migrations/001_preinscripciones_campos_contacto.sql` antes de importar los datos de prueba.

Edita `Fase 2/Codigo/backend/.env`: configura `DB_PORT=3306` para MySQL local y define `JWT_SECRET` con una cadena aleatoria de al menos 32 caracteres. Para generarla con Node:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Luego, desde `Fase 2/Codigo/backend`, ejecuta:

```powershell
npm run dev
```

El backend compila y sirve el frontend en `http://localhost:4000`. Comprueba el servicio en `http://localhost:4000/api/health`. Para trabajar con recarga en caliente, deja el backend ejecutándose y, en otra terminal, inicia Vite desde `Fase 2/Codigo/frontend` con `npm run dev`; abre `http://localhost:5173`.

## Instalación de MySQL con Docker

Desde `Fase 2/Codigo`:

```powershell
docker compose up -d database
```

En una base nueva, Compose crea el esquema y la tabla de preinscripciones. Espera a que el contenedor figure como saludable. Desde la carpeta `Fase 2/Codigo`, carga los datos de prueba con `cmd /c 'docker exec -i futuro_mysql_db mysql --default-character-set=utf8mb4 -uroot escuela_conductores < "database\datos_prueba.sql"'`. Configura `DB_PORT=3307` en `backend/.env` para que la API conecte al contenedor. Si el volumen ya contenía una tabla de preinscripción antigua, aplica la migración indicada arriba una sola vez. Luego instala dependencias como en la sección anterior e inicia el backend con `npm run dev`.

## Cuentas de prueba

| Rol | Correo | Contraseña inicial |
|---|---|---|
| Administrador | `admin@futuro.cl` | `Futuro2026` |
| Instructor | `instructor@futuro.cl` | `Futuro2026` |
| Alumno | `alumno@futuro.cl` | `Futuro2026` |

Son credenciales de desarrollo local. Al importar de nuevo el SQL se restaura esa contraseña. En el primer inicio de sesión, el backend migra el hash de prueba a bcrypt.

## Estado y límites conocidos

Los recorridos de landing y preinscripción, autenticación por roles, paneles, agenda, control de conflictos, asistencia, evaluaciones, mantenedores, certificado de avance y autogestión por enlace están implementados. Los flujos principales de API se verificaron contra MySQL local.

Para desplegar en Internet, configura secretos y una contraseña segura para MySQL, limita el origen de CORS, agrega límite de intentos al login y define revocación de sesiones. En desarrollo, Docker permite root sin contraseña y los JWT no se revocan inmediatamente al cerrar sesión.

## Estructura

```text
Fase 1/                 Análisis y definición
Fase 2/
 ├─ Codigo/
 │   ├─ backend/        API, reglas de negocio y esquema MySQL
 │   ├─ frontend/       Aplicación React
 │   └─ database/       Datos de prueba
 └─ Evidencias Grupales/
Fase 3/                 Evidencias de cierre
```

## Equipo

| Integrante | Rol |
|---|---|
| Maximiliano Valdebenito | Desarrollo frontend |
| Gabriel Godoy | Base de datos y backend |
| Máximo Ortega | Calidad y seguridad |

Proyecto desarrollado como Portafolio de Título (Capstone) en Duoc UC para la Escuela de Conductores Futuro.
