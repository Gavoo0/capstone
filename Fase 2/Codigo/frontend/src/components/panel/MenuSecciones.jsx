// Menú de secciones de los paneles (lateral en escritorio, pestañas arriba en celular)
function MenuSecciones({ secciones, seccionActiva, onCambiar }) {
  return (
    <nav className="bg-[#1E1E1B] lg:w-60 shrink-0 print:hidden">
      <ul className="flex lg:flex-col overflow-x-auto lg:overflow-visible px-3 py-3 lg:py-6 gap-1 font-body text-sm">
        {secciones.map((seccion) => (
          <li key={seccion.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onCambiar(seccion.id)}
              aria-current={seccionActiva === seccion.id ? "page" : undefined}
              className={
                seccionActiva === seccion.id
                  ? "w-full flex items-center gap-3 px-4 py-2.5 rounded-sm bg-[#FFC400] text-[#0D0D0D] font-semibold"
                  : "w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-[#FAFAF8]/70 hover:bg-white/10 hover:text-[#FAFAF8]"
              }
            >
              <span aria-hidden="true">{seccion.icono}</span>
              <span className="whitespace-nowrap">{seccion.titulo}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MenuSecciones;
