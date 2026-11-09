import { useState } from "react";

// Alerta flotante que se borra sola a los 4 segundos
// Uso: const { mensajeAlerta, tipoAlerta, mostrarAlerta } = useAlerta();
//      mostrarAlerta("success" | "danger", "Mensaje");
function useAlerta() {
  const [mensajeAlerta, setMensajeAlerta] = useState(null);
  const [tipoAlerta, setTipoAlerta] = useState("success");

  const mostrarAlerta = (tipo, mensaje) => {
    setTipoAlerta(tipo);
    setMensajeAlerta(mensaje);
    setTimeout(() => setMensajeAlerta(null), 4000);
  };

  return { mensajeAlerta, tipoAlerta, mostrarAlerta };
}

export default useAlerta;
