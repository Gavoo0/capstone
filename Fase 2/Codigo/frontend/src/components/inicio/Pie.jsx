export default function Pie({ sedes }) {
  return (
    <footer className="bg-[#0D0D0D] text-[#FAFAF8]/70">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8 font-body text-sm">
        <div>
          <p className="font-display text-lg text-[#FAFAF8]">Futuro · Conductores</p>
          <p className="mt-2">Formación para conductores en la Región Metropolitana.</p>
        </div>
        <div>
          <p className="text-[#FAFAF8] font-semibold mb-2">Sedes</p>
          {sedes.map((s) => (
            <p key={s.id}>{s.nombre} — {s.direccion}</p>
          ))}
        </div>
        <div>
          <p className="text-[#FAFAF8] font-semibold mb-2">Enlaces</p>
          <p><a href="#cursos" className="hover:text-[#FFC400]">Cursos</a></p>
          <p><a href="#etapas" className="hover:text-[#FFC400]">Cómo funciona</a></p>
          <p><a href="#alumno" className="hover:text-[#FFC400]">Portal del alumno</a></p>
          <p><a href="#contacto" className="hover:text-[#FFC400]">Contacto</a></p>
        </div>
      </div>
      <div className="h-1.5 w-full stripe-hazard" />
    </footer>
  );
}
