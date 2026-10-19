import { useState } from "react";

const ALUMNO = {
  nombre: "Camila Rojas",
  rut: "19.482.301-5",
  sede: "Macul",
  etapaActual: "Prácticas de manejo",
};

const ETAPAS = [
  { titulo: "Evaluación psicotécnica", estado: "Aprobado", progreso: 1 },
  { titulo: "Clases teóricas", estado: "8 de 10 bloques", progreso: 0.8 },
  { titulo: "Prácticas de manejo", estado: "3 de 12 horas", progreso: 0.25 },
];

const CLASES = [
  { fecha: "Jue 02 oct", hora: "10:00", tipo: "Práctica de manejo", sede: "Macul", instructor: "R. Fuentes", estado: "confirmada" },
  { fecha: "Lun 06 oct", hora: "18:30", tipo: "Clase teórica", sede: "Macul", instructor: "P. Soto", estado: "pendiente" },
  { fecha: "Vie 10 oct", hora: "09:00", tipo: "Práctica de manejo", sede: "Peñalolén", instructor: "R. Fuentes", estado: "pendiente" },
];

const HISTORIAL = [
  { fecha: "20 sep", tipo: "Clase teórica", detalle: "Señalética y normas de tránsito", resultado: "Asistió" },
  { fecha: "18 sep", tipo: "Práctica de manejo", detalle: "Maniobras en pista", resultado: "Completada" },
  { fecha: "12 sep", tipo: "Evaluación", detalle: "Examen psicotécnico", resultado: "Aprobado" },
];

export default function DashboardAlumno() {
  const [tab, setTab] = useState("resumen");

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0D0D0D]">
      {/* Topbar */}
      <header className="bg-[#0D0D0D] text-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-display text-lg">
            Futuro <span className="text-[#FFC400]">·</span> Conductores
          </a>
          <div className="flex items-center gap-4 font-body text-sm">
            <span className="hidden sm:inline text-[#FAFAF8]/60">Sede {ALUMNO.sede}</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFC400] text-[#0D0D0D] font-display grid place-items-center text-sm">
                {ALUMNO.nombre.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <span>{ALUMNO.nombre}</span>
            </div>
            <a href="/iniciar-sesion" className="text-[#FAFAF8]/60 hover:text-[#FFC400]">Cerrar sesión</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Encabezado + etapa actual */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-body text-sm text-[#0D0D0D]/50">Hola, {ALUMNO.nombre.split(" ")[0]}</p>
            <h1 className="font-display text-3xl font-bold mt-1">Tu avance en la formación</h1>
          </div>
          <div className="inline-flex items-center gap-2 bg-[#FFC400] rounded-sm px-4 py-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#0D0D0D]" />
            <span className="font-body text-sm font-semibold">Etapa actual: {ALUMNO.etapaActual}</span>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Columna principal */}
          <div>
            {/* Tabs */}
            <div className="flex gap-6 border-b border-black/10 font-body text-sm">
              <button
                onClick={() => setTab("resumen")}
                className={`pb-3 -mb-px border-b-2 transition-colors ${
                  tab === "resumen" ? "border-[#0D0D0D] font-semibold" : "border-transparent text-[#0D0D0D]/50"
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setTab("historial")}
                className={`pb-3 -mb-px border-b-2 transition-colors ${
                  tab === "historial" ? "border-[#0D0D0D] font-semibold" : "border-transparent text-[#0D0D0D]/50"
                }`}
              >
                Historial
              </button>
            </div>

            {tab === "resumen" ? (
              <div className="mt-8 space-y-10">
                {/* Progreso por etapa */}
                <section>
                  <h2 className="font-display text-lg mb-4">Tus tres etapas</h2>
                  <div className="space-y-5">
                    {ETAPAS.map((e) => (
                      <div key={e.titulo}>
                        <div className="flex justify-between font-body text-sm mb-1.5">
                          <span className="font-semibold">{e.titulo}</span>
                          <span className="text-[#0D0D0D]/50">{e.estado}</span>
                        </div>
                        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${e.progreso * 100}%`,
                              backgroundColor: e.progreso === 1 ? "#FFC400" : e.progreso >= 0.5 ? "#FFC400" : "#E31B23",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Próximas clases */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg">Próximas clases</h2>
                    <a href="/alumno/autogestion-clase" className="font-body text-sm font-semibold text-[#0D0D0D] underline decoration-[#FFC400] decoration-2 underline-offset-4">
                      Gestionar mis horas
                    </a>
                  </div>
                  <div className="border border-black/10 rounded-md divide-y divide-black/10">
                    {CLASES.map((c, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3">
                        <div className="w-14 shrink-0 text-center">
                          <p className="font-display text-sm leading-none">{c.fecha.split(" ")[1]}</p>
                          <p className="font-body text-[11px] text-[#0D0D0D]/50 uppercase">{c.fecha.split(" ")[0]}</p>
                        </div>
                        <div className="flex-1 font-body">
                          <p className="text-sm font-semibold">{c.tipo}</p>
                          <p className="text-xs text-[#0D0D0D]/50">
                            {c.hora} · Sede {c.sede} · {c.instructor}
                          </p>
                        </div>
                        <span
                          className={`font-body text-xs font-semibold px-2.5 py-1 rounded-sm ${
                            c.estado === "confirmada" ? "bg-[#FFC400] text-[#0D0D0D]" : "border border-[#E31B23] text-[#E31B23]"
                          }`}
                        >
                          {c.estado === "confirmada" ? "Confirmada" : "Por confirmar"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="mt-8">
                <h2 className="font-display text-lg mb-4">Historial</h2>
                <div className="border border-black/10 rounded-md divide-y divide-black/10">
                  {HISTORIAL.map((h, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 font-body">
                      <span className="w-16 shrink-0 text-xs text-[#0D0D0D]/50">{h.fecha}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{h.tipo}</p>
                        <p className="text-xs text-[#0D0D0D]/50">{h.detalle}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#0D0D0D]/70">{h.resultado}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna lateral: credencial */}
          <aside className="space-y-6">
            <div className="bg-[#0D0D0D] text-[#FAFAF8] rounded-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-xs text-[#FAFAF8]/50">Credencial digital</p>
                  <p className="font-display text-lg">{ALUMNO.nombre}</p>
                  <p className="font-body text-xs text-[#FAFAF8]/50 mt-0.5">{ALUMNO.rut}</p>
                </div>
                <div className="w-12 h-12 rounded-sm bg-[#FFC400] grid place-items-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" fill="#0D0D0D" />
                    <rect x="14" y="3" width="7" height="7" fill="#0D0D0D" />
                    <rect x="3" y="14" width="7" height="7" fill="#0D0D0D" />
                    <rect x="14" y="14" width="3" height="3" fill="#0D0D0D" />
                    <rect x="18" y="18" width="3" height="3" fill="#0D0D0D" />
                  </svg>
                </div>
              </div>
              <p className="font-body text-xs text-[#FAFAF8]/50 mt-6">
                Presenta este código QR en recepción para confirmar tu asistencia a clases teóricas y prácticas.
              </p>
            </div>

            <div className="border border-black/10 rounded-md p-6">
              <p className="font-body text-sm font-semibold mb-4">En números</p>
              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-[#0D0D0D]/60">Asistencia teórica</span>
                  <span className="font-semibold">80%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0D0D0D]/60">Horas prácticas restantes</span>
                  <span className="font-semibold">9</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0D0D0D]/60">Sede habitual</span>
                  <span className="font-semibold">{ALUMNO.sede}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
