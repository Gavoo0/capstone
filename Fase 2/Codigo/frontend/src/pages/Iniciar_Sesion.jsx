import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { iniciarSesion, ApiError } from "../services/api";
import { guardarSesion, rutaPorRol } from "../services/sesion";

// Página de inicio de sesión
// guarda la sesión y redirige al panel que corresponde según el rol del usuario.

// Beneficios que se muestran en el panel de marca
const BENEFICIOS = [
  "Tu tarjeta de avance, siempre actualizada",
  "Agenda y gestiona tus próximas clases",
  "Credencial digital con código QR",
];

function IniciarSesion() {
  const navigate = useNavigate();

  // Campos del formulario
  const [identificador, setIdentificador] = useState(""); // Correo o RUT
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(false);

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviarFormulario = async (e) => {
    e.preventDefault();

    // Evitar enviar dos veces mientras se espera la respuesta
    if (cargando) {
      return;
    }

    // Validar que estén los dos campos
    if (!identificador.trim() || !clave) {
      setError("Ingresa tu correo o RUT y tu contraseña.");
      return;
    }

    setError("");
    setCargando(true);
    try {
      const { usuario } = await iniciarSesion(identificador.trim(), clave);

      // Buscar el panel que corresponde al rol del usuario
      const ruta = rutaPorRol(usuario.NOMBRE_ROL);
      if (!ruta) {
        setError("Tu cuenta no tiene un panel asignado. Contacta a la administración.");
        return;
      }

      // Guardar la sesión y redirigir al panel
      guardarSesion(usuario, recordar);
      navigate(ruta);
    } catch (err) {
      // Se llama "err" para no confundirlo con el estado "error"
      console.error("Error al iniciar sesión:", err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado. Inténtalo nuevamente.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#0D0D0D]">
      <div className="h-2 w-full stripe-hazard shrink-0" />

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Panel de marca (solo en pantallas grandes) */}
        <div className="hidden lg:flex flex-col justify-between bg-[#0D0D0D] text-[#FAFAF8] px-14 py-12">
          <Link to="/" className="flex items-center gap-3 font-display text-xl">
            <img src="/logo/logo-nav.png" alt="" className="h-9 w-9 object-contain" />
            <span>
              Futuro <span className="text-[#FFC400]">·</span> Conductores
            </span>
          </Link>

          <div className="max-w-sm">
            <h1 className="font-display text-4xl font-bold leading-tight">Bienvenido de vuelta.</h1>
            <p className="font-body mt-4 text-[#FAFAF8]/70">
              Accede a tu cuenta para revisar tu avance, agendar horas o gestionar la flota, según tu perfil.
            </p>

            <ul className="font-body mt-8 space-y-4 text-sm">
              {BENEFICIOS.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FFC400] grid place-items-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="font-body text-xs text-[#FAFAF8]/40">Macul y Peñalolén, Región Metropolitana.</p>
        </div>

        {/* Formulario de inicio de sesión */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <Link to="/" className="lg:hidden flex items-center gap-3 font-display text-lg mb-10">
              <img src="/logo/logo-nav.png" alt="" className="h-8 w-8 object-contain" />
              <span>
                Futuro <span className="text-[#FFC400]">·</span> Conductores
              </span>
            </Link>

            <h2 className="font-display text-3xl font-bold">Iniciar sesión</h2>
            <p className="font-body mt-2 text-sm text-[#0D0D0D]/60">
              Ingresa con tu correo o RUT y tu contraseña.
            </p>

            <form className="mt-6 space-y-4" onSubmit={enviarFormulario} noValidate>
              <div>
                <label htmlFor="usuario" className="font-body text-sm text-[#0D0D0D]/70">
                  Correo o RUT
                </label>
                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  placeholder="tucorreo@ejemplo.cl"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-black/15 px-3 py-2.5 font-body text-sm focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="clave" className="font-body text-sm text-[#0D0D0D]/70">
                    Contraseña
                  </label>
                  <a href="#" className="font-body text-xs font-semibold text-[#0D0D0D]/60 hover:text-[#E31B23]">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative mt-1">
                  <input
                    id="clave"
                    type={verClave ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    className="w-full rounded-sm border border-black/15 px-3 py-2.5 pr-10 font-body text-sm focus:outline-none focus:border-[#0D0D0D]"
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave((v) => !v)}
                    aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-0 top-0 h-full px-3 text-[#0D0D0D]/40 hover:text-[#0D0D0D]"
                  >
                    {verClave ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.4 10.4 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.2 6.6C4.1 8 2.6 10 2 12c1 3 5 7 10 7 1.3 0 2.5-.3 3.6-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-body text-sm text-[#0D0D0D]/70">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-black/30 accent-[#0D0D0D]"
                  />
                  Recordarme
                </label>
              </div>

              {/* Mensaje de error */}
              {error && (
                <p role="alert" className="font-body rounded-sm border border-[#E31B23]/30 bg-[#E31B23]/5 px-3 py-2 text-sm text-[#E31B23]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-sm bg-[#FFC400] text-[#0D0D0D] font-body font-semibold py-3 hover:bg-[#E6B000] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cargando ? "Ingresando…" : "Iniciar sesión"}
              </button>
            </form>

            <p className="font-body mt-8 text-center text-sm text-[#0D0D0D]/60">
              ¿Aún no eres alumno?{" "}
              <Link to="/#cursos" className="font-semibold text-[#0D0D0D] underline decoration-[#FFC400] decoration-2 underline-offset-4">
                Conoce nuestros cursos
              </Link>
            </p>
            <p className="font-body mt-2 text-center text-sm">
              <Link to="/" className="text-[#0D0D0D]/50 hover:text-[#0D0D0D]">
                ← Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IniciarSesion;
