import { useState, useEffect, useRef, useCallback } from "react";
import { useInactivityTimeout } from "../hooks/useInactivityTimeout.js";
import { Calendar, CalendarDays, BarChart3, Settings, Check, X, ChevronRight, ChevronLeft, Clock, CircleDot, Smartphone, MessageSquare, Phone, Ban, Loader, ArrowLeft, Shield, Zap, User, LogOut, Lock, Pause, Play, Trash2, AlertTriangle, Wifi, WifiOff, Eye, EyeOff, Save, HelpCircle, Sparkles, Plane, Plus, Briefcase, DollarSign, TrendingUp, ToggleRight, Download, MapPin, Car, Home, Sun, Moon as MoonIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from '../lib/supabase.js';

// ============================================
// CLEO — Dashboard del dueño del negocio
// Mobile-first · Theme system
// ============================================

const THEMES = {
  dark: {
    bg: "#0A0F0A", surface: "#0F1A0F", surface2: "#142014", border: "#1A2E1A",
    text: "#F9FAFB", dim: "#6B7280", accent: "#4ADE80", cyan: "#22D3EE",
    grad: "linear-gradient(100deg, #4ADE80, #22D3EE)",
    accentGlow: "rgba(74,222,128,0.10)", red: "#EF4444", redDark: "#1A0A0A",
    navBg: "rgba(10,15,10,0.92)", iaText: "#6B7280",
  },
  light: {
    bg: "#FAFAFA", surface: "#FFFFFF", surface2: "#F3F4F6", border: "#E5E7EB",
    text: "#111827", dim: "#6B7280", accent: "#16A34A", cyan: "#0891B2",
    grad: "linear-gradient(100deg, #16A34A, #0891B2)",
    accentGlow: "rgba(22,163,74,0.08)", red: "#DC2626", redDark: "#FEF2F2",
    navBg: "rgba(250,250,250,0.92)", iaText: "#9CA3AF",
  },
};

var C = THEMES.dark;

const Logo = ({ size = 18, tag = false }) => (
  <span style={{ display: "inline-flex", flexDirection: "column", alignItems: tag ? "flex-start" : "center", userSelect: "none" }}>
    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -0.8, background: "linear-gradient(100deg,#4ADE80 0%,#22D3EE 50%,#4ADE80 100%)", backgroundSize: "300% 100%", animation: "gradBreathe 2.5s ease-in-out infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>cleo<span style={{ WebkitTextFillColor: "inherit" }}>.</span></span>
    {tag && <span style={{ fontFamily: "monospace", fontSize: Math.max(size * 0.32, 8), letterSpacing: 2.5, color: C.iaText, marginTop: 2 }}>powered by ia</span>}
  </span>
);

// --- Mock Data ---
const BUSINESS = { name: "Glamour Studio", type: "peluqueria" };
const TODAY = new Date();
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getWeekDays() {
  const d = new Date(TODAY); d.setDate(d.getDate() - d.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => { const day = new Date(d); day.setDate(d.getDate() + i); return day; });
}

const MOCK_SERVICES = [
  { id: "s1", name: "Corte de pelo", description: "Incluye lavado y secado", price: 12, duration_minutes: 30, active: true },
  { id: "s2", name: "Uñas acrílicas", description: "Diseño a elección", price: 30, duration_minutes: 45, active: true },
  { id: "s3", name: "Tinte completo", description: "Color + tratamiento", price: 45, duration_minutes: 60, active: true },
  { id: "s4", name: "Manicure básico", description: null, price: 15, duration_minutes: 30, active: true },
  { id: "s5", name: "Pedicure", description: "Incluye exfoliación", price: 20, duration_minutes: 45, active: false },
];

const MOCK_APPOINTMENTS = [
  { id: "1", client_name: "Valentina Ruiz", client_phone: "+593991234567", datetime: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 9, 0), duration_minutes: 45, status: "confirmed", service_id: "s2", service_name: "Uñas acrílicas", service_price: 30, mobile: true, client_coords: { lat: -0.1807, lng: -78.4678 } },
  { id: "2", client_name: "Carolina Mendoza", client_phone: "+593987654321", datetime: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 10, 30), duration_minutes: 30, status: "confirmed", service_id: "s1", service_name: "Corte de pelo", service_price: 12 },
  { id: "3", client_name: "Ana María Torres", client_phone: "+593998765432", datetime: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(), 14, 0), duration_minutes: 60, status: "confirmed", service_id: "s3", service_name: "Tinte completo", service_price: 45, mobile: true, client_address: "Av. 6 de Diciembre N32-45, Quito" },
  { id: "4", client_name: "Lucía Paredes", client_phone: "+593976543210", datetime: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 1, 11, 0), duration_minutes: 30, status: "confirmed", service_id: "s1", service_name: "Corte de pelo", service_price: 12, mobile: true },
  { id: "5", client_name: "María José Herrera", client_phone: "+593965432109", datetime: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 2, 9, 30), duration_minutes: 45, status: "confirmed", service_id: "s2", service_name: "Uñas acrílicas", service_price: 30 },
  { id: "6", client_name: "Daniela Espinoza", client_phone: "+593954321098", datetime: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 2, 15, 0), duration_minutes: 30, status: "confirmed", service_id: "s4", service_name: "Manicure básico", service_price: 15, mobile: true, client_address: "Cumbayá, Vía Interoceánica km 12" },
];

function getApptsByDate(date, appts) {
  return appts.filter(a => a.status === "confirmed" && a.datetime.toDateString() === date.toDateString()).sort((a, b) => a.datetime - b.datetime);
}

const waLink = (phone) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;

const PLANS = [
  { id: "basico", name: "Básico", price: 29, annual: 290, desc: "Para negocios que están arrancando",
    yes: ["IA en WhatsApp responde 24/7", "Agendamiento automático", "Panel de agenda", "Hasta 10 servicios", "500 conversaciones/mes"],
    no: ["Estadísticas e ingresos", "Modo ausencia", "Reportes Excel", "Ubicación y modalidad"],
    note: "Con 500 conversaciones atiendes ~500 clientes distintos al mes. Si superas el límite la IA pausa hasta el siguiente mes — te avisamos al 80%." },
  { id: "negocio", name: "Negocio", price: 59, annual: 590, desc: "Para PYMEs activas", popular: true,
    yes: ["Todo lo del Básico", "Ingresos estimados en dashboard", "Estadísticas completas", "Modo ausencia personalizado", "Ubicación y modalidad", "Hasta 20 servicios", "2,000 conversaciones/mes"],
    no: ["Reportes Excel", "Proyección de ingresos"],
    note: "Con 2,000 conversaciones es suficiente para la mayoría de PYMEs activas. Te notificamos al 80% del límite." },
  { id: "pro", name: "Pro", price: 99, annual: 990, desc: "Para negocios en crecimiento",
    yes: ["Todo lo de Negocio", "Reportes Excel descargables", "Proyección de ingresos", "Servicios ilimitados", "Conversaciones ilimitadas", "Soporte prioritario"],
    no: [],
    note: "Sin límite de conversaciones. Atiende a todos tus clientes sin preocuparte por el contador." },
];
const PLANS_EXPLAINER = "¿Qué es una conversación? Cada vez que un cliente te escribe por WhatsApp se abre una ventana de 24 horas — todo lo que se intercambie en esas 24 horas con ese cliente cuenta como 1 sola conversación, sin importar cuántos mensajes se envíen.";
const PLAN_LABEL = { trial:"Prueba", basico:"Básico", negocio:"Negocio", pro:"Pro ⭐", suspended:"Suspendido", cancelled:"Cancelado" };

