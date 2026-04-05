import { useState, useEffect, useRef } from "react";
import { useInactivityTimeout } from "../hooks/useInactivityTimeout.js";
import { BarChart3, Users, DollarSign, Mail, Settings, Search, ChevronRight, X, Eye, EyeOff, Shield, TrendingUp, Trash2, AlertTriangle, RefreshCw, Minus, Cloud, Brain, Smartphone, Wrench, Briefcase, Pause, Play, StickyNote, Sun, Moon, Activity, CheckCircle, AlertCircle, XCircle, Plus, Database, Server, Cpu, MessageSquare, Lock, UserPlus, ShieldCheck, Headphones, User } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const T = {
  dark:  { bg:"#080808",s:"#111111",s2:"#161616",b:"#1E1E1E",t:"#F9FAFB",d:"#6B7280",a:"#4ADE80",r:"#EF4444",glow:"rgba(74,222,128,0.08)",ia:"#6B7280" },
  light: { bg:"#FAFAFA",s:"#FFFFFF",s2:"#F3F4F6",b:"#E5E7EB",t:"#111827",d:"#6B7280",a:"#16A34A",r:"#DC2626",glow:"rgba(22,163,74,0.06)",ia:"#9CA3AF" },
};
var C = T.dark;

const EXP_CATS = [
  { v:"infra",  l:"Infraestructura", Icon: Cloud },
  { v:"ia",     l:"IA (Claude API)",  Icon: Brain },
  { v:"wa",     l:"WhatsApp (Meta)",  Icon: Smartphone },
  { v:"email",  l:"Email (Resend)",   Icon: Mail },
  { v:"tools",  l:"Herramientas",     Icon: Wrench },
  { v:"other",  l:"Otros",            Icon: Briefcase },
];

const PLAN_LABEL    = { trial:"Prueba", basico:"Básico", negocio:"Negocio", pro:"Pro", cancelled:"Cancelado", suspended:"Suspendido" };
const PLAN_PRICES   = { basico:29, negocio:59, pro:99 };
const PLAN_ANNUAL   = { basico:290, negocio:590, pro:990 };
const STATUS_COLORS = { operational:C?.a, degraded:"#F59E0B", outage:C?.r };

// ── Helpers ───────────────────────────────────────────────────────────────────
const Badge = ({ plan }) => {
  const col = { trial:"#6B7280", basico:"#3B82F6", negocio:C.a, pro:"#F59E0B", cancelled:"#EF4444", suspended:"#EF4444" };
  return <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:(col[plan]||"#666")+"18", color:col[plan]||"#666" }}>{PLAN_LABEL[plan]||plan}</span>;
};

const AdminLogo = ({ size=20 }) => (
  <span style={{ display:"inline-flex", flexDirection:"column", alignItems:"flex-start", userSelect:"none" }}>
    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:size, lineHeight:1, letterSpacing:-0.8, background:"linear-gradient(100deg,#4ADE80 0%,#22D3EE 50%,#4ADE80 100%)", backgroundSize:"300% 100%", animation:"gradBreathe 2.5s ease-in-out infinite", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>cleo<span style={{ WebkitTextFillColor:"inherit" }}>.</span></span>
    <span style={{ fontFamily:"monospace", fontSize:Math.max(size*0.32,7), letterSpacing:2.5, color:C.ia, marginTop:1 }}>powered by ia</span>
  </span>
);

const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
    <RefreshCw size={20} color={C.a} style={{ animation:"spin 1s linear infinite" }} />
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div style={{ textAlign:"center", padding:"40px 20px", color:C.d }}>
    <Icon size={28} style={{ opacity:0.3, marginBottom:8 }} />
    <p style={{ fontSize:13 }}>{text}</p>
  </div>
);

