export default function Vehiculo({ tipo }) {
  const rueda = (cx) => (
    <g>
      <circle cx={cx} cy="176" r="28" fill="#0D0D0D" />
      <circle cx={cx} cy="176" r="14" fill="#D9D9D3" />
      <circle cx={cx} cy="176" r="5" fill="#0D0D0D" />
    </g>
  );
  const texto = { fontFamily: "Kanit, sans-serif", fontWeight: 800, textAnchor: "middle", fill: "#0D0D0D" };

  return (
    <svg viewBox="0 0 520 230" className="w-full h-auto" role="img" aria-label={`Vehículo de práctica ${tipo}`}>
      {tipo === "auto" && (
        <g strokeLinejoin="round">
          <rect x="226" y="70" width="68" height="18" rx="3" fill="#FFC400" stroke="#0D0D0D" strokeWidth="3" />
          <text x="260" y="84" fontSize="11" {...texto}>ESCUELA</text>
          <path d="M56 172 L56 152 Q56 140 72 136 L134 128 L182 92 Q190 86 202 86 L318 86 Q332 86 341 94 L384 128 L446 136 Q464 140 464 156 L464 172 Z" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          <path d="M196 100 L250 100 L250 126 L164 126 Z" fill="#0D0D0D" />
          <path d="M260 100 L316 100 L352 126 L260 126 Z" fill="#0D0D0D" />
          <path d="M255 100 L255 168" stroke="#0D0D0D" strokeWidth="3" />
          <rect x="58" y="158" width="404" height="7" fill="#E31B23" />
          <text x="304" y="151" fontSize="16" {...texto}>FUTURO</text>
          <rect x="446" y="142" width="16" height="8" rx="2" fill="#FFC400" />
          <rect x="56" y="142" width="10" height="12" rx="2" fill="#E31B23" />
          {rueda(140)}
          {rueda(384)}
        </g>
      )}

      {tipo === "van" && (
        <g strokeLinejoin="round">
          <rect x="118" y="70" width="76" height="14" rx="3" fill="#E31B23" stroke="#0D0D0D" strokeWidth="3" />
          <path d="M52 172 L52 96 Q52 84 64 84 L338 84 L410 128 L452 136 Q466 140 466 154 L466 172 Z" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          <path d="M346 98 L386 98 L408 124 L346 124 Z" fill="#0D0D0D" />
          <rect x="72" y="98" width="52" height="34" rx="3" fill="#0D0D0D" />
          <rect x="176" y="98" width="22" height="46" fill="#E31B23" />
          <rect x="164" y="110" width="46" height="22" fill="#E31B23" />
          <rect x="54" y="148" width="410" height="9" fill="#E31B23" />
          <rect x="452" y="142" width="14" height="8" rx="2" fill="#FFC400" />
          {rueda(126)}
          {rueda(396)}
        </g>
      )}

      {tipo === "bus" && (
        <g strokeLinejoin="round">
          <rect x="28" y="66" width="464" height="106" rx="16" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={54 + i * 62} y="82" width="50" height="36" rx="4" fill="#0D0D0D" />
          ))}
          <rect x="420" y="82" width="36" height="88" rx="3" fill="#0D0D0D" />
          <line x1="438" y1="82" x2="438" y2="170" stroke="#FAFAF8" strokeWidth="2" />
          <rect x="462" y="82" width="26" height="54" rx="4" fill="#0D0D0D" />
          <rect x="32" y="130" width="384" height="10" fill="#FFC400" />
          <rect x="32" y="142" width="384" height="6" fill="#E31B23" />
          <rect x="484" y="148" width="8" height="10" rx="2" fill="#FFC400" />
          {rueda(116)}
          {rueda(400)}
        </g>
      )}

      {tipo === "camion" && (
        <g strokeLinejoin="round">
          <defs>
            <pattern id="hz-a4" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="12" height="24" fill="#FFC400" />
              <rect x="12" width="12" height="24" fill="#0D0D0D" />
            </pattern>
          </defs>
          <rect x="36" y="58" width="272" height="114" rx="6" fill="#FFC400" stroke="#0D0D0D" strokeWidth="4" />
          <rect x="38" y="152" width="268" height="18" fill="url(#hz-a4)" />
          <text x="172" y="120" fontSize="34" {...texto}>FUTURO</text>
          <path d="M316 172 L316 84 Q316 76 324 76 L384 76 L424 124 L452 130 Q466 134 466 150 L466 172 Z" fill="#FAFAF8" stroke="#0D0D0D" strokeWidth="4" />
          <path d="M328 90 L378 90 L410 124 L328 124 Z" fill="#0D0D0D" />
          <rect x="318" y="146" width="146" height="8" fill="#E31B23" />
          <rect x="452" y="138" width="14" height="8" rx="2" fill="#FFC400" />
          <rect x="36" y="170" width="430" height="8" fill="#0D0D0D" />
          {rueda(110)}
          {rueda(390)}
        </g>
      )}
    </svg>
  );
}