const ACENTOS_PLAN = {
  trial:   { accent:"#4ADE80", accentGlow:"rgba(74,222,128,0.10)", grad:"linear-gradient(100deg,#4ADE80,#22D3EE)" },
  basico:  { accent:"#3B82F6", accentGlow:"rgba(59,130,246,0.08)", grad:"linear-gradient(100deg,#3B82F6,#60A5FA)" },
  negocio: { accent:"#4ADE80", accentGlow:"rgba(74,222,128,0.10)", grad:"linear-gradient(100deg,#4ADE80,#22D3EE)" },
  pro:     { accent:"#F59E0B", accentGlow:"rgba(245,158,11,0.10)", grad:"linear-gradient(100deg,#F59E0B,#FCD34D)" },
};

const FAQ_CATS = ["WhatsApp","Citas","Servicios","Planes","IA","Cuenta"];
const FAQ_DATA = [
  {id:1,cat:"WhatsApp",q:"¿Cómo conecto mi WhatsApp Business?",a:"Ve a Ajustes → durante el onboarding verás el botón 'Conectar WhatsApp Business'. Haz clic, se abre una ventana de Meta, selecciona tu número y autoriza con 2 clics. El proceso toma menos de 2 minutos.",kw:["conectar","whatsapp","business","número","vincular","activar"]},
  {id:2,cat:"WhatsApp",q:"¿Mi WhatsApp se desconectó, qué hago?",a:"Si ves un banner rojo 'Tu WhatsApp se desconectó' en el dashboard, toca el botón 'Reconectar'. Si el problema persiste contáctanos en soporte@cleo.app.",kw:["desconectó","desconectado","error","whatsapp","reconectar","problema","no funciona"]},
  {id:3,cat:"WhatsApp",q:"¿Cuántas conversaciones incluye mi plan?",a:"Una conversación es una ventana de 24 horas — todo lo que un cliente te escribe en 24 horas cuenta como 1 sola conversación. Básico: 500/mes. Negocio: 2,000/mes. Pro: ilimitadas.",kw:["conversaciones","límite","mensajes","cuántas","plan"]},
  {id:4,cat:"WhatsApp",q:"¿Qué pasa cuando llego al límite?",a:"Te avisamos al 80%. Al 100% la IA pausa hasta el siguiente mes. Puedes cambiar a un plan mayor para reactivarla de inmediato.",kw:["límite","conversaciones","pausa","80%","100%","se acabaron","agotó"]},
  {id:5,cat:"Citas",q:"¿Cómo agenda citas la IA automáticamente?",a:"Cuando un cliente escribe preguntando por una cita, la IA revisa tus horarios disponibles, ofrece opciones y confirma. La cita aparece automáticamente en tu Agenda.",kw:["agenda","citas","automático","cómo","funciona","reserva"]},
  {id:6,cat:"Citas",q:"¿Cómo cancelo una cita?",a:"Ve a Agenda, busca la cita y toca Cancelar. La IA enviará un mensaje al cliente notificando la cancelación y ofreciendo otros horarios.",kw:["cancelar","cita","eliminar","borrar","cancelación"]},
  {id:7,cat:"Citas",q:"¿Cómo bloqueo un día o horario?",a:"Ve a Agenda → vista Mes → toca el día que quieres bloquear. La IA no agendará citas en días bloqueados.",kw:["bloquear","bloqueo","horario","día","vacaciones","cerrado","feriado"]},
  {id:8,cat:"Citas",q:"¿Puedo ver el teléfono del cliente?",a:"Sí. En cada cita aparece el nombre y número de WhatsApp del cliente. Al tocarlo se abre el chat directo.",kw:["teléfono","número","cliente","contacto","whatsapp","llamar"]},
  {id:9,cat:"Servicios",q:"¿Cómo agrego mis servicios y precios?",a:"Ve al tab Servicios → toca '+' → ingresa nombre, descripción, precio y duración. La IA los usa automáticamente cuando preguntan por precios.",kw:["servicios","precios","agregar","nuevo","crear","precio","costo"]},
  {id:10,cat:"Servicios",q:"¿Cuántos servicios puedo agregar?",a:"Básico: hasta 10. Negocio: hasta 20. Pro: ilimitados.",kw:["cuántos","servicios","límite","máximo","plan"]},
  {id:11,cat:"Servicios",q:"¿Puedo desactivar un servicio sin borrarlo?",a:"Sí. Cada servicio tiene un toggle para activar/desactivar. Los desactivados no aparecen en las respuestas de la IA pero se conservan.",kw:["desactivar","ocultar","pausar","servicio","toggle"]},
  {id:12,cat:"IA",q:"¿Qué pasa si la IA no puede responder?",a:"Le dice al cliente que alguien del equipo le responderá pronto. Si hay error técnico envía mensaje de disculpa y tú recibes alerta por email.",kw:["ia","no responde","error","falla","equivoca","no sabe","problema"]},
  {id:13,cat:"IA",q:"¿Cómo activo el modo ausencia?",a:"Ajustes → Asistente IA → Modo ausencia. Activa el toggle y escribe tu mensaje personalizado.",kw:["ausencia","vacaciones","modo","fuera","no disponible","mensaje"]},
  {id:14,cat:"IA",q:"¿Puedo cambiar el nombre del asistente?",a:"Sí. Ajustes → Asistente IA → Nombre del asistente.",kw:["nombre","asistente","ia","cambiar","personalizar","bot"]},
  {id:15,cat:"IA",q:"¿La IA envía la ubicación a los clientes?",a:"Sí, si configuraste modalidad 'Cliente viene al local'. Al confirmar cita envía tu dirección y link de Google Maps.",kw:["ubicación","dirección","maps","google","local","cómo llegar","mapa"]},
  {id:16,cat:"Planes",q:"¿Cuáles son los planes y precios?",a:"Básico: $29/mes o $290/año. Negocio: $59/mes o $590/año. Pro: $99/mes o $990/año. Todos con 7 días gratis.",kw:["planes","precios","costo","cuánto","mensual","anual","pagar"]},
  {id:17,cat:"Planes",q:"¿Cuál es la diferencia entre mensual y anual?",a:"El anual equivale a 10 meses — recibes 2 meses gratis. Los planes anuales no son reembolsables.",kw:["mensual","anual","diferencia","descuento","meses","gratis","ahorro"]},
  {id:18,cat:"Planes",q:"¿Cómo cambio de plan?",a:"Ajustes → Plan y facturación → Cambiar plan. Puedes subir inmediatamente o bajar al final del período.",kw:["cambiar","plan","upgrade","downgrade","subir","bajar"]},
  {id:19,cat:"Planes",q:"¿Cómo cancelo mi suscripción?",a:"Ajustes → Plan y facturación → Cancelar. Tu acceso continúa hasta el fin del período pagado. 30 días de gracia antes de eliminar datos.",kw:["cancelar","cancelación","baja","suscripción","eliminar"]},
  {id:20,cat:"Planes",q:"¿Puedo pausar mi cuenta?",a:"Sí. Modo ausencia (la IA responde con tu mensaje) o al cancelar puedes pausar 1 mes gratis (una sola vez).",kw:["pausar","pausa","temporal","vacaciones","suspender","desactivar"]},
  {id:21,cat:"Cuenta",q:"¿Cómo cambio mi contraseña?",a:"Ajustes → Cuenta → Cambiar contraseña. Ingresa la actual y la nueva (mín 8 chars, letras, números, símbolo).",kw:["contraseña","password","cambiar","olvidé","nueva"]},
  {id:22,cat:"Cuenta",q:"¿Cómo descargo un reporte?",a:"Tab Estadísticas → botón 'Descargar reporte'. Genera Excel con resumen del mes y detalle de citas.",kw:["reporte","excel","descargar","exportar","informe","estadísticas"]},
  {id:23,cat:"Cuenta",q:"¿Cómo contacto soporte?",a:"Ajustes → Ayuda → Contactar soporte. Describe tu problema y lo enviamos a soporte@cleo.app. Respuesta en menos de 24h.",kw:["soporte","ayuda","contactar","problema","email"]},
  {id:24,cat:"Cuenta",q:"¿Cómo elimino mi cuenta?",a:"Ajustes → Eliminar cuenta. Escribe el nombre de tu negocio y confirma con código de 6 dígitos por email. Irreversible.",kw:["eliminar","borrar","cuenta","darme de baja","cerrar"]},
  {id:25,cat:"Cuenta",q:"¿Qué pasa con mis datos si cancelo?",a:"Se conservan 30 días. Puedes reactivar en ese tiempo. Al día 37 se eliminan permanentemente.",kw:["datos","cancelar","eliminar","qué pasa","conservan","30 días"]},
];

