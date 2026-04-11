import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import { Scissors, Sparkles, Heart, Building, Dog, Brain, Bone, Eye, Baby, ClipboardList, Home, Stethoscope, Moon, Flower2, Lamp, MessageSquare, Calendar, BarChart3, Check, X, ArrowLeft, Send, Smartphone, Settings, Info, Shield, CreditCard, Link2, Loader, ChevronRight, Clock, Star, CircleDot, Users, Activity, BookOpen, GraduationCap, Sun } from "lucide-react";
const MoonIcon = Moon;

const THEMES = {
  dark: {
    bg: "#080808", surface: "#111111", surface2: "#161616", border: "#1E1E1E",
    text: "#F9FAFB", dim: "#6B7280", accent: "#4ADE80", cyan: "#22D3EE",
    grad: "linear-gradient(100deg, #4ADE80, #22D3EE)",
    accentGlow: "rgba(74,222,128,0.10)", orange: "#F59E0B",
    red: "#EF4444", wa: "#25D366", navBg: "rgba(8,8,8,0.92)", iaText: "#6B7280",
  },
  light: {
    bg: "#FAFAFA", surface: "#FFFFFF", surface2: "#F3F4F6", border: "#E5E7EB",
    text: "#111827", dim: "#6B7280", accent: "#16A34A", cyan: "#0891B2",
    grad: "linear-gradient(100deg, #16A34A, #0891B2)",
    accentGlow: "rgba(22,163,74,0.08)", orange: "#D97706",
    red: "#DC2626", wa: "#25D366", navBg: "rgba(250,250,250,0.92)", iaText: "#9CA3AF",
  },
};

let C = THEMES.dark;

const BUSINESS_TYPES = [
  { value: "peluqueria", label: "Peluquería", Icon: Scissors },
  { value: "manicura", label: "Manicure / Nail art", Icon: Sparkles },
  { value: "spa", label: "Spa", Icon: Heart },
  { value: "estetica", label: "Centro de estética", Icon: Flower2 },
  { value: "barberia", label: "Barbería", Icon: Scissors },
  { value: "clinica_dental", label: "Clínica dental", Icon: Activity },
  { value: "consultorio", label: "Consultorio médico", Icon: Stethoscope },
  { value: "psicologia", label: "Psicología", Icon: Brain },
  { value: "fisioterapia", label: "Fisioterapia", Icon: Bone },
  { value: "veterinaria", label: "Veterinaria", Icon: Dog },
  { value: "inmobiliaria", label: "Inmobiliaria", Icon: Building },
  { value: "otro", label: "Otro", Icon: ClipboardList },
];

