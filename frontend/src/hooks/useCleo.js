import { useState, useCallback } from "react";

function detectIntent(input) {
  const q = input.toLowerCase();
  const has = (...w) => w.some(x => q.includes(x));
  if (has("reagend","mover cita","cambiar hora","cambiar fecha")) return "reagendar";
  if (has("cancel","eliminar cita","borrar cita"))                return "cancelar";
  if (has("crear servic","nuevo servic","agregar servic"))        return "crear_servicio";
  if (has("limite","límite","cuantos servic","máximo servic"))    return "limite_servicios";
  if (has("ingreso","dinero","ganancia","estadist","reporte"))    return "ingresos";
  if (has("plan","incluye","beneficio","suscri","negocio","pro","basico")) return "mi_plan";
  if (has("whatsapp","bot","ia activa","configur ia","responde")) return "whatsapp";
  if (has("cita hoy","agenda hoy","cuantas citas","hoy"))        return "citas_hoy";
  if (has("servicio"))                                            return "crear_servicio";
  if (has("cita"))                                               return "citas_hoy";
  return "ayuda_general";
}

const RESPONSES = {
  reagendar:        (ctx) => ({ title:"Reagendar cita", body:"Abre la cita en Agenda y toca Reagendar. Elige nueva fecha y hora desde el selector visual.", steps:["Ve a Agenda","Ubica la cita confirmada","Toca Reagendar","Selecciona día y hora","Confirma"], action:{label:"Ir a Agenda",tab:"agenda"} }),
  cancelar:         (ctx) => ({ title:"Cancelar cita", body:"Abre la cita en Agenda y toca Cancelar. Cleo enviará un WhatsApp automático al cliente.", steps:["Ve a Agenda","Ubica la cita","Toca Cancelar","Confirma en el modal"], action:{label:"Ir a Agenda",tab:"agenda"} }),
  crear_servicio:   (ctx) => { const lim={basico:10,negocio:20}[ctx.plan]; const r=lim?lim-ctx.servicesCount:null; return { title:"Crear un servicio", body:lim?(r>0?`Tienes ${ctx.servicesCount} de ${lim} servicios. Te quedan ${r}.`:`Límite alcanzado. Actualiza tu plan.`):`Tienes ${ctx.servicesCount} servicios. Plan ${ctx.planLabel}: ilimitados.`, steps:["Ve a Servicios","Toca + Nuevo servicio","Completa datos","Crea"], action:{label:r===0?"Ver planes":"Ir a Servicios",tab:r===0?"config":"services"} }; },
  limite_servicios: (ctx) => { const lim={basico:10,negocio:20}[ctx.plan]; return { title:"Límite de servicios", body:lim?`Plan ${ctx.planLabel}: hasta ${lim}. Tienes ${ctx.servicesCount} — quedan ${lim-ctx.servicesCount}.`:`Plan ${ctx.planLabel}: ilimitados. Tienes ${ctx.servicesCount}.`, steps:lim&&ctx.servicesCount>=lim?["Elimina servicios inactivos","O actualiza a Pro"]:["Ve a Servicios","Toca + Nuevo servicio"], action:{label:"Ver Servicios",tab:"services"} }; },
  ingresos:         (ctx) => ({ title:"Ver ingresos", body:"En Estadísticas: ingresos semanales, proyección mensual y clientes recurrentes. Exporta en Excel.", steps:["Ve a Estadísticas","Revisa ingresos","Descarga reporte"], action:{label:"Ver Estadísticas",tab:"stats"} }),
  mi_plan:          (ctx) => ({ title:`Tu plan: ${ctx.planLabel}`, body:{basico:"Hasta 10 servicios, agenda y WhatsApp.",negocio:"Hasta 20 servicios, estadísticas y reportes.",pro:"Servicios ilimitados e IA avanzada.",trial:`Prueba (${ctx.trialDays} días). Acceso completo.`}[ctx.plan]||"", steps:["Ve a Ajustes → Plan","Revisa lo incluido","Compara si quieres actualizar"], action:{label:"Ver mi plan",tab:"config"} }),
  whatsapp:         (ctx) => ({ title:"IA en WhatsApp", body:"Cleo responde automáticamente. Configura nombre, modo ausencia y comportamiento en Ajustes.", steps:["Ve a Ajustes → IA","Personaliza el asistente","Configura modo ausencia"], action:{label:"Ajustes IA",tab:"config"} }),
  citas_hoy:        (ctx) => ({ title:"Citas de hoy", body:ctx.todayCount>0?`Tienes ${ctx.todayCount} cita${ctx.todayCount!==1?"s":""} confirmada${ctx.todayCount!==1?"s":""} hoy.`:"Sin citas hoy. Comparte tu WhatsApp para que Cleo agende.", steps:ctx.todayCount>0?["Ve a Agenda → Día","Revisa tus citas","Reagenda o cancela si necesitas"]:["Comparte tu WhatsApp","Cleo agendará automáticamente"], action:{label:"Ver Agenda",tab:"agenda"} }),
  ayuda_general:    (ctx) => ({ title:"¿En qué te ayudo?", body:"Soy el copiloto de Cleo. Escribe tu pregunta o toca una acción rápida.", steps:null, action:null }),
};

