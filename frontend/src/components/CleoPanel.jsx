import { useRef, useEffect } from "react";
import { X, ChevronRight, Calendar, CalendarDays, Plus, Briefcase, Zap, User, TrendingUp } from "lucide-react";


const QUICK_ACTIONS_BY_TAB = { agenda:["reagendar","cancelar","citas_hoy"], services:["crear_servicio","limite_servicios"], stats:["ingresos"], config:["mi_plan","whatsapp"] };

const ACTION_ICONS  = { reagendar:CalendarDays, cancelar:X, citas_hoy:Calendar, crear_servicio:Plus, limite_servicios:Briefcase, ingresos:TrendingUp, mi_plan:User, whatsapp:Zap };
const ACTION_LABELS = { reagendar:"Reagendar cita", cancelar:"Cancelar cita", citas_hoy:"Ver citas hoy", crear_servicio:"Crear servicio", limite_servicios:"Ver límites", ingresos:"Ver ingresos", mi_plan:"Mi plan", whatsapp:"Config IA" };
const CATEGORIES    = [
  { id:"citas",     label:"Citas",     keys:["reagendar","cancelar","citas_hoy"] },
  { id:"servicios", label:"Servicios", keys:["crear_servicio","limite_servicios"] },
  { id:"negocio",   label:"Negocio",   keys:["ingresos"] },
  { id:"ia",        label:"IA / Plan", keys:["mi_plan","whatsapp"] },
];

function TypingDots({ C }) {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center", padding:"12px 16px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px 14px 14px 14px", width:"fit-content", marginBottom:12 }}>
      {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.accent, animation:`pulse ${0.6+i*0.18}s ease-in-out infinite` }}/>)}
    </div>
  );
}