const DAYS = [
  { key: "lunes", label: "Lun" }, { key: "martes", label: "Mar" },
  { key: "miercoles", label: "Mié" }, { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" }, { key: "sabado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];
const DURATIONS = [{ value: 15, label: "15 min" },{ value: 30, label: "30 min" },{ value: 45, label: "45 min" },{ value: 60, label: "1 hora" },{ value: 90, label: "1h 30m" }];

const DEMO_FLOWS = {
  belleza: {
    name: "Glamour Studio", tab: "Belleza", color: "#4ADE80",
    placeholder: "Ej: Quiero cita para uñas el sábado",
    preview: [
      { from: "user", text: "Hola, quiero uñas acrílicas y un corte" },
      { from: "bot",  text: "¡Hola! Tenemos disponible el sábado:\n\nUñas con Paola: 9:00 · 11:00 · 14:00\nCorte con Daniela: 10:30 · 13:00\n\nTe recomiendo uñas 9:00 y corte 10:30. ¿Confirmo?" },
      { from: "user", text: "Sí, a nombre de Valentina Ruiz" },
      { from: "bot",  text: "✅ Confirmado, Valentina:\nSáb 9:00 — Uñas acrílicas ($30)\nSáb 10:30 — Corte + secado ($18)\n\nTe envío recordatorio el viernes. 📅" },
    ],
    responses: [
      { match: ["uña","acril","manicure","nail"], reply: "Tenemos uñas acrílicas desde $25 hasta $40. Esta semana disponible: Mié, Jue y Sáb. ¿Cuál te queda mejor?" },
      { match: ["corte","pelo","cabello","secado"], reply: "Corte dama $12 o $18 con secado. Disponible Lun–Sáb. ¿Tienes preferencia de horario?" },
      { match: ["sábado","sabado","sab"], reply: "El sábado tenemos:\nUñas con Paola: 9:00, 11:00, 14:00\nCorte con Daniela: 10:30, 13:00\n\n¿Te agendo?" },
      { match: ["precio","cuanto","costo","vale"], reply: "Nuestros precios:\nUñas acrílicas: $25–$40\nCorte dama: $12–$18\nColoración: desde $35\nManicure: $10\n\n¿Qué servicio te interesa?" },
      { match: ["hola","buenas","buenos","hi"], reply: "¡Hola! Soy Cleo, asistente de Glamour Studio. ¿En qué puedo ayudarte hoy? 💅" },
      { match: [], reply: "Gracias por escribir. ¿Me dices tu nombre para agendar la cita?" },
    ],
  },
  spa: {
    name: "Zenith Spa", tab: "Spa", color: "#34D399",
    placeholder: "Ej: ¿Tienen masaje para parejas este fin de semana?",
    preview: [
      { from: "user", text: "Qué paquetes de spa tienen?" },
      { from: "bot",  text: "Nuestros paquetes:\n\nRelax Básico — Masaje 60min ($45)\nDía de Reina — Masaje + facial + exfoliación ($85)\nPremium — Todo incluido ($120)\nParejas — 2 masajes + jacuzzi ($130)" },
      { from: "user", text: "Día de Reina para el sábado" },
      { from: "bot",  text: "Perfecto. Sábado disponible: 10:00 · 13:00 · 15:30\nDuración ~2h. ¿A qué hora prefieres?" },
    ],
    responses: [
      { match: ["pareja","parejas","dos","novio","esposo"], reply: "Paquete Parejas: 2 masajes relajantes + jacuzzi privado por $130. Disponible Mar–Dom. ¿Para cuándo?" },
      { match: ["masaje","relax","relajante"], reply: "Masaje Relax 60min — $45\nMasaje Descontracturante 60min — $55\nMasaje Piedras Calientes — $65\n\n¿Cuál te interesa?" },
      { match: ["facial","cara","rostro"], reply: "Facial Hidratante: $45 · 50min\nFacial Anti-edad: $65 · 70min\nIncluyendo vapor y mascarilla profesional. ¿Te agendo?" },
      { match: ["regalo","mamá","mama","cumpleaños"], reply: "¡Qué detalle! Preparamos tarjeta de regalo personalizada + copa de bienvenida sin costo extra. ¿Qué paquete prefieres?" },
      { match: ["hola","buenas","buenos","hi"], reply: "¡Bienvenida a Zenith Spa! Soy tu asistente virtual. ¿Qué experiencia quieres vivir hoy? ✨" },
      { match: [], reply: "¿Me dices tu nombre para preparar tu reserva?" },
    ],
  },
  dental: {
    name: "Sonrisas Dental", tab: "Salud", color: "#60A5FA",
    placeholder: "Ej: ¿Tienen turno mañana a las 10?",
    preview: [
      { from: "user", text: "Quiero agendar una limpieza dental" },
      { from: "bot",  text: "Esta semana tenemos disponible:\n\nMié — 9:00 · 11:30 · 15:00\nJue — 10:00 · 14:30\nVie — 9:00 · 16:00\n\n¿Qué día te queda mejor?" },
      { from: "user", text: "Viernes a las 9" },
      { from: "bot",  text: "✅ Viernes 9:00 AM reservado.\nLimpieza dental — $35 · ~40min\nAceptamos Diners, Visa y Mastercard.\n\n¿A nombre de quién?" },
    ],
    responses: [
      { match: ["limpieza","profilaxis"], reply: "Limpieza dental profesional — $35, dura ~40min. Disponible esta semana:\nMié 9:00/11:30/15:00 · Jue 10:00/14:30 · Vie 9:00/16:00" },
      { match: ["dolor","duele","muela","molar"], reply: "Entiendo. Te agendamos con urgencia. Hoy tenemos espacio a las 15:00 o 17:00. ¿Puedes venir?" },
      { match: ["blanqueamiento","blanquear"], reply: "Blanqueamiento LED profesional — $80, 1 hora. Resultados visibles desde la primera sesión. ¿Te interesa agendar?" },
      { match: ["ortodoncia","brackets","frenos"], reply: "Ofrecemos consulta de ortodoncia gratis esta semana. El Dr. Pérez tiene cita el Jue 10:00 y Vie 14:00. ¿Te agendo?" },
      { match: ["hola","buenas","buenos","hi"], reply: "¡Hola! Soy el asistente de Sonrisas Dental. ¿En qué puedo ayudarte? 🦷" },
      { match: [], reply: "¿Cuál es tu nombre para registrar el turno?" },
    ],
  },
  inmobiliaria: {
    name: "Remax Quito", tab: "Inmobiliaria", color: "#FBBF24",
    placeholder: "Ej: Busco depa 2 dormitorios en Cumbayá",
    preview: [
      { from: "user", text: "Busco depa de 3 dormitorios en Cumbayá" },
      { from: "bot",  text: "Tengo 4 opciones en Cumbayá:\n\nMiravalle III — 120m² · $185,000\nPortal de Cumbayá — 95m² · $142,000\nJardines del Este — 135m² · $210,000\nLa Primavera — 110m² · $168,000" },
      { from: "user", text: "Portal de Cumbayá, ¿tiene parqueadero?" },
      { from: "bot",  text: "Sí. Incluye parqueadero cubierto, piscina, gimnasio y BBQ. A 5 min del C.C. Scala.\n\n¿Te agendo un recorrido esta semana?" },
    ],
    responses: [
      { match: ["cumbayá","cumbaya"], reply: "En Cumbayá tengo:\nPortal de Cumbayá — 95m² · $142,000\nMiravalle III — 120m² · $185,000\nJardines del Este — 135m² · $210,000\n\n¿Cuántos dormitorios buscas?" },
      { match: ["norte","quito norte","carcelén","calderón"], reply: "En el norte de Quito tengo opciones desde $85,000. ¿Prefieres 2 o 3 dormitorios?" },
      { match: ["precio","presupuesto","cuanto","valor"], reply: "¿Cuál es tu presupuesto aproximado? Tenemos opciones desde $85,000 hasta $280,000 con financiamiento bancario disponible." },
      { match: ["recorrido","visita","ver","conocer"], reply: "Perfecto. Puedo agendarte un recorrido con nuestro asesor. ¿Prefieres esta semana? Disponible Lun–Sáb 9:00–18:00." },
      { match: ["hola","buenas","buenos","hi"], reply: "¡Hola! Soy el asistente de Remax Quito. ¿Qué tipo de propiedad estás buscando? 🏠" },
      { match: [], reply: "¿Me das tu nombre y te cuento más detalles sobre las opciones disponibles?" },
    ],
  },
};

const PLANS = [
  { id: "basico", name: "Básico", price: 29, annual: 290, desc: "Para negocios que están arrancando", popular: false, features: ["IA en WhatsApp 24/7", "Agendamiento automático", "Panel de agenda", "Hasta 10 servicios", "500 conversaciones/mes"] },
  { id: "negocio", name: "Negocio", price: 59, annual: 590, desc: "Para PYMEs activas", popular: true, features: ["Todo lo del Básico", "Estadísticas e ingresos", "Modo ausencia", "Ubicación y modalidad", "Hasta 20 servicios", "2,000 conversaciones/mes"] },
  { id: "pro", name: "Pro", price: 99, annual: 990, desc: "Para negocios en crecimiento", popular: false, features: ["Todo lo de Negocio", "Reportes Excel", "Proyección de ingresos", "Servicios ilimitados", "Conversaciones ilimitadas", "Soporte prioritario"] },
];

const SECTORS = [
  { cat: "Belleza y cuidado personal", items: [{ I: Scissors, l: "Peluquerías" },{ I: Sparkles, l: "Manicuristas" },{ I: Scissors, l: "Barberías" },{ I: Star, l: "Maquilladores" },{ I: Flower2, l: "Estética" },{ I: Sparkles, l: "Cosmetología" },{ I: Star, l: "Depilación láser" },{ I: Home, l: "Estilistas a domicilio" }]},
  { cat: "Salud", items: [{ I: Activity, l: "Dentales" },{ I: Stethoscope, l: "Consultorios" },{ I: Brain, l: "Psicólogos" },{ I: Bone, l: "Fisioterapia" },{ I: Eye, l: "Ópticas" },{ I: Baby, l: "Pediatras" },{ I: ClipboardList, l: "Nutricionistas" },{ I: Heart, l: "Enfermería" }]},
  { cat: "Bienestar", items: [{ I: Heart, l: "Spas" },{ I: Flower2, l: "Masajistas" },{ I: Moon, l: "Yoga / Pilates" },{ I: Lamp, l: "Holísticos" },{ I: Flower2, l: "Med. alternativa" },{ I: Moon, l: "Clínicas del sueño" }]},
  { cat: "Otros", items: [{ I: Building, l: "Inmobiliarias" },{ I: Dog, l: "Veterinarias" },{ I: BookOpen, l: "Tareas dirigidas" },{ I: GraduationCap, l: "Nivelaciones académicas" }]},
];


// ── CHAT MOCKUP — hero visual ─────────────────────────────────────────────────
function ChatMockup({ C }) {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);

  const MSGS = [
    { from: "client", text: "Hola, ¿tienen cita disponible mañana a las 10?" },
    { from: "cleo",   text: "¡Hola! Claro, tenemos disponible mañana martes a las 10:00 AM. ¿Te agendo?" },
    { from: "client", text: "Sí por favor, a nombre de Valentina" },
    { from: "cleo",   text: "✅ ¡Listo, Valentina! Cita confirmada para mañana martes 10:00 AM. Te enviaré un recordatorio esta noche. 📅" },
  ];

  useEffect(() => {
    const run = async () => {
      for (let i = 0; i < MSGS.length; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 800 : 1400));
        setTyping(true);
        await new Promise(r => setTimeout(r, MSGS[i].from === "cleo" ? 900 : 400));
        setTyping(false);
        setStep(s => s + 1);
      }
      await new Promise(r => setTimeout(r, 3000));
      setStep(0);
    };
    run();
    const interval = setInterval(run, MSGS.length * 2000 + 5000);
    return () => clearInterval(interval);
  }, []);

  const visible = MSGS.slice(0, step);
  const lastIsBot = visible.length > 0 && visible[visible.length - 1].from === "cleo";

  return (
    <div style={{ width: 320, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: `0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px ${C.border}` }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, background: C.surface }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${C.accent}15`, border: `1.5px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: "#22C55E", border: `2px solid ${C.surface}` }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Cleo IA</div>
          <div style={{ fontSize: 10, color: C.accent, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, animation: "pulse 1.5s infinite" }} />
            En línea · Responde al instante
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: C.dim, background: C.surface2, padding: "3px 8px", borderRadius: 20, border: `1px solid ${C.border}` }}>WhatsApp</div>
      </div>

      {/* Messages */}
      <div style={{ padding: "16px 14px", minHeight: 220, display: "flex", flexDirection: "column", gap: 10, background: "#080808" }}>
        {visible.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.from === "client" ? "flex-end" : "flex-start", animation: "fadeUp 0.25s ease" }}>
            <div style={{
              maxWidth: "80%",
              padding: "9px 13px",
              borderRadius: msg.from === "client" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.from === "client" ? "#1A3A2A" : C.surface,
              border: `1px solid ${msg.from === "client" ? C.accent + "25" : C.border}`,
              fontSize: 13, color: msg.from === "client" ? "#D0F0D8" : C.text,
              lineHeight: 1.5,
            }}>
              {msg.text}
              {msg.from === "cleo" && (
                <div style={{ fontSize: 9, color: C.accent, marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                  <Check size={8} color={C.accent} strokeWidth={3} /><Check size={8} color={C.accent} strokeWidth={3} style={{ marginLeft: -4 }} /> Entregado
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display: "flex", justifyContent: lastIsBot ? "flex-end" : "flex-start", animation: "fadeUp 0.2s ease" }}>
            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: `pulse ${0.6 + i * 0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", background: C.surface }}>
        <div style={{ flex: 1, padding: "8px 12px", borderRadius: 20, background: C.surface2, border: `1px solid ${C.border}`, fontSize: 12, color: C.dim }}>
          Escribe un mensaje...
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={13} color={C.bg} />
        </div>
      </div>
    </div>
  );
}

const Logo = ({ size = 20, tag = false }) => (
  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: tag ? "flex-start" : "center", userSelect: "none" }}>
    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -1, background: "linear-gradient(100deg, #4ADE80 0%, #22D3EE 50%, #4ADE80 100%)", backgroundSize: "300% 100%", animation: "gradBreathe 2.5s ease-in-out infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cleo<span style={{ WebkitTextFillColor: "inherit" }}>.</span></span>
    {tag && <span style={{ fontFamily: "monospace", fontSize: Math.max(size * 0.32, 8), letterSpacing: 2.5, color: C.iaText, marginTop: 2 }}>powered by ia</span>}
  </span>
);
const inp = (err) => ({
  width: "100%", padding: "10px 13px", borderRadius: 10, fontSize: 14,
  fontFamily: "inherit", border: `1.5px solid ${err ? C.red : C.border}`,
  outline: "none", background: C.surface2, color: C.text,
  boxSizing: "border-box",
  transition: "border-color 0.18s, box-shadow 0.18s",
});
const btn1 = (off) => ({
  width: "100%", padding: "14px", borderRadius: 12, border: "none",
  background: off ? C.surface2 : C.accent,
  color: off ? C.dim : C.bg, fontSize: 15, fontWeight: 700,
  cursor: off ? "default" : "pointer", fontFamily: "inherit",
  transition: "opacity 0.18s, transform 0.18s, box-shadow 0.18s",
  boxShadow: off ? "none" : "0 4px 20px rgba(74,222,128,0.25)",
  opacity: off ? 0.4 : 1,
});

function ChatDemo() {
  const [ak, setAk] = useState("belleza");
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [ctaVisible, setCtaVisible] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const f = DEMO_FLOWS[ak];

  // Cargar preview al cambiar sector
  useEffect(() => {
    setMsgs(f.preview.slice(0, 2));
    setTyping(false);
    setCtaVisible(false);
    setUserInteracted(false);
    setInput("");
  }, [ak]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const getReply = (text) => {
    const lower = text.toLowerCase();
    for (const r of f.responses) {
      if (r.match.length === 0) continue;
      if (r.match.some(kw => lower.includes(kw))) return r.reply;
    }
    return f.responses[f.responses.length - 1].reply;
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input.trim(), ts: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }) };
    setMsgs(p => [...p, userMsg]);
    setInput("");
    setUserInteracted(true);
    setTyping(true);
    const reply = getReply(userMsg.text);
    setTimeout(() => {
      setTyping(false);
      const botMsg = { from: "bot", text: reply, ts: new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }) };
      setMsgs(p => [...p, botMsg]);
      // Mostrar CTA después de 2 intercambios del usuario
      const userCount = msgs.filter(m => m.from === "user").length + 1;
      if (userCount >= 1) setTimeout(() => setCtaVisible(true), 1200);
    }, 1400 + Math.random() * 600);
  };

  const switchSector = (k) => {
    setAk(k);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>

      {/* Tabs de sector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {Object.entries(DEMO_FLOWS).map(([k, v]) => (
          <button key={k} onClick={() => switchSector(k)}
            style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 50, border: `1px solid ${ak === k ? v.color + "50" : C.border}`, background: ak === k ? v.color + "12" : "transparent", color: ak === k ? v.color : C.dim, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s", whiteSpace: "nowrap" }}
            onMouseEnter={e => { if (ak !== k) { e.currentTarget.style.borderColor = v.color + "30"; e.currentTarget.style.color = C.text; }}}
            onMouseLeave={e => { if (ak !== k) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}}>
            {v.tab}
          </button>
        ))}
      </div>

      {/* Contenedor del chat */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>

        {/* Header del negocio */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: C.surface }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: f.color + "15", border: `1.5px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
            <MessageSquare size={16} color={f.color} />
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: "#22C55E", border: `2px solid ${C.surface}` }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.name}</div>
            <div style={{ fontSize: 10, color: "#22C55E", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", animation: "pulse 1.5s infinite" }} />
              En línea · Responde al instante
            </div>
          </div>
          <div style={{ fontSize: 10, color: C.dim, background: C.surface2, border: `1px solid ${C.border}`, padding: "3px 10px", borderRadius: 20 }}>WhatsApp</div>
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} style={{ padding: "16px 14px", minHeight: 260, maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, background: "#080808", scrollBehavior: "smooth" }}>

          {/* Label intro */}
          {!userInteracted && (
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: C.dim, background: C.surface, border: `1px solid ${C.border}`, padding: "3px 10px", borderRadius: 20 }}>
                Conversación de ejemplo — escribe abajo para interactuar
              </span>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.22s ease" }}>
              <div style={{
                maxWidth: "82%", padding: "10px 14px",
                borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.from === "user" ? "#1A3A28" : C.surface,
                border: `1px solid ${m.from === "user" ? f.color + "20" : C.border}`,
                fontSize: 13, color: m.from === "user" ? "#D0F0D8" : C.text,
                lineHeight: 1.55, whiteSpace: "pre-line",
              }}>
                {m.text}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, paddingLeft: m.from === "bot" ? 4 : 0, paddingRight: m.from === "user" ? 4 : 0 }}>
                {m.ts && <span style={{ fontSize: 9, color: C.dim }}>{m.ts}</span>}
                {m.from === "bot" && <span style={{ fontSize: 9, color: f.color, display: "flex", alignItems: "center", gap: 2 }}><Check size={8} color={f.color} strokeWidth={3}/><Check size={8} color={f.color} strokeWidth={3} style={{ marginLeft: -4 }}/></span>}
              </div>
            </div>
          ))}

          {typing && (
            <div style={{ display: "flex", alignItems: "flex-start", animation: "fadeUp 0.2s ease" }}>
              <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: 4, alignItems: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: f.color, animation: `pulse ${0.5 + i * 0.15}s ease-in-out infinite` }} />)}
              </div>
            </div>
          )}

          {/* CTA dentro del chat */}
          {ctaVisible && !typing && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, marginTop: 4, animation: "fadeUp 0.3s ease" }}>
              <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: C.surface, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, lineHeight: 1.55 }}>
                ¿Quieres que Cleo haga esto por tu negocio? 🚀
              </div>
              <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ padding: "8px 18px", borderRadius: 50, background: f.color, color: C.bg, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${f.color}30`, transition: "opacity 0.18s, transform 0.18s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
                Activa mi asistente gratis →
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center", background: C.surface }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder={f.placeholder}
            style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 50, padding: "10px 18px", color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color 0.18s, box-shadow 0.18s" }}
            onFocus={e => { e.target.style.borderColor = f.color + "60"; e.target.style.boxShadow = `0 0 0 3px ${f.color}10`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
          <button onClick={send}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: input.trim() ? f.color : C.surface2, color: input.trim() ? C.bg : C.dim, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.18s", flexShrink: 0, boxShadow: input.trim() ? `0 4px 14px ${f.color}30` : "none" }}
            onMouseEnter={e => { if (input.trim()) { e.currentTarget.style.transform = "scale(1.08)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Hint */}
      <p style={{ textAlign: "center", fontSize: 11, color: C.dim, marginTop: 12 }}>
        Escribe cualquier mensaje — Cleo responde en segundos
      </p>
    </div>
  );
}

function ROICalc() {
  const [ms, setMs] = useState(30); const [mn, setMn] = useState(5);
  const mo = ms * 22, hr = (mo * mn) / 60, cm = hr * 4.5;
  const pl = mo <= 500 ? PLANS[0] : mo <= 2000 ? PLANS[1] : PLANS[2];
  const sv = cm * 0.75 - pl.price;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}><BarChart3 size={18} color={C.accent} /> Calcula cuánto ahorras</div>
      {[{ l: "Mensajes / día", v: ms, s: setMs, mi: 5, mx: 200, d: ms },{ l: "Min por respuesta", v: mn, s: setMn, mi: 1, mx: 15, d: `${mn} min` }].map((x, i) => (
        <label key={i} style={{ display: "block", marginBottom: 16 }}><span style={{ fontSize: 13, color: C.dim, display: "flex", justifyContent: "space-between" }}><span>{x.l}</span><span style={{ color: C.accent, fontWeight: 600 }}>{x.d}</span></span>
          <input type="range" min={x.mi} max={x.mx} value={x.v} onChange={e => x.s(+e.target.value)} style={{ width: "100%", marginTop: 8, accentColor: C.accent }} /></label>
      ))}
      <div style={{ background: C.surface2, borderRadius: 12, padding: 18, marginTop: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Sin Cleo</div><div style={{ fontSize: 24, fontWeight: 700, color: "#F09595" }}>${cm.toFixed(0)}<span style={{ fontSize: 12, fontWeight: 400 }}>/mes</span></div></div>
          <div><div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Con Cleo</div><div style={{ fontSize: 24, fontWeight: 700, color: C.accent }}>${pl.price}<span style={{ fontSize: 12, fontWeight: 400 }}>/mes</span></div></div>
        </div>
        {sv > 0 && <div style={{ marginTop: 14, padding: "10px 14px", background: C.accentGlow, borderRadius: 8, border: `1px solid ${C.accent}30`, fontSize: 14, fontWeight: 700, color: C.accent }}>Ahorras ~${sv.toFixed(0)}/mes</div>}
      </div>
    </div>
  );
}

function S1({ data: d, setData: sd, onNext, onLegal, isMobile: mob }) {
  const [phase, setPhase] = useState("form"); // form | verify
  const [sp, setSp] = useState(false);
  const [er, setEr] = useState({});
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);

  // --- Password strength ---
  const pw = d.password || "";
  const checks = [
    { label: "Mínimo 8 caracteres", met: pw.length >= 8 },
    { label: "Letras y números", met: /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw) },
    { label: "Un símbolo (!@#$%)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
  ];
  const metCount = checks.filter(c => c.met).length;
  const strengthColor = metCount === 3 ? C.accent : metCount === 2 ? "#F59E0B" : "#EF4444";
  const strengthLabel = metCount === 3 ? "Segura" : metCount === 2 ? "Media" : metCount >= 1 ? "Débil" : "";
  const strengthPct = metCount === 3 ? "100%" : metCount === 2 ? "66%" : metCount >= 1 ? "33%" : "0%";

  const validate = () => {
    const e = {};
    if (!d.business_name?.trim()) e.n = 1;
    if (!d.email?.trim() || !/\S+@\S+\.\S+/.test(d.email)) e.e = 1;
    if (metCount < 3) e.p = 1;
    setEr(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try { await api.post("/auth/register", { email: d.email, password: d.password, company_name: d.business_name });
    setLoading(false); setPhase("verify"); } catch (err) { setLoading(false); setEr({ g: err.response?.data?.error || "Error al registrarse" }); }
  };

  // --- Verification code ---
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  const handleCodeChange = async (index, value) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean && value) return;

    const newCode = [...code];
    newCode[index] = clean.slice(0, 1);
    setCode(newCode);
    setCodeError("");

    // Move to next input
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 filled
    const full = newCode.join("");
    if (full.length === 6) {
      setVerifying(true);
      try {
        const res = await api.post('/auth/verify', { email: d.email, code: full });
        if (res.data.token) localStorage.setItem('cleo_token', res.data.token);
        setVerifying(false);
        onNext();
      } catch (err) {
        setVerifying(false);
        setCodeError(err.response?.data?.error || 'Código inválido');
        setCode(['','','','','','']);
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
    setCodeError("");
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      setVerifying(true);
      api.post("/auth/verify", { email: d.email, code: pasted }).then(res => { if (res.data.token) localStorage.setItem("cleo_token", res.data.token); setVerifying(false); onNext(); }).catch(err => { setVerifying(false); setCodeError(err.response?.data?.error || "Código inválido"); setCode(["","","","","",""]); inputRefs.current[0]?.focus(); });
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- VERIFY SCREEN ---
  if (phase === "verify") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.cyan}12`, border: `1px solid ${C.cyan}25`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Shield size={22} color={C.cyan} />
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>Verifica tu email</h2>
        <p style={{ color: C.dim, fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
          Enviamos un código de 6 caracteres a<br/><span style={{ color: C.text, fontWeight: 600 }}>{d.email}</span>
        </p>
      </div>

      {/* 6 code inputs */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handlePaste}>
        {code.map((char, i) => (
          <input key={i} ref={el => inputRefs.current[i] = el}
            type="text" inputMode="text" maxLength={1} value={char}
            onChange={e => handleCodeChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{
              width: 46, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700,
              fontFamily: "'DM Sans', monospace", letterSpacing: 0,
              background: char ? `${C.accent}08` : C.surface,
              border: `2px solid ${codeError ? C.red : char ? C.accent : C.border}`,
              borderRadius: 12, color: C.text, outline: "none",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onFocus={e => { if (!codeError) e.target.style.borderColor = C.accent; }}
            onBlur={e => { if (!codeError) e.target.style.borderColor = char ? `${C.accent}60` : C.border; }}
          />
        ))}
      </div>

      {verifying && (
        <div style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.dim, fontSize: 13 }}>
          <Loader size={14} color={C.accent} style={{ animation: "spin 1s linear infinite" }} /> Verificando...
        </div>
      )}

      {codeError && (
        <div style={{ textAlign: "center", fontSize: 13, color: C.red }}>{codeError}</div>
      )}

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button onClick={async () => { setCode(["","","","","",""]); setCodeError(""); try { await api.post("/auth/resend-code", { email: d.email }); } catch(e) { setCodeError("Error al reenviar"); } }}
          style={{ background: "none", border: "none", color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Reenviar código
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: C.dim, margin: 0 }}>El código expira en 15 minutos</p>
    </div>
  );

  // --- REGISTER FORM ---
  const inpFocus = (e) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 3px rgba(74,222,128,0.08)"; };
  const inpBlur = (e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800, margin: 0 }}>Crea tu cuenta en Cleo</h2>
        <p style={{ color: C.dim, fontSize: 12, marginTop: 6 }}>Tu asistente IA estará listo en minutos</p>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Nombre de tu negocio</label>
        <input placeholder="Ej: Glamour Studio" value={d.business_name||""} onChange={e => sd({...d, business_name: e.target.value})} style={inp(er.n)} onFocus={inpFocus} onBlur={inpBlur} />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Email</label>
        <input type="email" placeholder="tu@email.com" value={d.email||""} onChange={e => sd({...d, email: e.target.value})} style={inp(er.e)} onFocus={inpFocus} onBlur={inpBlur} />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Contraseña</label>
        <div style={{ position: "relative" }}>
          <input type={sp?"text":"password"} placeholder="Crea una contraseña segura" value={pw}
            onChange={e => sd({...d, password: e.target.value})}
            style={{...inp(er.p), paddingRight: 50}}
            onFocus={inpFocus} onBlur={inpBlur} />
          <button onClick={() => setSp(!sp)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.dim }}>
            <Eye size={16} />
          </button>
        </div>

        {/* Strength bar */}
        {pw.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.dim }}>Fortaleza</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: strengthColor, transition: "color 0.3s" }}>{strengthLabel}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: C.border }}>
              <div style={{ height: "100%", borderRadius: 2, background: strengthColor, width: strengthPct, transition: "width 0.4s ease, background 0.3s" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {checks.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c.met ? C.accent : C.dim, transition: "color 0.3s" }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: c.met ? `${C.accent}18` : "transparent",
                    border: `1.5px solid ${c.met ? C.accent : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s",
                    ...(c.met ? { animation: "checkPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" } : {}),
                  }}>
                    {c.met && <Check size={10} color={C.accent} strokeWidth={3} />}
                  </div>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:12 }}>
        <input type="checkbox" checked={terms} onChange={function(){setTerms(!terms)}} style={{ marginTop:3, accentColor:C.accent, width:16, height:16, flexShrink:0 }} />
        <span style={{ fontSize:12, color:C.dim, lineHeight:1.4 }}>
          {"He leído y acepto los "}
          <span onClick={function(){if(onLegal)onLegal("terminos")}} style={{ color:C.accent, cursor:"pointer", textDecoration:"underline" }}>Términos y Condiciones</span>
          {" y la "}
          <span onClick={function(){if(onLegal)onLegal("privacidad")}} style={{ color:C.accent, cursor:"pointer", textDecoration:"underline" }}>Política de Privacidad</span>
        </span>
      </div>

      <button onClick={handleRegister} disabled={loading || !terms || metCount < 3}
        style={{...btn1(!terms || metCount < 3), opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onMouseEnter={e => { if (!loading && terms && metCount >= 3) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
        onMouseLeave={e => { e.currentTarget.style.opacity = (!terms || metCount < 3) ? "0.4" : "1"; e.currentTarget.style.transform = "none"; }}>
        {loading ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Creando cuenta...</> : "Crear mi cuenta gratis"}
      </button>
      <p style={{ textAlign: "center", fontSize: 12, color: C.dim, margin: 0 }}>7 días gratis · Sin tarjeta de crédito</p>
    </div>
  );
}

function S2({ data: d, setData: sd, onNext, isMobile: mob }) {
  const ds = {}; DAYS.forEach(x => { ds[x.key] = x.key === "domingo" ? { open: "00:00", close: "00:00", active: false } : { open: "09:00", close: "18:00", active: true }; });
  const sch = d.schedule || ds; const ss = s => sd({...d, schedule: s}); const can = d.business_type && Object.values(sch).some(x => x.active);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ textAlign: "center" }}><div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.cyan}15`, border: `1px solid ${C.cyan}30`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Settings size={22} color={C.cyan} /></div><h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>Configura tu negocio</h2><p style={{ color: C.dim, fontSize: 14, marginTop: 6 }}>La IA usará esto para atender clientes</p></div>
      <div><label style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "block" }}>Tipo de negocio</label>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8 }}>
          {BUSINESS_TYPES.map(t => { const Ic = t.Icon; return (<button key={t.value} onClick={() => sd({...d, business_type: t.value})} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", borderRadius: 10, border: `1.5px solid ${d.business_type === t.value ? C.accent : C.border}`, background: d.business_type === t.value ? C.accentGlow : C.surface, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500, color: C.text, textAlign: "left" }}><Ic size={15} color={d.business_type === t.value ? C.accent : C.dim} strokeWidth={1.8} />{t.label}</button>); })}
        </div>
      </div>
      <div><label style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "block" }}>Horario</label>
        {DAYS.map(x => { const dy = sch[x.key]; return (<div key={x.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 6, opacity: dy.active ? 1 : 0.4 }}>
          <button onClick={() => ss({...sch, [x.key]: {...dy, active: !dy.active}})} style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", background: dy.active ? C.accent : "#444", position: "relative", flexShrink: 0 }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: dy.active ? 18 : 2, transition: "left 0.2s" }} /></button>
          <span style={{ fontWeight: 600, fontSize: 12, minWidth: 32 }}>{x.label}</span>
          {dy.active ? (<div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}><input type="time" value={dy.open} onChange={e => ss({...sch, [x.key]: {...dy, open: e.target.value}})} style={{ padding: "5px 6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 12, fontFamily: "inherit", flex: 1 }} /><span style={{ color: C.dim, fontSize: 11 }}>a</span><input type="time" value={dy.close} onChange={e => ss({...sch, [x.key]: {...dy, close: e.target.value}})} style={{ padding: "5px 6px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 12, fontFamily: "inherit", flex: 1 }} /></div>) : <span style={{ fontSize: 11, color: C.dim }}>Cerrado</span>}
        </div>); })}
      </div>
      <div><label style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "block" }}>Duración de cita</label><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{DURATIONS.map(x => (<button key={x.value} onClick={() => sd({...d, appointment_duration: x.value})} style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", border: `1.5px solid ${d.appointment_duration === x.value ? C.accent : C.border}`, background: d.appointment_duration === x.value ? C.accentGlow : C.surface, color: C.text, cursor: "pointer" }}>{x.label}</button>))}</div></div>
      <button onClick={can ? onNext : undefined} style={btn1(!can)}>Siguiente <ChevronRight size={16} style={{ verticalAlign: "middle", marginLeft: 2 }} /></button>
    </div>
  );
}

function S3({ data: d, onNext }) {
  const [phase, setPhase] = useState(0); // 0=idle, 1=loading, 2=checks, 3=done
  const [checks, setChecks] = useState([false, false, false]);
  const [showCelebration, setShowCelebration] = useState(false);
  const confettiRef = useRef(null);

  const fireConfetti = useCallback(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
    script.onload = () => {
      if (window.confetti) {
        window.confetti({ particleCount: 80, spread: 70, startVelocity: 30, decay: 0.92, scalar: 0.9, ticks: 120, origin: { y: 0.6 },
          colors: ["#4ADE80", "#22D3EE", "#4ADE80", "#22D3EE", "#86EFAC", "#67E8F9"] });
      }
    };
    document.head.appendChild(script);
  }, []);

  const go = () => {
    setPhase(1);
    // Phase 1 → 2: loading for 2s then start checks
    setTimeout(() => {
      setPhase(2);
      // Check 1 at 0ms
      setTimeout(() => setChecks(p => [true, p[1], p[2]]), 0);
      // Check 2 at 600ms
      setTimeout(() => setChecks(p => [p[0], true, p[2]]), 600);
      // Check 3 at 1200ms
      setTimeout(() => setChecks(p => [p[0], p[1], true]), 1200);
      // Phase 3: celebration at 1800ms after checks start (3800ms total)
      setTimeout(() => {
        setPhase(3);
        fireConfetti();
        setTimeout(() => setShowCelebration(true), 200);
      }, 1800);
    }, 2000);
  };

  const checkLabels = ["WhatsApp conectado", "IA personalizada para tu negocio", "Enviando mensaje de prueba..."];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.wa}15`, border: `1px solid ${C.wa}30`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Smartphone size={22} color={C.wa} />
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>Conecta tu WhatsApp</h2>
        <p style={{ color: C.dim, fontSize: 14, marginTop: 6 }}>Tu bot usará tu propio número</p>
      </div>

      <div style={{ background: "#1A1800", border: "1px solid #3D3600", borderRadius: 12, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Info size={16} color={C.orange} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: "#D4A017", lineHeight: 1.5 }}>Necesitas una cuenta de Facebook y un número de WhatsApp Business activo.</div>
      </div>

      {/* IDLE */}
      {phase === 0 && (
        <div style={{ background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 16, padding: "36px 20px", textAlign: "center" }}>
          <Link2 size={32} color={C.dim} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>Se abrirá una ventana de Facebook donde seleccionas tu cuenta y número.</p>
          <button onClick={go} style={{ padding: "14px 28px", borderRadius: 100, border: "none", background: C.wa, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Smartphone size={18} /> Conectar WhatsApp
          </button>
        </div>
      )}

      {/* PHASE 1 — RADAR PULSE */}
      {phase === 1 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "48px 20px", textAlign: "center" }}>
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 20px" }}>
            {/* Radar rings */}
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: `2px solid ${C.accent}`,
                animation: `radar 2s ${i * 0.6}s ease-out infinite`,
              }} />
            ))}
            {/* Center icon */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: `${C.wa}20`, borderRadius: "50%", border: `2px solid ${C.wa}40`,
            }}>
              <Smartphone size={28} color={C.wa} />
            </div>
          </div>
          <p style={{ fontWeight: 600, fontSize: 15, color: C.text }}>Activando tu IA…</p>
          <p style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>Esto toma unos segundos</p>
        </div>
      )}

      {/* PHASE 2 — PROGRESSIVE CHECKS */}
      {phase === 2 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {checkLabels.map((label, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                opacity: checks[i] ? 1 : 0.15, transition: "opacity 0.3s",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: checks[i] ? `${C.accent}20` : "transparent",
                  border: checks[i] ? `1.5px solid ${C.accent}40` : `1.5px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  ...(checks[i] ? {
                    animation: "checkPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                  } : {}),
                }}>
                  {checks[i] && <Check size={14} color={C.accent} strokeWidth={2.5} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: checks[i] ? 600 : 400, color: checks[i] ? C.text : C.dim }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 3 — CELEBRATION */}
      {phase === 3 && (
        <div ref={confettiRef} style={{
          background: C.accentGlow, border: `1.5px solid ${C.accent}40`, borderRadius: 16,
          padding: "36px 24px", textAlign: "center",
          opacity: showCelebration ? 1 : 0, transform: showCelebration ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s, transform 0.5s",
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8,
            background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Cleo está activo
          </div>
          <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.5, marginBottom: 28 }}>
            Revisa tu WhatsApp — ya te enviamos el primer mensaje.
          </p>
          <button onClick={onNext} style={{
            ...btn1(false), borderRadius: 100,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            Ver mi panel <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function S4({ data: d, onBack }) {
  const steps = [
    { text: "Envía un WhatsApp a tu número y prueba el bot", icon: <Send size={13} color={C.accent} /> },
    { text: "Compártelo con alguien para prueba real", icon: <Users size={13} color={C.accent} /> },
    { text: "Personaliza servicios en configuración", icon: <Settings size={13} color={C.accent} /> },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero with aurora glow */}
      <div style={{
        position: "relative", borderRadius: 20, padding: "40px 24px 32px", textAlign: "center", overflow: "hidden",
        background: C.surface, border: `1px solid ${C.accent}18`,
      }}>
        {/* Aurora radial glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}18 0%, ${C.accent}08 40%, transparent 70%)`,
          pointerEvents: "none", filter: "blur(30px)",
        }} />

        {/* Animated checkmark with ring */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 18 }}>
          <div style={{
            position: "absolute", top: 0, left: 0, width: 60, height: 60, borderRadius: "50%",
            border: `2px solid ${C.accent}40`,
            animation: "ringPulse 2s ease-out infinite",
          }} />
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.accent}25, ${C.accent}10)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
            border: `1.5px solid ${C.accent}30`,
          }}>
            <Check size={28} color={C.accent} strokeWidth={3} />
          </div>
        </div>

        {/* Title with gradient */}
        <h2 style={{
          fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, margin: 0,
          background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "fadeUp 0.5s 0.2s both",
        }}>
          {d.business_name} está listo 🎉
        </h2>

        {/* Subtitle */}
        <p style={{
          color: C.dim, fontSize: 13, marginTop: 8, lineHeight: 1.5,
          animation: "fadeUp 0.5s 0.3s both",
        }}>
          Tu IA ya está activa. Comparte tu número con tus clientes.
        </p>

        {/* Trial badge pill */}
        <div style={{
          display: "inline-block", marginTop: 14,
          padding: "6px 16px", borderRadius: 50,
          background: C.accentGlow, border: `1px solid ${C.accent}40`,
          fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: 0.3,
          animation: "fadeUp 0.5s 0.4s both",
        }}>
          Trial · 7 días gratis
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { emoji: "📅", label: "Citas hoy", value: "0" },
          { emoji: "💬", label: "Mensajes", value: "0" },
          { emoji: "⚡", label: "Estado", value: "Activo", dot: true },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "16px 10px", textAlign: "center",
            animation: `fadeUp 0.45s ${0.1 * (i + 1)}s both`,
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{kpi.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif" }}>
              {kpi.dot ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {kpi.value}
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%", background: C.accent,
                    display: "inline-block", animation: "dotPulse 1.8s ease-in-out infinite",
                  }} />
                </span>
              ) : kpi.value}
            </div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 2, fontWeight: 500 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Próximos pasos */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "20px 18px",
        animation: "fadeUp 0.5s 0.45s both",
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, marginBottom: 14,
        }}>Próximos pasos</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((s, i) => (
            <div key={i} className="s4-step" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 10,
              background: `${C.surface2}`,
              border: `1px solid ${C.border}`,
              cursor: "default",
              transition: "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}>
              {/* Gradient numbered circle */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: C.grad,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#080808" }}>{i + 1}</span>
              </div>
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: C.accentGlow,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.icon}
              </div>
              {/* Text */}
              <span style={{ fontSize: 12, color: C.dim, lineHeight: 1.4, fontWeight: 500 }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main CTA button */}
      <button
        onClick={() => { window.location.href = "/dashboard"; }}
        style={{
          width: "100%", height: 52, borderRadius: 14, border: "none",
          background: C.grad, color: "#080808",
          fontSize: 15, fontWeight: 700, fontFamily: "inherit",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: `0 4px 24px ${C.accent}30, 0 0 48px ${C.accent}15`,
          animation: "fadeUp 0.5s 0.55s both",
        }}
      >
        Ir a mi panel →
      </button>
    </div>
  );
}

