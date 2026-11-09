// Bloques horarios de las clases prácticas
// Se ajustan al horario de atención de las sedes (lunes a viernes, 9:40 a 13:00 y 15:00 a 20:20).
// Si la escuela cambia la duración de las clases, basta con editar esta lista.
export const BLOQUES_HORARIOS = [
  { inicio: "09:40", fin: "11:10" },
  { inicio: "11:30", fin: "13:00" },
  { inicio: "15:00", fin: "16:30" },
  { inicio: "16:45", fin: "18:15" },
  { inicio: "18:30", fin: "20:00" },
];

// Días que se muestran en la agenda semanal (0 = lunes ... 4 = viernes)
export const DIAS_AGENDA = 5;

// Horas de práctica de manejo que completa un alumno durante el curso
export const HORAS_PRACTICAS_REQUERIDAS = 12;
