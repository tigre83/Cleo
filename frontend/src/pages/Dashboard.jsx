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
function ApptCard({ appt, onCancel, isNext }) {
  const now = new Date();
  const time = appt.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
  const isPast = appt.datetime < now;
  const isConfirmed = appt.status === "confirmed";
  const borderColor = isNext ? C.accent : isPast ? C.border : C.border;
  const bgColor = isNext ? `${C.accent}08` : isPast ? "transparent" : C.surface2;

  return (
    <div style={{ background: bgColor, border: `1.5px solid ${borderColor}`, borderRadius: 14, padding: "12px 14px", opacity: isPast ? 0.6 : 1, transition: "all 0.2s", position: "relative", overflow: "hidden" }}>
      {isNext && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${C.accent}, transparent)` }}/>}
      <div style={{ display: "flex", gap: 10 }}>
        {/* Tiempo */}
        <div style={{ width: 48, textAlign: "center", flexShrink: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: isNext ? C.accent : C.text }}>{time}</div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{appt.duration_minutes}m</div>
          {isNext && <div style={{ fontSize: 9, fontWeight: 600, color: C.accent, marginTop: 3, letterSpacing: "0.05em" }}>PRÓXIMA</div>}
        </div>
        <div style={{ width: 1, background: isNext ? `${C.accent}30` : C.border, flexShrink: 0, alignSelf: "stretch" }} />
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client_name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: isConfirmed ? `${C.accent}15` : `${C.dim}15`, color: isConfirmed ? C.accent : C.dim, letterSpacing: "0.05em" }}>
                {isConfirmed ? "CONFIRMADA" : "PENDIENTE"}
              </span>
              <button onClick={() => onCancel(appt)} style={{ background: "none", border: "none", cursor: "pointer", color: C.dim, padding: 3, opacity: 0.6, display: "flex", alignItems: "center" }} title="Cancelar cita">
                <X size={13}/>
              </button>
            </div>
          </div>
          <a href={waLink(appt.client_phone)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
            <Phone size={10} /> {appt.client_phone}
          </a>
          <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
            <Briefcase size={10} color={C.dim} />
            {appt.service_name
              ? <><span style={{ color: C.dim }}>{appt.service_name}</span><span style={{ color: C.accent, fontWeight: 600, marginLeft: 4 }}>· ${appt.service_price}</span></>
              : <span style={{ color: C.dim, opacity: 0.5 }}>Servicio no especificado</span>}
          </div>
          <ClientLocation appt={appt} />
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
  const time = appt.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
  const dateStr = appt.datetime.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
  return (
    <BottomSheet open={!!appt} onClose={onClose} title="Cancelar cita">
      <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}20`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{appt.client_name}</div>
        <div style={{ fontSize: 13, color: C.dim, marginTop: 4 }}>{dateStr} a las {time} · {appt.duration_minutes} min</div>
      </div>
      <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginBottom: 16 }}>
        Al cancelar, Cleo enviará un mensaje automático por WhatsApp a {appt.client_name.split(" ")[0]} ofreciendo horarios alternativos.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>No cancelar</button>
        <button onClick={() => onConfirm(appt.id)} style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: C.red, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar cita</button>
      </div>
    </BottomSheet>
  );
}

// ============================================
// TAB 1: WEEKLY VIEW
// ============================================
function WeeklyView({ appointments, onCancel }) {
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
          {dayAppts.map((a,i) => <ApptCard key={a.id} appt={a} onCancel={onCancel} isNext={i===0&&a.datetime>new Date()} />)}
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
  const [addModal, setAddModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const limits = { basico: 10, negocio: 20, pro: Infinity, trial: Infinity };
  const limit = limits[plan] || Infinity;
  const total = services.length;
  const atLimit = limit !== Infinity && total >= limit;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700 }}>Servicios</div>
        <div style={{ fontSize: 12, color: atLimit ? C.accent : C.dim, fontWeight: atLimit ? 600 : 400 }}>
          {limit !== Infinity ? `${total} de ${limit}` : `${total} · Ilimitado`}
        </div>
      </div>
      <p style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>La IA usa esta lista para informar precios y agendar{limit !== Infinity ? ". Elimina un servicio para liberar espacio." : ""}</p>

      {services.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "36px 20px", textAlign: "center" }}>
          <Briefcase size={28} color={C.dim} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: C.dim }}>Agrega tu primer servicio</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {services.map(s => (
            <div key={s.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", opacity: s.active ? 1 : 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  {s.description && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{s.description}</div>}
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, color: C.accent, flexShrink: 0 }}>${s.price}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.dim }}><Clock size={11} /> {s.duration_minutes} min</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => { const updated = services.map(x => x.id === s.id ? {...x, active: !x.active} : x); setServices(updated); showToast(s.active ? "Servicio desactivado" : "Servicio activado ✓"); }} style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", background: s.active ? C.accent : "#333", position: "relative" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: s.active ? 18 : 2, transition: "left 0.2s" }} />
                  </button>
                  <button onClick={() => setDelTarget(s)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Trash2 size={12} color={C.dim} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => atLimit ? showToast(`Límite de ${limit} servicios. Elimina uno para agregar.`) : setAddModal(true)} style={{ position: "fixed", bottom: 80, right: 20, width: 52, height: 52, borderRadius: "50%", background: atLimit ? "#333" : C.accent, border: "none", color: atLimit ? C.dim : C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: atLimit ? "none" : `0 4px 20px ${C.accentGlow}`, zIndex: 90 }}><Plus size={22} /></button>

      {/* Add service modal */}
      <BottomSheet open={addModal} onClose={() => setAddModal(false)} title="Nuevo servicio">
        {(() => {
          const [nm, setNm] = useState(""); const [desc, setDesc] = useState(""); const [pr, setPr] = useState(""); const [dur, setDur] = useState(30);
          const fld = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 };
          const canSave = nm.trim() && pr;
          return (<div>
            <input value={nm} onChange={e => setNm(e.target.value)} placeholder="Nombre del servicio" style={fld} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)" style={fld} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.dim }}>$</span>
                <input type="number" value={pr} onChange={e => setPr(e.target.value)} placeholder="0.00" style={{ ...fld, paddingLeft: 28, marginBottom: 0 }} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <input type="number" value={dur} onChange={e => setDur(parseInt(e.target.value) || 30)} style={{ ...fld, marginBottom: 0 }} />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.dim }}>min</span>
              </div>
            </div>
            <button onClick={() => { setServices(prev => [...prev, { id: `s${Date.now()}`, name: nm, description: desc || null, price: parseFloat(pr), duration_minutes: dur, active: true }]); setAddModal(false); showToast("Servicio agregado ✓"); }} disabled={!canSave} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: canSave ? C.accent : C.border, color: canSave ? C.bg : C.dim, fontSize: 14, fontWeight: 600, cursor: canSave ? "pointer" : "default", fontFamily: "inherit" }}>Guardar servicio</button>
          </div>);
        })()}
      </BottomSheet>

      {/* Delete confirmation */}
      <BottomSheet open={!!delTarget} onClose={() => setDelTarget(null)} title="Eliminar servicio">
        {delTarget && (<div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{delTarget.name}</div>
            {delTarget.description && <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{delTarget.description}</div>}
            <div style={{ fontSize: 13, color: C.accent, fontWeight: 600, marginTop: 6 }}>${delTarget.price} · {delTarget.duration_minutes} min</div>
          </div>
          <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginBottom: 16 }}>¿Eliminar este servicio? Las citas existentes no se afectan.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setDelTarget(null)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>No eliminar</button>
            <button onClick={() => { setServices(prev => prev.filter(x => x.id !== delTarget.id)); setDelTarget(null); showToast("Servicio eliminado"); }} style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: C.red, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Eliminar</button>
          </div>
        </div>)}
      </BottomSheet>
    </div>
  );
}