function BillingToggle({ billing, setBilling }) {
  return (
    <div style={{ display:"flex", borderRadius:10, background:C.surface, border:"1px solid "+C.border, padding:3, marginBottom:16 }}>
      <button onClick={function(){setBilling("monthly")}} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", background:billing==="monthly"?C.accent:"transparent", color:billing==="monthly"?C.bg:C.dim, fontSize:13, fontWeight:600, transition:"all 0.2s" }}>Mensual</button>
      <button onClick={function(){setBilling("annual")}} style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", background:billing==="annual"?C.accent:"transparent", color:billing==="annual"?C.bg:C.dim, fontSize:13, fontWeight:600, transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
        {"Anual"} <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:billing==="annual"?"rgba(0,0,0,0.2)":C.accentGlow, color:billing==="annual"?C.bg:C.accent, fontWeight:700 }}>2 meses gratis</span>
      </button>
    </div>
  );
}

function PlanPrice({ plan, billing }) {
  if (billing === "annual") {
    const monthly = (plan.annual / 12).toFixed(2);
    const savings = plan.price * 12 - plan.annual;
    return (
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:11, color:C.dim, textDecoration:"line-through" }}>${plan.price}/mes</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.accent }}>${monthly}<span style={{ fontSize:10, fontWeight:400, color:C.dim }}>/mes</span></div>
        <div style={{ fontSize:10, color:C.dim }}>${plan.annual} al año</div>
        <div style={{ fontSize:10, color:C.accent, fontWeight:600 }}>Ahorras ${savings}/año</div>
      </div>
    );
  }
  return <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:C.accent }}>${plan.price}<span style={{ fontSize:11, fontWeight:400, color:C.dim }}>/mes</span></div>;
}

// Plan feature gating — trial = everything unlocked
const canUse = (plan, feature) => {
  if (plan === "trial") return true; // trial muestra todo para que vean el valor
  const perms = {
    basico:  { stats: false, away: false, excel: false, projection: false, location: false },
    negocio: { stats: true,  away: true,  excel: false, projection: false, location: true },
    pro:     { stats: true,  away: true,  excel: true,  projection: true,  location: true },
  };
  return perms[plan]?.[feature] ?? false;
};

// ============================================
// ANIMATED COUNTER
// ============================================
function LockedBanner({ plan }) {
  const upgrade = plan === "basico" ? "Negocio" : "Pro";
  return (
    <div style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}15`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
      <Lock size={14} color={C.accent} />
      <span style={{ fontSize: 12, color: C.dim, flex: 1 }}>Disponible en plan <span style={{ color: C.accent, fontWeight: 600 }}>{upgrade}</span></span>
    </div>
  );
}

function ClientLocation({ appt, showToast }) {
  if (!appt.mobile) return null;
  const dateStr = appt.datetime.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = appt.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });

  // Case 1: Live coordinates from WhatsApp
  if (appt.client_coords) {
    return (
      <a href={`https://maps.google.com/?q=${appt.client_coords.lat},${appt.client_coords.lng}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.accent, textDecoration: "none", marginTop: 4 }}>
        <MapPin size={10} /> Ver en Google Maps
      </a>
    );
  }

  // Case 2: Text address
  if (appt.client_address) {
    return (
      <a href={`https://maps.google.com/?q=${encodeURIComponent(appt.client_address)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.dim, textDecoration: "none", marginTop: 4 }}>
        <MapPin size={10} color={C.accent} /> <span style={{ borderBottom: `1px dashed ${C.border}` }}>{appt.client_address}</span>
      </a>
    );
  }

  // Case 3: No location
  const msg = encodeURIComponent(`Hola ${appt.client_name}, ¿podrías compartirme tu dirección o ubicación para coordinar tu cita del ${dateStr} a las ${timeStr}?`);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
      <span style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} /> Ubicación no proporcionada</span>
      <a href={`https://wa.me/${appt.client_phone.replace(/[^0-9]/g,"")}?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.accent, textDecoration: "none", padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.accent}30`, fontWeight: 600 }}>Pedir</a>
    </div>
  );
}

function Counter({ target, duration = 1000 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0; const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(timer); } else setVal(start); }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{val}</span>;
}

// ============================================
// APPOINTMENT CARD
// ============================================
function AppointmentStatusBadge({ status, isActive, isNext, isPast }) {
  if (status === "cancelled") return (
    <span style={{ fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:5, background:"rgba(248,113,113,0.12)", color:"#F87171", letterSpacing:"0.05em" }}>CANCELADA</span>
  );
  if (isActive) return (
    <span style={{ fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:5, background:`${C.accent}15`, color:C.accent, letterSpacing:"0.05em", display:"inline-flex", alignItems:"center", gap:4 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:C.accent, display:"inline-block", animation:"pulse 1.5s infinite" }}/>EN CURSO
    </span>
  );
  if (isNext) return (
    <span style={{ fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:5, background:`${C.accent}10`, color:C.accent, letterSpacing:"0.05em" }}>PRÓXIMA</span>
  );
  if (isPast) return (
    <span style={{ fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:5, background:"rgba(107,114,128,0.12)", color:"#6B7280", letterSpacing:"0.05em" }}>COMPLETADA</span>
  );
  return (
    <span style={{ fontSize:9, fontWeight:600, padding:"2px 7px", borderRadius:5, background:`${C.accent}15`, color:C.accent, letterSpacing:"0.05em" }}>CONFIRMADA</span>
  );
}

