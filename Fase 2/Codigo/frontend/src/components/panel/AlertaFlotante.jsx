// Alerta de éxito o error que aparece abajo a la derecha
function AlertaFlotante({ mensaje, tipo }) {
  if (!mensaje) {
    return null;
  }

  let clases = "fixed bottom-6 right-6 left-6 sm:left-auto z-[60] max-w-sm rounded-sm px-4 py-3 font-body text-sm font-semibold shadow-lg ";
  if (tipo === "danger") {
    clases += "bg-[#E31B23] text-[#FAFAF8]";
  } else {
    clases += "bg-[#FFC400] text-[#0D0D0D] border-2 border-[#0D0D0D]";
  }

  return (
    <div role="status" className={clases}>
      {mensaje}
    </div>
  );
}

export default AlertaFlotante;