// ============================================
// TAB 3: CALENDAR VIEW
// ============================================
function CalendarView({ appointments, blocked, onCancel, onBlock }) {
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const dayRefs = useRef({});

  const yr = month.getFullYear(), mo = month.getMonth();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const firstDow = new Date(yr, mo, 1).getDay();
  const blanks = (firstDow + 6) % 7;

  const dateStr = (day) => `${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const hasAppt = (day) => appointments.some(a => a.status === "confirmed" && a.datetime.getDate() === day && a.datetime.getMonth() === mo && a.datetime.getFullYear() === yr);
  const isBlocked = (day) => blocked.some(b => b.date === dateStr(day));
  const isToday = (day) => day === TODAY.getDate() && mo === TODAY.getMonth() && yr === TODAY.getFullYear();
  const isPast = (day) => new Date(yr, mo, day) < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  // All month appointments grouped by day
  const monthAppts = appointments.filter(a => a.status === "confirmed" && a.datetime.getMonth() === mo && a.datetime.getFullYear() === yr).sort((a, b) => a.datetime - b.datetime);
  const cancelledCount = appointments.filter(a => a.status === "cancelled" && a.datetime.getMonth() === mo).length;
  const blockedCount = blocked.filter(b => b.date.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`)).length;

  // Group by day
  const grouped = {};
  monthAppts.forEach(a => {
    const day = a.datetime.getDate();
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(a);
  });
  const sortedDays = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const scrollToDay = (day) => {
    const el = dayRefs.current[day];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* Month summary */}
      <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>
        {monthAppts.length} cita{monthAppts.length !== 1 ? "s" : ""} este mes · {cancelledCount} cancelada{cancelledCount !== 1 ? "s" : ""} · {blockedCount} día{blockedCount !== 1 ? "s" : ""} bloqueado{blockedCount !== 1 ? "s" : ""}
      </div>

      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setMonth(new Date(yr, mo - 1, 1))} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronLeft size={16} color={C.dim} /></button>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>{MONTH_NAMES[mo]} {yr}</div>
        <button onClick={() => setMonth(new Date(yr, mo + 1, 1))} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronRight size={16} color={C.dim} /></button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {["L","M","X","J","V","S","D"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.dim, padding: "4px 0" }}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 24 }}>
        {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1; const today = isToday(day); const blk = isBlocked(day); const has = hasAppt(day); const past = isPast(day);
          return (
            <button key={day} onClick={() => has ? scrollToDay(day) : null} style={{
              padding: "7px 0", borderRadius: 10, border: "none", cursor: has ? "pointer" : "default", fontFamily: "inherit",
              background: today ? `${C.accent}15` : blk ? C.redDark : "transparent", position: "relative",
              opacity: past && !today ? 0.35 : 1,
            }}>
              <div style={{ fontSize: 13, fontWeight: today ? 700 : 500, color: blk ? `${C.red}80` : today ? C.accent : C.text, textDecoration: blk ? "line-through" : "none" }}>{day}</div>
              {has && !blk && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, margin: "2px auto 0" }} />}
              {blk && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.red, margin: "2px auto 0", opacity: 0.5 }} />}
            </button>
          );
        })}
      </div>

      {/* Appointment list by day */}
      {sortedDays.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sortedDays.map(day => {
            const dayDate = new Date(yr, mo, day);
            const label = isToday(day) ? "Hoy" : dayDate.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "short" });
            return (
              <div key={day} ref={el => dayRefs.current[day] = el}>
                {/* Day header */}
                <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, padding: "12px 0 6px", textTransform: "capitalize", display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={12} /> {label}
                  <span style={{ color: C.dim, fontWeight: 400 }}>· {grouped[day].length} cita{grouped[day].length !== 1 ? "s" : ""}</span>
                </div>
                {/* Appointments */}
                {grouped[day].map(a => {
                  const time = a.datetime.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{time}</div>
                          <div style={{ fontSize: 10, color: C.dim }}>{a.duration_minutes} min</div>
                        </div>
                        <div style={{ width: 1, height: 42, background: C.border, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.client_name}</div>
                            <button onClick={() => onCancel(a)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.red}25`, background: `${C.red}08`, color: C.red, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}><X size={10} /> Cancelar cita</button>
                          </div>
                          <a href={waLink(a.client_phone)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <Phone size={10} /> {a.client_phone}
                          </a>
                          <div style={{ fontSize: 12, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                            <Briefcase size={10} color={C.dim} />
                            {a.service_name ? (
                              <><span style={{ color: C.dim }}>{a.service_name}</span> <span style={{ color: C.accent, fontWeight: 600 }}>· ${a.service_price}</span></>
                            ) : (
                              <span style={{ color: "#555" }}>Servicio no especificado</span>
                            )}
                          </div>
                          <ClientLocation appt={a} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "30px 0", color: C.dim }}>
          <Calendar size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ fontSize: 13 }}>Sin citas este mes</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// BLOCK CONFIRM
// ============================================
function BlockConfirm({ day, month, onConfirm, onClose }) {
  if (!day) return null;
  const dateStr = new Date(month.getFullYear(), month.getMonth(), day).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
  return (
    <BottomSheet open={!!day} onClose={onClose} title="Bloquear día">
      <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}20`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>¿Bloquear el <strong>{dateStr}</strong>? La IA no agendará citas ese día.</p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
        <button onClick={() => onConfirm(day)} style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: C.red, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Bloquear</button>
      </div>
    </BottomSheet>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================
// ============================================
// LOGIN PAGE
// ============================================
function LoginPage({ onLogin }) {
  const API = import.meta.env.VITE_API_URL;
  const [view,    setView]    = useState("login");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [code,    setCode]    = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confPw,  setConfPw]  = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [err,     setErr]     = useState("");

  const fi = { width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid "+C.border, background:C.surface, color:C.text, fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:12 };

  const pwChecks = [
    { l:"Mínimo 8 caracteres",  ok: newPw.length >= 8 },
    { l:"Letras y números",     ok: /[a-zA-Z]/.test(newPw) && /[0-9]/.test(newPw) },
    { l:"Un símbolo (!@#$%)",   ok: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(newPw) },
  ];
  const pwOk = pwChecks.every(c => c.ok) && newPw === confPw;

  const handleLogin = async () => {
    if (!email || !pw) { setErr("Completa todos los campos"); return; }
    setLoading(true); setErr("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) { setErr("Email o contraseña incorrectos"); setLoading(false); return; }
      onLogin(email);
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  const sendResetCode = async () => {
    if (!email) { setErr("Escribe tu email"); return; }
    setLoading(true); setErr(""); setMsg("");
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email }),
      });
      setView("code"); setMsg("Código enviado a "+email);
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!code || !pwOk) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/auth/reset-password-with-code`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email, code, new_password:newPw }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error||"Código inválido"); setLoading(false); return; }
      setView("login"); setMsg("Contraseña actualizada. Ya puedes entrar."); setCode(""); setNewPw(""); setConfPw("");
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:C.bg, color:C.text, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}><Logo size={32} tag /></div>

        {view==="login" && <>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={fi}/>
          <div style={{ position:"relative" }}>
            <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} placeholder="Contraseña"
              style={{...fi, paddingRight:48}} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            <button onClick={()=>setShowPw(!showPw)} style={{ position:"absolute",right:14,top:14,background:"none",border:"none",cursor:"pointer",color:C.dim }}>
              {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
          {err&&<div style={{ fontSize:12,color:"#EF4444",marginBottom:12,textAlign:"center" }}>{err}</div>}
          {msg&&<div style={{ fontSize:12,color:C.accent,marginBottom:12,textAlign:"center" }}>{msg}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width:"100%",padding:15,borderRadius:12,border:"none",background:loading?C.border:C.accent,color:loading?C.dim:C.bg,fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",fontFamily:"inherit",marginBottom:16 }}>
            {loading?"Entrando...":"Entrar"}
          </button>
          <button onClick={()=>{setView("forgot");setErr("");setMsg("");}}
            style={{ background:"none",border:"none",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"block",width:"100%",textAlign:"center",marginBottom:12 }}>
            ¿Olvidaste tu contraseña?
          </button>
          <div style={{ fontSize:13,color:C.dim,textAlign:"center" }}>
            ¿No tienes cuenta?{" "}
            <button onClick={()=>window.location.href="/"} style={{ background:"none",border:"none",color:C.accent,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
              Regístrate gratis
            </button>
          </div>
        </>}

        {view==="forgot" && <>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:8,textAlign:"center" }}>Recuperar contraseña</h2>
          <p style={{ fontSize:13,color:C.dim,marginBottom:20,textAlign:"center" }}>Te enviaremos un código de 6 caracteres.</p>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Tu email" type="email" style={fi}/>
          {err&&<div style={{ fontSize:12,color:"#EF4444",marginBottom:12 }}>{err}</div>}
          <button onClick={sendResetCode} disabled={loading}
            style={{ width:"100%",padding:15,borderRadius:12,border:"none",background:C.accent,color:C.bg,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:12 }}>
            {loading?"Enviando...":"Enviar código"}
          </button>
          <button onClick={()=>{setView("login");setErr("");}}
            style={{ background:"none",border:"none",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"block",width:"100%",textAlign:"center" }}>
            Volver al login
          </button>
        </>}

        {view==="code" && <>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:4,textAlign:"center" }}>Nueva contraseña</h2>
          {msg&&<div style={{ fontSize:12,color:C.accent,marginBottom:16,textAlign:"center" }}>{msg}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:12 }}>
            {[0,1,2,3,4,5].map(i=>(
              <input key={i} id={`rc${i}`}
                value={code[i]||""}
                onChange={e=>{
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(-1);
                  const arr = (code+"      ").split("").slice(0,6);
                  arr[i] = v;
                  setCode(arr.join("").trimEnd());
                  if (v && i<5) document.getElementById(`rc${i+1}`)?.focus();
                }}
                onKeyDown={e=>{
                  if (e.key==="Backspace" && !code[i] && i>0) document.getElementById(`rc${i-1}`)?.focus();
                }}
                maxLength={1}
                style={{ width:44,height:52,textAlign:"center",fontSize:22,fontWeight:700,fontFamily:"monospace",
                  borderRadius:10,border:"1.5px solid "+(code[i]?C.accent:C.border),
                  background:C.surface,color:C.text,outline:"none",
                  boxShadow:code[i]?"0 0 8px "+C.accent+"40":"none",
                  transition:"all 0.15s" }}
              />
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <input value={newPw} onChange={e=>setNewPw(e.target.value)} type={showNew?"text":"password"} placeholder="Nueva contraseña"
              style={{...fi,paddingRight:48}}/>
            <button onClick={()=>setShowNew(!showNew)} style={{ position:"absolute",right:14,top:14,background:"none",border:"none",cursor:"pointer",color:C.dim }}>
              {showNew?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
          {newPw&&<div style={{ marginBottom:10 }}>
            {pwChecks.map((ch,i)=>(
              <div key={i} style={{ fontSize:12,color:ch.ok?C.accent:C.dim,display:"flex",alignItems:"center",gap:6,padding:"2px 0" }}>
                <div style={{ width:14,height:14,borderRadius:"50%",border:"1.5px solid "+(ch.ok?C.accent:C.border),background:ch.ok?C.accent+"18":"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  {ch.ok&&<Check size={8} color={C.accent} strokeWidth={3}/>}
                </div>{ch.l}
              </div>
            ))}
          </div>}
          <input value={confPw} onChange={e=>setConfPw(e.target.value)} type="password" placeholder="Confirmar contraseña" style={fi}/>
          {confPw&&newPw!==confPw&&<div style={{ fontSize:12,color:C.dim,marginBottom:8 }}>Las contraseñas no coinciden</div>}
          {err&&<div style={{ fontSize:12,color:"#EF4444",marginBottom:12 }}>{err}</div>}
          <button onClick={resetPassword} disabled={!code||!pwOk||loading}
            style={{ width:"100%",padding:15,borderRadius:12,border:"none",background:code&&pwOk?C.accent:C.border,color:code&&pwOk?C.bg:C.dim,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:12 }}>
            {loading?"Guardando...":"Cambiar contraseña"}
          </button>
          <button onClick={()=>{setView("forgot");setErr("");}}
            style={{ background:"none",border:"none",color:C.dim,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"block",width:"100%",textAlign:"center" }}>
            Reenviar código
          </button>
        </>}
      </div>
    </div>
  );
}
// ============================================
// MAIN DASHBOARD
// ============================================
export default function CleoDashboard() {
  const [theme, setTheme] = useState("system");
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  C = THEMES[resolved];
  const [, forceUpdate] = useState(0);
  const cycleTheme = () => { setTheme(t => t === "dark" ? "light" : t === "light" ? "system" : "dark"); forceUpdate(n => n+1); };

  const [authed, setAuthed] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tab, setTab] = useState("agenda");
  const [agendaView, setAgendaView] = useState("semana"); // dia | semana | mes
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [services, setServices] = useState(MOCK_SERVICES);
  const [blocked, setBlocked] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [blockTarget, setBlockTarget] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [cfgTab,    setCfgTab]    = useState("negocio");
  const [dirMain,   setDirMain]   = useState("");
  const [dirNum,    setDirNum]    = useState("");
  const [dirCross,  setDirCross]  = useState("");
  const [dirSaved,  setDirSaved]  = useState(false);
  const [dirSaving, setDirSaving] = useState(false);
  const [rucCi,     setRucCi]     = useState("");

  const saveDir = async () => {
    if (!dirMain) return;
    setDirSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const API = import.meta.env.VITE_API_URL;
      await fetch(`${API}/api/business/me`, {
        method:"PUT",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body:JSON.stringify({ street_main:dirMain, street_number:dirNum, street_cross:dirCross }),
      });
      setBiz({...biz, street_main:dirMain, street_number:dirNum, street_cross:dirCross});
      setDirSaved(true);
      showToast("Dirección guardada ✓");
    } catch { showToast("Error al guardar"); }
    setDirSaving(false);
  };
  const [away, setAway] = useState({ active: false, message: "", improving: false });
  const [toast, setToast] = useState("");
  const [passwordModal, setPasswordModal] = useState(false);
  const [awayModal, setAwayModal] = useState(false);
  const [plansModal, setPlansModal] = useState(false);
  const [billingView, setBillingView] = useState("monthly");
  const [retentionModal, setRetentionModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [biz, setBiz] = useState({
    name: BUSINESS.name, type: "peluqueria", assistant_name: "Asistente de Glamour Studio",
    email: "glamour@email.com", plan: "negocio", trial_days: 0, wa_connected: true,
    duration: 30, logo: null, customDuration: false,
    modality: "local", business_address: "", location_url: "",
    pause_used: false, pending_downgrade: null,
    billing_cycle: "monthly", plan_started_at: "2026-03-28", plan_renews_at: "2026-04-28", cancel_at_period_end: false,
    schedule: { lunes: { active: true, open: "09:00", close: "18:00" }, martes: { active: true, open: "09:00", close: "18:00" }, miercoles: { active: true, open: "09:00", close: "18:00" }, jueves: { active: true, open: "09:00", close: "18:00" }, viernes: { active: true, open: "09:00", close: "18:00" }, sabado: { active: true, open: "09:00", close: "14:00" }, domingo: { active: false, open: "00:00", close: "00:00" } },
  });
  const logoInputRef = useRef(null);
  const _pa = ACENTOS_PLAN[biz?.plan] || ACENTOS_PLAN.negocio;
  C = { ...C, accent: _pa.accent, accentGlow: _pa.accentGlow, grad: _pa.grad };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  useEffect(() => {
    document.title = "Cleo — Dashboard";
    const fav = document.createElement("link"); fav.rel="icon"; fav.href="https://cleo.app/favicon.ico"; document.head.appendChild(fav);
    const manifest = document.createElement("link"); manifest.rel="manifest"; manifest.href="https://cleo.app/manifest.json"; document.head.appendChild(manifest);
    const theme = document.createElement("meta"); theme.name="theme-color"; theme.content="#4ADE80"; document.head.appendChild(theme);
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes gradBreathe{0%{background-position:0% 50%;filter:brightness(1)}50%{background-position:100% 50%;filter:brightness(1.2)}100%{background-position:0% 50%;filter:brightness(1)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes fadeCheck{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}*{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;width:100%;max-width:100vw}html{scroll-behavior:smooth}::selection{background:${C.accent}30}::-webkit-scrollbar{display:none}`;
    document.head.appendChild(s); return () => document.head.removeChild(s);
  }, []);

  const handleCancel = (id) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    setCancelTarget(null);
  };

  const handleBlock = (day) => {
    const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setBlocked(prev => [...prev, { date: dateStr }]);
    setBlockTarget(null);
  };

  const weekAppts = appointments.filter(a => a.status === "confirmed");
  const hasAnyAppts = weekAppts.length > 0;
  const initial = BUSINESS.name.charAt(0).toUpperCase();

  const tabs = [
    { id: "agenda", label: "Agenda", Icon: Calendar },
    { id: "services", label: "Servicios", Icon: Briefcase },
    { id: "stats", label: "Estadísticas", Icon: BarChart3 },
    { id: "config", label: "Ajustes", Icon: Settings },
  ];

  const mob = typeof window !== 'undefined' && window.innerWidth < 768;
  const handleLogout = () => { setAuthed(false); setTab("agenda"); setSessionExpired(false); };

  useInactivityTimeout(8 * 60 * 60 * 1000, () => {
    if (authed) { setAuthed(false); setTab("agenda"); setSessionExpired(true); }
  });

  // Cierre automático por inactividad — 8 horas
  useInactivityTimeout(8 * 60 * 60 * 1000, () => {
    if (authed) {
      setAuthed(false);
      setTab("agenda");
    }
  });

  const trialExpired = biz.plan === "trial" && biz.trial_days <= 0;

  const showDash = authed && !trialExpired;

  return (
    <div style={{ overflowX:"hidden", width:"100%", maxWidth:"100vw" }}>
    {sessionExpired && (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20 }}>
        <div style={{ background:C.surface,border:"1px solid "+C.border,borderRadius:16,padding:36,maxWidth:360,width:"100%",textAlign:"center",fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{ width:56,height:56,borderRadius:"50%",background:C.accentGlow,border:"1px solid "+C.accent+"30",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
            <Shield size={24} color={C.accent}/>
          </div>
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.text,marginBottom:8 }}>Sesión cerrada</h3>
          <p style={{ fontSize:13,color:C.dim,marginBottom:24,lineHeight:1.6 }}>Tu sesión fue cerrada por inactividad. Inicia sesión nuevamente para continuar.</p>
          <button onClick={()=>setSessionExpired(false)}
            style={{ width:"100%",padding:14,borderRadius:12,border:"none",background:C.accent,color:C.bg,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            <LogOut size={16}/> Iniciar sesión
          </button>
        </div>
      </div>
    )}

    {logoutModal && (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20 }}>
        <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:32,maxWidth:340,width:"100%",textAlign:"center" }}>
          <LogOut size={28} color={C.accent} style={{ marginBottom:12 }}/>
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:8,color:C.text }}>¿Cerrar sesión?</h3>
          <p style={{ fontSize:13,color:C.dim,marginBottom:24,lineHeight:1.5 }}>Tu sesión se cerrará y tendrás que volver a ingresar.</p>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>{ setLogoutModal(false); handleLogout(); }} style={{ flex:1,padding:12,borderRadius:10,border:"none",background:C.accent,color:C.bg,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Sí</button>
            <button onClick={()=>setLogoutModal(false)} style={{ flex:1,padding:12,borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.dim,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>No</button>
          </div>
        </div>
      </div>
    )}
    {!authed && <LoginPage onLogin={function(e){ if(e){ setAuthed(true); }}} />}
    {authed && trialExpired && (
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: C.bg, color: C.text, minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Logo size={28} tag />
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>Tu prueba gratuita terminó</h1>
        <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, maxWidth: 340, margin: "0 auto 16px" }}>
          Durante tu prueba Cleo respondió <span style={{ color: C.accent, fontWeight: 600 }}>47 mensajes</span> y agendó <span style={{ color: C.accent, fontWeight: 600 }}>6 citas</span> en {biz.name}.
        </p>
        <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, maxWidth: 360, margin: "0 auto" }}>{PLANS_EXPLAINER}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <BillingToggle billing={billingView} setBilling={setBillingView} />
        {billingView === "annual" && <p style={{ fontSize:10, color:C.dim, textAlign:"center", marginTop:-10, marginBottom:8 }}>Los planes anuales no son reembolsables. Puedes cancelar cuando quieras y tu acceso continúa hasta el fin del período pagado.</p>}
        {PLANS.map(p => (
          <div key={p.id} style={{ background: C.surface, border: `1px solid ${p.popular ? C.accent : C.border}`, borderRadius: 14, padding: "18px 16px", position: "relative" }}>
            {p.popular && <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.bg, padding: "2px 10px", borderRadius: 50, fontSize: 10, fontWeight: 700 }}>RECOMENDADO</div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div><div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: C.dim }}>{p.desc}</div></div>
              <PlanPrice plan={p} billing={billingView} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
              {p.yes.map((f, i) => <div key={i} style={{ fontSize: 11, color: C.text, display: "flex", alignItems: "center", gap: 5 }}><Check size={10} color={C.accent} />{f}</div>)}
              {p.no.map((f, i) => <div key={`n${i}`} style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5 }}><X size={10} color="#444" />{f}</div>)}
            </div>
            <p style={{ fontSize: 10, color: C.dim, lineHeight: 1.4, marginBottom: 12 }}>{p.note}</p>
            <button onClick={() => { setBiz({...biz, plan: p.id, billing_cycle: billingView, trial_days: -1}); }} style={{ width: "100%", padding: 12, borderRadius: 10, border: p.popular ? "none" : `1px solid ${C.border}`, background: p.popular ? C.accent : "transparent", color: p.popular ? C.bg : C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Elegir plan</button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: C.dim, marginTop: 16, textAlign: "center" }}>Tus datos se conservan 30 días. Después se eliminan.</p>
    </div>
    )}
    <div style={{ fontFamily: "'DM Sans',system-ui,sans-serif", background: C.bg, color: C.text, minHeight: "100vh", paddingBottom: mob ? 80 : 0, display: showDash ? (mob ? "block" : "flex") : "none", overflowX: "hidden" }}>

      {/* SIDEBAR desktop */}
      {!mob && <div style={{ width:220, flexShrink:0, height:"100vh", position:"sticky", top:0, background:C.bg, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"20px 12px", zIndex:50 }}>
        <div style={{ padding:"4px 8px 16px", borderBottom:`1px solid ${C.border}`, marginBottom:14 }}>
          <Logo size={18} tag />
          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:away.active?C.dim:C.accent, marginTop:6 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:away.active?C.dim:C.accent,animation:away.active?"none":"pulse 2s infinite" }}/>
            {away.active?"Modo ausencia":"IA activa"}
          </div>
        </div>
        <div style={{ flex:1 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===t.id?C.accent+"15":"transparent",color:tab===t.id?C.accent:C.dim,fontSize:13,fontWeight:tab===t.id?600:400,marginBottom:2,transition:"all 0.15s" }}>
              <t.Icon size={16} strokeWidth={tab===t.id?2:1.5}/>{t.label}
            </button>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,marginBottom:4 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:C.accent+"15",border:`1.5px solid ${C.accent}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.accent,flexShrink:0,overflow:"hidden" }}>
              {biz.logo?<img src={biz.logo} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>:initial}
            </div>
            <div style={{ minWidth:0,flex:1 }}>
              <div style={{ fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{BUSINESS.name}</div>
              <div style={{ fontSize:10,color:C.dim }}>Plan {PLAN_LABEL[biz.plan]||biz.plan}</div>
            </div>
          </div>
          <button onClick={()=>setLogoutModal(true)} style={{ width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:12,color:C.red }}>
            <LogOut size={13} color={C.red}/> Cerrar sesión
          </button>
          <button onClick={cycleTheme} style={{ width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,border:"none",background:"transparent",cursor:"pointer",fontFamily:"inherit",fontSize:12,color:C.dim }}>
            {resolved==="dark"?<MoonIcon size={13} color={C.dim}/>:<Sun size={13} color={C.dim}/>} {resolved==="dark"?"Oscuro":"Claro"}
          </button>
        </div>
      </div>}

      {/* Contenido */}
      <div style={{ flex:1, minWidth:0, overflowX:"hidden" }}>

      {/* HEADER mobile only */}
      {mob && <div style={{ position: "sticky", top: 0, zIndex: 100, background: C.bg, borderBottom: `1px solid ${C.border}`, borderTop: biz?.plan === "pro" ? `2px solid ${C.accent}55` : "none", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <Logo size={20} tag />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{BUSINESS.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: away.active ? C.dim : C.accent }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: away.active ? C.dim : C.accent, animation: away.active ? "none" : "pulse 2s infinite" }} />
                {away.active ? "Modo ausencia" : "IA activa"}
                {biz.plan === "trial" && <span style={{ color: C.dim, marginLeft: 4 }}>· {biz.trial_days}d prueba</span>}
              </div>
            </div>
          </div>

          {/* Theme + Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button onClick={cycleTheme} style={{ width: 32, height: 32, borderRadius: "50%", background: C.surface, border: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {resolved === "dark" ? <MoonIcon size={14} color={C.dim} /> : resolved === "light" ? <Sun size={14} color={C.dim} /> : <Settings size={14} color={C.dim} />}
            </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setProfileOpen(!profileOpen)} style={{
              width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
              background: biz.logo ? "transparent" : `${C.accent}15`,
              border: `1.5px solid ${biz.logo ? C.border : C.accent + "30"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: C.accent, padding: 0,
            }}>
              {biz.logo ? <img src={biz.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <>
                <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 149 }} />
                <div style={{
                  position: "absolute", top: 44, right: 0, zIndex: 150,
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                  width: 200, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{BUSINESS.name}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{"Plan " + (PLAN_LABEL[biz.plan] || biz.plan) + (biz.plan === "trial" ? " · " + biz.trial_days + " días" : "")}</div>
                  </div>
                  {[
                    { label: "Editar negocio", Icon: User, action: () => { setTab("config"); setProfileOpen(false); } },
                    { label: "Cerrar sesión", Icon: LogOut, danger: true, action: () => { setProfileOpen(false); handleLogout(); } },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} style={{
                      width: "100%", padding: "12px 16px", background: "none", border: "none",
                      display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: "inherit",
                      fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text,
                      borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                    }}>
                      <item.Icon size={15} color={item.danger ? C.red : C.dim} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>}

      {/* CANCEL AT PERIOD END BANNER */}
      {biz.cancel_at_period_end && (
        <div style={{ padding: "10px 20px", background: "#F59E0B12", borderBottom: "1px solid #F59E0B25", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <AlertTriangle size={13} color="#F59E0B" />
          <span style={{ fontSize: 12, color: "#F59E0B" }}>{"Cancelaste tu plan. Tu acceso continúa hasta el " + biz.plan_renews_at + "."}</span>
        </div>
      )}

      {/* WA DISCONNECTED BANNER — only shows on error */}
      {!biz.wa_connected && (
        <button onClick={() => { setBiz({...biz, wa_connected: true}); showToast("WhatsApp reconectado ✓"); }} style={{ width: "100%", padding: "10px 20px", background: `${C.red}15`, borderBottom: `1px solid ${C.red}25`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
          <WifiOff size={14} color={C.red} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Tu WhatsApp se desconectó. Toca aquí para reconectar.</span>
        </button>
      )}

      {/* SERVICE FREEZE BANNER */}
      {(() => {
        const limits = { basico: 10, negocio: 20, pro: Infinity, trial: Infinity };
        const limit = limits[biz.plan] || Infinity;
        const activeCount = services.filter(s => s.active).length;
        if (activeCount <= limit || limit === Infinity) return null;
        return (
          <div style={{ padding: "12px 20px", background: `${C.accent}08`, borderBottom: `1px solid ${C.accent}15` }}>
            <p style={{ fontSize: 12, color: C.dim, lineHeight: 1.4, marginBottom: 8 }}>Tienes <span style={{ color: C.accent, fontWeight: 600 }}>{activeCount} servicios activos</span> pero tu plan {biz.plan} permite solo {limit}. Elige cuáles mantener o vuelve al plan anterior.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setTab("services")} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.accent}30`, background: C.accentGlow, color: C.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Gestionar servicios</button>
              <button onClick={() => setPlansModal(true)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.dim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Volver al plan anterior</button>
            </div>
          </div>
        );
      })()}

      {/* CONTENT */}
      <div style={{ padding: "20px 16px" }}>

        {tab === "agenda" && (() => {
          const weekIncome = appointments.filter(a => a.status === "confirmed" && a.service_price).reduce((s, a) => s + a.service_price, 0);
          const todayAppts = getApptsByDate(TODAY, appointments);
          const todayIncome = todayAppts.filter(a => a.service_price).reduce((s, a) => s + a.service_price, 0);
          const filters = [{ id: "dia", label: "Día" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }];
          return (<div>
            {/* Sub-filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, background: C.surface, borderRadius: 10, padding: 3 }}>
              {filters.map(f => (
                <button key={f.id} onClick={() => setAgendaView(f.id)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: agendaView === f.id ? C.accent : "transparent",
                  color: agendaView === f.id ? C.bg : C.dim,
                  fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                }}>{f.label}</button>
              ))}
            </div>

            {/* KPIs agenda */}
            {canUse(biz.plan, "stats") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>Ingresos hoy</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: C.accent }}>${todayIncome}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{todayAppts.length} cita{todayAppts.length !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>Esta semana</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: C.text }}>${weekIncome}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{appointments.filter(a=>a.status==="confirmed").length} confirmadas</div>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.dim, marginBottom: 6 }}>Ocupación</div>
                  {(() => {
                    const totalSlots = 7 * 8;
                    const occupied = appointments.filter(a=>a.status==="confirmed").length;
                    const pct = Math.min(100, Math.round((occupied/totalSlots)*100));
                    return <>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: pct > 60 ? C.accent : C.text }}>{pct}%</div>
                      <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: C.accent, borderRadius: 2, transition: "width 0.5s ease" }}/>
                      </div>
                    </>;
                  })()}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasAnyAppts && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 24px", textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${C.accent}10`, border: `1px solid ${C.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }}/>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Tu IA está activa y esperando</div>
                <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>Comparte tu número de WhatsApp con tus clientes y Cleo agendará automáticamente.</p>
                <a href={`https://wa.me/${biz.wa_number}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: C.accentGlow, border: `1px solid ${C.accent}30`, color: C.accent, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  <Phone size={13}/> Compartir WhatsApp
                </a>
              </div>
            )}

            {/* DÍA */}
            {agendaView === "dia" && hasAnyAppts && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dim, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={13} /> Hoy — {TODAY.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: C.accent }}>{todayAppts.length} cita{todayAppts.length !== 1 ? "s" : ""}</span>
                </div>
                {todayAppts.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {todayAppts.map((a, i) => <ApptCard key={a.id} appt={a} onCancel={setCancelTarget} isNext={i===0&&a.datetime>new Date()} />)}
                  </div>
                ) : (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "30px 20px", textAlign: "center" }}>
                    <Calendar size={24} color={C.dim} style={{ opacity: 0.3, marginBottom: 6 }} />
                    <p style={{ fontSize: 13, color: C.dim }}>Sin citas para hoy</p>
                  </div>
                )}
              </div>
            )}

            {/* SEMANA */}
            {agendaView === "semana" && hasAnyAppts && <WeeklyView appointments={appointments} onCancel={setCancelTarget} />}

            {/* MES */}
            {agendaView === "mes" && hasAnyAppts && (
              <CalendarView appointments={appointments} blocked={blocked} onCancel={setCancelTarget} onBlock={(day) => { setBlockTarget(day); }} />
            )}
          </div>);
        })()}

        {tab === "stats" && <StatsView appointments={appointments} businessName={biz.name} plan={biz.plan} showToast={showToast} />}

        {tab === "services" && <ServicesView services={services} setServices={setServices} showToast={showToast} plan={biz.plan} />}

        {tab === "config" && (() => {
          const DURS = [15, 30, 45, 60, 90];
          const SDAYS = [{ k: "lunes", l: "Lun" },{ k: "martes", l: "Mar" },{ k: "miercoles", l: "Mié" },{ k: "jueves", l: "Jue" },{ k: "viernes", l: "Vie" },{ k: "sabado", l: "Sáb" },{ k: "domingo", l: "Dom" }];
          const st = { fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10, marginTop: 28 };
          const fw = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8 };
          const fl = { fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 };
          const fi = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
          const CONFIG_TABS = [
            { id:"negocio",   label:"Negocio",    Icon:Briefcase },
            { id:"asistente", label:"IA",          Icon:Zap },
            { id:"plan",      label:"Plan",        Icon:DollarSign },
            { id:"cuenta",    label:"Cuenta",      Icon:User },
          ];

          return (
            <div>
              {/* TABS de config */}
              <div style={{ display:"flex",gap:4,marginBottom:20,background:C.surface,borderRadius:12,padding:4,border:`1px solid ${C.border}` }}>
                {CONFIG_TABS.map(t=>(
                  <button key={t.id} onClick={()=>setCfgTab(t.id)}
                    style={{ flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",background:cfgTab===t.id?C.bg:"transparent",color:cfgTab===t.id?C.accent:C.dim,fontSize:12,fontWeight:cfgTab===t.id?600:500,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:5,boxShadow:cfgTab===t.id?"0 1px 4px rgba(0,0,0,0.3)":"none" }}>
                    <t.Icon size={13}/>{t.label}
                  </button>
                ))}
              </div>

              {cfgTab==="negocio" && <div>
              {/* ── 1. MI NEGOCIO ── */}
              <div style={st}>Mi negocio</div>

              <div style={{ display:"flex", gap:8, marginBottom:8 }}>

                {/* CARD 1: Logo */}
                <div style={{ flex:"0 0 auto", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" style={{ display:"none" }} onChange={e => { const f=e.target.files?.[0]; if(!f) return; if(f.size>2*1024*1024){showToast("Máximo 2MB");return;} if(!["image/png","image/jpeg"].includes(f.type)){showToast("Solo PNG o JPG");return;} const r=new FileReader(); r.onload=ev=>{setBiz({...biz,logo:ev.target.result});showToast("Logo actualizado ✓");}; r.readAsDataURL(f); }} />
                  <div onClick={() => logoInputRef.current?.click()} style={{ width:80, height:80, borderRadius:14, overflow:"hidden", background:biz.logo?"transparent":`${C.accent}10`, border:`1.5px solid ${biz.logo?C.border:C.accent+"25"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    {biz.logo ? <img src={biz.logo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:`${C.accent}60` }}>{initial}</span>}
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${C.accent}40`, background:C.accentGlow, color:C.accent, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Subir</button>
                  {biz.logo && <button onClick={() => {setBiz({...biz,logo:null});showToast("Logo eliminado");}} style={{ padding:"4px 8px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.dim, fontSize:10, cursor:"pointer", fontFamily:"inherit" }}>Quitar</button>}
                  <div style={{ fontSize:9, color:C.dim, textAlign:"center", lineHeight:1.5 }}>PNG o JPG<br/>400×400px · 2MB</div>
                </div>

                {/* CARD 2: Nombre + RUC/CI */}
                <div style={{ flex:"0 0 200px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px", display:"flex", flexDirection:"column", justifyContent:"center", gap:14 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:600, letterSpacing:1, color:C.dim, textTransform:"uppercase", marginBottom:4 }}>Nombre del negocio</div>
                    <div style={{ fontSize:15, fontWeight:600, color:C.text }}>{biz.name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:600, letterSpacing:1, color:C.dim, textTransform:"uppercase", marginBottom:4 }}>RUC o Cédula</div>
                    <input value={rucCi} onChange={e=>setRucCi(e.target.value)} onBlur={()=>rucCi&&showToast("Guardado ✓")} placeholder="Ej: 1234567890001" style={{...fi, width:"100%", boxSizing:"border-box", fontSize:13}}/>
                  </div>
                </div>

                {/* CARD 3: Dirección */}
                <div style={{ flex:1.4, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:600, letterSpacing:1, color:C.dim, textTransform:"uppercase" }}>Dirección del negocio</div>
                    {dirSaved && <span style={{ fontSize:10, color:C.accent, display:"flex", alignItems:"center", gap:4 }}><Check size={10}/> Guardada</span>}
                  </div>
                  {dirSaved ? (
                    <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{dirMain} {dirNum}{dirCross?`, ${dirCross}`:""}</div>
                  ) : (<>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <div style={{ flex:2 }}>
                        <div style={{ fontSize:11, color:C.dim, marginBottom:4 }}>Calle principal</div>
                        <input value={dirMain} onChange={e=>setDirMain(e.target.value)} placeholder="Ej: Av. 6 de Diciembre" style={{...fi, width:"100%", boxSizing:"border-box"}}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:C.dim, marginBottom:4 }}>Numeración</div>
                        <input value={dirNum} onChange={e=>setDirNum(e.target.value)} placeholder="Ej: N81-18" style={{...fi, width:"100%", boxSizing:"border-box"}}/>
                      </div>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:11, color:C.dim, marginBottom:4 }}>Calle secundaria / Referencia</div>
                      <input value={dirCross} onChange={e=>setDirCross(e.target.value)} placeholder="Ej: y Diego de Almagro" style={{...fi, width:"100%", boxSizing:"border-box"}}/>
                    </div>
                    <button onClick={saveDir} disabled={!dirMain||dirSaving}
                      style={{ width:"100%", padding:9, borderRadius:10, border:"none", background:dirMain?C.accent:C.border, color:dirMain?C.bg:C.dim, fontSize:12, fontWeight:600, cursor:dirMain?"pointer":"default", fontFamily:"inherit" }}>
                      {dirSaving?"Guardando...":"Guardar dirección"}
                    </button>
                  </>)}
                </div>

                {/* CARD 4: Duración de cita */}
                <div style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px" }}>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:1, color:C.dim, textTransform:"uppercase", marginBottom:4 }}>Duración de cita</div>
                  <div style={{ fontSize:11, color:C.dim, marginBottom:10 }}>Tiempo por cita agendada</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
                    {DURS.map(d => <button key={d} onClick={() => {setBiz({...biz,duration:d,customDuration:false});showToast("Guardado ✓");}} style={{ padding:"7px 0", borderRadius:8, border:`1.5px solid ${biz.duration===d&&!biz.customDuration?C.accent:C.border}`, background:biz.duration===d&&!biz.customDuration?C.accentGlow:"transparent", color:biz.duration===d&&!biz.customDuration?C.accent:C.dim, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>{d}m</button>)}
                    <button onClick={() => setBiz({...biz,customDuration:true,duration:biz.customDuration?biz.duration:120})} style={{ padding:"7px 0", borderRadius:8, border:`1.5px solid ${biz.customDuration?C.accent:C.border}`, background:biz.customDuration?C.accentGlow:"transparent", color:biz.customDuration?C.accent:C.dim, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>Otro</button>
                  </div>
                  {biz.customDuration && <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}><input type="number" min="5" max="480" value={biz.duration} onChange={e => setBiz({...biz,duration:Math.max(5,Math.min(480,parseInt(e.target.value)||5))})} onBlur={() => showToast("Guardado ✓")} style={{ ...fi, width:60, textAlign:"center", padding:"4px 6px" }} /><span style={{ fontSize:11, color:C.dim }}>min</span></div>}
                </div>

              </div>

              <div style={fw}>
                <div style={fl}>Horarios</div>
                {SDAYS.map(d => { const day = biz.schedule[d.k]; return (
                  <div key={d.k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", opacity: day.active ? 1 : 0.4 }}>
                    <button onClick={() => { const s={...biz.schedule,[d.k]:{...day,active:!day.active}}; setBiz({...biz,schedule:s}); showToast("Guardado ✓"); }} style={{ width: 32, height: 18, borderRadius: 9, border: "none", cursor: "pointer", background: day.active ? C.accent : "#333", position: "relative", flexShrink: 0 }}><div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: day.active ? 16 : 2, transition: "left 0.2s" }} /></button>
                    <span style={{ fontWeight: 600, fontSize: 12, minWidth: 28 }}>{d.l}</span>
                    {day.active ? <div style={{ display: "flex", gap: 4, flex: 1 }}><input type="time" value={day.open} onChange={e => { const s={...biz.schedule,[d.k]:{...day,open:e.target.value}}; setBiz({...biz,schedule:s}); }} style={{ ...fi, padding: "4px 6px", fontSize: 12, flex: 1 }} /><span style={{ color: C.dim, fontSize: 10, alignSelf: "center" }}>a</span><input type="time" value={day.close} onChange={e => { const s={...biz.schedule,[d.k]:{...day,close:e.target.value}}; setBiz({...biz,schedule:s}); }} style={{ ...fi, padding: "4px 6px", fontSize: 12, flex: 1 }} /></div> : <span style={{ fontSize: 11, color: C.dim }}>Cerrado</span>}
                  </div>
                ); })}
              </div>


              {/* ── 2. SERVICIOS shortcut ── */}
              </div>}

              {cfgTab==="asistente" && <div>
              <div style={st}>Servicios</div>
              <button onClick={() => setTab("services")} style={{ ...fw, width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
                <Briefcase size={16} color={C.accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color:C.text }}>Administrar servicios</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 1, color:C.dim }}>
                    {services.filter(s=>s.active).length} activos · {services.length} total
                    {biz.plan !== "trial" && biz.plan !== "pro" && <span style={{ color: services.filter(s=>s.active).length > ({basico:10,negocio:20}[biz.plan]||99) ? C.accent : C.dim }}> · Límite: {({basico:10,negocio:20})[biz.plan]}</span>}
                    {biz.plan === "pro" && <span> · Sin límite</span>}
                  </div>
                </div>
                <ChevronRight size={16} color={C.dim} />
              </button>

              {/* ── 3. ASISTENTE IA ── */}
              </div>}

              {cfgTab==="asistente" && <div>
              <div style={st}>Asistente IA</div>
              <div style={fw}><div style={fl}>Nombre del asistente</div><div style={{ fontSize: 14, color: C.dim }}>{biz.assistant_name}</div></div>
              {canUse(biz.plan, "away") ? (
              <div style={fw}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: away.active ? 10 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Plane size={14} color={away.active ? C.accent : C.dim} />
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>Modo ausencia</div><div style={{ fontSize: 10, color: C.dim }}>La IA responde con tu mensaje</div></div>
                  </div>
                  <button onClick={() => setAway({...away, active: !away.active})} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: away.active ? C.accent : "#333", position: "relative" }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: away.active ? 20 : 2, transition: "left 0.2s" }} /></button>
                </div>
                {away.active && <div>
                  <div style={{ position: "relative" }}>
                    <textarea value={away.message} onChange={e => setAway({...away,message:e.target.value})} placeholder='Ej: Estoy de vacaciones hasta el lunes, te respondo pronto.' rows={3} style={{ ...fi, resize: "vertical", paddingBottom: 32, lineHeight: 1.5 }} />
                    <button onClick={() => { if(!away.message.trim()) return; setAway({...away,message: away.message.replace(/\.$/,"") + ". Puedes escribirnos y te responderemos apenas estemos de vuelta."}); showToast("Mensaje mejorado ✓"); }} style={{ position: "absolute", bottom: 6, right: 6, padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface2, color: C.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3 }}><Sparkles size={10} /> Mejorar</button>
                  </div>
                </div>}
              </div>
              ) : <div style={{ marginBottom: 8 }}><LockedBanner plan={biz.plan} /></div>}



              {cfgTab==="asistente" && (canUse(biz.plan, "location") ? (
              <div style={fw}>
                <div style={fl}>Ubicación y modalidad</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[{ id: "local", Icon: Home, label: "Cliente viene al local", desc: "El bot envía tu ubicación al confirmar" },{ id: "mobile", Icon: Car, label: "Voy donde el cliente", desc: "El bot pide la dirección del cliente" },{ id: "both", Icon: MapPin, label: "Ambas modalidades", desc: "El bot pregunta al cliente qué prefiere" }].map(m => (
                    <button key={m.id} onClick={() => {setBiz({...biz,modality:m.id});showToast("Guardado ✓");}} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${biz.modality===m.id?C.accent:C.border}`, background: biz.modality===m.id?C.accentGlow:"transparent", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
                      <m.Icon size={15} color={biz.modality===m.id?C.accent:C.dim} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: biz.modality===m.id?C.accent:C.text }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>{m.desc}</div>
                      </div>
                      {biz.modality===m.id && <Check size={14} color={C.accent} />}
                    </button>
                  ))}
                </div>
                {(biz.modality==="local"||biz.modality==="both") && <div style={{ marginTop: 10 }}>
                  <input value={biz.business_address} onChange={e => setBiz({...biz,business_address:e.target.value})} placeholder="Ej: Av. 6 de Diciembre N81-18, Quito" style={{...fi, marginBottom: 6}} onBlur={() => biz.business_address && showToast("Guardado ✓")} />
                  <input value={biz.location_url} onChange={e => setBiz({...biz,location_url:e.target.value})} placeholder="Link de Google Maps" style={fi} onBlur={() => biz.location_url && showToast("Guardado ✓")} />
                  {biz.location_url && <a href={biz.location_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.accent, textDecoration: "none", marginTop: 4 }}><MapPin size={10} /> Ver en Maps</a>}
                </div>}
              </div>
              ) : <div style={{ marginBottom: 8 }}><LockedBanner plan={biz.plan} /></div>)}

              {/* ── 4. PLAN Y FACTURACIÓN ── */}
              </div>}

              {cfgTab==="plan" && <div>
              <div style={st}>Plan y facturación</div>
              <div style={fw}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 6, background: C.accentGlow, border: `1px solid ${C.accent}30`, fontSize: 12, fontWeight: 700, color: C.accent }}>{PLAN_LABEL[biz.plan] || biz.plan}</span>
                  {biz.plan === "trial" && <span style={{ fontSize: 12, color: C.dim }}>Te quedan {biz.trial_days} días</span>}
                </div>
                {biz.plan !== "trial" && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Facturación: {biz.billing_cycle === "annual" ? "Anual" : "Mensual"}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>Próxima renovación: {biz.plan_renews_at}</div>
                    {biz.billing_cycle === "monthly" && (
                      <button onClick={() => { setBillingView("annual"); setPlansModal(true); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 4 }}>
                        {"Cambiar a anual y ahorrar $" + (PLANS.find(p => p.id === biz.plan) ? (PLANS.find(p => p.id === biz.plan).price * 12 - PLANS.find(p => p.id === biz.plan).annual) : 0) + "/año"}
                      </button>
                    )}
                  </div>
                )}
                <button onClick={() => { setBillingView(biz.billing_cycle); setPlansModal(true); }} style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${C.accent}40`, background: C.accentGlow, color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cambiar plan</button>
                {biz.plan !== "trial" && <button onClick={() => setRetentionModal(true)} style={{ width: "100%", padding: 8, borderRadius: 10, border: "none", background: "transparent", color: C.dim, fontSize: 11, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>Cancelar suscripción</button>}
              </div>

              {/* ── 5. AYUDA ── */}              </div>}

              {cfgTab==="cuenta" && <div>
              <div style={st}>Ayuda</div>
              <button onClick={() => setHelpModal(true)} style={{ ...fw, width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left", marginBottom: 6 }}>
                <HelpCircle size={15} color={C.accent} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color:C.text }}>Preguntas frecuentes</div><div style={{ fontSize: 11, color: C.dim }}>Busca respuestas al instante</div></div><ChevronRight size={16} color={C.dim} />
              </button>
              <button onClick={() => setSupportModal(true)} style={{ ...fw, width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", textAlign: "left" }}>
                <MessageSquare size={15} color={C.dim} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color:C.text }}>Contactar soporte</div><div style={{ fontSize: 11, color: C.dim }}>Respuesta en menos de 24h</div></div><ChevronRight size={16} color={C.dim} />
              </button>


              {/* ── 6. CUENTA ── */}

              <div style={st}>Cuenta</div>
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 8 }}>{biz.email}</div>
              <div style={fw}><button onClick={() => setPasswordModal(true)} style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}><Lock size={14} color={C.dim} /> Cambiar contraseña</button></div>
              <button onClick={handleLogout} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.dim, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><LogOut size={14} /> Cerrar sesión</button>

              {/* ── 7. ELIMINAR ── */}
              <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => setDeleteModal(true)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.dim, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Trash2 size={14} /> Eliminar cuenta</button>
              </div>

              {/* ── LEGAL ── */}
              <div style={{ textAlign:"center", marginTop:20, marginBottom:20 }}>
                <span style={{ color:"#374151", fontSize:11 }}>Términos y Condiciones</span>
                <span style={{ color:"#374151", margin:"0 6px", fontSize:11 }}>·</span>
                <span style={{ color:"#374151", fontSize:11 }}>Política de Privacidad</span>
                <div style={{ fontSize:9, color:"#2A2A2A", marginTop:4 }}>cleo.app/terminos · cleo.app/privacidad</div>
              </div>

              </div>}
              <div style={{ height: 40 }} />
            </div>
          );
        })()}
      </div>

      {/* CANCEL MODAL */}
      <CancelModal appt={cancelTarget} onConfirm={handleCancel} onClose={() => setCancelTarget(null)} />

      {/* BLOCK CONFIRM */}
      <BlockConfirm day={blockTarget} month={calMonth} onConfirm={handleBlock} onClose={() => setBlockTarget(null)} />

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: C.accent, color: C.bg, padding: "10px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "fadeCheck 0.3s ease" }}>{toast}</div>
      )}

      {/* PASSWORD MODAL — 3 phases: send code → verify → new password */}
      <BottomSheet open={passwordModal} onClose={() => setPasswordModal(false)} title="Cambiar contraseña">
        {(() => {
          const [phase, setPhase] = useState(0); // 0=send, 1=code, 2=newpw
          const [sending, setSending] = useState(false);
          const [code, setCode] = useState(["","","","","",""]);
          const [verifying, setVerifying] = useState(false);
          const [codeErr, setCodeErr] = useState("");
          const codeRefs = useRef([]);
          const [nw, setNw] = useState(""); const [cf, setCf] = useState(""); const [sh, setSh] = useState(false);
          const checks = [{ l: "Mínimo 8 caracteres", m: nw.length >= 8 },{ l: "Letras y números", m: /[a-zA-Z]/.test(nw) && /[0-9]/.test(nw) },{ l: "Un símbolo (!@#$%)", m: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nw) }];
          const met = checks.filter(c => c.m).length;
          const clr = met === 3 ? C.accent : met === 2 ? "#D4A017" : met >= 1 ? "#888" : C.border;
          const canSave = met === 3 && nw === cf;
          const fld = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 };

          const handleCode = (i, v) => {
            const clean = v.toUpperCase().replace(/[^A-Z0-9]/g,"");
            const nc = [...code]; nc[i] = clean.slice(0,1); setCode(nc); setCodeErr("");
            if (clean && i < 5) codeRefs.current[i+1]?.focus();
            if (nc.join("").length === 6) { setVerifying(true); setTimeout(() => { setVerifying(false); setPhase(2); }, 800); }
          };
          const handlePaste = (e) => {
            e.preventDefault();
            const p = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);
            const nc = [...code]; for (let i=0;i<6;i++) nc[i]=p[i]||""; setCode(nc);
            if (p.length===6) { codeRefs.current[5]?.focus(); setVerifying(true); setTimeout(() => { setVerifying(false); setPhase(2); }, 800); }
          };

          if (phase === 0) return (<div style={{ textAlign: "center", padding: "8px 0" }}>
            <Shield size={28} color={C.accent} style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>Enviaremos un código de verificación a</p>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>{biz.email}</p>
            <button onClick={() => { setSending(true); setTimeout(() => { setSending(false); setPhase(1); }, 800); }} disabled={sending} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: sending ? C.border : C.accent, color: sending ? C.dim : C.bg, fontSize: 14, fontWeight: 600, cursor: sending ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {sending ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</> : "Enviar código"}
            </button>
          </div>);

          if (phase === 1) return (<div>
            <p style={{ fontSize: 13, color: C.dim, textAlign: "center", marginBottom: 16 }}>Ingresa el código de 6 caracteres</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }} onPaste={handlePaste}>
              {code.map((c,i) => <input key={i} ref={el => codeRefs.current[i]=el} type="text" inputMode="text" maxLength={1} value={c}
                onChange={e => handleCode(i, e.target.value)} onKeyDown={e => { if (e.key==="Backspace"&&!code[i]&&i>0) codeRefs.current[i-1]?.focus(); }}
                style={{ width: 44, height: 52, textAlign: "center", fontSize: 20, fontWeight: 700, fontFamily: "'DM Sans',monospace", background: c ? `${C.accent}08` : C.surface, border: `2px solid ${c ? C.accent : C.border}`, borderRadius: 10, color: C.text, outline: "none" }}
                onFocus={e => e.target.style.borderColor=C.accent} onBlur={e => e.target.style.borderColor=c?`${C.accent}60`:C.border} />)}
            </div>
            {verifying && <div style={{ textAlign: "center", fontSize: 13, color: C.dim, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Loader size={14} color={C.accent} style={{ animation: "spin 1s linear infinite" }} /> Verificando...</div>}
            {codeErr && <div style={{ textAlign: "center", fontSize: 13, color: "#888" }}>{codeErr}</div>}
            <button onClick={() => { setCode(["","","","","",""]); }} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reenviar código</button>
          </div>);

          return (<div>
            <p style={{ fontSize: 13, color: C.dim, marginBottom: 12 }}>Crea tu nueva contraseña</p>
            <div style={{ position: "relative" }}><input type={sh?"text":"password"} placeholder="Nueva contraseña" value={nw} onChange={e => setNw(e.target.value)} style={{...fld, paddingRight: 44}} /><button onClick={() => setSh(!sh)} style={{ position: "absolute", right: 12, top: 12, background: "none", border: "none", cursor: "pointer", color: C.dim }}>{sh ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
            {nw && <div style={{ marginBottom: 10 }}>
              <div style={{ height: 3, borderRadius: 2, background: C.border, marginBottom: 8 }}><div style={{ height: "100%", borderRadius: 2, background: clr, width: met === 3 ? "100%" : met === 2 ? "66%" : met >= 1 ? "33%" : "0%", transition: "width 0.4s ease, background 0.3s" }} /></div>
              {checks.map((c, i) => <div key={i} style={{ fontSize: 12, color: c.m ? C.accent : C.dim, display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${c.m ? C.accent : C.border}`, background: c.m ? `${C.accent}18` : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.m && <Check size={9} color={C.accent} strokeWidth={3} />}</div>{c.l}</div>)}
            </div>}
            <input type="password" placeholder="Confirmar contraseña" value={cf} onChange={e => setCf(e.target.value)} style={fld} />
            {cf && nw && cf !== nw && <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Las contraseñas no coinciden</div>}
            <button onClick={() => { setPasswordModal(false); showToast("Contraseña actualizada ✓"); }} disabled={!canSave} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: canSave ? C.accent : C.border, color: canSave ? C.bg : C.dim, fontSize: 14, fontWeight: 600, cursor: canSave ? "pointer" : "default", fontFamily: "inherit" }}>Guardar contraseña</button>
          </div>);
        })()}
      </BottomSheet>

      {/* AWAY MODE MODAL */}
      <BottomSheet open={awayModal} onClose={() => setAwayModal(false)} title="Modo ausencia">
        {(() => {
          const [msg, setMsg] = useState(away.message || "");
          const [improving, setImproving] = useState(false);
          const placeholder = "Ej: Estamos de vacaciones hasta el 15 de abril. Volvemos pronto con nuevos horarios disponibles.";
          const improveMsg = () => {
            if (!msg.trim()) return;
            setImproving(true);
            // Simulate AI improvement - in production calls Claude API
            setTimeout(() => {
              const improved = msg.replace(/\.$/, "") + ". Puedes escribirnos y te responderemos apenas estemos de vuelta. ¡Gracias por tu paciencia!";
              setMsg(improved);
              setImproving(false);
            }, 1200);
          };
          return (<div>
            <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginBottom: 14 }}>Escribe el mensaje que recibirán tus clientes cuando te escriban por WhatsApp.</p>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder={placeholder} rows={4} style={{ width: "100%", padding: "12px 14px", paddingBottom: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} onFocus={e => e.target.style.borderColor=C.accent} onBlur={e => e.target.style.borderColor=C.border} />
              {/* AI improve button */}
              <button onClick={improveMsg} disabled={!msg.trim() || improving} style={{ position: "absolute", bottom: 8, right: 8, padding: "5px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: msg.trim() ? C.accent : C.dim, fontSize: 11, fontWeight: 600, cursor: msg.trim() ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, opacity: improving ? 0.6 : 1 }}>
                {improving ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={11} />}
                Mejorar
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={() => setAwayModal(false)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={() => { setAway({ active: true, message: msg }); setAwayModal(false); showToast("Modo ausencia activado ✓"); }} disabled={!msg.trim()} style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: msg.trim() ? C.accent : C.border, color: msg.trim() ? C.bg : C.dim, fontSize: 14, fontWeight: 600, cursor: msg.trim() ? "pointer" : "default", fontFamily: "inherit" }}>Activar</button>
            </div>
          </div>);
        })()}
      </BottomSheet>

      {/* DELETE ACCOUNT MODAL — 2-step verification */}
      <BottomSheet open={deleteModal} onClose={() => setDeleteModal(false)} title="Eliminar cuenta">
        {(() => {
          const [step, setStep] = useState(0);
          const [confirm, setConfirm] = useState("");
          const [code, setCode] = useState(["","","","","",""]);
          const [sending, setSending] = useState(false);
          const [verifying, setVerifying] = useState(false);
          const [codeErr, setCodeErr] = useState("");
          const [countdown, setCountdown] = useState(0);
          const [resends, setResends] = useState(0);
          const [deleting, setDeleting] = useState(false);
          const cRefs = useRef([]);

          useEffect(() => {
            if (countdown <= 0) return;
            const t = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(t);
          }, [countdown]);

          const canDelete = confirm === biz.name;
          const sendCode = () => {
            if (resends >= 3) { setCodeErr("Demasiados intentos. Intenta de nuevo en 24 horas."); return; }
            setSending(true);
            setTimeout(() => { setSending(false); setStep(1); setCountdown(60); setResends(resends + 1); }, 800);
          };
          const resendCode = () => {
            if (resends >= 3) { setCodeErr("Demasiados intentos. Intenta de nuevo en 24 horas."); return; }
            setCode(["","","","","",""]); setCodeErr(""); setCountdown(60); setResends(resends + 1);
          };
          const handleCode = (i, v) => {
            const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
            const nc = [...code]; nc[i] = clean.slice(0, 1); setCode(nc); setCodeErr("");
            if (clean && i < 5) cRefs.current[i + 1]?.focus();
            if (nc.join("").length === 6) {
              setVerifying(true);
              setTimeout(() => {
                setVerifying(false); setDeleting(true);
                setTimeout(() => { setDeleteModal(false); setDeleting(false); handleLogout(); }, 2000);
              }, 800);
            }
          };
          const handlePaste = (e) => {
            e.preventDefault();
            const p = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
            const nc = [...code]; for (let i = 0; i < 6; i++) nc[i] = p[i] || ""; setCode(nc);
            if (p.length === 6) { cRefs.current[5]?.focus(); handleCode(5, p[5]); }
          };
          const cMin = Math.floor(countdown / 60);
          const cSec = String(countdown % 60).padStart(2, "0");

          if (deleting) return (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <Loader size={24} color={C.dim} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Eliminando tu cuenta...</p>
              <p style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>Gracias por haber usado Cleo.</p>
            </div>
          );

          if (step === 0) return (
            <div>
              <div style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>Esta acción es irreversible. Se eliminarán todas tus citas, conversaciones y datos.</p>
                <p style={{ fontSize: 13, color: C.dim, fontWeight: 600, marginTop: 8 }}>{"Escribe \""}<span style={{ color: C.text }}>{biz.name}</span>{" \" para continuar."}</p>
              </div>
              <input value={confirm} onChange={function(e) { setConfirm(e.target.value); }} placeholder={biz.name} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid " + (canDelete ? "#EF4444" : C.border), background: C.surface2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
              <button onClick={sendCode} disabled={!canDelete || sending} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: canDelete && !sending ? "#EF4444" : C.border, color: canDelete && !sending ? "#fff" : C.dim, fontSize: 14, fontWeight: 600, cursor: canDelete ? "pointer" : "default", fontFamily: "inherit" }}>
                {sending ? "Enviando código..." : "Continuar"}
              </button>
            </div>
          );

          return (
            <div>
              <p style={{ fontSize: 13, color: C.dim, textAlign: "center", marginBottom: 4 }}>Enviamos un código a</p>
              <p style={{ fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 16 }}>{biz.email}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }} onPaste={handlePaste}>
                {code.map(function(c, i) { return (
                  <input key={i} ref={function(el) { cRefs.current[i] = el; }} type="text" inputMode="text" maxLength={1} value={c}
                    onChange={function(e) { handleCode(i, e.target.value); }}
                    onKeyDown={function(e) { if (e.key === "Backspace" && !code[i] && i > 0) cRefs.current[i - 1]?.focus(); }}
                    style={{ width: 44, height: 52, textAlign: "center", fontSize: 20, fontWeight: 700, fontFamily: "'DM Sans',monospace", background: c ? "rgba(239,68,68,0.08)" : C.surface, border: "2px solid " + (c ? "#EF4444" : C.border), borderRadius: 10, color: C.text, outline: "none" }}
                  />
                ); })}
              </div>
              {verifying ? (
                <div style={{ textAlign: "center", fontSize: 13, color: C.dim, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Verificando...
                </div>
              ) : null}
              {codeErr ? <div style={{ textAlign: "center", fontSize: 12, color: "#EF4444", marginTop: 8 }}>{codeErr}</div> : null}
              <div style={{ textAlign: "center", marginTop: 12 }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: 12, color: "#555" }}>{"Reenviar código en " + cMin + ":" + cSec}</span>
                ) : resends < 3 ? (
                  <button onClick={resendCode} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Reenviar código</button>
                ) : (
                  <span style={{ fontSize: 12, color: "#555" }}>Demasiados intentos</span>
                )}
              </div>
            </div>
          );
        })()}
      </BottomSheet>

      {/* SUPPORT MODAL */}
      <BottomSheet open={supportModal} onClose={() => setSupportModal(false)} title="Contactar soporte">
        {(() => {
          const [msg, setMsg] = useState("");
          const [sent, setSent] = useState(false);
          const [sending, setSending] = useState(false);
          if (sent) return (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${C.accent}15`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Check size={24} color={C.accent} /></div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Mensaje enviado</p>
              <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>Te responderemos en menos de 24 horas.</p>
              <button onClick={() => { setSupportModal(false); setSent(false); setMsg(""); }} style={{ marginTop: 16, padding: "12px 28px", borderRadius: 12, border: "none", background: C.accent, color: C.bg, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Volver a Ajustes</button>
            </div>
          );
          return (<div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Remitente</div>
              <div style={{ padding: "10px 14px", borderRadius: 10, background: C.surface2, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim }}>{biz.email}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Negocio</div>
              <div style={{ padding: "10px 14px", borderRadius: 10, background: C.surface2, border: `1px solid ${C.border}`, fontSize: 13, color: C.dim }}>{biz.name}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Problema</div>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Describe tu problema o pregunta…" rows={5} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor=C.accent} onBlur={e => e.target.style.borderColor=C.border} />
            </div>
            <button onClick={() => { setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 1000); }} disabled={!msg.trim() || sending} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: msg.trim() && !sending ? C.accent : C.border, color: msg.trim() && !sending ? C.bg : C.dim, fontSize: 14, fontWeight: 600, cursor: msg.trim() && !sending ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {sending ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</> : "Enviar mensaje"}
            </button>
          </div>);
        })()}
      </BottomSheet>

      {/* PLANS MODAL */}
      <BottomSheet open={plansModal} onClose={() => setPlansModal(false)} title="Elige tu plan">
        <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, marginBottom: 14 }}>{PLANS_EXPLAINER}</p>
        <BillingToggle billing={billingView} setBilling={setBillingView} />
        {billingView === "annual" && <p style={{ fontSize:10, color:C.dim, textAlign:"center", marginTop:-10, marginBottom:8 }}>Los planes anuales no son reembolsables. Tu acceso continúa hasta el fin del período pagado.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PLANS.map(p => (
            <div key={p.id} style={{ background: C.surface, border: `1px solid ${p.popular ? C.accent : C.border}`, borderRadius: 14, padding: "16px 14px", position: "relative" }}>
              {p.popular && <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.bg, padding: "2px 10px", borderRadius: 50, fontSize: 10, fontWeight: 700 }}>RECOMENDADO</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div><div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: C.dim }}>{p.desc}</div></div>
                <PlanPrice plan={p} billing={billingView} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                {p.yes.map((f, i) => <div key={i} style={{ fontSize: 11, color: C.text, display: "flex", alignItems: "center", gap: 5 }}><Check size={10} color={C.accent} />{f}</div>)}
                {p.no.map((f, i) => <div key={`n${i}`} style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", gap: 5 }}><X size={10} color="#444" />{f}</div>)}
              </div>
              <p style={{ fontSize: 10, color: C.dim, lineHeight: 1.4, marginBottom: 12 }}>{p.note}</p>
              <button onClick={() => { setBiz({...biz, plan: p.id, billing_cycle: billingView}); setPlansModal(false); showToast(`Plan ${p.name} (${billingView === "annual" ? "anual" : "mensual"}) activado ✓`); }} style={{ width: "100%", padding: 11, borderRadius: 10, border: p.popular ? "none" : `1px solid ${C.border}`, background: p.popular ? C.accent : "transparent", color: p.popular ? C.bg : C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {biz.plan === p.id ? "Plan actual" : "Seleccionar"}
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* CANCELLATION FEEDBACK */}
      <BottomSheet open={retentionModal} onClose={() => setRetentionModal(false)} title="¿Por qué te vas?" tall>
        {(() => {
          const [reason, setReason] = useState(null);
          const [feedback, setFeedback] = useState("");
          const reasons = [
            { id: "expensive", label: "Es muy caro para mi negocio", Icon: DollarSign },
            { id: "ai_bad", label: "La IA no respondió bien", Icon: Sparkles },
            { id: "missing", label: "Me faltó alguna función", Icon: Settings },
            { id: "no_need", label: "Mi negocio no lo necesita por ahora", Icon: Briefcase },
            { id: "switched", label: "Me cambié a otra herramienta", Icon: LogOut },
            { id: "other", label: "Otro motivo", Icon: HelpCircle },
          ];
          const doCancel = () => {
            setRetentionModal(false);
            if (biz.billing_cycle === "annual") {
              setBiz({...biz, cancel_at_period_end: true});
              showToast("Tu acceso continúa hasta el " + biz.plan_renews_at);
            } else {
              setBiz({...biz, plan: "trial", trial_days: 0});
              showToast("Suscripción cancelada. Gracias por tu feedback.");
            }
          };
          return (
            <div>
              <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginBottom: 16 }}>Tu opinión nos ayuda a mejorar. Solo toma 30 segundos.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {reasons.map(function(r) {
                  const sel = reason === r.id;
                  return (
                    <button key={r.id} onClick={function(){ setReason(r.id); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "1.5px solid " + (sel ? C.accent : C.border), background: sel ? C.accentGlow : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                      <r.Icon size={15} color={sel ? C.accent : C.dim} strokeWidth={1.8} />
                      <span style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? C.text : C.dim }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <textarea value={feedback} onChange={function(e){ if (e.target.value.length <= 200) setFeedback(e.target.value); }} placeholder="Cuéntanos más (opcional)" rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid " + C.border, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none" }} />
                <div style={{ textAlign: "right", fontSize: 10, color: C.dim, marginTop: 4 }}>{feedback.length + " / 200"}</div>
              </div>
              <button onClick={doCancel} disabled={!reason} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: reason ? "#7F1D1D" : C.border, color: reason ? "#FCA5A5" : C.dim, fontSize: 14, fontWeight: 600, cursor: reason ? "pointer" : "default", fontFamily: "inherit", marginBottom: 8 }}>Cancelar mi cuenta</button>
              <button onClick={function(){ setRetentionModal(false); }} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid " + C.border, background: "transparent", color: C.dim, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Volver</button>
            </div>
          );
        })()}
      </BottomSheet>

      {/* HELP FAB */}
      {tab !== "config" && (
        <button onClick={function(){setHelpModal(true)}} style={{ position:"fixed", bottom:90, right:16, width:44, height:44, borderRadius:"50%", background:C.surface, border:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:99, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
          <HelpCircle size={20} color={C.dim} />
        </button>
      )}

      {/* FAQ HELP MODAL */}
      <BottomSheet open={helpModal} onClose={function(){setHelpModal(false)}} title={"¿En qué te ayudamos?"} tall>
        {(() => {
          const [q, setQ] = useState("");
          const [cat, setCat] = useState(null);
          const [open, setOpen] = useState(null);

          const words = q.toLowerCase().split(/\s+/).filter(function(w){return w.length>1});
          const filtered = FAQ_DATA.filter(function(f){
            if(cat && f.cat !== cat) return false;
            if(!q.trim()) return true;
            return f.kw.some(function(k){ return words.some(function(w){ return k.includes(w) || w.includes(k) }) });
          }).sort(function(a,b){
            if(!q.trim()) return 0;
            var scoreA = a.kw.filter(function(k){return words.some(function(w){return k.includes(w)||w.includes(k)})}).length;
            var scoreB = b.kw.filter(function(k){return words.some(function(w){return k.includes(w)||w.includes(k)})}).length;
            return scoreB - scoreA;
          }).slice(0, q.trim() ? 5 : 25);

          return (
            <div>
              <input value={q} onChange={function(e){setQ(e.target.value);setCat(null)}} placeholder="Buscar..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid "+C.border, background:C.surface, color:C.text, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 }} />
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
                {FAQ_CATS.map(function(c){ return (
                  <button key={c} onClick={function(){setCat(cat===c?null:c);setQ("")}} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid "+(cat===c?C.accent:C.border), background:cat===c?C.accentGlow:"transparent", color:cat===c?C.accent:C.dim, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{c}</button>
                )})}
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"20px 0" }}>
                  <p style={{ fontSize:13, color:C.dim, marginBottom:12 }}>No encontré respuesta a eso.</p>
                  <button onClick={function(){setHelpModal(false);setSupportModal(true)}} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.accent, color:C.bg, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Contactar soporte</button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {filtered.map(function(f){
                    var isOpen = open === f.id;
                    return (
                      <div key={f.id} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10, overflow:"hidden" }}>
                        <button onClick={function(){setOpen(isOpen?null:f.id)}} style={{ width:"100%", padding:"12px 14px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:13, fontWeight:600, color:C.text, flex:1 }}>{f.q}</span>
                          <ChevronRight size={14} color={C.dim} style={{ transform:isOpen?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0, marginLeft:8 }} />
                        </button>
                        {isOpen && (
                          <div style={{ padding:"0 14px 12px", fontSize:13, color:C.dim, lineHeight:1.6 }}>{f.a}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheet>

      {mob && <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: C.bg, borderTop: `1px solid ${C.border}`,
        display: "flex", padding: "8px 0 20px",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
            padding: "6px 0",
          }}>
            <t.Icon size={20} color={tab === t.id ? C.accent : C.dim} strokeWidth={tab === t.id ? 2 : 1.5} />
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.id ? C.accent : C.dim }}>{t.label}</span>
          </button>
        ))}
      </div>}
      </div>
      </div>
    </div>
  );
}
