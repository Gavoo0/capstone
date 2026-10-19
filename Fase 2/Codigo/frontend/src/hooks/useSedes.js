import { useEffect, useState } from "react";
import { api } from "../services/api";
import { HORARIO_ATENCION, SEDES_RESPALDO, enlaceMapa } from "../data/inicio";

// Convierte una fila de la tabla `sedes` al formato que usa la página.
const normalizar = (s) => ({
  id: s.ID_SEDE,
  nombre: String(s.NOMBRE || "").replace(/^sede\s+/i, ""),
  direccion: s.DIRECCION,
  telefono: s.TELEFONO,
  horarios: HORARIO_ATENCION, // la tabla `sedes` todavía no guarda horarios
  mapa: enlaceMapa(s.DIRECCION),
});

/** Sedes desde el backend. Si falla o viene vacío, se quedan las de respaldo. */
export default function useSedes() {
  const [sedes, setSedes] = useState(SEDES_RESPALDO);

  useEffect(() => {
    let activo = true;
    api
      .get("/sedes")
      .then((filas) => {
        if (activo && Array.isArray(filas) && filas.length > 0) setSedes(filas.map(normalizar));
      })
      .catch(() => {
        // Sin conexión con el servidor: se mantienen las sedes de respaldo.
      });
    return () => {
      activo = false;
    };
  }, []);

  return sedes;
}