// ── RECUPERAR CONTRASEÑA ─────────────────────────────────────────────────────
function ForgotPassword({ email, API }) {
  const [open,    setOpen]    = useState(false);
  const [fEmail,  setFEmail]  = useState(email||"");
  const [step,    setStep]    = useState(0); // 0=email, 1=code, 2=newpw
  const [code,    setCode]    = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [err,     setErr]     = useState("");

  const sendCode = async () => {
    if (!fEmail) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/admin/forgot-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email:fEmail }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error||"Error"); setLoading(false); return; }
      setStep(1); setMsg("Código enviado a "+fEmail);
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  const resetPw = async () => {
    if (!code||!newPw||newPw!==confirm) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/admin/reset-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email:fEmail, code, new_password:newPw }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error||"Código inválido"); setLoading(false); return; }
      setMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
      setStep(3);
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  const fi = { width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid #1E1E1E",background:"#111111",color:"#F9FAFB",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8 };

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{ background:"none",border:"none",color:"#6B7280",fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:12,display:"block",width:"100%" }}>
      ¿Olvidaste tu contraseña?
    </button>
  );

  return (
    <div style={{ marginTop:16,padding:16,borderRadius:12,border:"1px solid #1E1E1E",background:"#111111",textAlign:"left" }}>
      <div style={{ fontSize:13,fontWeight:600,marginBottom:12,color:"#F9FAFB" }}>Recuperar contraseña</div>
      {step===0 && <>
        <input value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="Tu email de admin" style={fi}/>
        {err && <div style={{ fontSize:11,color:"#EF4444",marginBottom:6 }}>{err}</div>}
        <button onClick={sendCode} disabled={!fEmail||loading}
          style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:fEmail?"#4ADE80":"#1E1E1E",color:fEmail?"#080808":"#6B7280",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          {loading?"Enviando...":"Enviar código"}
        </button>
      </>}
      {step===1 && <>
        {msg && <div style={{ fontSize:11,color:"#4ADE80",marginBottom:8 }}>{msg}</div>}
        <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código de 6 caracteres" style={fi}/>
        <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Nueva contraseña" style={fi}/>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirmar contraseña" style={fi}/>
        {err && <div style={{ fontSize:11,color:"#EF4444",marginBottom:6 }}>{err}</div>}
        <button onClick={resetPw} disabled={!code||!newPw||newPw!==confirm||loading}
          style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:code&&newPw&&newPw===confirm?"#4ADE80":"#1E1E1E",color:code&&newPw&&newPw===confirm?"#080808":"#6B7280",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          {loading?"Guardando...":"Cambiar contraseña"}
        </button>
      </>}
      {step===3 && <div style={{ fontSize:12,color:"#4ADE80",textAlign:"center",padding:"8px 0" }}>{msg}</div>}
      <button onClick={()=>{setOpen(false);setStep(0);setErr("");setMsg("");}} style={{ background:"none",border:"none",color:"#6B7280",fontSize:11,cursor:"pointer",fontFamily:"inherit",marginTop:8,display:"block" }}>Cancelar</button>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [step, setStep]           = useState(0);
  const [email, setEmail]         = useState("");
  const [pass, setPass]           = useState("");
  const [err, setErr]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [code, setCode]           = useState(["","","","","",""]);
  const [countdown, setCountdown] = useState(0);
  const [resends, setResends]     = useState(0);
  const [isMember, setIsMember]   = useState(false); // true = miembro invitado
  const cRefs = useRef([]);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c-1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const go = async () => {
    if (!email||!pass) { setErr("Completa los campos"); return; }
    setLoading(true); setErr("");
    try {
      // Intentar login de dueño primero
      const r = await fetch(`${API}/api/admin/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password:pass }) });
      if (r.ok) {
        setIsMember(false);
        setStep(1); setCountdown(60); setResends(1);
        setLoading(false); return;
      }
      // Si no es dueño, intentar login de miembro invitado
      const rm = await fetch(`${API}/api/admin/login/member`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password:pass }) });
      if (rm.ok) {
        setIsMember(true);
        setStep(1); setCountdown(60); setResends(1);
        setLoading(false); return;
      }
      const d = await r.json();
      setErr(d.error||"Credenciales inválidas"); setLoading(false); return;
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  const handleCode = async (i, v) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g,"");
    const nc = [...code]; nc[i] = clean.slice(0,1); setCode(nc); setErr("");
    if (clean && i<5) cRefs.current[i+1]?.focus();
    if (nc.join("").length===6) {
      setLoading(true);
      try {
        // Usar endpoint según tipo de usuario
        const endpoint = isMember ? "/api/admin/verify-2fa/member" : "/api/admin/verify-2fa";
        const body     = isMember
          ? JSON.stringify({ email, code:nc.join("") })
          : JSON.stringify({ code:nc.join("") });
        const r = await fetch(`${API}${endpoint}`, { method:"POST", headers:{"Content-Type":"application/json"}, body });
        const d = await r.json();
        if (!r.ok) { setErr(d.error||"Código inválido"); setLoading(false); return; }
        localStorage.setItem("adminToken", d.token);
        onLogin(email, isMember ? d.role : (d.role || 'owner'));
      } catch { setErr("Error de conexión"); }
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resends>=3) { setErr("Demasiados intentos. Intenta en 30 minutos."); return; }
    setCode(["","","","","",""]); setErr("");
    try {
      const endpoint = isMember ? "/api/admin/login/member" : "/api/admin/login";
      const body     = isMember
        ? JSON.stringify({ email, password:pass })
        : JSON.stringify({ email, password:pass });
      await fetch(`${API}${endpoint}`, { method:"POST", headers:{"Content-Type":"application/json"}, body });
      setCountdown(60); setResends(r=>r+1);
    } catch { setErr("Error de conexión"); }
  };

  const cMin = Math.floor(countdown/60);
  const cSec = String(countdown%60).padStart(2,"0");
  const fi   = { width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.t, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:360, textAlign:"center" }}>
        <AdminLogo size={28} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:12, marginBottom:4 }}>
          <Shield size={16} color={C.a} />
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>Admin</h1>
        </div>
        {step===0 ? (
          <div>
            <p style={{ fontSize:13, color:C.d, marginBottom:28 }}>Panel de administración</p>
            <input value={email} onChange={x=>setEmail(x.target.value)} placeholder="Email admin" style={fi} />
            <div style={{ position:"relative" }}>
              <input value={pass} onChange={x=>setPass(x.target.value)} type={showPw?"text":"password"} placeholder="Contraseña" onKeyDown={x=>x.key==="Enter"&&go()} style={{...fi,paddingRight:48}} />
              <button onClick={()=>setShowPw(!showPw)} style={{ position:"absolute",right:14,top:14,background:"none",border:"none",cursor:"pointer",color:C.d }}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
            {err && <div style={{ fontSize:12, color:C.r, marginBottom:10 }}>{err}</div>}
            <button onClick={go} disabled={loading} style={{ width:"100%",padding:15,borderRadius:12,border:"none",background:loading?C.b:C.a,color:loading?C.d:C.bg,fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",fontFamily:"inherit" }}>{loading?"Verificando...":"Entrar"}</button>
            {step===0 && <ForgotPassword email={email} API={API}/>}
          </div>
        ) : (
          <div>
            <p style={{ fontSize:13, color:C.d, marginBottom:4 }}>Código enviado a</p>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>{email}</p>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:12 }}>
              {code.map((c,i)=>(
                <input key={i} ref={el=>cRefs.current[i]=el} type="text" inputMode="text" maxLength={1} value={c}
                  onChange={ev=>handleCode(i,ev.target.value)}
                  onKeyDown={ev=>{if(ev.key==="Backspace"&&!code[i]&&i>0)cRefs.current[i-1]?.focus()}}
                  style={{ width:42,height:50,textAlign:"center",fontSize:20,fontWeight:700,fontFamily:"monospace",background:c?C.glow:C.s,border:"2px solid "+(c?C.a:C.b),borderRadius:10,color:C.t,outline:"none" }}/>
              ))}
            </div>
            {loading && <div style={{ fontSize:12, color:C.d, marginBottom:8 }}>Verificando...</div>}
            {err && <div style={{ fontSize:12, color:C.r, marginBottom:8 }}>{err}</div>}
            <div style={{ marginTop:8 }}>
              {countdown>0 ? <span style={{ fontSize:12, color:"#555" }}>Reenviar en {cMin}:{cSec}</span>
               : resends<3 ? <button onClick={resend} style={{ background:"none",border:"none",color:C.a,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Reenviar código</button>
               : <span style={{ fontSize:12, color:"#555" }}>Demasiados intentos</span>}
            </div>
            <button onClick={()=>{setStep(0);setCode(["","","","","",""]);setErr("");}} style={{ marginTop:16,background:"none",border:"none",color:C.d,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Volver al inicio</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function Overview({ stats, users, loading, views }) {
  if (loading) return <Spinner />;
  const card = { background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"20px 16px" };
  const lbl  = { fontSize:11, color:C.d, marginTop:4 };
  const pc   = stats?.planCounts || {};
  const growth = stats?.growth || [];

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Resumen</h2>
      {/* Card Visitas */}
      {(()=>{
        const raw = views.sparkline||[0,0,0,0,0,0,0];
        const tod = views.today||0;
        const yest = views.yesterday||0;
        const diff = yest===0 ? null : tod - yest;
        const pct  = yest===0 ? null : Math.round(((tod-yest)/yest)*100);
        const up   = diff===null ? null : diff>=0;

        // SVG sparkline con curva suave
        const W=200, H=56, pad=6;
        const maxV = Math.max(...raw,1);
        const pts = raw.map((v,i)=>[
          pad + (i/(raw.length-1))*(W-pad*2),
          H - pad - ((v/maxV)*(H-pad*2))
        ]);

        // Catmull-Rom smooth path
        const smooth = pts.map((p,i,a)=>{
          if(i===0) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
          const p0=a[Math.max(0,i-1)], p1=a[i], p2=a[Math.min(a.length-1,i+1)];
          const cp1x=(p0[0]+p1[0])/2, cp1y=(p0[1]+p1[1])/2;
          const cp2x=(p1[0]+p2[0])/2, cp2y=(p1[1]+p2[1])/2;
          return `C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`;
        }).join(" ");
        const area = `${smooth} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;

        return (
        <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"16px 20px", marginBottom:16 }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:14, opacity:0.55 }}>
            <Activity size={11} color={C.a}/>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.09em", textTransform:"uppercase", color:C.d }}>Visitas al sitio web</span>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            {/* KPI */}
            <div style={{ flexShrink:0, minWidth:150 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:42, fontWeight:800, color:C.a, lineHeight:1 }}>{tod.toLocaleString()}</span>
                <span style={{ fontSize:11, color:C.d, paddingBottom:2 }}>hoy</span>
              </div>

              {/* Tendencia */}
              <div style={{ marginTop:5, minHeight:18 }}>
                {diff!==null ? (
                  <span style={{ fontSize:12, fontWeight:500, color:up?"#4ADE80":"#F87171", display:"inline-flex", alignItems:"center", gap:3 }}>
                    {up?"↑":"↓"} {up?"+":""}{diff} vs ayer
                    <span style={{ fontSize:10, opacity:0.55 }}>({up?"+":""}{pct}%)</span>
                  </span>
                ) : null}
              </div>

              {/* Métricas secundarias */}
              <div style={{ display:"flex", gap:14, marginTop:12, paddingTop:12, borderTop:"1px solid "+C.b }}>
                {[{l:"7d",v:views.week},{l:"Mes",v:views.month},{l:"Total",v:views.total}].map((m,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{ fontSize:11, color:C.d }}>{m.l}</span>
                    <span style={{ fontSize:14, fontWeight:600, color:C.t }}>{(m.v||0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sparkline */}
            <div style={{ flex:1 }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H, display:"block", overflow:"visible" }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.02"/>
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#sg)" style={{ transition:"d 0.5s ease" }}/>
                <path d={smooth} fill="none" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"d 0.5s ease" }}/>
                {pts.map((p,i)=>(
                  <circle key={i} cx={p[0]} cy={p[1]} r={i===pts.length-1?3:1.5}
                    fill={i===pts.length-1?"#4ADE80":"rgba(74,222,128,0.5)"}
                    style={{ transition:"all 0.3s" }}/>
                ))}
              </svg>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
                <span style={{ fontSize:10, color:C.d, opacity:0.45 }}>−6 días</span>
                <span style={{ fontSize:10, color:C.d, opacity:0.45 }}>hoy</span>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.a }}>{stats?.totalUsers ?? 0}</div><div style={lbl}>Total usuarios</div></div>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.a }}>${stats?.mrr ?? 0}</div><div style={lbl}>MRR</div></div>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.t }}>{stats?.newThisWeek ?? 0}</div><div style={lbl}>Nuevos esta semana</div></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:20 }}>
        {[{l:"Prueba",v:pc.trial||0,c:"#6B7280"},{l:"Básico",v:pc.basico||0,c:"#3B82F6"},{l:"Negocio",v:pc.negocio||0,c:C.a},{l:"Pro",v:pc.pro||0,c:"#F59E0B"},{l:"Cancelados",v:stats?.churnRate||0,c:C.r,suf:"%"}].map((p,i)=>(
          <div key={i} style={{ ...card, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:p.c }}>{p.v}{p.suf||""}</div>
            <div style={{ fontSize:9, color:C.d, marginTop:2 }}>{p.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        <div style={card}><div style={{ fontSize:12, color:C.d }}>Usuarios activos</div><div style={{ fontSize:20, fontWeight:700, marginTop:4 }}>{stats?.activeUsers ?? 0}</div></div>
        <div style={card}><div style={{ fontSize:12, color:C.d }}>Churn rate</div><div style={{ fontSize:20, fontWeight:700, marginTop:4, color:(stats?.churnRate||0)>10?C.r:C.t }}>{stats?.churnRate ?? 0}%</div></div>
      </div>

      {/* Ingresos por plan */}
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Ingresos por plan</div>
        {["basico","negocio","pro"].map((p,i)=>{
          const monthly = users.filter(u=>u.plan===p&&u.billing_cycle!=="annual").length;
          const annual  = users.filter(u=>u.plan===p&&u.billing_cycle==="annual").length;
          const total   = monthly*PLAN_PRICES[p] + Math.round(annual*(PLAN_ANNUAL[p]/12));
          const col     = p==="basico"?"#3B82F6":p==="negocio"?C.a:"#F59E0B";
          return (
            <div key={p} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:i<2?"1px solid "+C.b:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:col }}/>
                <span style={{ fontSize:13, fontWeight:600 }}>{PLAN_LABEL[p]}</span>
                <span style={{ fontSize:11, color:C.d }}>{monthly+annual} usuarios</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:C.a }}>${total}/mes</span>
            </div>
          );
        })}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, paddingTop:8, borderTop:"1px solid "+C.b }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.d }}>MRR total</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:C.a }}>${stats?.mrr ?? 0}</span>
        </div>
      </div>

      {/* Gráfico crecimiento */}
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Crecimiento de usuarios</div>
        {growth.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={growth}>
              <XAxis dataKey="m" tick={{fill:C.d,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.d,fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.s2,border:"1px solid "+C.b,borderRadius:8,fontSize:12}} formatter={v=>[v,"Usuarios"]}/>
              <Line type="monotone" dataKey="u" stroke={C.a} strokeWidth={2} dot={{fill:C.a,r:4}} name="Usuarios"/>
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState icon={BarChart3} text="Sin datos de crecimiento aún" />}
      </div>
    </div>
  );
}