export default function CleoApp({ initialView }) {
  const [theme, setTheme] = useState("dark");
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  C = THEMES[resolved];
  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");

  const [vw, setVw] = useState(initialView || "landing"); const [st, setSt] = useState(1); const [mob, setMob] = useState(false); const [billing, setBilling] = useState("monthly");
  const [d, setD] = useState({ business_name: "", email: "", password: "", business_type: "", schedule: null, appointment_duration: 30 });
  const dr = useRef(null); const pr = useRef(null); const cr = useRef(null);
  useEffect(() => { const c = () => setMob(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  useEffect(() => {
    // SEO Meta tags
    document.title = "Cleo — Tu negocio atendido 24/7 con IA en WhatsApp";
    // Favicon
    const fav = document.createElement("link"); fav.rel="icon"; fav.href="https://cleo.app/favicon.ico"; document.head.appendChild(fav);
    const apple = document.createElement("link"); apple.rel="apple-touch-icon"; apple.href="https://cleo.app/apple-touch-icon.png"; document.head.appendChild(apple);
    const metas = [
      {name:"description",content:"Chatbot inteligente que responde, agenda citas y confirma — mientras tú te enfocas en tu negocio. Hecho en Ecuador para PYMEs."},
      {name:"keywords",content:"agendamiento WhatsApp Ecuador, chatbot IA PYMEs, agenda automática WhatsApp"},
      {property:"og:title",content:"Cleo — Tu negocio atendido 24/7 con IA"},
      {property:"og:description",content:"Responde, agenda y confirma citas automáticamente en WhatsApp. Prueba gratis 7 días."},
      {property:"og:image",content:"https://cleo.app/og-image.png"},
      {property:"og:url",content:"https://cleo.app"},
      {property:"og:type",content:"website"},
      {name:"twitter:card",content:"summary_large_image"},
      {name:"twitter:title",content:"Cleo — IA para tu negocio en WhatsApp"},
      {name:"twitter:description",content:"Agenda citas automáticamente 24/7. Hecho en Ecuador."},
      {name:"twitter:image",content:"https://cleo.app/og-image.png"},
    ];
    const added = metas.map(function(m){const t=document.createElement("meta");if(m.name)t.name=m.name;if(m.property)t.setAttribute("property",m.property);t.content=m.content;document.head.appendChild(t);return t;});
    // Plausible Analytics
    const pa = document.createElement("script"); pa.defer=true; pa.dataset.domain="cleo.app"; pa.src="https://plausible.io/js/script.js"; document.head.appendChild(pa);
    return () => { added.forEach(function(t){document.head.removeChild(t)}); document.head.removeChild(pa); };
  }, []);
  // Analytics helper
  const track = function(event, props) { if(window.plausible) window.plausible(event, {props}); };

  useEffect(() => { const s = document.createElement("style"); s.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}@keyframes fadeCheck{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}@keyframes gradBreathe{0%{background-position:0% 50%;filter:brightness(1)}50%{background-position:100% 50%;filter:brightness(1.2)}100%{background-position:0% 50%;filter:brightness(1)}}@keyframes radar{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.8);opacity:0}}@keyframes navEntry{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes checkPop{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}50%{box-shadow:0 0 12px 3px rgba(74,222,128,0.12)}}@keyframes scaleIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}@keyframes ringPulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.8);opacity:0}}@keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}@keyframes s4StepHover{from{transform:translateX(0)}to{transform:translateX(4px)}}.s4-step:hover{transform:translateX(4px)!important}*{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;width:100%;max-width:100vw}html{scroll-behavior:smooth}input:focus,select:focus{border-color:${C.accent}!important}::selection{background:${C.accent}30}input[type="range"]{height:6px;border-radius:3px}button{transition:opacity 0.15s,transform 0.15s}button:active{transform:scale(0.98)}`; document.head.appendChild(s); return () => document.head.removeChild(s); }, []);
  const scr = r => { r.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const go = () => { track("Empieza gratis"); setVw("onboarding"); setSt(1); window.scrollTo({ top: 0 }); };
  const nx = () => { setSt(s => Math.min(s+1, 4)); window.scrollTo({ top: 0 }); };
  const sx = { padding: mob ? "50px 0" : "80px 0", maxWidth: 1080, margin: "0 auto", paddingLeft: mob ? 16 : 20, paddingRight: mob ? 16 : 20 };
  const lb = { fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.accent, marginBottom: 8, display: "block" };
  const tt = { fontFamily: "'Syne', sans-serif", fontSize: mob ? 24 : "clamp(28px,3.5vw,36px)", fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 12 };

  const legalStyle = { fontFamily:"'DM Sans',system-ui,sans-serif", background:C.bg, color:"#D1D5DB", minHeight:"100vh", overflowX:"hidden" };
  const legalWrap = { maxWidth:680, margin:"0 auto", padding:mob?"24px 16px 60px":"40px 20px 80px" };
  const lh = { fontFamily:"'Syne',sans-serif", fontWeight:700, color:C.text, marginTop:28, marginBottom:8 };
  const lp = { fontSize:14, lineHeight:1.7, marginBottom:12 };

  if (vw === "terminos") return (
    <div style={legalStyle}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+C.border, position:"sticky", top:0, background:C.bg, zIndex:50 }}>
        <div style={{ maxWidth:680, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={function(){setVw("onboarding")}} style={{ background:"none", border:"none", cursor:"pointer", color:C.dim, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", fontSize:13 }}><ArrowLeft size={16} /> Volver</button>
          <Logo size={18} tag />
        </div>
      </div>
      <div style={legalWrap}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:mob?22:28, fontWeight:800, marginBottom:4 }}>Términos y Condiciones de Cleo</h1>
        <p style={{ fontSize:12, color:C.dim, marginBottom:28 }}>Última actualización: abril 2026</p>
        <p style={lp}>Bienvenido a Cleo. Al crear una cuenta y usar nuestro servicio, aceptas estos Términos y Condiciones. Léelos con calma — están escritos en lenguaje simple para que entiendas exactamente qué estás aceptando.</p>
        <h2 style={{...lh, fontSize:18}}>1. ¿Qué es Cleo?</h2>
        <p style={lp}>Cleo es una plataforma SaaS (software como servicio) que permite a pequeños negocios en Ecuador conectar un asistente de inteligencia artificial a su número de WhatsApp Business para responder mensajes, agendar citas y gestionar su agenda de forma automática.</p>
        <p style={lp}>Cleo no es una empresa de telecomunicaciones ni un proveedor de WhatsApp. Nos integramos con la API oficial de WhatsApp Business de Meta para ofrecer este servicio.</p>
        <h2 style={{...lh, fontSize:18}}>2. Tu cuenta</h2>
        <p style={lp}>Para usar Cleo necesitas: tener al menos 18 años, proporcionar información veraz al registrarte, tener un número de WhatsApp Business activo que sea de tu propiedad o que tengas autorización legal para usar, y mantener la confidencialidad de tu contraseña.</p>
        <p style={lp}>Eres responsable de todo lo que ocurra en tu cuenta. Si crees que alguien accedió sin autorización, contáctanos de inmediato en soporte@cleo.app.</p>
        <h2 style={{...lh, fontSize:18}}>3. Uso del servicio</h2>
        <p style={lp}>Al usar Cleo te comprometes a: usar el servicio únicamente para fines legales y legítimos de tu negocio, no enviar mensajes de spam, contenido engañoso o ilegal a través de la IA, no intentar manipular o engañar al sistema, y respetar las políticas de uso de WhatsApp Business de Meta.</p>
        <p style={lp}>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos sin previo aviso.</p>
        <h2 style={{...lh, fontSize:18}}>4. Planes, precios y facturación</h2>
        <p style={lp}>Cleo ofrece los siguientes planes: Plan Básico — $29/mes o $290/año, Plan Negocio — $59/mes o $590/año, Plan Pro — $99/mes o $990/año. Todos los planes incluyen un período de prueba gratuita de 7 días sin necesidad de tarjeta de crédito.</p>
        <p style={lp}>Facturación mensual: se cobra cada mes en la fecha de inicio del plan. Facturación anual: se cobra por adelantado por 12 meses. Los planes anuales equivalen a 10 meses de precio — recibes 2 meses gratis.</p>
        <p style={lp}>Planes mensuales: no se realizan reembolsos por el mes en curso. Puedes cancelar en cualquier momento y tu acceso continúa hasta el fin del período pagado. Planes anuales: no son reembolsables. Si cancelas un plan anual antes de que venza, tu acceso continúa activo hasta la fecha de vencimiento anual.</p>
        <h2 style={{...lh, fontSize:18}}>5. Cancelación y período de gracia</h2>
        <p style={lp}>Puedes cancelar tu cuenta en cualquier momento desde Ajustes en tu dashboard. Al cancelar un plan mensual: tu cuenta permanece activa hasta el fin del período pagado, tras el vencimiento tienes 30 días de período de gracia con los datos guardados pero la IA desactivada, y al día 37 todos tus datos son eliminados permanentemente.</p>
        <p style={lp}>Al cancelar un plan anual: tu cuenta permanece activa hasta la fecha de vencimiento anual, y al vencer aplica el mismo período de gracia de 30 días descrito arriba.</p>
        <h2 style={{...lh, fontSize:18}}>6. Limitación de responsabilidad</h2>
        <p style={lp}>Cleo es una herramienta de automatización. No garantizamos que la IA responda correctamente el 100% de los mensajes, disponibilidad ininterrumpida del servicio, ni que todos los mensajes de WhatsApp sean entregados. La responsabilidad máxima de Cleo ante cualquier reclamo se limita al monto pagado por el usuario en los últimos 3 meses.</p>
        <h2 style={{...lh, fontSize:18}}>7. Propiedad intelectual</h2>
        <p style={lp}>El software, diseño, logo y contenido de Cleo son propiedad exclusiva de Cleo y están protegidos por las leyes de propiedad intelectual del Ecuador.</p>
        <h2 style={{...lh, fontSize:18}}>8. Modificaciones al servicio</h2>
        <p style={lp}>Nos reservamos el derecho de modificar estos Términos y Condiciones, los precios y las funcionalidades del servicio con un aviso previo de 30 días por email.</p>
        <h2 style={{...lh, fontSize:18}}>9. Ley aplicable</h2>
        <p style={lp}>Estos Términos y Condiciones se rigen por las leyes de la República del Ecuador. Cualquier disputa será resuelta ante los tribunales competentes de la ciudad de Quito, Ecuador.</p>
        <h2 style={{...lh, fontSize:18}}>10. Contacto</h2>
        <p style={lp}>Para cualquier consulta sobre estos términos escríbenos a: soporte@cleo.app</p>
      </div>
    </div>
  );

  if (vw === "privacidad") return (
    <div style={legalStyle}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+C.border, position:"sticky", top:0, background:C.bg, zIndex:50 }}>
        <div style={{ maxWidth:680, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={function(){setVw("onboarding")}} style={{ background:"none", border:"none", cursor:"pointer", color:C.dim, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", fontSize:13 }}><ArrowLeft size={16} /> Volver</button>
          <Logo size={18} tag />
        </div>
      </div>
      <div style={legalWrap}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:mob?22:28, fontWeight:800, marginBottom:4 }}>Política de Privacidad de Cleo</h1>
        <p style={{ fontSize:12, color:C.dim, marginBottom:28 }}>Última actualización: abril 2026</p>
        <p style={lp}>En Cleo nos tomamos muy en serio la privacidad de tus datos y los de tus clientes. Esta política explica qué información recopilamos, cómo la usamos y cómo la protegemos.</p>
        <h2 style={{...lh, fontSize:18}}>1. Quién es responsable de tus datos</h2>
        <p style={lp}>Cleo es el responsable del tratamiento de los datos personales que recopilamos a través de nuestra plataforma, de conformidad con la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP). Contacto: soporte@cleo.app</p>
        <h2 style={{...lh, fontSize:18}}>2. Qué datos recopilamos</h2>
        <p style={lp}>Datos que tú nos proporcionas: nombre del negocio, correo electrónico, contraseña (almacenada encriptada), tipo de negocio y horarios, servicios y precios, dirección o ubicación.</p>
        <p style={lp}>Datos generados al usar el servicio: número de WhatsApp Business conectado, conversaciones entre tu asistente IA y tus clientes, citas agendadas, estadísticas de uso.</p>
        <p style={lp}>Datos técnicos: dirección IP, tipo de dispositivo y navegador, fechas y horas de acceso.</p>
        <h2 style={{...lh, fontSize:18}}>3. Para qué usamos tus datos</h2>
        <p style={lp}>Usamos tu información únicamente para: operar y mejorar el servicio, personalizar el asistente IA, enviarte notificaciones, comunicaciones de soporte, análisis agregado anónimo, y cumplir con obligaciones legales.</p>
        <p style={lp}>No usamos tus datos para: vender información a terceros, enviarte publicidad de terceros, ni entrenar modelos de IA externos con tus conversaciones.</p>
        <h2 style={{...lh, fontSize:18}}>4. Datos de los clientes de tu negocio</h2>
        <p style={lp}>Cuando tus clientes escriben a tu WhatsApp, Cleo almacena sus mensajes y datos de contacto para operar el servicio. Como dueño del negocio eres corresponsable de esos datos y te comprometes a usarlos solo para gestionar citas y conversaciones, e informar a tus clientes que sus mensajes son atendidos por un asistente de IA.</p>
        <h2 style={{...lh, fontSize:18}}>5. Con quién compartimos datos</h2>
        <p style={lp}>Para operar el servicio trabajamos con: Anthropic (IA), Meta/WhatsApp (mensajería), Supabase (base de datos), Vercel (hosting), Resend (emails). Todos con políticas de seguridad adecuadas.</p>
        <h2 style={{...lh, fontSize:18}}>6. Por cuánto tiempo guardamos tus datos</h2>
        <p style={lp}>Mientras tu cuenta esté activa: todos tus datos. Durante el período de gracia (30 días tras cancelar): datos guardados, IA desactivada. Al día 37: eliminación definitiva e irreversible. Si solicitas eliminación manual, ejecutamos el borrado en máximo 72 horas.</p>
        <h2 style={{...lh, fontSize:18}}>7. Tus derechos</h2>
        <p style={lp}>De acuerdo con la LOPDP tienes derecho a: acceso, rectificación, eliminación, portabilidad y oposición. Escríbenos a soporte@cleo.app y responderemos en máximo 15 días hábiles.</p>
        <h2 style={{...lh, fontSize:18}}>8. Seguridad</h2>
        <p style={lp}>Protegemos tus datos con: encriptación en tránsito (HTTPS/TLS), contraseñas con hash seguro, acceso restringido, y códigos de verificación para acciones sensibles.</p>
        <h2 style={{...lh, fontSize:18}}>9. Cookies</h2>
        <p style={lp}>Usamos cookies estrictamente necesarias para mantener tu sesión iniciada. No usamos cookies de seguimiento ni publicidad.</p>
        <h2 style={{...lh, fontSize:18}}>10. Cambios a esta política</h2>
        <p style={lp}>Si realizamos cambios importantes te notificaremos por email con al menos 30 días de anticipación.</p>
        <h2 style={{...lh, fontSize:18}}>11. Contacto</h2>
        <p style={lp}>Para cualquier consulta sobre privacidad o para ejercer tus derechos: soporte@cleo.app</p>
        <p style={{ fontSize:12, color:C.dim, marginTop:28, textAlign:"center" }}>Cleo — Hecho en Ecuador para PYMEs ecuatorianas.</p>
      </div>
    </div>
  );

  if (vw === "404") return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:C.bg, color:C.text, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20, textAlign:"center" }}>
      <div style={{ maxWidth:400 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:mob?64:80, fontWeight:800, background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1, marginBottom:12 }}>404</div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:8 }}>Página no encontrada</h1>
        <p style={{ fontSize:14, color:C.dim, lineHeight:1.5, marginBottom:24 }}>La página que buscas no existe o fue movida.</p>
        <button onClick={function(){setVw("landing");window.scrollTo(0,0)}} style={{ padding:"14px 32px", borderRadius:50, background:C.accent, color:C.bg, fontSize:15, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit" }}>Volver al inicio</button>
        <div style={{ marginTop:20 }}><Logo size={18} tag /></div>
      </div>
    </div>
  );

  if (vw === "status") return (
    <div style={legalStyle}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+C.border, position:"sticky", top:0, background:C.bg, zIndex:50 }}>
        <div style={{ maxWidth:680, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={function(){setVw("landing")}} style={{ background:"none", border:"none", cursor:"pointer", color:C.dim, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", fontSize:13 }}><ArrowLeft size={16} /> Inicio</button>
          <Logo size={18} tag />
        </div>
      </div>
      <div style={legalWrap}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:mob?22:28, fontWeight:800, marginBottom:20 }}>Estado del sistema</h1>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{name:"Plataforma Cleo",ok:true},{name:"Asistente IA",ok:true},{name:"WhatsApp",ok:true},{name:"Emails",ok:true}].map(function(s,i){
            return <div key={i} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:s.ok?C.accent:"#EF4444" }} />
              <span style={{ fontSize:14, fontWeight:600 }}>{s.name}</span>
              <span style={{ marginLeft:"auto", fontSize:12, color:s.ok?C.accent:"#EF4444" }}>{s.ok?"Operativo":"Incidencia"}</span>
            </div>;
          })}
        </div>
        <div style={{ marginTop:28 }}>
          <h2 style={{...lh, fontSize:16}}>Últimos 30 días</h2>
          <div style={{ display:"flex", gap:2, marginTop:8 }}>
            {Array.from({length:30}).map(function(_,i){ return <div key={i} style={{ flex:1, height:24, borderRadius:2, background:C.accent+"30" }} /> })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ fontSize:10, color:C.dim }}>30 días atrás</span>
            <span style={{ fontSize:10, color:C.dim }}>Hoy</span>
          </div>
          <div style={{ textAlign:"center", marginTop:12, fontSize:13, color:C.accent, fontWeight:600 }}>99.9% uptime</div>
        </div>
      </div>
    </div>
  );

  if (vw === "changelog") return (
    <div style={legalStyle}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid "+C.border, position:"sticky", top:0, background:C.bg, zIndex:50 }}>
        <div style={{ maxWidth:680, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={function(){setVw("landing")}} style={{ background:"none", border:"none", cursor:"pointer", color:C.dim, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit", fontSize:13 }}><ArrowLeft size={16} /> Inicio</button>
          <Logo size={18} tag />
        </div>
      </div>
      <div style={legalWrap}>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:mob?22:28, fontWeight:800, marginBottom:20 }}>Novedades</h1>
        {[
          {date:"2 abr 2026", title:"Facturación anual", desc:"Ahora puedes elegir planes anuales con 2 meses gratis. Toggle disponible en la página de planes.", cat:"nuevo"},
          {date:"1 abr 2026", title:"Panel de administración", desc:"Nuevo panel admin con finanzas, egresos, gestión de usuarios y configuración del sistema.", cat:"nuevo"},
          {date:"28 mar 2026", title:"Modo ausencia mejorado", desc:"Ahora puedes escribir tu mensaje personalizado y la IA lo mejora con un clic.", cat:"mejora"},
          {date:"25 mar 2026", title:"Eliminación de cuenta segura", desc:"Flujo de eliminación con verificación por código de 6 caracteres vía email.", cat:"mejora"},
          {date:"20 mar 2026", title:"Estadísticas e ingresos", desc:"Nuevo tab de estadísticas con ingresos estimados, proyección y descarga de reportes Excel.", cat:"nuevo"},
          {date:"15 mar 2026", title:"Corrección de horarios", desc:"Se corrigió un error que mostraba horarios incorrectos en la vista mensual.", cat:"correccion"},
        ].map(function(e,i){
          var catColors = {nuevo:C.accent, mejora:"#3B82F6", correccion:"#F59E0B"};
          var catLabels = {nuevo:"Nuevo", mejora:"Mejora", correccion:"Corrección"};
          return <div key={i} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:12, padding:"16px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:10, color:C.dim }}>{e.date}</span>
              <span style={{ padding:"2px 6px", borderRadius:4, fontSize:9, fontWeight:700, background:(catColors[e.cat]||"#666")+"18", color:catColors[e.cat]||"#666" }}>{catLabels[e.cat]||e.cat}</span>
            </div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{e.title}</div>
            <div style={{ fontSize:13, color:C.dim, lineHeight:1.5 }}>{e.desc}</div>
          </div>;
        })}
      </div>
    </div>
  );

  if (vw === "onboarding") {
    const stepLabels = ["Cuenta","Negocio","WhatsApp","Listo \u2713"];
    const benefits = [
      { title:"Responde 24/7", desc:"Atiende a tus clientes mientras tú duermes.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, delay:"0s" },
      { title:"Agenda automáticamente", desc:"Confirma citas sin intervención humana.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, delay:"0.7s" },
      { title:"Todo desde un panel", desc:"Agenda, servicios, estadísticas e ingresos.", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>, delay:"1.4s" },
    ];

    return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: C.bg, color: C.text, minHeight: "100vh" }}>
      {/* NAV */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {st > 1 && st < 4 && <button onClick={() => setSt(s => Math.max(s-1,1))} style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, padding: 4, display: "flex" }}><ArrowLeft size={18} /></button>}
            <Logo tag />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {st < 4 && <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 22, height: 3, borderRadius: 2, background: i + 1 <= st ? C.accent : C.border, transition: "all 0.3s" }} />
                  <span style={{ fontSize: 9, fontWeight: i + 1 <= st ? 600 : 400, color: i + 1 <= st ? C.accent : C.dim, transition: "color 0.3s" }}>{label}</span>
                </div>
              ))}
            </div>}
            <button onClick={() => { setVw("landing"); setSt(1); }} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim }}><X size={14} /></button>
          </div>
        </div>
      </div>

      {/* BODY */}
      {st === 1 ? (
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mob ? "24px 20px 60px" : "24px 20px 60px" }}>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", display: mob ? "block" : "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr" }}>
            {/* LEFT PANEL */}
            {!mob && (
              <div style={{ background: C.bg, borderRight: `1px solid ${C.border}`, padding: "40px 32px", position: "relative", overflow: "hidden" }}>
                {/* Ambient glow */}
                <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, lineHeight: 1.3, marginBottom: 10, position: "relative", animation: "fadeUp 0.45s 0.05s both" }}>
                  Tu negocio atendido{" "}<span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>24/7 con IA</span>{" "}en WhatsApp
                </h2>
                <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, marginBottom: 28, position: "relative", animation: "fadeUp 0.45s 0.15s both" }}>
                  Configura Cleo en menos de 10 minutos. Sin conocimientos técnicos.
                </p>

                {/* Benefits */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", marginBottom: 28 }}>
                  {benefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, border: `1px solid transparent`, transition: "border-color 0.2s, background 0.2s", animation: `fadeUp 0.45s ${0.25 + i * 0.1}s both`, cursor: "default" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "rgba(74,222,128,0.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: C.accentGlow, border: `1px solid ${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flexShrink: 0, animation: "breathe 3s ease-in-out infinite", animationDelay: `${i * 0.7}s` }}>
                        {b.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trial card */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 15px", position: "relative", animation: "fadeUp 0.45s 0.55s both" }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.5, color: C.dim, marginBottom: 4 }}>Prueba gratuita</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 19, color: C.accent }}>7 días gratis</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>Sin tarjeta · Cancela cuando quieras</div>
                </div>
              </div>
            )}

            {/* RIGHT PANEL */}
            <div style={{ background: C.surface, padding: mob ? "24px 20px" : "40px 32px" }}>
              <S1 data={d} setData={setD} onNext={nx} onLegal={function(page){setVw(page)}} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 60px" }}>
          {st === 2 && <S2 data={d} setData={setD} onNext={nx} isMobile={mob} />}
          {st === 3 && <S3 data={d} onNext={nx} />}
          {st === 4 && <S4 data={d} onBack={() => { setVw("landing"); setSt(1); }} />}
        </div>
      )}
    </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: C.bg, color: C.text, minHeight: "100vh", overflowX: "hidden" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, padding: "14px 20px", background: C.navBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ animation: "navEntry 0.6s cubic-bezier(0.16,1,0.3,1) both" }}><Logo size={22} tag /></div>
          {mob ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "navEntry 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
              <button onClick={cycleTheme} style={{ width: 30, height: 30, borderRadius: "50%", background: C.surface, border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {resolved === "dark" ? <MoonIcon size={13} color={C.dim} /> : resolved === "light" ? <Sun size={13} color={C.dim} /> : <Settings size={13} color={C.dim} />}
              </button>
              <button onClick={go} style={{ padding: "8px 18px", borderRadius: 50, background: C.accent, color: C.bg, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Empezar gratis</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 24, alignItems: "center", animation: "navEntry 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
              <button onClick={() => scr(dr)} style={{ color: C.dim, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Cómo funciona</button>
              <button onClick={() => scr(pr)} style={{ color: C.dim, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Planes</button>
              <button onClick={() => scr(cr)} style={{ color: C.dim, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Calculadora</button>
              <button onClick={cycleTheme} style={{ width: 32, height: 32, borderRadius: "50%", background: C.surface, border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {resolved === "dark" ? <MoonIcon size={14} color={C.dim} /> : resolved === "light" ? <Sun size={14} color={C.dim} /> : <Settings size={14} color={C.dim} />}
              </button>
              <button onClick={() => window.location.href="/dashboard"} style={{ color: C.dim, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Iniciar sesión</button>
              <button onClick={go} style={{ padding: "8px 20px", borderRadius: 50, background: C.accent, color: C.bg, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Prueba gratis</button>
            </div>
          )}
        </div>
      </nav>

      <section style={{ padding: mob?"70px 16px 60px":"100px 20px 90px", position: "relative", overflow: "hidden" }}>
        {/* Glow fondo */}
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, background: `radial-gradient(circle,${C.accentGlow} 0%,transparent 65%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto", display: mob ? "block" : "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

          {/* ── TEXTO ── */}
          <div style={{ textAlign: mob ? "center" : "left" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 50, background: C.surface, border: `1px solid ${C.border}`, fontSize: 11, color: C.dim, marginBottom: 24 }}>
              <CircleDot size={7} color={C.accent} /> IA para PYMEs ecuatorianas
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: mob ? 32 : "clamp(40px,5vw,58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: mob ? -0.5 : -2, marginBottom: 20, color: C.text }}>
              Cada cliente que<br/>
              escribe{" "}
              <span style={{ background: C.grad, backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "gradBreathe 2.5s ease-in-out infinite" }}>merece respuesta.</span><br/>
              Cleo la da.
            </h1>

            {/* Subheadline */}
            <p style={{ fontSize: mob ? 15 : 17, color: C.dim, maxWidth: 460, margin: mob ? "0 auto 28px" : "0 0 28px", lineHeight: 1.65 }}>
              Tu negocio responde, agenda citas y confirma por WhatsApp — automáticamente. Sin que tú hagas nada.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexDirection: mob ? "column" : "row", alignItems: mob ? "stretch" : "center", marginBottom: 24 }}>
              <button onClick={go}
                style={{ padding: "15px 32px", borderRadius: 50, background: C.accent, color: C.bg, fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 0 32px rgba(74,222,128,0.3), 0 4px 16px rgba(74,222,128,0.2)`, transition: "opacity 0.18s, transform 0.18s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
                Empieza gratis — 7 días
              </button>
              <button onClick={() => { track("Ver demo"); scr(dr); }}
                style={{ padding: "15px 32px", borderRadius: 50, background: "transparent", color: C.text, border: `1px solid ${C.border}`, fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + "60"}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                Ver cómo funciona
              </button>
            </div>

            {/* Trust pills */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: mob ? "center" : "flex-start" }}>
              {["Sin tarjeta de crédito", "Setup en 15 minutos", "Cancela cuando quieras"].map((t, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.dim }}>
                  <Check size={11} color={C.accent} strokeWidth={3} />{t}
                </span>
              ))}
            </div>
          </div>

          {/* ── MOCKUP CHAT ── */}
          {!mob && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ChatMockup C={C} />
            </div>
          )}
        </div>
      </section>

      {/* MIENTRAS TÚ DUERMES */}
      <section style={sx}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <CircleDot size={8} color={C.accent} /><span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.accent }}>Siempre disponible</span>
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: mob ? 32 : "clamp(36px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, marginBottom: 16 }}>
          Mientras tú<br/>
          <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>duermes,</span><br/>
          Cleo trabaja.
        </h2>
        <p style={{ color: C.dim, fontSize: mob ? 14 : 16, maxWidth: 480, marginBottom: 36, lineHeight: 1.6 }}>
          Cada mensaje sin respuesta es un cliente que se va a la competencia. Cleo responde, agenda y confirma — solo. Las 24 horas. Los 7 días.
        </p>

        {/* Scenario cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
          {[
            { Icon: Moon, context: "Son las 11pm y ya estás durmiendo", clientMsg: "¿Tienen cita mañana a las 10?", result: "Cleo responde en segundos y agenda la cita. Tú ni te enteraste." },
            { Icon: Stethoscope, context: "Estás en consulta con un paciente", clientMsg: "Quiero cancelar mi turno del viernes", result: "Cleo cancela, libera el horario y le ofrece otra fecha. Sin interrumpirte." },
            { Icon: Clock, context: "Es domingo y tu negocio está cerrado", clientMsg: "¿Tienen disponible el paquete de masajes para parejas?", result: "Cleo responde con detalles del paquete y precios. Agenda la reserva sin que tú hagas nada." },
          ].map((c, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>

              {/* 1. CONTEXTO — situación clara */}
              <div style={{ padding: mob ? "16px 18px" : "18px 24px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: mob ? 15 : 16, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.accent}12`, border: `1px solid ${C.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <c.Icon size={14} color={C.accent} strokeWidth={2} />
                  </div>
                  {c.context}
                </div>
              </div>

              <div style={{ padding: mob ? "16px 18px" : "18px 24px" }}>
                {/* 2. MENSAJE DEL CLIENTE — burbuja WhatsApp */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontWeight: 600 }}>Tu cliente escribe:</div>
                  <div style={{
                    background: "#1A2A1A", border: `1px solid ${C.border}`,
                    borderRadius: "14px 14px 14px 4px", padding: "11px 15px",
                    fontSize: 14, color: "#D0E8D0", lineHeight: 1.5,
                    maxWidth: mob ? "90%" : "75%",
                  }}>
                    {c.clientMsg}
                  </div>
                </div>

                {/* 3. RESULTADO — qué hace Cleo */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${C.accent}18`, border: `1px solid ${C.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <Check size={12} color={C.accent} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>{c.result}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 36 }}>
          {[
            { val: "24/7", label: "Siempre disponible" },
            { val: "<30s", label: "Tiempo de respuesta" },
            { val: "0", label: "Clientes perdidos" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: mob ? 20 : 24, fontWeight: 700, color: C.accent }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={go} style={{ padding: "15px 36px", borderRadius: 100, background: C.accent, color: C.bg, fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Empieza gratis — 7 días</button>
          <div style={{ marginTop: 12, fontSize: 12, color: C.dim }}>Sin tarjeta · 15 min de setup · Cancela cuando quieras</div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={sx}>
        <span style={lb}>Testimonios</span>
        <div style={tt}>Lo que dicen nuestros clientes</div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap: 14, marginTop: 24 }}>
          {[
            { name: "Valentina M.", biz: "Nail Studio, Quito", text: "Antes perdía clientes porque no podía responder de noche. Ahora Cleo agenda mientras duermo y mis citas se llenaron.", photo: "data:image/jpeg;base64,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" },
            { name: "Dr. Andrés P.", biz: "Clínica Dental, Guayaquil", text: "Lo configuré en 10 minutos. Mis pacientes reciben confirmación automática y mis cancelaciones bajaron a la mitad.", photo: "data:image/jpeg;base64,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" },
            { name: "Sofía R.", biz: "Spa & Bienestar, Cuenca", text: "Mis clientes preguntan por precios a las 11pm y Cleo responde solo. Es como tener una recepcionista que nunca duerme.", photo: "data:image/jpeg;base64,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" },
          ].map((t, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: `1px solid ${C.accent}30`, flexShrink: 0 }}>
                  <img src={t.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{t.biz}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginBottom: 10 }}>"{t.text}"</p>
              <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: C.accent, fontSize: 13 }}>★</span>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section ref={dr} style={sx}>
        <span style={lb}>Demo interactiva</span>
        <div style={tt}>Escribe un mensaje.<br/><span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Cleo responde en segundos.</span></div>
        <p style={{ color: C.dim, fontSize: mob ? 14 : 16, marginBottom: 32, maxWidth: 480, lineHeight: 1.6 }}>Elige tu sector y escribe como si fueras un cliente real. Así es exactamente cómo funciona en tu negocio.</p>
        <ChatDemo />
      </section>

      <section style={sx}><span style={lb}>Sectores</span><div style={tt}>Para negocios que agendan citas</div>
        {SECTORS.map((g, gi) => (<div key={gi} style={{ marginBottom: 20 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 8 }}>{g.cat}</div><div style={{ display: "grid", gridTemplateColumns: mob?"1fr 1fr":"repeat(4,1fr)", gap: 6 }}>{g.items.map((s, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: mob?"9px 10px":"10px 14px", borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, fontSize: mob?11:12, fontWeight: 500 }}><s.I size={13} color={C.dim} strokeWidth={1.5} style={{ flexShrink: 0 }} /><span style={{ lineHeight: 1.3 }}>{s.l}</span></div>))}</div></div>))}
      </section>

      <section ref={pr} style={sx}><span style={lb}>Precios</span><div style={tt}>Simple, sin sorpresas</div><p style={{ color: C.dim, fontSize: 14, marginBottom: 20 }}>7 días gratis. Cancela en 1 clic.</p>
        <div style={{ display:"flex", borderRadius:10, background:C.surface, border:"1px solid "+C.border, padding:3, marginBottom:8, maxWidth:400 }}>
          <button onClick={()=>setBilling("monthly")} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", background:billing==="monthly"?C.accent:"transparent", color:billing==="monthly"?C.bg:C.dim, fontSize:13, fontWeight:600, transition:"all 0.2s" }}>Mensual</button>
          <button onClick={()=>setBilling("annual")} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", background:billing==="annual"?C.accent:"transparent", color:billing==="annual"?C.bg:C.dim, fontSize:13, fontWeight:600, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
            Anual <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:billing==="annual"?"rgba(0,0,0,0.2)":C.accentGlow, color:billing==="annual"?C.bg:C.accent, fontWeight:700 }}>2 meses gratis</span>
          </button>
        </div>
        {billing === "annual" && <p style={{ fontSize:10, color:C.dim, marginBottom:12 }}>Los planes anuales no son reembolsables. Puedes cancelar cuando quieras y tu acceso continúa hasta el fin del período pagado.</p>}
        <div style={{ display: "grid", gridTemplateColumns: mob?"1fr":"repeat(3,1fr)", gap: 14, marginTop: 16 }}>
          {PLANS.map(p => {
            const isAnnual = billing === "annual";
            const monthlyEq = isAnnual ? (p.annual / 12).toFixed(2) : p.price;
            const savings = p.price * 12 - p.annual;
            return (<div key={p.id} style={{ background: C.surface, border: `1px solid ${p.popular?C.accent:C.border}`, borderRadius: 16, padding: "28px 24px", position: "relative", boxShadow: p.popular?`0 0 50px ${C.accentGlow}`:"none" }}>
            {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.bg, padding: "3px 12px", borderRadius: 50, fontSize: 10, fontWeight: 700 }}>MÁS POPULAR</div>}
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
            {isAnnual ? (<div>
              <div style={{ fontSize: 14, color: C.dim, textDecoration: "line-through" }}>${p.price}/mes</div>
              <div style={{ fontSize: mob ? 32 : 38, fontWeight: 700, letterSpacing: -1 }}>${monthlyEq}<span style={{ fontSize: 13, fontWeight: 400, color: C.dim }}>/mes</span></div>
              <div style={{ fontSize: 11, color: C.dim }}>${p.annual} facturado anualmente</div>
              <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 8 }}>Ahorras ${savings}/año</div>
            </div>) : (
              <div style={{ fontSize: mob ? 32 : 38, fontWeight: 700, letterSpacing: -1, marginBottom: 8 }}>${p.price}<span style={{ fontSize: 13, fontWeight: 400, color: C.dim }}>/mes</span></div>
            )}
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>{p.desc}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>{p.features.map((f, i) => <div key={i} style={{ fontSize: 12, color: C.dim, display: "flex", alignItems: "center", gap: 6 }}><Check size={12} color={C.accent} strokeWidth={2.5} style={{ flexShrink: 0 }} />{f}</div>)}</div>
            <button onClick={go} style={{ width: "100%", padding: "12px", borderRadius: 12, border: p.popular?"none":`1px solid ${C.border}`, background: p.popular?C.accent:"transparent", color: p.popular?C.bg:C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Empezar gratis</button>
          </div>)})}
        </div>
      </section>

      <section ref={cr} style={sx}><div style={{ display: "grid", gridTemplateColumns: mob?"1fr":"1fr 1fr", gap: 28, alignItems: "start" }}><div><span style={lb}>Calculadora</span><div style={tt}>¿Cuánto gastas respondiendo?</div><p style={{ color: C.dim, fontSize: 14 }}>Mueve los controles y mira el ahorro.</p></div><ROICalc /></div></section>

      <section style={{ ...sx, textAlign: "center", paddingBottom: mob?60:100 }}><div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: mob?"40px 20px":"56px 40px", maxWidth: 560, margin: "0 auto" }}><h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: mob ? 20 : 24, fontWeight: 700, letterSpacing: -0.5, marginBottom: 10 }}>¿Lista para automatizar?</h2><p style={{ color: C.dim, fontSize: 14, marginBottom: 24 }}>7 días gratis, sin compromiso.</p><button onClick={go} style={{ padding: "15px 40px", borderRadius: 50, background: C.accent, color: C.bg, fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Crear mi cuenta gratis</button></div></section>

      <footer style={{ padding: "28px 20px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}><div style={{ marginBottom: 6 }}><Logo size={18} tag /></div><div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Hecho en Ecuador para PYMEs ecuatorianas</div><div style={{ fontSize: 11, display:"flex", justifyContent:"center", gap:6, flexWrap:"wrap" }}><button onClick={function(){setVw("terminos");window.scrollTo(0,0)}} style={{ background:"none", border:"none", color:"#374151", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Términos</button><span style={{ color:"#2A2A2A" }}>·</span><button onClick={function(){setVw("privacidad");window.scrollTo(0,0)}} style={{ background:"none", border:"none", color:"#374151", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Privacidad</button><span style={{ color:"#2A2A2A" }}>·</span><button onClick={function(){setVw("status");window.scrollTo(0,0)}} style={{ background:"none", border:"none", color:"#374151", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Estado</button><span style={{ color:"#2A2A2A" }}>·</span><button onClick={function(){setVw("changelog");window.scrollTo(0,0)}} style={{ background:"none", border:"none", color:"#374151", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Novedades</button></div></footer>
    </div>
  );
}
