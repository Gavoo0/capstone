import { Link } from "react-router-dom";

// Marco común de las pantallas de acceso (recuperar y restablecer contraseña)
function PantallaAcceso({ titulo, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#0D0D0D]">
      <div className="h-2 w-full stripe-hazard shrink-0" />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-3 font-display text-lg mb-6">
            <img src="/logo/logo-nav.png" alt="" className="h-9 w-9 object-contain" />
            <span>
              Futuro <span className="text-[#E6B000]">·</span> Conductores
            </span>
          </Link>

          <div className="bg-white border-2 border-[#0D0D0D] rounded-md overflow-hidden">
            <h1 className="bg-[#0D0D0D] text-[#FAFAF8] font-display text-xl px-6 py-4">{titulo}</h1>
            <div className="px-6 py-6 font-body">{children}</div>
          </div>

          <p className="mt-6 text-center font-body text-sm">
            <Link to="/iniciar-sesion" className="text-[#0D0D0D]/50 hover:text-[#0D0D0D]">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default PantallaAcceso;