function ApptCard({ appt, onCancel, onReschedule, isNext }) {
  const [now, setNow] = useState(new Date());

  // Actualizar tiempo cada 30s para estado time-aware
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const endTime    = new Date(appt.datetime.getTime() + appt.duration_minutes * 60000);
  const isActive   = now >= appt.datetime && now <= endTime && appt.status !== "cancelled";
  const isPast     = now > endTime && appt.status !== "cancelled";
  const isCancelled = appt.status === "cancelled";
  const timeStr    = appt.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
  const endStr     = endTime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });

  const borderColor = isCancelled ? `${C.red}25` : isActive ? C.accent : isNext ? `${C.accent}40` : C.border;
  const bgColor     = isCancelled ? `${C.red}05` : isActive ? `${C.accent}06` : isNext ? `${C.accent}04` : C.surface2;
  const opacity     = isPast || isCancelled ? 0.55 : 1;

  return (
    <div style={{ background:bgColor, border:`1.5px solid ${borderColor}`, borderRadius:14, padding:"12px 14px",
      opacity, transition:"all 0.2s", position:"relative", overflow:"hidden" }}
      onMouseEnter={e=>{ if(!isPast&&!isCancelled) e.currentTarget.style.transform="translateY(-1px)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; }}>

      {/* Barra top para activa */}
      {isActive && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.accent}, transparent)` }}/>}
      {isNext && !isActive && <div style={{ position:"absolute", top:0, left:0, right:0, height:1.5, background:`linear-gradient(90deg, ${C.accent}50, transparent)` }}/>}

      <div style={{ display:"flex", gap:10 }}>
        {/* Columna tiempo */}
        <div style={{ width:50, textAlign:"center", flexShrink:0, paddingTop:2 }}>
          <div style={{ fontSize:15, fontWeight:700, color:isActive||isNext?C.accent:isPast?C.dim:C.text }}>{timeStr}</div>
          <div style={{ fontSize:9, color:C.dim, marginTop:1 }}>→ {endStr}</div>
          <div style={{ fontSize:10, color:C.dim, marginTop:2 }}>{appt.duration_minutes}m</div>
        </div>

        {/* Divisor */}
        <div style={{ width:1, background:isActive?`${C.accent}30`:C.border, flexShrink:0, alignSelf:"stretch" }}/>

        {/* Info principal */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Fila 1: nombre + badge + acción */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:6, marginBottom:4 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{appt.client_name}</div>
            <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
              <AppointmentStatusBadge status={appt.status} isActive={isActive} isNext={isNext&&!isActive} isPast={isPast}/>
              {!isCancelled && !isPast && !isActive && (
                <button onClick={()=>onReschedule&&onReschedule(appt)}
                  style={{ background:"none", border:`1px solid ${C.accent}25`, borderRadius:6, cursor:"pointer", color:C.accent, padding:"2px 7px", fontSize:10, fontWeight:500, fontFamily:"inherit", opacity:0.7, transition:"all 0.15s", display:"flex", alignItems:"center", gap:3 }}
                  onMouseEnter={e=>{e.currentTarget.style.opacity="1"; e.currentTarget.style.background=`${C.accent}10`;}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity="0.7"; e.currentTarget.style.background="none";}}>
                  <CalendarDays size={9}/> Reagendar
                </button>
              )}
              {!isCancelled && !isPast && (
                <button onClick={()=>onCancel(appt)}
                  style={{ background:"none", border:`1px solid ${C.red}25`, borderRadius:6, cursor:"pointer", color:C.red, padding:"2px 7px", fontSize:10, fontWeight:500, fontFamily:"inherit", opacity:0.7, transition:"all 0.15s", display:"flex", alignItems:"center", gap:3 }}
                  onMouseEnter={e=>{e.currentTarget.style.opacity="1"; e.currentTarget.style.background=`${C.red}10`;}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity="0.7"; e.currentTarget.style.background="none";}}>
                  <X size={9}/> Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: teléfono */}
          <a href={waLink(appt.client_phone)} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:11, color:C.accent, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3, marginBottom:3 }}>
            <Phone size={10}/> {appt.client_phone}
          </a>

          {/* Fila 3: servicio + precio */}
          {appt.service_name && (
            <div style={{ fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
              <Briefcase size={10} color={C.dim}/>
              <span style={{ color:C.dim }}>{appt.service_name}</span>
              {appt.service_price && <span style={{ color:C.accent, fontWeight:600 }}>· ${appt.service_price}</span>}
            </div>
          )}

          {/* Fila 4: ubicación */}
          <ClientLocation appt={appt}/>
        </div>
      </div>
    </div>
  );
}


// ============================================
// BOTTOM SHEET
// ============================================
function BottomSheet({ open, onClose, title, children, tall }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, transition: "opacity 0.3s" }} />}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
        background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0",
        transform: open ? "translateY(0)" : "translateY(100%)", transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        maxHeight: tall ? "88vh" : "70vh", overflow: "auto", paddingBottom: 30,
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} />
        </div>
        <div style={{ padding: "4px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color={C.dim} /></button>
        </div>
        <div style={{ padding: "0 20px" }}>{children}</div>
      </div>
    </>
  );
}

// ============================================
// CANCEL CONFIRM MODAL
// ============================================
function CancelModal({ appt, onConfirm, onClose }) {
  if (!appt) return null;
  const time    = appt.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
  const dateStr = appt.datetime.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
  const firstName = appt.client_name.split(" ")[0];

  return (
    <>
      {/* Overlay con blur */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.65)",
        backdropFilter:"blur(4px)",
        WebkitBackdropFilter:"blur(4px)",
        animation:"fadeIn 0.2s ease"
      }}/>

      {/* Modal flotante centrado */}
      <div style={{
        position:"fixed", inset:0, zIndex:301,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"20px",
        pointerEvents:"none",
      }}>
        <div style={{
          background:C.bg, border:`1px solid ${C.border}`,
          borderRadius:20, padding:"28px 24px",
          width:"100%", maxWidth:400,
          boxShadow:"0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          pointerEvents:"all",
          animation:"scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)",
        }}>
          {/* Header */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>Cancelar cita</div>
            <div style={{ fontSize:13, color:C.dim }}>Estás a punto de cancelar esta reserva</div>
          </div>

          {/* Card cita */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{appt.client_name}</div>
              <span style={{ fontSize:9, fontWeight:600, padding:"3px 8px", borderRadius:6, background:`${C.accent}15`, color:C.accent, letterSpacing:"0.06em" }}>CONFIRMADA</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.dim }}>
                <Calendar size={11} color={C.dim}/> {dateStr} · {time}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.dim }}>
                <Clock size={11} color={C.dim}/> {appt.duration_minutes} minutos
              </div>
              {appt.service_name && (
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.dim }}>
                  <Briefcase size={11} color={C.dim}/> {appt.service_name}
                  {appt.service_price && <span style={{ color:C.accent, fontWeight:600 }}>· ${appt.service_price}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Mensaje IA */}
          <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"11px 13px", background:`${C.accent}06`, border:`1px solid ${C.accent}18`, borderRadius:12, marginBottom:10 }}>
            <MessageSquare size={13} color={C.accent} style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:C.dim, lineHeight:1.6, margin:0 }}>
              Cleo notificará automáticamente al cliente y sugerirá nuevos horarios disponibles.
            </p>
          </div>

          {/* Warning */}
          <div style={{ display:"flex", gap:8, alignItems:"center", padding:"9px 12px", background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:10, marginBottom:22 }}>
            <AlertTriangle size={12} color="#FBBF24" style={{ flexShrink:0 }}/>
            <span style={{ fontSize:11, color:"#FBBF24", opacity:0.8 }}>Esta acción liberará el espacio en tu agenda.</span>
          </div>

          {/* Botones */}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose}
              style={{ flex:1, padding:"12px 0", borderRadius:12, border:"none", background:C.accent, color:C.bg, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"opacity 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              Mantener cita
            </button>
            <button onClick={()=>onConfirm(appt.id)}
              style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1.5px solid ${C.red}50`, background:"transparent", color:C.red, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background=`${C.red}12`; e.currentTarget.style.boxShadow=`0 0 12px ${C.red}20`; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.boxShadow="none"; }}>
              Cancelar cita
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </>
  );
}