export function CleoPanel({ cleo, C, onNavigate }) {
  const { open, setOpen, status, result, query, setQuery, category, setCategory, ctx, insights, quickActions, ask, getResponse, reset } = cleo;
  const inputRef = useRef(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);
  if (!open) return null;

  const handleNav = (tab) => { if (onNavigate) onNavigate(tab); setOpen(false); };
  const handleAsk = (text) => { if (!text?.trim()) return; ask(text); setQuery(""); };

  return (
    <>
      <div onClick={()=>setOpen(false)} style={{ position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",animation:"fadeIn 0.2s ease" }}/>
      <div style={{ position:"fixed",top:0,right:0,bottom:0,zIndex:501,width:"min(400px,100vw)",background:C.bg,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",animation:"slideInRight 0.26s cubic-bezier(0.16,1,0.3,1)",boxShadow:`-28px 0 80px rgba(0,0,0,0.55)` }}>

        {/* HEADER */}
        <div style={{ padding:"20px 18px 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0,background:`linear-gradient(180deg,${C.accent}07 0%,transparent 100%)` }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",gap:12 }}>
              <div style={{ width:44,height:44,borderRadius:14,flexShrink:0,background:`${C.accent}10`,border:`1.5px solid ${C.accent}35`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",boxShadow:`0 0 24px ${C.accent}15` }}>
                <div style={{ width:14,height:14,borderRadius:"50%",background:C.accent,boxShadow:`0 0 14px ${C.accent}` }}/>
                <div style={{ position:"absolute",bottom:-3,right:-3,width:13,height:13,borderRadius:"50%",background:"#22C55E",border:`2.5px solid ${C.bg}` }}/>
              </div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:C.text }}>Cleo</div>
                <div style={{ fontSize:10,color:C.accent,display:"flex",alignItems:"center",gap:4,marginTop:1 }}>
                  <div style={{ width:5,height:5,borderRadius:"50%",background:C.accent,animation:"pulse 1.5s infinite" }}/>
                  {status==="thinking"?"Pensando...":"Copiloto activo"}
                </div>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
              <X size={13} color={C.dim}/>
            </button>
          </div>
          <div style={{ position:"relative" }}>
            <input ref={inputRef} value={query} onChange={e=>{ setQuery(e.target.value); if(!e.target.value) reset(); }} onKeyDown={e=>e.key==="Enter"&&handleAsk(query)} placeholder="¿En qué te puedo ayudar?"
              style={{ width:"100%",padding:"10px 42px 10px 14px",borderRadius:12,border:`1px solid ${result?C.accent+"50":C.border}`,background:C.surface,color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color 0.2s" }}/>
            <button onClick={()=>handleAsk(query)} disabled={!query.trim()}
              style={{ position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:8,border:"none",background:query.trim()?C.accent:"transparent",color:query.trim()?C.bg:C.dim,cursor:query.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex:1,overflowY:"auto",padding:"16px" }}>
          {status==="thinking" && <TypingDots C={C}/>}

          {result && status==="response" && (
            <div style={{ background:C.surface,border:`1px solid ${C.accent}30`,borderRadius:16,padding:"16px",marginBottom:16,position:"relative",overflow:"hidden",animation:"fadeIn 0.25s ease" }}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.accent},transparent)` }}/>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:C.text,marginBottom:8 }}>{result.title}</div>
              <div style={{ fontSize:12,color:C.dim,lineHeight:1.7,marginBottom:result.steps?12:0 }}>{result.body}</div>
              {result.steps && <div style={{ display:"flex",flexDirection:"column",gap:5,marginBottom:result.action?12:0 }}>
                {result.steps.map((s,i)=><div key={i} style={{ display:"flex",alignItems:"flex-start",gap:7,fontSize:11,color:C.dim }}>
                  <span style={{ fontSize:9,fontWeight:700,color:C.accent,minWidth:14,marginTop:2 }}>{i+1}.</span>{s}
                </div>)}
              </div>}
              {result.action && <button onClick={()=>handleNav(result.action.tab)}
                style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9,border:`1px solid ${C.accent}30`,background:C.accentGlow,color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                {result.action.label} →
              </button>}
              <button onClick={reset} style={{ position:"absolute",top:10,right:10,background:"none",border:"none",cursor:"pointer",color:C.dim,padding:2 }}><X size={11}/></button>
            </div>
          )}

          {!result && insights.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:C.dim,marginBottom:8 }}>Ahora mismo</div>
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {insights.map((ins,i)=><div key={i} style={{ display:"flex",alignItems:"center",gap:9,padding:"9px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10 }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:ins.color,flexShrink:0,boxShadow:`0 0 6px ${ins.color}` }}/>
                  <span style={{ fontSize:12,color:C.text }}>{ins.text}</span>
                </div>)}
              </div>
            </div>
          )}

          {!result && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:C.dim,marginBottom:8 }}>Acciones rápidas</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {quickActions.map(key=>{ const Icon=ACTION_ICONS[key]||ChevronRight; return (
                  <button key={key} onClick={()=>getResponse(key)}
                    style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 12px",borderRadius:12,border:`1px solid ${C.border}`,background:C.surface,color:C.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${C.accent}45`; e.currentTarget.style.background=`${C.accent}07`; e.currentTarget.style.transform="translateY(-1px)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.surface; e.currentTarget.style.transform="translateY(0)"; }}>
                    <Icon size={14} color={C.accent}/>{ACTION_LABELS[key]}
                  </button>
                ); })}
              </div>
            </div>
          )}

          {!result && (
            <div>
              <div style={{ fontSize:9,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:C.dim,marginBottom:8 }}>Explorar</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                {CATEGORIES.map(cat=>(
                  <div key={cat.id}>
                    <button onClick={()=>setCategory(category===cat.id?null:cat.id)}
                      style={{ width:"100%",padding:"9px 12px",borderRadius:10,border:`1px solid ${category===cat.id?C.accent+"45":C.border}`,background:category===cat.id?`${C.accent}08`:C.surface,color:category===cat.id?C.accent:C.dim,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",textAlign:"left" }}>
                      {cat.label}
                    </button>
                    {category===cat.id && <div style={{ marginTop:4,display:"flex",flexDirection:"column",gap:3 }}>
                      {cat.keys.map(k=><button key={k} onClick={()=>getResponse(k)}
                        style={{ textAlign:"left",padding:"6px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.surface2,color:C.dim,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}
                        onMouseEnter={e=>{ e.currentTarget.style.color=C.text; e.currentTarget.style.borderColor=`${C.accent}30`; }}
                        onMouseLeave={e=>{ e.currentTarget.style.color=C.dim; e.currentTarget.style.borderColor=C.border; }}>
                        {ACTION_LABELS[k]}
                      </button>)}
                    </div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:"10px 18px 20px",borderTop:`1px solid ${C.border}`,flexShrink:0,textAlign:"center" }}>
          <span style={{ fontSize:10,color:C.dim,opacity:0.4 }}>Cleo · Copiloto interno · Sin APIs externas</span>
        </div>
      </div>
    </>
  );
}
