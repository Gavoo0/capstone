import { useState } from "react";

// La preinscripción todavía no tiene endpoint en el backend: el formulario valida y avisa,
// pero no envía nada. Cuando exista (p. ej. POST /api/preinscripciones), se llama acá.
export default function Contacto({ sedes }) {
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [sede, setSede] = useState("");
  const [aviso, setAviso] = useState("");

  function enviar(e) {
    e.preventDefault();
    if (!nombre.trim() || !contacto.trim()) {
      setAviso("Completa tu nombre y un correo o teléfono.");
      return;
    }
    setAviso("La preinscripción en línea estará disponible pronto. Mientras tanto, visítanos o llámanos en la sede que prefieras.");
  }

  return (
    <section id="contacto" className="scroll-mt-20 bg-[#FFC400]">
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0D0D0D]">Empieza tu proceso hoy.</h2>
          <p className="font-body mt-4 text-[#0D0D0D]/70 max-w-sm">
            Completa tus datos y te contactamos para coordinar tu evaluación psicotécnica en la sede que prefieras.
          </p>
        </div>

        <form className="bg-[#FAFAF8] rounded-md p-6 space-y-4" onSubmit={enviar} noValidate>
          <div>
            <label htmlFor="pre-nombre" className="campo-etiqueta">Nombre completo</label>
            <input id="pre-nombre" type="text" className="campo" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pre-contacto" className="campo-etiqueta">Correo o teléfono</label>
            <input id="pre-contacto" type="text" className="campo" placeholder="tucorreo@ejemplo.cl" value={contacto} onChange={(e) => setContacto(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pre-sede" className="campo-etiqueta">Sede preferida</label>
            <select id="pre-sede" className="campo" value={sede} onChange={(e) => setSede(e.target.value)}>
              {sedes.map((s) => (
                <option key={s.id} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </div>
          {aviso && <p role="status" className="aviso-info">{aviso}</p>}
          <button type="submit" className="btn-negro w-full">Enviar preinscripción</button>
        </form>
      </div>
    </section>
  );
}
