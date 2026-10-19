import { ETAPAS } from "../../data/inicio";

export default function Etapas() {
  return (
    <section id="etapas" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-24">
      <h2 className="font-display text-3xl md:text-4xl font-bold max-w-lg">Tres etapas, una sola plataforma.</h2>
      <p className="font-body mt-3 text-[#0D0D0D]/60 max-w-md">
        Cada etapa queda registrada automáticamente en tu tarjeta de avance, sin importar en qué sede la rindas.
      </p>

      <div className="mt-14 grid md:grid-cols-3 gap-10">
        {ETAPAS.map((etapa, i) => (
          <div key={etapa.numero} className="relative pl-2">
            <span className="numero-etapa">{etapa.numero}</span>
            <h3 className="font-display text-xl mt-4">{etapa.titulo}</h3>
            <p className="font-body mt-2 text-[#0D0D0D]/60">{etapa.detalle}</p>
            {i < ETAPAS.length - 1 && (
              <div className="hidden md:block absolute top-8 -right-5 w-10 h-0.5 stripe-connector" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
