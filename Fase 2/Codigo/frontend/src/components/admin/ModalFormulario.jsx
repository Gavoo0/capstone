// Ventana modal con un formulario (se usa para crear y editar en todos los mantenedores)
function ModalFormulario({ titulo, abierto, guardando, onCerrar, onGuardar, children }) {
  if (!abierto) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#FAFAF8] rounded-md shadow-xl">
        {/* Encabezado del modal */}
        <div className="flex items-center justify-between bg-[#0D0D0D] text-[#FAFAF8] px-6 py-4 rounded-t-md">
          <h2 className="font-display text-xl">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="text-2xl leading-none text-[#FAFAF8]/60 hover:text-[#FFC400]">
            ×
          </button>
        </div>
        <div className="h-1.5 w-full stripe-hazard" />

        {/* Campos del formulario */}
        <div className="px-6 py-5 space-y-4">{children}</div>

        {/* Botones */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button type="button" onClick={onCerrar} className="btn-contorno btn-compacto">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="btn-amarillo btn-compacto">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ModalFormulario;
