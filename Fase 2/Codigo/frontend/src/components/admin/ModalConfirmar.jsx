// Ventana para confirmar acciones que no se pueden deshacer (eliminar, levantar bloqueo, etc.)
function ModalConfirmar({ abierto, titulo, mensaje, textoBoton = "Eliminar", procesando, onCancelar, onConfirmar }) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-sm bg-[#FAFAF8] rounded-md shadow-xl p-6 font-body">
        <h2 className="font-display text-xl">{titulo}</h2>
        <p className="mt-2 text-sm text-[#0D0D0D]/70">{mensaje}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="btn-contorno btn-compacto">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando}
            className="btn-compacto inline-flex items-center justify-center rounded-sm bg-[#E31B23] text-[#FAFAF8] font-semibold hover:bg-[#C4151C] disabled:opacity-60"
          >
            {procesando ? "Procesando..." : textoBoton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmar;
