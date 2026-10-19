export const HORARIO = "Lunes a viernes: 9:40 a 13:00 y 15:00 a 20:20";

export const CURSOS = [
  {
    clase: "Clase B",
    tipo: "Particular",
    titulo: "Autos y camionetas",
    descripcion: "La licencia básica y la más solicitada: el punto de partida para conducir tu propio vehículo.",
    habilita: ["Autos y camionetas de uso particular"],
    duracion: "25 días si vas de corrido",
    etapas: [
      { nombre: "psicotécnico", dias: 3, tono: "tono-psico" },
      { nombre: "clases teóricas", dias: 8, tono: "tono-teoria" },
      { nombre: "práctica de manejo", dias: 14, tono: "tono-practica" },
    ],
    vehiculo: "auto",
  },
  {
    clase: "Clase A2",
    tipo: "Profesional",
    titulo: "Ambulancias y transporte de pasajeros",
    descripcion: "Primer paso profesional para trabajar transportando personas en vehículos de capacidad limitada.",
    habilita: ["Ambulancias", "Transporte de pasajeros de hasta 17 asientos", "Hasta 32 asientos después de dos años"],
    vehiculo: "van",
  },
  {
    clase: "Clase A3",
    tipo: "Profesional",
    titulo: "Buses y transporte sin límite",
    descripcion: "Transporte de pasajeros sin restricción de capacidad, además de los vehículos de las clases anteriores.",
    habilita: ["Transporte de pasajeros sin límite de capacidad", "Buses de cualquier número de asientos"],
    requisito: "Licencia A1 o A2 con al menos dos años de experiencia.",
    vehiculo: "bus",
  },
  {
    clase: "Clase A4",
    tipo: "Profesional",
    titulo: "Transporte de carga",
    descripcion: "Para quienes quieren trabajar conduciendo camiones de carga.",
    habilita: ["Camiones simples de hasta 3,5 toneladas", "Transporte de carga profesional"],
    vehiculo: "camion",
  },
];

export const ETAPAS = [
  {
    numero: "01",
    titulo: "Evaluación psicotécnica",
    detalle: "Rinde tu examen psicosensotécnico en cualquiera de nuestras dos sedes, sin fichas de papel que se puedan traspapelar.",
  },
  {
    numero: "02",
    titulo: "Clases teóricas",
    detalle: "Asiste a los bloques teóricos y revisa tu asistencia y tus notas desde tu propia tarjeta de avance, en línea.",
  },
  {
    numero: "03",
    titulo: "Prácticas de manejo",
    detalle: "Agenda tus horas al volante según la disponibilidad real de la flota e instructores, sin choques de horario.",
  },
];