// ============================================
// RESCHEDULE MODAL
// ============================================
function RescheduleModal({ appt, onConfirm, onClose, appointments }) {
  if (!appt) return null;
  const origDate = appt.datetime.toISOString().split("T")[0];
  const origTime = appt.datetime.toLocaleTimeString("es-EC", { hour:"2-digit", minute:"2-digit", hour12:false });
  const [newDate, setNewDate] = useState(origDate);
  const [newTime, setNewTime] = useState(origTime);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const hasChanged = newDate !== origDate || newTime !== origTime;

  // Sugerencias de horarios disponibles basadas en horario de trabajo
  const suggestions = ["09:00","10:00","11:00","14:00","15:00","16:00"].filter(t => {
    if (!newDate) return true;
    const dt = new Date(`${newDate}T${t}:00`);
    return dt > new Date() && t !== origTime;
  }).slice(0,4);

  // Validación disponibilidad real
  const isOccupied = appointments && newDate && newTime && appointments.some(a =>
    a.id !== appt.id &&
    a.status === "confirmed" &&
    a.datetime.toISOString().split("T")[0] === newDate &&
    Math.abs(new Date(`${newDate}T${newTime}:00`) - a.datetime) < (appt.duration_minutes||30)*60000
  );

  // CTA dinámico
  const ctaLabel = (() => {
    if (saving) return "Guardando...";
    if (success) return "✓ Reagendado";
    if (!hasChanged) return "Sin cambios";
    if (!newDate || !newTime) return "Selecciona fecha y hora";
    const d = new Date(`${newDate}T${newTime}:00`);
    const label = d.toLocaleDateString("es-EC",{weekday:"short",day:"numeric",month:"short"});
    return `Mover a ${label} · ${newTime}`;
  })();

  const handleConfirm = async () => {
    if (!newDate||!newTime||!hasChanged||isOccupied) return;
    setSaving(true);
    const datetime = new Date(`${newDate}T${newTime}:00`).toISOString();
    await onConfirm(appt.id, datetime);
    setSuccess(true);
    setTimeout(()=>{ setSaving(false); }, 400);
  };

  const fi = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", animation:"fadeIn 0.2s ease" }}/>
      <div style={{ position:"fixed", inset:0, zIndex:301, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", pointerEvents:"none" }}>
        <div style={{ background:C.bg, border:`1px solid rgba(255,255,255,0.07)`, borderRadius:22, padding:"28px 24px", width:"100%", maxWidth:420, boxShadow:`0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 0 40px ${C.accent}08`, pointerEvents:"all", animation:"scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)", maxHeight:"90vh", overflowY:"auto" }}>

          {/* Header */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>Reagendar cita</div>
            <div style={{ fontSize:12, color:C.dim, opacity:0.7 }}>{appt.client_name} · {appt.service_name}</div>
          </div>

          {/* Comparación ANTES vs DESPUÉS */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
            <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 12px" }}>
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:C.dim, marginBottom:6 }}>Antes</div>
              <div style={{ fontSize:12, fontWeight:600, color:C.dim }}>{appt.datetime.toLocaleDateString("es-EC",{day:"numeric",month:"short"})}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.dim }}>{appt.datetime.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}</div>
            </div>
            <div style={{ background:hasChanged?`${C.accent}06`:"rgba(255,255,255,0.02)", border:`1px solid ${hasChanged?C.accent+"30":C.border}`, borderRadius:12, padding:"10px 12px", transition:"all 0.2s" }}>
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:hasChanged?C.accent:C.dim, marginBottom:6 }}>Después</div>
              <div style={{ fontSize:12, fontWeight:600, color:hasChanged?C.accent:C.dim }}>
                {newDate ? new Date(newDate+"T12:00:00").toLocaleDateString("es-EC",{day:"numeric",month:"short"}) : "—"}
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:hasChanged?C.accent:C.dim }}>{newTime||"—"}</div>
            </div>
          </div>

          {/* Selector fecha — días de la próxima semana */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.dim, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Selecciona el día</div>
            <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none", paddingBottom:4 }}>
              {Array.from({length:14},(_,i)=>{
                const d = new Date(); d.setDate(d.getDate()+i);
                const iso = d.toISOString().split("T")[0];
                const isSelected = newDate===iso;
                const isToday = i===0;
                const dayName = d.toLocaleDateString("es-EC",{weekday:"short"}).replace(".","");
                const dayNum  = d.getDate();
                const month   = d.toLocaleDateString("es-EC",{month:"short"}).replace(".","");
                return (
                  <button key={iso} onClick={()=>setNewDate(iso)}
                    style={{ flexShrink:0, width:52, padding:"10px 0", borderRadius:14, border:`1.5px solid ${isSelected?C.accent:C.border}`,
                      background:isSelected?`${C.accent}12`:"transparent",
                      cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                      boxShadow:isSelected?`0 0 12px ${C.accent}20`:"none" }}>
                    <div style={{ fontSize:9, fontWeight:600, color:isSelected?C.accent:C.dim, textTransform:"uppercase", letterSpacing:"0.05em" }}>{dayName}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:isSelected?C.accent:isToday?C.text:C.dim, lineHeight:1.2, marginTop:2 }}>{dayNum}</div>
                    <div style={{ fontSize:8, color:isSelected?C.accent:C.dim, opacity:0.7 }}>{month}</div>
                    {isToday && !isSelected && <div style={{ width:4,height:4,borderRadius:"50%",background:C.accent,margin:"3px auto 0" }}/>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector hora — botones visuales */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:600, color:C.dim, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Selecciona la hora</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
              {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"].map(t=>{
                const isSel = newTime===t;
                const dt = newDate ? new Date(`${newDate}T${t}:00`) : null;
                const busy = appointments && dt && appointments.some(a=>
                  a.id!==appt.id && a.status==="confirmed" &&
                  Math.abs(dt-a.datetime) < (appt.duration_minutes||30)*60000
                );
                const isPast = dt && dt < new Date();
                const isBest = suggestions[0]===t;
                if(isPast) return null;
                return (
                  <button key={t} onClick={()=>!busy&&setNewTime(t)} disabled={busy}
                    style={{ padding:"9px 0", borderRadius:10, textAlign:"center", cursor:busy?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s",
                      border:`1.5px solid ${isSel?C.accent:isBest&&!busy?C.accent+"40":busy?"transparent":C.border}`,
                      background:isSel?`${C.accent}15`:isBest&&!busy?`${C.accent}05`:"transparent",
                      opacity:busy?0.35:1,
                      boxShadow:isSel?`0 0 10px ${C.accent}20`:isBest&&!busy?`0 0 8px ${C.accent}10`:"none" }}>
                    <div style={{ fontSize:12, fontWeight:isSel||isBest?700:500, color:isSel?C.accent:busy?C.dim:isBest?C.accent:C.text }}>{t}</div>
                    {isBest && !busy && !isSel && <div style={{ fontSize:7, color:C.accent, fontWeight:700, letterSpacing:"0.05em" }}>★ TOP</div>}
                    {busy && <div style={{ fontSize:7, color:C.dim }}>ocupado</div>}
                  </button>
                );
              })}
            </div>

            {/* Indicador de disponibilidad */}
            {newDate && newTime && (
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, marginTop:10, color:isOccupied?"#F87171":C.accent, transition:"all 0.2s" }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:isOccupied?"#F87171":C.accent, boxShadow:isOccupied?"none":`0 0 6px ${C.accent}` }}/>
                {isOccupied ? "⚠ Cercano a otra cita" : "✓ Disponible · Sin conflictos"}
              </div>
            )}
          </div>

          {/* Sugerencias IA */}
          {suggestions.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:C.accent, boxShadow:`0 0 6px ${C.accent}` }}/>
                  <span style={{ fontSize:10, fontWeight:600, color:C.accent, letterSpacing:"0.07em", textTransform:"uppercase" }}>Optimizado por IA</span>
                </div>
                <span style={{ fontSize:10, color:C.dim, opacity:0.6 }}>
                  {isOccupied ? "Evita conflictos en tu agenda" : "Basado en tu disponibilidad"}
                </span>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {suggestions.map((t,i)=>{
                  const isBest = i===0;
                  const isSel  = newTime===t;
                  return (
                    <div key={t} style={{ position:"relative" }}>
                      <button onClick={()=>setNewTime(t)}
                        style={{ padding:"6px 12px", borderRadius:9,
                          border:`1.5px solid ${isSel?C.accent:isBest?C.accent+"50":C.border}`,
                          background:isSel?`${C.accent}15`:isBest?`${C.accent}06`:"transparent",
                          color:isSel?C.accent:isBest?C.accent:C.dim,
                          fontSize:11, fontWeight:isBest?700:600, cursor:"pointer", fontFamily:"inherit",
                          boxShadow:isBest&&!isSel?`0 0 10px ${C.accent}18`:"none",
                          transition:"all 0.18s", display:"flex", alignItems:"center", gap:4 }}>
                        {isBest && <span style={{ fontSize:8, opacity:0.7 }}>★</span>}
                        {t}
                      </button>
                      {isBest && !isSel && (
                        <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", fontSize:8, fontWeight:700, color:C.accent, background:C.bg, padding:"0 4px", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>MEJOR</div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Predicción de calidad */}
              {newTime && (
                <div style={{ marginTop:8, fontSize:10, color:newTime===suggestions[0]?C.accent:C.dim, display:"flex", alignItems:"center", gap:4, transition:"all 0.2s" }}>
                  <Check size={10} color={newTime===suggestions[0]?C.accent:C.dim}/>
                  {newTime===suggestions[0] ? "Horario óptimo · Alta probabilidad de asistencia" : "Horario disponible"}
                </div>
              )}
            </div>
          )}

          {/* Mensaje IA */}
          <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"11px 13px", background:`${C.accent}05`, border:`1px solid ${C.accent}15`, borderRadius:12, marginBottom:20 }}>
            <MessageSquare size={13} color={C.accent} style={{ flexShrink:0, marginTop:1 }}/>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:2 }}>Cleo avisará al cliente</div>
              <p style={{ fontSize:11, color:C.dim, lineHeight:1.5, margin:0 }}>Se enviará una notificación automática por WhatsApp con el nuevo horario confirmado.</p>
            </div>
          </div>

          {/* Botones */}
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <button onClick={onClose}
              style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${C.border}`, background:"transparent", color:C.dim, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.accent+"40"; e.currentTarget.style.color=C.text; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dim; }}>
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={!hasChanged||isOccupied||saving||success}
              style={{ flex:2, padding:"12px 0", borderRadius:12, border:"none", background:hasChanged&&!isOccupied?C.accent:C.border, color:hasChanged&&!isOccupied?C.bg:C.dim, fontSize:12, fontWeight:700, cursor:hasChanged&&!isOccupied?"pointer":"default", fontFamily:"inherit", transition:"all 0.2s", boxShadow:hasChanged&&!isOccupied?`0 4px 16px ${C.accent}25`:"none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}
              onMouseEnter={e=>{ if(hasChanged&&!isOccupied){ e.currentTarget.style.opacity="0.88"; e.currentTarget.style.transform="translateY(-1px)"; }}}
              onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="translateY(0)"; }}>
              {ctaLabel}
            </button>
          </div>
          <div style={{ textAlign:"center", fontSize:10, color:C.dim, opacity:0.35 }}>La cita mantiene el mismo ID y historial.</div>
        </div>
      </div>
    </>
  );
}


// ============================================
// TAB 1: WEEKLY VIEW
// ============================================
function WeeklyView({ appointments, onCancel, onReschedule }) {
  const week = getWeekDays();
  const [selectedDay, setSelectedDay] = useState(TODAY);

  const dayAppts = getApptsByDate(selectedDay, appointments);
  const isToday = (d) => d.toDateString() === TODAY.toDateString();
  const isSelected = (d) => d.toDateString() === selectedDay.toDateString();

  return (
    <div>
      {/* Day selector */}
      <div style={{ display: "flex", gap: 6, padding: "0 4px", marginBottom: 20, overflowX: "auto", scrollbarWidth: "none" }}>
        {week.map((day, i) => {
          const count = getApptsByDate(day, appointments).length;
          const today = isToday(day); const sel = isSelected(day);
          return (
            <button key={i} onClick={() => setSelectedDay(day)} style={{
              flex: "0 0 auto", width: 56, padding: "10px 0", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: sel ? (today ? C.accent : C.surface2) : "transparent",
              transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: sel && today ? C.bg : sel ? C.text : C.dim, marginBottom: 4 }}>{DAY_NAMES[day.getDay()]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: sel && today ? C.bg : sel ? C.text : today ? C.accent : C.text }}>{day.getDate()}</div>
              {count > 0 && <div style={{ width: 18, height: 18, borderRadius: "50%", background: sel && today ? C.bg : `${C.accent}20`, color: sel && today ? C.accent : C.accent, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "4px auto 0" }}>{count}</div>}
              {count === 0 && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.border, margin: "8px auto 0" }} />}
            </button>
          );
        })}
      </div>

      {/* Day label */}
      <div style={{ fontSize: 13, fontWeight: 600, color: C.dim, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={13} />
        {isToday(selectedDay) ? "Hoy" : selectedDay.toLocaleDateString("es-EC", { weekday: "long" })} — {selectedDay.toLocaleDateString("es-EC", { day: "numeric", month: "long" })}
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.accent }}>{dayAppts.length} cita{dayAppts.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Appointments list */}
      {dayAppts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dayAppts.map((a,i) => <ApptCard key={a.id} appt={a} onCancel={onCancel} onReschedule={onReschedule} isNext={i===0&&a.datetime>new Date()} />)}
        </div>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "36px 20px", textAlign: "center" }}>
          <Calendar size={28} color={C.dim} style={{ opacity: 0.4, marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: C.dim }}>Sin citas para este día</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// TAB 2: STATS
// ============================================
function StatsView({ appointments, businessName, plan, showToast }) {
  const confirmed = appointments.filter(a => a.status === "confirmed");
  const weekIncome = confirmed.filter(a => a.service_price).reduce((s, a) => s + a.service_price, 0);
  const monthIncome = Math.round(weekIncome * 4.3);
  const projection = Math.round(monthIncome * 1.12);
  const uniqueClients = [...new Set(confirmed.map(a => a.client_phone))].length;
  const recurring = Math.max(0, uniqueClients - 2);
  const services = {};
  confirmed.forEach(a => { if (a.service_name) services[a.service_name] = (services[a.service_name] || 0) + 1; });
  const topService = Object.entries(services).sort((a, b) => b[1] - a[1])[0];

  const downloadReport = () => {
    try {
      const now = new Date();
      const mesNombre = MONTH_NAMES[now.getMonth()];
      const periodo = `${mesNombre} ${now.getFullYear()}`;

      const resumen = [
        { Campo: "Negocio", Valor: businessName },
        { Campo: "Período", Valor: periodo },
        { Campo: "Ingresos semana", Valor: `$${weekIncome}` },
        { Campo: "Ingresos mes", Valor: `$${monthIncome}` },
        { Campo: "Proyección mes", Valor: `$${projection}` },
        { Campo: "Clientes nuevos", Valor: uniqueClients - recurring },
        { Campo: "Clientes recurrentes", Valor: recurring },
        { Campo: "Servicio más solicitado", Valor: topService ? `${topService[0]} (${topService[1]}x)` : "—" },
        { Campo: "Hora pico", Valor: "7pm – 9pm" },
        { Campo: "Mensajes respondidos", Valor: 47 },
      ];

      const detalle = appointments.map(a => ({
        Fecha: a.datetime.toLocaleDateString("es-EC"),
        Hora: a.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
        Cliente: a.client_name,
        Teléfono: a.client_phone,
        Servicio: a.service_name || "No especificado",
        Precio: a.service_price ? `$${a.service_price}` : "—",
        Estado: a.status === "confirmed" ? "Confirmada" : "Cancelada",
      }));

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(resumen);
      ws1["!cols"] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Resumen");
      const ws2 = XLSX.utils.json_to_sheet(detalle);
      ws2["!cols"] = [{ wch: 12 },{ wch: 8 },{ wch: 22 },{ wch: 16 },{ wch: 18 },{ wch: 8 },{ wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Detalle de citas");

      const slug = businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const mesSlug = `${mesNombre.toLowerCase()}-${now.getFullYear()}`;
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const filename = `cleo-reporte-${slug}-${mesSlug}.xlsx`;

      // Try anchor download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 500);

      if (showToast) showToast("Reporte descargado ✓");
    } catch (err) {
      console.error("Error generando reporte:", err);
      if (showToast) showToast("Error al generar reporte");
    }
  };

  return (
    <div>
      {/* INGRESOS */}
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Ingresos</div>
      {canUse(plan, "stats") ? (<>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 16px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$<Counter target={weekIncome} /></div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Esta semana</div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 16px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$<Counter target={monthIncome} /></div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Este mes</div>
          </div>
        </div>
        {canUse(plan, "projection") ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: C.dim }}>Proyección del mes</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: C.accent, marginTop: 2 }}>$<Counter target={projection} /></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: C.accentGlow }}>
                <TrendingUp size={12} color={C.accent} /><span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>+12%</span>
              </div>
            </div>
          </div>
        ) : <div style={{ marginBottom: 24 }}><LockedBanner plan={plan} /></div>}
      </>) : <div style={{ marginBottom: 24 }}><LockedBanner plan={plan} /></div>}

      {/* ACTIVIDAD */}
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Actividad</div>
      {canUse(plan, "stats") ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topService && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <Briefcase size={16} color={C.accent} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: C.dim }}>Servicio más solicitado</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{topService[0]}</div></div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{topService[1]}x</div>
            </div>
          )}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <Clock size={16} color={C.accent} />
            <div><div style={{ fontSize: 12, color: C.dim }}>Hora pico de mensajes</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>7pm – 9pm</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: C.accent }}><Counter target={uniqueClients - recurring} /></div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Nuevos</div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: C.accent }}><Counter target={recurring} /></div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Recurrentes</div>
            </div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <MessageSquare size={16} color={C.accent} />
            <div><div style={{ fontSize: 12, color: C.dim }}>Mensajes respondidos por IA</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>47 esta semana</div></div>
          </div>
        </div>
      ) : <LockedBanner plan={plan} />}

      {/* Download report */}
      {canUse(plan, "excel") ? (
        <button onClick={downloadReport} style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${C.accent}40`, background: C.accentGlow, color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Download size={16} /> Descargar reporte
        </button>
      ) : <div style={{ marginTop: 20 }}><LockedBanner plan={plan} /></div>}
    </div>
  );
}