export const QUICK_ACTIONS_BY_TAB = {
  agenda:   ["reagendar","cancelar","citas_hoy"],
  services: ["crear_servicio","limite_servicios"],
  stats:    ["ingresos"],
  config:   ["mi_plan","whatsapp"],
};

function buildInsights(ctx) {
  const out = [];
  if (ctx.todayCount>0) out.push({color:"#4ADE80",text:`${ctx.todayCount} cita${ctx.todayCount!==1?"s":""} confirmada${ctx.todayCount!==1?"s":""} hoy`});
  const lim={basico:10,negocio:20}[ctx.plan];
  if (lim) { const pct=Math.round((ctx.servicesCount/lim)*100); out.push(pct>=80?{color:"#FBBF24",text:`${ctx.servicesCount}/${lim} servicios — cerca del límite`}:{color:"#4ADE80",text:`${lim-ctx.servicesCount} servicio${lim-ctx.servicesCount!==1?"s":""} disponibles`}); }
  if (ctx.plan==="trial"&&ctx.trialDays>0) out.push({color:"#22D3EE",text:`Prueba: ${ctx.trialDays} días restantes`});
  return out.slice(0,3);
}

export function useCleo({ tab, biz, services, appointments }) {
  const [open,     setOpen]     = useState(false);
  const [status,   setStatus]   = useState("idle");
  const [result,   setResult]   = useState(null);
  const [query,    setQuery]    = useState("");
  const [category, setCategory] = useState(null);

  const ctx = {
    tab, plan:biz?.plan||"trial",
    planLabel:{basico:"Básico",negocio:"Negocio",pro:"Pro",trial:"Trial"}[biz?.plan]||"Trial",
    servicesCount:services?.length||0, trialDays:biz?.trial_days||0, waNumber:biz?.wa_number||"",
    todayCount:appointments?.filter(a=>a.datetime?.toDateString?.()===new Date().toDateString()&&a.status==="confirmed").length||0,
  };

  const insights     = buildInsights(ctx);
  const quickActions = QUICK_ACTIONS_BY_TAB[tab] || QUICK_ACTIONS_BY_TAB.agenda;

  const ask = useCallback((input) => {
    if (!input?.trim()) return;
    setStatus("thinking"); setResult(null);
    setTimeout(() => { setResult(RESPONSES[detectIntent(input)](ctx)); setStatus("response"); }, 600+Math.random()*600);
  }, [JSON.stringify(ctx)]);

  const getResponse = useCallback((key) => {
    setStatus("thinking"); setResult(null);
    setTimeout(() => { setResult(RESPONSES[key]?.(ctx)||RESPONSES.ayuda_general(ctx)); setStatus("response"); }, 500);
  }, [JSON.stringify(ctx)]);

  const reset = useCallback(() => { setResult(null); setQuery(""); setCategory(null); setStatus("idle"); }, []);

  return { open,setOpen,status,result,query,setQuery,category,setCategory,ctx,insights,quickActions,ask,getResponse,reset };
}