// ── USUARIOS ──────────────────────────────────────────────────────────────────
function UsersSection({ users, loading, onSelect }) {
  const [search, setSearch]     = useState("");
  const [filterPlan, setFilter] = useState("all");

  const filtered = users.filter(u => {
    if (filterPlan!=="all" && u.plan!==filterPlan) return false;
    const q = search.toLowerCase();
    return !q || (u.business_name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q);
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Usuarios</h2>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={14} color={C.d} style={{ position:"absolute", left:12, top:13 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o email"
            style={{ width:"100%",padding:"10px 12px 10px 34px",borderRadius:10,border:"1px solid "+C.b,background:C.s,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}/>
        </div>
        <select value={filterPlan} onChange={e=>setFilter(e.target.value)}
          style={{ padding:"10px 12px",borderRadius:10,border:"1px solid "+C.b,background:C.s,color:C.t,fontSize:12,fontFamily:"inherit",outline:"none" }}>
          <option value="all">Todos</option>
          <option value="trial">Prueba</option>
          <option value="basico">Básico</option>
          <option value="negocio">Negocio</option>
          <option value="pro">Pro</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>
      <div style={{ fontSize:11, color:C.d, marginBottom:8 }}>{filtered.length} usuarios</div>
      {filtered.length===0
        ? <EmptyState icon={Users} text="Sin usuarios registrados aún" />
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {filtered.map(u=>(
              <button key={u.id} onClick={()=>onSelect(u)}
                style={{ background:C.s,border:"1px solid "+C.b,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%" }}>
                <div style={{ width:36,height:36,borderRadius:10,background:C.glow,border:"1px solid "+C.b,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:C.a,flexShrink:0 }}>{(u.business_name||"?")[0].toUpperCase()}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:13,fontWeight:600,color:C.t,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.business_name}</span>
                    <Badge plan={u.plan}/>
                    {u.billing_cycle && u.plan!=="trial" && <span style={{ fontSize:9,color:C.d,padding:"1px 4px",borderRadius:3,border:"1px solid "+C.b }}>{u.billing_cycle==="annual"?"Anual":"Mens."}</span>}
                  </div>
                  <div style={{ fontSize:11, color:C.d, marginTop:2 }}>{u.email}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.t }}>{u.messages_used||0}</div>
                  <div style={{ fontSize:9, color:C.d }}>msgs</div>
                </div>
                <ChevronRight size={14} color={C.d}/>
              </button>
            ))}
          </div>
        )}
    </div>
  );
}

function UserDetail({ user, onBack, onUpdate }) {
  const [plan, setPlan]       = useState(user.plan);
  const [newNote, setNewNote] = useState("");
  const isSusp = user.status==="suspended";
  const fields = [
    {l:"Plan",          v:user.plan,           color:true},
    {l:"Facturación",   v:user.billing_cycle==="annual"?"Anual":"Mensual"},
    {l:"Renovación",    v:user.plan_renews_at?.split("T")[0]||"—"},
    {l:"Monto",         v:user.billing_cycle==="annual"?"$"+(PLAN_ANNUAL[user.plan]||0)+"/año":"$"+(PLAN_PRICES[user.plan]||0)+"/mes"},
    {l:"Registro",      v:user.created_at?.split("T")[0]||"—"},
    {l:"Tipo negocio",  v:user.business_type||"—"},
    {l:"Email verificado", v:user.email_verified?"Sí":"No"},
    {l:"Mensajes usados",  v:user.messages_used||0},
    {l:"Límite mensajes",  v:user.messages_limit||0},
    {l:"Estado",        v:user.status},
  ];

  return (
    <div>
      <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.d,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:16 }}>
        <X size={14}/> Volver a la lista
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:48,height:48,borderRadius:14,background:C.glow,border:"1px solid "+C.b,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:C.a }}>{(user.business_name||"?")[0].toUpperCase()}</div>
        <div><div style={{ fontSize:18, fontWeight:700 }}>{user.business_name}</div><div style={{ fontSize:12, color:C.d }}>{user.email}</div></div>
      </div>
      {isSusp && (
        <div style={{ background:C.r+"10",border:"1px solid "+C.r+"25",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8 }}>
          <AlertTriangle size={14} color={C.r}/>
          <span style={{ fontSize:12, color:C.r, fontWeight:600 }}>Cuenta suspendida</span>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
        {fields.map((f,i)=>(
          <div key={i} style={{ background:C.s,border:"1px solid "+C.b,borderRadius:10,padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:C.d, marginBottom:4 }}>{f.l}</div>
            {f.color?<Badge plan={String(f.v)}/>:<div style={{ fontSize:14, fontWeight:600 }}>{String(f.v)}</div>}
          </div>
        ))}
      </div>

      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Acciones</div>
      <div style={{ background:C.s,border:"1px solid "+C.b,borderRadius:12,padding:"14px 16px",marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:6 }}>Cambiar plan</div>
        <div style={{ display:"flex", gap:6 }}>
          <select value={plan} onChange={e=>setPlan(e.target.value)}
            style={{ flex:1,padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none" }}>
            {["trial","basico","negocio","pro"].map(p=><option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
          </select>
          <button onClick={()=>onUpdate({...user,plan,status:plan==="trial"?"trial":"active"})}
            style={{ padding:"10px 16px",borderRadius:8,border:"none",background:C.a,color:C.bg,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Aplicar</button>
        </div>
      </div>
      {isSusp
        ? <button onClick={()=>onUpdate({...user,status:"active",plan:user.previous_plan||"basico"})}
            style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.a+"40",background:C.glow,color:C.a,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}><Play size={12}/> Reactivar</button>
        : user.plan!=="cancelled"&&<button onClick={()=>onUpdate({...user,status:"suspended"})}
            style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.r+"25",background:C.r+"08",color:C.r,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}><Pause size={12}/> Suspender</button>}
      <button style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}><Mail size={12}/> Enviar email</button>
    </div>
  );
}

// ── FINANZAS ──────────────────────────────────────────────────────────────────
function Finanzas({ users, expenses, stats, loading }) {
  const [view, setView] = useState("ambos");
  if (loading) return <Spinner />;

  const mrrRows = [];
  ["basico","negocio","pro"].forEach(p=>{
    const monthly = users.filter(u=>u.plan===p&&u.billing_cycle!=="annual"&&u.status==="active").length;
    const annual  = users.filter(u=>u.plan===p&&u.billing_cycle==="annual"&&u.status==="active").length;
    const mEq     = +(PLAN_ANNUAL[p]/12).toFixed(2);
    const col     = p==="basico"?"#3B82F6":p==="negocio"?C.a:"#F59E0B";
    if(monthly) mrrRows.push({label:PLAN_LABEL[p]+" Mensual",count:monthly,unit:PLAN_PRICES[p],total:monthly*PLAN_PRICES[p],color:col});
    if(annual)  mrrRows.push({label:PLAN_LABEL[p]+" Anual",  count:annual, unit:mEq, total:+(annual*mEq).toFixed(2),color:col});
  });

  const mrr           = mrrRows.reduce((s,r)=>s+r.total,0);
  const totalExpenses = expenses.reduce((s,e)=>s+(e.amount||0),0);
  const net           = mrr - totalExpenses;
  const card          = { background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"14px 16px" };

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Finanzas</h2>

      {/* Toggle */}
      <div style={{ display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid "+C.b,marginBottom:16 }}>
        {["ingresos","egresos","ambos"].map(v=>(
          <button key={v} onClick={()=>setView(v)}
            style={{ flex:1,padding:"8px 0",border:"none",background:view===v?C.glow:"transparent",color:view===v?C.a:C.d,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",borderRight:v!=="ambos"?"1px solid "+C.b:"none",textTransform:"capitalize" }}>{v}</button>
        ))}
      </div>

      {/* Ganancia neta */}
      <div style={{ ...card,textAlign:"center",marginBottom:16,background:net>=0?C.glow:C.r+"08",border:"1px solid "+(net>=0?C.a+"25":C.r+"25") }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:4 }}>Ganancia neta del mes</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:net>=0?C.a:C.r }}>${net.toFixed(0)}</div>
        <div style={{ fontSize:11, color:C.d, marginTop:4 }}>${mrr.toFixed(0)} MRR − ${totalExpenses.toFixed(0)} egresos</div>
      </div>

      {/* Ingresos */}
      {(view==="ingresos"||view==="ambos") && (
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Ingresos</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div style={card}><div style={{ fontSize:10, color:C.d }}>MRR actual</div><div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.a, marginTop:2 }}>${mrr.toFixed(0)}</div></div>
            <div style={card}><div style={{ fontSize:10, color:C.d }}>Usuarios activos</div><div style={{ fontSize:22, fontWeight:800, color:C.a, marginTop:2 }}>{stats?.activeUsers??0}</div></div>
          </div>
          {mrrRows.length>0 ? (
            <div style={{ ...card, marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.d, marginBottom:4 }}>MRR por plan</div>
              {mrrRows.map((m,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i<mrrRows.length-1?"1px solid "+C.b:"none" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:8,height:8,borderRadius:2,background:m.color }}/><span style={{ fontSize:12,fontWeight:600 }}>{m.label}</span><span style={{ fontSize:10,color:C.d }}>{m.count}×${m.unit}</span></div>
                  <span style={{ fontSize:13,fontWeight:700,color:C.a }}>${m.total}</span>
                </div>
              ))}
            </div>
          ) : <div style={{ marginBottom:16 }}><EmptyState icon={DollarSign} text="Sin usuarios de pago aún" /></div>}
        </div>
      )}

      {/* Egresos */}
      {(view==="egresos"||view==="ambos") && (
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Egresos</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            <div style={card}><div style={{ fontSize:10, color:C.d }}>Total este mes</div><div style={{ fontSize:22, fontWeight:800, color:C.r, marginTop:2 }}>${totalExpenses.toFixed(0)}</div></div>
            <div style={card}><div style={{ fontSize:10, color:C.d }}>Registros</div><div style={{ fontSize:22, fontWeight:800, marginTop:2 }}>{expenses.length}</div></div>
          </div>
          {totalExpenses>0 && (
            <div style={{ ...card, marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.d, marginBottom:6 }}>Por categoría</div>
              {EXP_CATS.map(cat=>{
                const t = expenses.filter(e=>e.category===cat.v).reduce((s,e)=>s+(e.amount||0),0);
                if(!t) return null;
                return <div key={cat.v} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0" }}><span style={{ fontSize:12,display:"flex",alignItems:"center",gap:4 }}><cat.Icon size={12} color={C.d}/> {cat.l}</span><span style={{ fontSize:13,fontWeight:600 }}>${t.toFixed(2)}</span></div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── EGRESOS ───────────────────────────────────────────────────────────────────
function Expenses({ expenses, setExpenses, loading, authFetch }) {
  const [showForm,  setShowForm]  = useState(false);
  const [cat,       setCat]       = useState("infra");
  const [desc,      setDesc]      = useState("");
  const [amount,    setAmount]    = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);

  const total = expenses.reduce((s,e)=>s+(e.amount||0),0);
  const card  = { background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"14px 16px" };
  const fi    = { width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8 };

  const addExpense = async () => {
    if (!desc||!amount) return;
    setSaving(true);
    try {
      const data = await authFetch("/api/admin/expenses", {
        method:"POST",
        body:JSON.stringify({ category:cat, description:desc, amount:parseFloat(amount), date, recurring, notes }),
      });
      setExpenses(prev=>[data,...prev]);
      setDesc(""); setAmount(""); setNotes(""); setShowForm(false);
    } catch(err) { console.error(err); }
    setSaving(false);
  };

  const deleteExpense = async (id) => {
    try {
      await authFetch(`/api/admin/expenses/${id}`, { method:"DELETE" });
      setExpenses(prev=>prev.filter(e=>e.id!==id));
    } catch(err) { console.error(err); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>Egresos</h2>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ padding:"6px 12px",borderRadius:8,border:"1px solid "+C.a+"40",background:C.glow,color:C.a,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>+ Registrar</button>
      </div>

      <div style={{ ...card,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <span style={{ fontSize:13, color:C.d }}>Total egresos registrados</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:C.r }}>${total.toFixed(2)}</span>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Nuevo egreso</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:8 }}>
            {EXP_CATS.map(c=>(
              <button key={c.v} onClick={()=>setCat(c.v)}
                style={{ padding:"8px",borderRadius:8,border:"1.5px solid "+(cat===c.v?C.a:C.b),background:cat===c.v?C.glow:"transparent",color:cat===c.v?C.a:C.t,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:5 }}>
                <c.Icon size={13} color={cat===c.v?C.a:C.d}/> {c.l}
              </button>
            ))}
          </div>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción" style={fi}/>
          <div style={{ display:"flex", gap:6 }}>
            <div style={{ flex:1, position:"relative" }}>
              <span style={{ position:"absolute",left:12,top:10,color:C.d,fontSize:13 }}>$</span>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{...fi,paddingLeft:24}}/>
            </div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...fi,flex:1}}/>
          </div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}><RefreshCw size={12} color={C.d}/><span style={{ fontSize:12 }}>Recurrente</span></div>
            <button onClick={()=>setRecurring(!recurring)} style={{ width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",background:recurring?C.a:"#333",position:"relative" }}>
              <div style={{ width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:recurring?18:2,transition:"left 0.2s" }}/>
            </button>
          </div>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas (opcional)" style={fi}/>
          <button onClick={addExpense} disabled={!desc||!amount||saving}
            style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:desc&&amount?C.a:C.b,color:desc&&amount?C.bg:C.d,fontSize:13,fontWeight:600,cursor:desc&&amount?"pointer":"default",fontFamily:"inherit" }}>
            {saving?"Guardando...":"Guardar egreso"}
          </button>
        </div>
      )}

      {expenses.length===0
        ? <EmptyState icon={Minus} text="Sin egresos registrados. Agrega el primero." />
        : (
          <div>
            <div style={{ ...card, marginBottom:12 }}>
              <div style={{ fontSize:12, color:C.d, marginBottom:8 }}>Por categoría</div>
              {EXP_CATS.map(c=>{
                const items    = expenses.filter(e=>e.category===c.v);
                if(!items.length) return null;
                const catTotal = items.reduce((s,e)=>s+(e.amount||0),0);
                return (
                  <div key={c.v} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                      <span style={{ fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4 }}><c.Icon size={12} color={C.d}/> {c.l}</span>
                      <span style={{ fontSize:12,fontWeight:600 }}>${catTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Todos los egresos</div>
            {expenses.map(e=>{
              const ci = EXP_CATS.find(c=>c.v===e.category);
              return (
                <div key={e.id} style={{ background:C.s,border:"1px solid "+C.b,borderRadius:10,padding:"10px 14px",marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4 }}>{e.recurring&&<RefreshCw size={10} color={C.a}/>}{e.description}</div>
                    <div style={{ fontSize:10,color:C.d,display:"flex",alignItems:"center",gap:3 }}>{ci?<ci.Icon size={10}/>:null} {ci?ci.l:""} · {e.date}</div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                    <span style={{ fontSize:13,fontWeight:700 }}>${(e.amount||0).toFixed(2)}</span>
                    <button onClick={()=>deleteExpense(e.id)} style={{ background:"none",border:"none",cursor:"pointer",color:C.d,padding:4 }}><Trash2 size={13}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ── SISTEMA ───────────────────────────────────────────────────────────────────
function SystemStatus({ systemStatus, setSystemStatus, loading, authFetch }) {
  const [health,        setHealth]        = useState([]);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked,   setLastChecked]   = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [service,       setService]       = useState("");
  const [status,        setStatus]        = useState("operational");
  const [desc,          setDesc]          = useState("");
  const [saving,        setSaving]        = useState(false);

  const card = { background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"14px 16px" };
  const fi   = { width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8 };

  const statusInfo = {
    operational: { label:"Operacional", color:C.a,       Icon:CheckCircle },
    degraded:    { label:"Degradado",   color:"#F59E0B", Icon:AlertCircle },
    outage:      { label:"Caída",       color:C.r,       Icon:XCircle },
  };

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const data = await authFetch("/api/admin/health-check");
      setHealth(data);
      setLastChecked(new Date());
    } catch(err) { console.error(err); }
    setHealthLoading(false);
  };

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 30000);
    return () => clearInterval(t);
  }, []);

  const addStatus = async () => {
    if (!service) return;
    setSaving(true);
    try {
      const data = await authFetch("/api/admin/system-status", { method:"POST", body:JSON.stringify({ service, status, description:desc }) });
      setSystemStatus(prev=>[data,...prev]);
      setService(""); setDesc(""); setShowForm(false);
    } catch(err) { console.error(err); }
    setSaving(false);
  };

  const resolve = async (id) => {
    try {
      const data = await authFetch(`/api/admin/system-status/${id}/resolve`, { method:"PATCH" });
      setSystemStatus(prev=>prev.map(s=>s.id===id?data:s));
    } catch(err) { console.error(err); }
  };

  const deleteStatus = async (id) => {
    try {
      await authFetch(`/api/admin/system-status/${id}`, { method:"DELETE" });
      setSystemStatus(prev=>prev.filter(s=>s.id!==id));
    } catch(err) { console.error(err); }
  };

  if (loading) return <Spinner />;

  const allOk   = health.length > 0 && health.every(h=>h.ok);
  const anyDown = health.some(h=>!h.ok);
  const active  = systemStatus.filter(s=>s.status!=="operational");
  const resolved = systemStatus.filter(s=>s.status==="operational");

  // Servicios siempre visibles — se actualizan con datos reales
  const SERVICES = [
    { name:"Supabase",      Icon:Database,       desc:"Base de datos" },
    { name:"Railway (API)", Icon:Server,          desc:"Backend / API" },
    { name:"Resend",        Icon:Mail,            desc:"Emails transaccionales" },
    { name:"WhatsApp Meta", Icon:MessageSquare,   desc:"Mensajería WhatsApp" },
    { name:"Claude API",    Icon:Cpu,             desc:"Inteligencia artificial" },
  ];

  // Progreso hacia el siguiente refresh (0-100)
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { return 0; }
        return p + (100 / (30 * 10)); // 30s ÷ 100ms ticks
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getServiceStatus = (name) => health.find(h=>h.service===name);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>Sistema</h2>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <button onClick={checkHealth}
            style={{ padding:"6px 10px",borderRadius:8,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:11,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4 }}>
            <RefreshCw size={11} style={healthLoading?{animation:"spin 1s linear infinite"}:{}}/> Verificar
          </button>
          <button onClick={()=>setShowForm(!showForm)}
            style={{ padding:"6px 12px",borderRadius:8,border:"1px solid "+C.a+"40",background:C.glow,color:C.a,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>+ Reportar</button>
        </div>
      </div>

      {/* Banner estado general */}
      <div style={{ ...card,marginBottom:20,display:"flex",alignItems:"center",gap:12,background:anyDown?C.r+"08":allOk?C.glow:C.s2,border:"1px solid "+(anyDown?C.r+"30":allOk?C.a+"30":C.b) }}>
        <div style={{ width:14,height:14,borderRadius:"50%",background:anyDown?C.r:healthLoading?"#F59E0B":allOk?C.a:C.d,flexShrink:0,
          boxShadow:anyDown?`0 0 8px ${C.r}`:`0 0 8px ${allOk&&!healthLoading?C.a:"#F59E0B"}`,
          animation:"pulse 2s infinite" }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14,fontWeight:600,color:anyDown?C.r:healthLoading?"#F59E0B":allOk?C.a:C.t }}>
            {healthLoading&&health.length===0 ? "Verificando servicios..."
             : anyDown ? `${health.filter(h=>!h.ok).length} servicio${health.filter(h=>!h.ok).length>1?"s":""} con problemas`
             : "Todos los servicios operativos ✓"}
          </div>
          <div style={{ fontSize:10,color:C.d,marginTop:2 }}>
            {lastChecked ? `Última verificación: ${lastChecked.toLocaleTimeString("es-EC")} · Auto-refresca cada 30s` : "Conectando..."}
          </div>
        </div>
      </div>

      {/* Grid de servicios — siempre visible */}
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:12 }}>Servicios en tiempo real</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
        {SERVICES.map(svc => {
          const h    = getServiceStatus(svc.name);
          const isOk     = h?.ok === true;
          const isDown   = h?.ok === false;
          const isLoading = !h;
          const dotColor  = isLoading ? "#6B7280" : isOk ? C.a : isDown ? C.r : "#F59E0B";
          const borderCol = isLoading ? C.b : isOk ? C.a+"25" : C.r+"40";
          const bgCol     = isLoading ? "transparent" : isOk ? C.a+"04" : C.r+"08";

          return (
            <div key={svc.name} style={{ background:bgCol, border:"1px solid "+borderCol, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:12, transition:"all 0.4s", position:"relative", overflow:"hidden" }}>
              {/* Barra de progreso — indica tiempo hasta próximo refresh */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:C.b }}>
                <div style={{ height:"100%", width:progress+"%", background:isDown?C.r:isOk?C.a:C.d, transition:"width 0.1s linear", opacity:0.5 }}/>
              </div>
              {/* Icono + indicador */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, paddingTop:2 }}>
                <svc.Icon size={18} color={isDown?C.r:isOk?C.a:C.d} strokeWidth={1.5}/>
                <div style={{ width:8, height:8, borderRadius:"50%", background:dotColor, flexShrink:0,
                  boxShadow: isOk ? `0 0 5px ${C.a}` : isDown ? `0 0 5px ${C.r}` : "none",
                  animation: isLoading||healthLoading ? "pulse 0.8s infinite" : isOk ? "pulse 3s infinite" : "none" }}/>
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:isDown?C.r:C.t }}>{svc.name}</div>
                <div style={{ fontSize:11, color:C.d, marginTop:1 }}>{svc.desc}</div>
                <div style={{ fontSize:11, marginTop:4, color: isDown ? C.r : isOk ? C.a : C.d, fontWeight: isDown ? 600 : 400 }}>
                  {isLoading ? "Verificando..." : h.detail}
                </div>
              </div>
              {/* Latencia */}
              {h && (
                <div style={{ flexShrink:0, textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color: h.latency<200?C.a:h.latency<600?"#F59E0B":C.r }}>{h.latency}ms</div>
                  <div style={{ fontSize:9, color:C.d }}>latencia</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulario nuevo incidente */}
      {showForm && (
        <div style={{ ...card,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:600,marginBottom:10 }}>Registrar incidente</div>
          <input value={service} onChange={e=>setService(e.target.value)} placeholder="Servicio afectado" style={fi}/>
          <div style={{ display:"flex",gap:6,marginBottom:8 }}>
            {Object.entries(statusInfo).map(([k,v])=>(
              <button key={k} onClick={()=>setStatus(k)}
                style={{ flex:1,padding:"8px",borderRadius:8,border:"1.5px solid "+(status===k?v.color:C.b),background:status===k?v.color+"18":"transparent",color:status===k?v.color:C.d,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{v.label}</button>
            ))}
          </div>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción (opcional)" style={fi}/>
          <button onClick={addStatus} disabled={!service||saving}
            style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:service?C.a:C.b,color:service?C.bg:C.d,fontSize:13,fontWeight:600,cursor:service?"pointer":"default",fontFamily:"inherit" }}>
            {saving?"Guardando...":"Registrar incidente"}
          </button>
        </div>
      )}

      {/* Incidentes activos manuales */}
      {active.length>0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:8, color:C.r }}>Incidentes activos</div>
          {active.map(s=>{
            const si = statusInfo[s.status]||statusInfo.outage;
            return (
              <div key={s.id} style={{ background:C.s,border:"1px solid "+si.color+"30",borderRadius:10,padding:"12px 14px",marginBottom:6 }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0 }}>
                    <si.Icon size={14} color={si.color}/>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600 }}>{s.service}</div>
                      <div style={{ fontSize:10,color:C.d }}>{si.label} · {new Date(s.started_at).toLocaleString("es-EC")}</div>
                      {s.description && <div style={{ fontSize:11,color:C.d,marginTop:2 }}>{s.description}</div>}
                    </div>
                  </div>
                  <button onClick={()=>resolve(s.id)}
                    style={{ padding:"4px 10px",borderRadius:6,border:"1px solid "+C.a+"40",background:C.glow,color:C.a,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>Resolver</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historial */}
      {resolved.length>0 && (
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:8, color:C.d }}>Historial de incidentes</div>
          {resolved.slice(0,10).map(s=>(
            <div key={s.id} style={{ background:C.s,border:"1px solid "+C.b,borderRadius:10,padding:"10px 14px",marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between",opacity:0.6 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <CheckCircle size={13} color={C.a}/>
                <div>
                  <div style={{ fontSize:12,fontWeight:600 }}>{s.service}</div>
                  <div style={{ fontSize:10,color:C.d }}>Resuelto · {s.resolved_at?new Date(s.resolved_at).toLocaleString("es-EC"):"—"}</div>
                </div>
              </div>
              <button onClick={()=>deleteStatus(s.id)} style={{ background:"none",border:"none",cursor:"pointer",color:C.d,padding:4 }}><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      )}

      {systemStatus.length===0&&health.length===0&&!healthLoading && <EmptyState icon={Activity} text="Sin registros. Todos los servicios operativos." />}
    </div>
  );
}

// ── CONFIG ────────────────────────────────────────────────────────────────────
function SysConfig({ authFetch, adminRole }) {
  const [activeTab,  setActiveTab]  = useState("cuenta");

  // ── Cuenta (todos) ──
  const [pwCurrent,  setPwCurrent]  = useState("");
  const [pwNew,      setPwNew]      = useState("");
  const [pwConfirm,  setPwConfirm]  = useState("");
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwMsg,      setPwMsg]      = useState("");
  const [pwErr,      setPwErr]      = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);

  // ── Equipo (owner) ──
  const [team,       setTeam]       = useState([]);
  const [invEmail,   setInvEmail]   = useState("");
  const [invRole,    setInvRole]    = useState("soporte");
  const [invSending, setInvSending] = useState(false);
  const [invDone,    setInvDone]    = useState(false);
  const [invErr,     setInvErr]     = useState("");

  // ── Sistema (owner) ──
  const [maint,      setMaint]      = useState(false);
  const [maintMsg,   setMaintMsg]   = useState("Estamos realizando mejoras. Volvemos en unos minutos.");
  const [prices,     setPrices]     = useState({basico:29,negocio:59,pro:99});
  const [limits,     setLimits]     = useState({basico:500,negocio:2000,pro:99999});

  const fi   = { padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",width:80,textAlign:"center" };
  const fiw  = { width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box" };
  const card = { background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"16px",marginBottom:12 };

  useEffect(()=>{
    if (((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")) authFetch("/api/admin/team").then(setTeam).catch(()=>{});
  },[]);

  const changePassword = async () => {
    if (!pwCurrent||!pwNew||pwNew!==pwConfirm) return;
    if (pwNew.length<8) { setPwErr("Mínimo 8 caracteres"); return; }
    setPwLoading(true); setPwErr(""); setPwMsg("");
    try {
      await authFetch("/api/admin/change-password", { method:"POST", body:JSON.stringify({ current_password:pwCurrent, new_password:pwNew }) });
      setPwMsg("Contraseña actualizada ✓");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch { setPwErr("Contraseña actual incorrecta"); }
    setPwLoading(false);
  };

  const sendInvite = async () => {
    if (!invEmail) return;
    setInvSending(true); setInvErr(""); setInvDone(false);
    try {
      await authFetch("/api/admin/invite", { method:"POST", body:JSON.stringify({ email:invEmail, role:invRole }) });
      setInvDone(true); setInvEmail("");
      authFetch("/api/admin/team").then(setTeam).catch(()=>{});
    } catch { setInvErr("Error al enviar la invitación"); }
    setInvSending(false);
  };

  const revokeAccess = async (id) => {
    try {
      await authFetch(`/api/admin/team/${id}`, { method:"DELETE" });
      setTeam(prev=>prev.filter(m=>m.id!==id));
    } catch(err) { console.error(err); }
  };

  // Tabs disponibles según rol
  const tabs = ((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")
    ? [{id:"cuenta",label:"Cuenta",Icon:User},{id:"equipo",label:"Equipo",Icon:Users},{id:"sistema",label:"Sistema",Icon:Settings}]
    : [{id:"cuenta",label:"Cuenta",Icon:User}];

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,marginBottom:20 }}>Configuración</h2>

      {/* Tabs */}
      <div style={{ display:"flex",gap:4,marginBottom:24,background:C.s,borderRadius:12,padding:4,border:"1px solid "+C.b }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ flex:1,padding:"9px 0",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeTab===t.id?C.bg:"transparent",color:activeTab===t.id?C.a:C.d,fontSize:13,fontWeight:activeTab===t.id?600:500,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:activeTab===t.id?"0 1px 4px rgba(0,0,0,0.3)":"none" }}>
            <t.Icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CUENTA ── */}
      {activeTab==="cuenta" && (
        <div>
          <div style={card}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:6 }}><Lock size={14} color={C.a}/> Cambiar contraseña</div>
            {[
              {label:"Contraseña actual", val:pwCurrent, set:setPwCurrent, show:showCur, toggle:()=>setShowCur(!showCur)},
              {label:"Nueva contraseña",  val:pwNew,     set:setPwNew,     show:showNew, toggle:()=>setShowNew(!showNew)},
              {label:"Confirmar nueva",   val:pwConfirm, set:setPwConfirm, show:false,   toggle:null},
            ].map((f,i)=>(
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ fontSize:11,color:C.d,marginBottom:4 }}>{f.label}</div>
                <div style={{ position:"relative" }}>
                  <input type={f.show?"text":"password"} value={f.val} onChange={e=>f.set(e.target.value)}
                    style={{...fiw, paddingRight:f.toggle?40:12}}/>
                  {f.toggle && <button onClick={f.toggle} style={{ position:"absolute",right:10,top:10,background:"none",border:"none",cursor:"pointer",color:C.d }}>
                    {f.show?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>}
                </div>
              </div>
            ))}
            {pwNew && pwConfirm && pwNew!==pwConfirm && <div style={{ fontSize:11,color:C.r,marginBottom:6 }}>Las contraseñas no coinciden</div>}
            {pwErr && <div style={{ fontSize:11,color:C.r,marginBottom:6 }}>{pwErr}</div>}
            {pwMsg && <div style={{ fontSize:11,color:C.a,marginBottom:6 }}>{pwMsg}</div>}
            <button onClick={changePassword} disabled={!pwCurrent||!pwNew||pwNew!==pwConfirm||pwLoading}
              style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:pwCurrent&&pwNew&&pwNew===pwConfirm?C.a:C.b,color:pwCurrent&&pwNew&&pwNew===pwConfirm?C.bg:C.d,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4 }}>
              {pwLoading?"Guardando...":"Guardar contraseña"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB EQUIPO (owner) ── */}
      {activeTab==="equipo" && ((adminRole==="owner"||adminRole==="admin")||adminRole==="admin") && (
        <div>
          <div style={card}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}><UserPlus size={14} color={C.a}/> Invitar miembro</div>
            <div style={{ display:"flex",gap:6,marginBottom:8 }}>
              <input value={invEmail} onChange={e=>setInvEmail(e.target.value)} placeholder="email@cleoia.app"
                style={{...fiw, flex:1}}/>
              <select value={invRole} onChange={e=>setInvRole(e.target.value)}
                style={{ padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:12,fontFamily:"inherit",outline:"none" }}>
                <option value="soporte">Soporte</option>
                <option value="owner">Dueño</option>
              </select>
            </div>
            {invErr  && <div style={{ fontSize:11,color:C.r,marginBottom:6 }}>{invErr}</div>}
            {invDone && <div style={{ fontSize:11,color:C.a,marginBottom:6 }}>✓ Invitación enviada</div>}
            <button onClick={sendInvite} disabled={!invEmail||invSending}
              style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:invEmail?C.a:C.b,color:invEmail?C.bg:C.d,fontSize:13,fontWeight:600,cursor:invEmail?"pointer":"default",fontFamily:"inherit" }}>
              {invSending?"Enviando...":"Enviar invitación"}
            </button>
          </div>

          {team.length>0 && (
            <div style={card}>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}><Users size={14} color={C.a}/> Miembros actuales</div>
              {team.map((m,i)=>(
                <div key={m.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<team.length-1?"1px solid "+C.b:"none" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:C.glow,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      {m.role==="owner"?<ShieldCheck size={14} color="#F59E0B"/>:<Headphones size={14} color={C.a}/>}
                    </div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600 }}>{m.email}</div>
                      <div style={{ fontSize:11,color:C.d }}>
                        {m.role==="owner"?"Administrador":"Soporte"} · {m.active?"Activo":"Pendiente"}
                        {m.last_login_at&&" · "+new Date(m.last_login_at).toLocaleDateString("es-EC")}
                      </div>
                    </div>
                  </div>
                  {m.role!=="owner" && (
                    <button onClick={()=>revokeAccess(m.id)}
                      style={{ padding:"4px 10px",borderRadius:6,border:"1px solid "+C.r+"25",background:C.r+"08",color:C.r,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                      Revocar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB SISTEMA (owner) ── */}
      {activeTab==="sistema" && ((adminRole==="owner"||adminRole==="admin")||adminRole==="admin") && (
        <div>
          {/* Mantenimiento */}
          <div style={card}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:maint?12:0 }}>
              <div>
                <div style={{ fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6 }}><AlertTriangle size={14} color={maint?C.r:C.d}/> Modo mantenimiento</div>
                <div style={{ fontSize:11,color:C.d,marginTop:2 }}>Bloquea acceso a todos los usuarios</div>
              </div>
              <button onClick={()=>setMaint(!maint)} style={{ width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",background:maint?C.r:"#333",position:"relative" }}>
                <div style={{ width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:maint?20:2,transition:"left 0.2s" }}/>
              </button>
            </div>
            {maint && <textarea value={maintMsg} onChange={e=>setMaintMsg(e.target.value)} rows={2}
              style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"vertical",marginTop:8 }}/>}
          </div>

          {/* Precios */}
          <div style={card}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}><DollarSign size={14} color={C.a}/> Precios por plan</div>
            {["basico","negocio","pro"].map(p=>(
              <div key={p} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0" }}>
                <span style={{ fontSize:13,fontWeight:600 }}>{PLAN_LABEL[p]}</span>
                <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                  <span style={{ fontSize:13,color:C.d }}>$</span>
                  <input type="number" value={prices[p]} onChange={e=>setPrices({...prices,[p]:parseInt(e.target.value)||0})} style={fi}/>
                  <span style={{ fontSize:11,color:C.d }}>/mes</span>
                </div>
              </div>
            ))}
          </div>

          {/* Límites */}
          <div style={card}>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}><MessageSquare size={14} color={C.a}/> Límite de conversaciones</div>
            {["basico","negocio","pro"].map(p=>(
              <div key={p} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0" }}>
                <span style={{ fontSize:13,fontWeight:600 }}>{PLAN_LABEL[p]}</span>
                <input type="number" value={limits[p]} onChange={e=>setLimits({...limits,[p]:parseInt(e.target.value)||0})} style={fi}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function CleoAdmin() {
  const [theme,        setTheme]        = useState("dark");
  const prefersDark = typeof window!=="undefined"&&window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved    = theme==="system"?(prefersDark?"dark":"light"):theme;
  C = T[resolved];
  const cycleTheme  = () => setTheme(t=>t==="dark"?"light":t==="light"?"system":"dark");

  const [authed,       setAuthed]       = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [logoutModal,    setLogoutModal]    = useState(false);
  const [initializing,  setInitializing]  = useState(true);
  const [adminRole,    setAdminRole]    = useState('owner');
  const [adminEmail,   setAdminEmail]   = useState('');

  // Auto-login si hay token válido en localStorage
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setAuthed(true);
          setAdminRole(payload.role || 'owner');
          setAdminEmail(payload.email || '');
        } else {
          localStorage.removeItem("adminToken");
        }
      } catch { localStorage.removeItem("adminToken"); }
    }
    setInitializing(false);
  }, []);

  const [tab,          setTab]          = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const mob = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // ── Data real ──
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [systemStatus, setSystemStatus] = useState([]);
  const [views, setViews] = useState({ total:0, today:0, week:0, month:0, topReferrers:[] });
  const [loading,      setLoading]      = useState(false);

  // Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        setAuthed(true);
        setAdminRole(payload.role || 'owner');
        setAdminEmail(payload.email || '');
      } else {
        localStorage.removeItem("adminToken");
      }
    } catch { localStorage.removeItem("adminToken"); }
  }, []);

  const API = import.meta.env.VITE_API_URL;

  const authFetch = async (path, opts = {}) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}`, ...(opts.headers||{}) },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, expensesData, statusData, viewsData] = await Promise.all([
        authFetch("/api/admin/stats"),
        authFetch("/api/admin/users"),
        authFetch("/api/admin/expenses"),
        authFetch("/api/admin/system-status"),
        authFetch("/api/admin/views-stats").catch(()=>({ total:0, today:0, week:0, month:0, topReferrers:[] })),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setExpenses(expensesData);
      setSystemStatus(statusData);
      if (viewsData) setViews(viewsData);
    } catch(err) { console.error("Error cargando datos:", err); }
    setLoading(false);
  };

  useEffect(()=>{
    if (authed) loadData();
  }, [authed]);

  // Actualizar visitas cada 30 segundos
  useEffect(()=>{
    if (!authed) return;
    const interval = setInterval(()=>{
      authFetch("/api/admin/views-stats")
        .then(d => { if(d) setViews(d); })
        .catch(()=>{});
    }, 30000);
    return () => clearInterval(interval);
  }, [authed]);

  useEffect(()=>{
    const s=document.createElement("style");
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes gradBreathe{0%{background-position:0% 50%;filter:brightness(1)}50%{background-position:100% 50%;filter:brightness(1.2)}100%{background-position:0% 50%;filter:brightness(1)}}@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}*{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;width:100%;max-width:100vw}::-webkit-scrollbar{display:none}`;
    document.head.appendChild(s); return()=>document.head.removeChild(s);
  },[]);

  const updateUser = async (updated) => {
    try {
      await authFetch(`/api/admin/users/${updated.id}`, {
        method:"PATCH",
        body:JSON.stringify({ plan:updated.plan, status:updated.status }),
      });
      setUsers(all=>all.map(u=>u.id===updated.id?{...u,...updated}:u));
      setSelectedUser({...selectedUser,...updated});
    } catch(err) { console.error(err); }
  };

  if (initializing) return <div style={{ background:'#080808', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid #4ADE80', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/></div>;
  if (!authed) return <AdminLogin onLogin={(email, role)=>{ setAuthed(true); setAdminRole(role||'owner'); setAdminEmail(email); }}/>

  const TIcon = resolved==="dark"?Moon:resolved==="light"?Sun:Settings;

  const allTabs = [
    {id:"overview", label:"Resumen",  Icon:BarChart3,   roles:["owner"]},
    {id:"users",    label:"Usuarios", Icon:Users,       roles:["owner","soporte"]},
    {id:"finanzas", label:"Finanzas", Icon:DollarSign,  roles:["owner"]},
    {id:"expenses", label:"Egresos",  Icon:Minus,       roles:["owner"]},
    {id:"sistema",  label:"Sistema",  Icon:Activity,    roles:["owner","soporte"]},
    {id:"config",   label:"Config",   Icon:Settings,    roles:["owner","soporte"]},
  ];
  const effectiveRole = (adminRole==="admin") ? "owner" : adminRole;
  const tabs = allTabs.filter(t=>t.roles.includes(effectiveRole));

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t,minHeight:"100vh",display:"flex",flexDirection:mob?"column":"row",overflowX:"hidden",maxWidth:"100vw" }}>

    {logoutModal && (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20 }}>
        <div style={{ background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:16,padding:32,maxWidth:340,width:"100%",textAlign:"center" }}>
          
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:"#F9FAFB",marginBottom:8 }}>¿Cerrar sesión?</h3>
          <p style={{ fontSize:13,color:"#6B7280",marginBottom:24,lineHeight:1.5 }}>Tu sesión se cerrará y tendrás que volver a ingresar.</p>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>{ setLogoutModal(false); localStorage.removeItem("adminToken"); setAuthed(false); }} style={{ flex:1,padding:12,borderRadius:10,border:"none",background:"#4ADE80",color:"#080808",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Sí</button>
            <button onClick={()=>setLogoutModal(false)} style={{ flex:1,padding:12,borderRadius:10,border:"1px solid #1A1A1A",background:"transparent",color:"#6B7280",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>No</button>
          </div>
        </div>
      </div>
    )}

    {sessionExpired && (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20 }}>
        <div style={{ background:"#0D0D0D",border:"1px solid #1A1A1A",borderRadius:16,padding:36,maxWidth:360,width:"100%",textAlign:"center" }}>
          <div style={{ width:56,height:56,borderRadius:"50%",background:"rgba(74,222,128,0.1)",border:"1px solid rgba(74,222,128,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
            <Shield size={24} color="#4ADE80"/>
          </div>
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"#F9FAFB",marginBottom:8 }}>Sesión cerrada</h3>
          <p style={{ fontSize:13,color:"#6B7280",marginBottom:24,lineHeight:1.6 }}>Tu sesión fue cerrada por inactividad. Inicia sesión nuevamente para continuar.</p>
          <button onClick={()=>setSessionExpired(false)} style={{ width:"100%",padding:14,borderRadius:12,border:"none",background:"#4ADE80",color:"#080808",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            Iniciar sesión
          </button>
        </div>
      </div>
    )}

      {/* Sidebar desktop */}
      {!mob && (
        <div style={{ width:220,borderRight:"1px solid "+C.b,padding:"20px 12px",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:28,paddingLeft:8 }}><AdminLogo size={22}/></div>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelectedUser(null);}}
              style={{ width:"100%",padding:"10px 12px",borderRadius:10,border:"none",background:tab===t.id?C.glow:"transparent",color:tab===t.id?C.a:C.d,fontSize:13,fontWeight:tab===t.id?600:500,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,marginBottom:2,textAlign:"left" }}>
              <t.Icon size={16}/> {t.label}
            </button>
          ))}
          <div style={{ position:"absolute",bottom:16,left:12,right:12 }}>
            <div style={{ textAlign:"center",marginBottom:10,padding:"8px",borderRadius:8,background:((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")?"rgba(245,158,11,0.08)":"rgba(74,222,128,0.06)",border:"1px solid "+(((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")?"rgba(245,158,11,0.2)":"rgba(74,222,128,0.15)"),display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:6,background:((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")?"rgba(245,158,11,0.12)":C.glow,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")?<ShieldCheck size={14} color="#F59E0B"/>:<Headphones size={14} color={C.a}/>}
              </div>
              <div style={{ textAlign:"left",minWidth:0 }}>
                <div style={{ fontSize:11,fontWeight:700,color:((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")?"#F59E0B":C.a }}>{((adminRole==="owner"||adminRole==="admin")||adminRole==="admin")?"Administrador":"Soporte"}</div>
                <div style={{ fontSize:10,color:C.d,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{adminEmail}</div>
              </div>
            </div>
            <button onClick={()=>loadData()} style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
              <RefreshCw size={13}/> Actualizar
            </button>
            <button onClick={cycleTheme} style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
              <TIcon size={13}/> {resolved==="dark"?"Oscuro":resolved==="light"?"Claro":"Sistema"}
            </button>
            <button onClick={()=>setLogoutModal(true)} style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex:1,padding:mob?"16px 16px 80px":"24px 28px",maxWidth:mob?"100%":1100,overflowY:"auto" }}>
        {mob&&(
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <AdminLogo size={14}/>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>loadData()} style={{ width:32,height:32,borderRadius:"50%",background:C.s,border:"1px solid "+C.b,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><RefreshCw size={13} color={C.d}/></button>
              <button onClick={cycleTheme} style={{ width:32,height:32,borderRadius:"50%",background:C.s,border:"1px solid "+C.b,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><TIcon size={14} color={C.d}/></button>
            </div>
          </div>
        )}
        {tab==="overview" && <Overview stats={stats} users={users} loading={loading} views={views}/>}
        {tab==="users"    && !selectedUser && <UsersSection users={users} loading={loading} onSelect={setSelectedUser}/>}
        {tab==="users"    && selectedUser  && <UserDetail user={selectedUser} onBack={()=>setSelectedUser(null)} onUpdate={updateUser}/>}
        {tab==="finanzas" && <Finanzas users={users} expenses={expenses} stats={stats} loading={loading}/>}
        {tab==="expenses" && <Expenses expenses={expenses} setExpenses={setExpenses} loading={loading} authFetch={authFetch}/>}
        {tab==="sistema"  && <SystemStatus systemStatus={systemStatus} setSystemStatus={setSystemStatus} loading={loading} authFetch={authFetch}/>}
        {tab==="config"   && <SysConfig authFetch={authFetch} adminRole={adminRole}/>}
      </div>

      {/* Bottom nav mobile */}
      {mob && (
        <div style={{ position:"fixed",bottom:0,left:0,right:0,background:C.bg,borderTop:"1px solid "+C.b,display:"flex",padding:"8px 0 4px",zIndex:100 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelectedUser(null);}}
              style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 0" }}>
              <t.Icon size={16} color={tab===t.id?C.a:C.d} strokeWidth={tab===t.id?2.5:1.5}/>
              <span style={{ fontSize:8,fontWeight:tab===t.id?700:500,color:tab===t.id?C.a:C.d }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
