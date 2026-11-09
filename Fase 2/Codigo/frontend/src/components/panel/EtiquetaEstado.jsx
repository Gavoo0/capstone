// Etiqueta pequeña de estado (recibe el objeto { texto, clase } de los services)
function EtiquetaEstado({ etiqueta }) {
  return (
    <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-sm font-body text-xs font-semibold ${etiqueta.clase}`}>
      {etiqueta.texto}
    </span>
  );
}

export default EtiquetaEstado;