// ============================================
// ============================================
// TAB: SERVICES
// ============================================
function ServicesView({ services, setServices, showToast, plan }) {
  const [addModal,   setAddModal]   = useState(false);
  const [delTarget,  setDelTarget]  = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const limits  = { basico:10, negocio:20, pro:Infinity, trial:Infinity };
  const limit   = limits[plan] || Infinity;
  const total   = services.length;
  const active  = services.filter(s=>s.active).length;
  const atLimit = limit !== Infinity && total >= limit;
  const nearLimit = limit !== Infinity && total >= limit - 2 && !atLimit;
  const pct     = limit === Infinity ? 0 : Math.min(100, Math.round((total/limit)*100));
  const card    = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" };
  const fi      = { width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 };

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>Servicios</div>
          <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>La IA usa esta lista para informar precios y agendar</div>
        </div>
        <button onClick={()=>atLimit?showToast(`Límite de ${limit} servicios alcanzado`):setAddModal(true)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10,
            border:`1px solid ${atLimit?C.border:C.accent+"40"}`,
            background:atLimit?"transparent":C.accentGlow,
            color:atLimit?C.dim:C.accent,
            fontSize:12, fontWeight:600, cursor:atLimit?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
          <Plus size={13}/> {atLimit?"Límite alcanzado":"Nuevo servicio"}
        </button>
      </div>

      {/* Barra de uso */}
      {limit !== Infinity && (
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:C.dim }}>{total} de {limit} servicios</span>
            <span style={{ fontSize:12, fontWeight:600, color:atLimit?C.red:nearLimit?"#FBBF24":C.accent }}>
              {atLimit?"Límite alcanzado":nearLimit?`Solo ${limit-total} disponibles`:`${limit-total} restantes`}
            </span>
          </div>
          <div style={{ height:5, background:C.surface2, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, borderRadius:4, transition:"width 0.5s ease",
              background:atLimit?C.red:nearLimit?"#FBBF24":C.accent }}/>
          </div>
        </div>
      )}

      {/* Upgrade banner */}
      {atLimit && plan !== "pro" && (
        <div style={{ ...card, marginBottom:16, border:`1px solid ${C.accent}25`, background:`${C.accent}05` }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>
            {plan==="basico"?"Pasa a Negocio y agrega hasta 20 servicios":"Pasa a Pro y agrega servicios ilimitados"}
          </div>
          <div style={{ fontSize:11, color:C.dim, marginBottom:12 }}>
            {plan==="basico"?"Más servicios = más opciones para tus clientes = más ingresos.":"Sin límites. Escala tu negocio sin restricciones."}
          </div>
          <button onClick={()=>{}} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.accent}40`, background:C.accentGlow, color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Ver planes →
          </button>
        </div>
      )}

      {/* Lista vacía */}
      {services.length===0 ? (
        <div style={{ ...card, padding:"40px 20px", textAlign:"center" }}>
          <Briefcase size={28} color={C.dim} style={{ opacity:0.3, marginBottom:8 }}/>
          <p style={{ fontSize:13, color:C.dim, marginBottom:16 }}>Agrega tu primer servicio</p>
          <button onClick={()=>setAddModal(true)} style={{ padding:"9px 20px", borderRadius:10, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ Crear servicio</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {services.map(s=>(
            <div key={s.id}
              style={{ background:C.surface, border:`1px solid ${s.active?C.border:C.border}`, borderRadius:14, padding:"14px 16px", opacity:s.active?1:0.5, transition:"all 0.2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{s.name}</div>
                  {s.description && <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>{s.description}</div>}
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.accent, flexShrink:0 }}>${s.price}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:C.dim }}>
                  <Clock size={11}/> {s.duration_minutes} min
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {/* Editar */}
                  <button onClick={()=>setEditTarget(s)}
                    style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.accent+"40"; e.currentTarget.style.background=C.accentGlow; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="transparent"; }}>
                    <Save size={11} color={C.dim}/>
                  </button>
                  {/* Eliminar */}
                  <button onClick={()=>setDelTarget(s)}
                    style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.red+"40"; e.currentTarget.style.background=`${C.red}08`; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="transparent"; }}>
                    <Trash2 size={11} color={C.dim}/>
                  </button>
                  {/* Toggle */}
                  <button onClick={()=>{ const u=services.map(x=>x.id===s.id?{...x,active:!x.active}:x); setServices(u); showToast(s.active?"Servicio desactivado":"Servicio activado ✓"); }}
                    style={{ width:36, height:20, borderRadius:10, border:"none", cursor:"pointer", background:s.active?C.accent:"#333", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:s.active?18:2, transition:"left 0.2s" }}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo servicio */}
      <BottomSheet open={addModal} onClose={()=>setAddModal(false)} title="Nuevo servicio">
        {(()=>{
          const [nm,setNm]=useState(""); const [desc,setDesc]=useState(""); const [pr,setPr]=useState(""); const [dur,setDur]=useState(30);
          const canSave = nm.trim()&&pr;
          return (<div>
            <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Nombre del servicio" style={fi}/>
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción (opcional)" style={fi}/>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <div style={{ flex:1, position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:C.dim }}>$</span>
                <input type="number" value={pr} onChange={e=>setPr(e.target.value)} placeholder="0.00" style={{...fi,paddingLeft:28,marginBottom:0}}/>
              </div>
              <select value={dur} onChange={e=>setDur(Number(e.target.value))} style={{...fi,flex:1,marginBottom:0}}>
                {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <button onClick={()=>{ if(!canSave) return; const ns={id:Date.now().toString(),name:nm.trim(),description:desc.trim()||null,price:parseFloat(pr),duration_minutes:dur,active:true}; setServices(p=>[...p,ns]); showToast("Servicio creado ✓"); setAddModal(false); }}
              disabled={!canSave}
              style={{ width:"100%",padding:13,borderRadius:12,border:"none",background:canSave?C.accent:C.border,color:canSave?C.bg:C.dim,fontSize:14,fontWeight:700,cursor:canSave?"pointer":"default",fontFamily:"inherit" }}>
              Crear servicio
            </button>
          </div>);
        })()}
      </BottomSheet>

      {/* Modal editar servicio */}
      {editTarget && (
        <BottomSheet open={!!editTarget} onClose={()=>setEditTarget(null)} title="Editar servicio">
          {(()=>{
            const [nm,setNm]=useState(editTarget.name); const [desc,setDesc]=useState(editTarget.description||""); const [pr,setPr]=useState(String(editTarget.price)); const [dur,setDur]=useState(editTarget.duration_minutes);
            const canSave = nm.trim()&&pr;
            return (<div>
              <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="Nombre" style={fi}/>
              <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción (opcional)" style={fi}/>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ flex:1, position:"relative" }}>
                  <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:C.dim }}>$</span>
                  <input type="number" value={pr} onChange={e=>setPr(e.target.value)} placeholder="0.00" style={{...fi,paddingLeft:28,marginBottom:0}}/>
                </div>
                <select value={dur} onChange={e=>setDur(Number(e.target.value))} style={{...fi,flex:1,marginBottom:0}}>
                  {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <button onClick={()=>{ if(!canSave) return; setServices(p=>p.map(x=>x.id===editTarget.id?{...x,name:nm.trim(),description:desc.trim()||null,price:parseFloat(pr),duration_minutes:dur}:x)); showToast("Servicio actualizado ✓"); setEditTarget(null); }}
                disabled={!canSave}
                style={{ width:"100%",padding:13,borderRadius:12,border:"none",background:canSave?C.accent:C.border,color:canSave?C.bg:C.dim,fontSize:14,fontWeight:700,cursor:canSave?"pointer":"default",fontFamily:"inherit" }}>
                Guardar cambios
              </button>
            </div>);
          })()}
        </BottomSheet>
      )}

      {/* Confirmar eliminar */}
      {delTarget && (
        <>
          <div onClick={()=>setDelTarget(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,backdropFilter:"blur(3px)" }}/>
          <div style={{ position:"fixed",inset:0,zIndex:301,display:"flex",alignItems:"center",justifyContent:"center",padding:20,pointerEvents:"none" }}>
            <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"24px",maxWidth:340,width:"100%",pointerEvents:"all" }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,marginBottom:6 }}>Eliminar servicio</div>
              <p style={{ fontSize:13,color:C.dim,marginBottom:20,lineHeight:1.5 }}>¿Eliminar <strong style={{ color:C.text }}>{delTarget.name}</strong>? La IA ya no lo ofrecerá.</p>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={()=>setDelTarget(null)} style={{ flex:1,padding:12,borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Cancelar</button>
                <button onClick={()=>{ setServices(p=>p.filter(x=>x.id!==delTarget.id)); showToast("Servicio eliminado"); setDelTarget(null); }}
                  style={{ flex:1,padding:12,borderRadius:10,border:"none",background:C.red,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Eliminar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



export default CleoApp;
