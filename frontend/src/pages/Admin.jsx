import { useState, useEffect, useRef } from "react";
import { BarChart3, Users, DollarSign, Mail, Settings, Search, ChevronRight, X, Eye, EyeOff, Shield, TrendingUp, Trash2, AlertTriangle, RefreshCw, Minus, Cloud, Brain, Smartphone, Wrench, Briefcase, Pause, Play, StickyNote, Sun, Moon, Activity, CheckCircle, AlertCircle, XCircle, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const T = {
  dark:  { bg:"#080808",s:"#111111",s2:"#161616",b:"#1E1E1E",t:"#F9FAFB",d:"#6B7280",a:"#4ADE80",r:"#EF4444",glow:"rgba(74,222,128,0.08)",ia:"#6B7280" },
  light: { bg:"#FAFAFA",s:"#FFFFFF",s2:"#F3F4F6",b:"#E5E7EB",t:"#111827",d:"#6B7280",a:"#16A34A",r:"#DC2626",glow:"rgba(22,163,74,0.06)",ia:"#9CA3AF" },
};
let C = T.dark;

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
      const r = await fetch(`${API}/api/admin/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password:pass }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error||"Credenciales inválidas"); setLoading(false); return; }
      setStep(1); setCountdown(60); setResends(1);
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
        const r = await fetch(`${API}/api/admin/verify-2fa`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ code:nc.join("") }) });
        const d = await r.json();
        if (!r.ok) { setErr(d.error||"Código inválido"); setLoading(false); return; }
        localStorage.setItem("adminToken", d.token);
        onLogin(email);
      } catch { setErr("Error de conexión"); }
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resends>=3) { setErr("Demasiados intentos. Intenta en 30 minutos."); return; }
    setCode(["","","","","",""]); setErr("");
    try {
      await fetch(`${API}/api/admin/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password:pass }) });
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
function Overview({ stats, users, loading }) {
  if (loading) return <Spinner />;
  const card = { background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"20px 16px" };
  const lbl  = { fontSize:11, color:C.d, marginTop:4 };
  const pc   = stats?.planCounts || {};
  const growth = stats?.growth || [];

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Resumen</h2>
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
  const [showForm, setShowForm]   = useState(false);
  const [service,  setService]    = useState("");
  const [status,   setStatus]     = useState("operational");
  const [desc,     setDesc]       = useState("");
  const [saving,   setSaving]     = useState(false);

  const card = { background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"14px 16px" };
  const fi   = { width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:8 };

  const statusInfo = {
    operational: { label:"Operacional", color:C.a,  Icon:CheckCircle },
    degraded:    { label:"Degradado",   color:"#F59E0B", Icon:AlertCircle },
    outage:      { label:"Caída",       color:C.r,  Icon:XCircle },
  };

  const addStatus = async () => {
    if (!service) return;
    setSaving(true);
    try {
      const data = await authFetch("/api/admin/system-status", {
        method:"POST",
        body:JSON.stringify({ service, status, description:desc }),
      });
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

  const active    = systemStatus.filter(s=>s.status!=="operational");
  const resolved  = systemStatus.filter(s=>s.status==="operational");

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>Sistema</h2>
        <button onClick={()=>setShowForm(!showForm)}
          style={{ padding:"6px 12px",borderRadius:8,border:"1px solid "+C.a+"40",background:C.glow,color:C.a,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>+ Reportar</button>
      </div>

      {/* Estado general */}
      <div style={{ ...card,marginBottom:16,display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ width:12,height:12,borderRadius:"50%",background:active.length>0?C.r:C.a,animation:"pulse 2s infinite",flexShrink:0 }}/>
        <div>
          <div style={{ fontSize:14,fontWeight:600 }}>{active.length>0?`${active.length} incidente${active.length>1?"s":""} activo${active.length>1?"s":""}`:"Todos los sistemas operativos"}</div>
          <div style={{ fontSize:11,color:C.d }}>{systemStatus.length} registros totales</div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ ...card,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:600,marginBottom:10 }}>Nuevo reporte</div>
          <input value={service} onChange={e=>setService(e.target.value)} placeholder="Servicio (ej: API, WhatsApp, Supabase)" style={fi}/>
          <div style={{ display:"flex",gap:6,marginBottom:8 }}>
            {Object.entries(statusInfo).map(([k,v])=>(
              <button key={k} onClick={()=>setStatus(k)}
                style={{ flex:1,padding:"8px",borderRadius:8,border:"1.5px solid "+(status===k?v.color:C.b),background:status===k?v.color+"18":"transparent",color:status===k?v.color:C.d,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>{v.label}</button>
            ))}
          </div>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción (opcional)" style={fi}/>
          <button onClick={addStatus} disabled={!service||saving}
            style={{ width:"100%",padding:10,borderRadius:8,border:"none",background:service?C.a:C.b,color:service?C.bg:C.d,fontSize:13,fontWeight:600,cursor:service?"pointer":"default",fontFamily:"inherit" }}>
            {saving?"Guardando...":"Registrar"}
          </button>
        </div>
      )}

      {/* Incidentes activos */}
      {active.length>0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:8, color:C.r }}>Incidentes activos</div>
          {active.map(s=>{
            const si = statusInfo[s.status];
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

      {/* Historial resueltos */}
      {resolved.length>0 && (
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:8, color:C.d }}>Historial</div>
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

      {systemStatus.length===0 && <EmptyState icon={Activity} text="Sin registros de sistema. Todo operativo." />}
    </div>
  );
}

// ── CONFIG ────────────────────────────────────────────────────────────────────
function SysConfig() {
  const [maint,  setMaint]  = useState(false);
  const [msg,    setMsg]    = useState("Estamos realizando mejoras. Volvemos en unos minutos.");
  const [prices, setPrices] = useState({basico:29,negocio:59,pro:99});
  const [limits, setLimits] = useState({basico:500,negocio:2000,pro:99999});
  const fi = { padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:14,fontFamily:"inherit",outline:"none",width:80,textAlign:"center" };

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Configuración</h2>
      <div style={{ background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"16px",marginBottom:12 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:maint?12:0 }}>
          <div><div style={{ fontSize:14,fontWeight:600 }}>Modo mantenimiento</div><div style={{ fontSize:11,color:C.d }}>Bloquea acceso a todos los usuarios</div></div>
          <button onClick={()=>setMaint(!maint)} style={{ width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",background:maint?C.r:"#333",position:"relative" }}>
            <div style={{ width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:maint?20:2,transition:"left 0.2s" }}/>
          </button>
        </div>
        {maint&&<textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={2}
          style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid "+C.b,background:C.s2,color:C.t,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",resize:"vertical" }}/>}
      </div>
      <div style={{ background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"16px",marginBottom:12 }}>
        <div style={{ fontSize:14,fontWeight:600,marginBottom:12 }}>Precios por plan</div>
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
      <div style={{ background:C.s,border:"1px solid "+C.b,borderRadius:14,padding:"16px" }}>
        <div style={{ fontSize:14,fontWeight:600,marginBottom:12 }}>Límite de conversaciones</div>
        {["basico","negocio","pro"].map(p=>(
          <div key={p} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0" }}>
            <span style={{ fontSize:13,fontWeight:600 }}>{PLAN_LABEL[p]}</span>
            <input type="number" value={limits[p]} onChange={e=>setLimits({...limits,[p]:parseInt(e.target.value)||0})} style={fi}/>
          </div>
        ))}
      </div>
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
  const [tab,          setTab]          = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [mob,          setMob]          = useState(false);

  // ── Data real ──
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [systemStatus, setSystemStatus] = useState([]);
  const [loading,      setLoading]      = useState(false);

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
      const [statsData, usersData, expensesData, statusData] = await Promise.all([
        authFetch("/api/admin/stats"),
        authFetch("/api/admin/users"),
        authFetch("/api/admin/expenses"),
        authFetch("/api/admin/system-status"),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setExpenses(expensesData);
      setSystemStatus(statusData);
    } catch(err) { console.error("Error cargando datos:", err); }
    setLoading(false);
  };

  useEffect(()=>{
    if (authed) loadData();
  }, [authed]);

  useEffect(()=>{
    const c=()=>setMob(window.innerWidth<768);
    c(); window.addEventListener("resize",c); return()=>window.removeEventListener("resize",c);
  },[]);

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

  if (!authed) return <AdminLogin onLogin={()=>setAuthed(true)}/>;

  const TIcon = resolved==="dark"?Moon:resolved==="light"?Sun:Settings;

  const tabs = [
    {id:"overview", label:"Resumen",  Icon:BarChart3},
    {id:"users",    label:"Usuarios", Icon:Users},
    {id:"finanzas", label:"Finanzas", Icon:DollarSign},
    {id:"expenses", label:"Egresos",  Icon:Minus},
    {id:"sistema",  label:"Sistema",  Icon:Activity},
    {id:"config",   label:"Config",   Icon:Settings},
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:C.bg,color:C.t,minHeight:"100vh",display:"flex",flexDirection:mob?"column":"row",overflowX:"hidden",maxWidth:"100vw" }}>

      {/* Sidebar desktop */}
      {!mob && (
        <div style={{ width:220,borderRight:"1px solid "+C.b,padding:"20px 12px",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:28,paddingLeft:8 }}><AdminLogo size={16}/></div>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelectedUser(null);}}
              style={{ width:"100%",padding:"10px 12px",borderRadius:10,border:"none",background:tab===t.id?C.glow:"transparent",color:tab===t.id?C.a:C.d,fontSize:13,fontWeight:tab===t.id?600:500,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,marginBottom:2,textAlign:"left" }}>
              <t.Icon size={16}/> {t.label}
            </button>
          ))}
          <div style={{ position:"absolute",bottom:16,left:12,right:12 }}>
            <button onClick={()=>loadData()} style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
              <RefreshCw size={13}/> Actualizar
            </button>
            <button onClick={cycleTheme} style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
              <TIcon size={13}/> {resolved==="dark"?"Oscuro":resolved==="light"?"Claro":"Sistema"}
            </button>
            <button onClick={()=>setAuthed(false)} style={{ width:"100%",padding:10,borderRadius:10,border:"1px solid "+C.b,background:"transparent",color:C.d,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex:1,padding:mob?"16px 16px 80px":"24px 28px",maxWidth:mob?"100%":900,overflowY:"auto" }}>
        {mob&&(
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <AdminLogo size={14}/>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>loadData()} style={{ width:32,height:32,borderRadius:"50%",background:C.s,border:"1px solid "+C.b,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><RefreshCw size={13} color={C.d}/></button>
              <button onClick={cycleTheme} style={{ width:32,height:32,borderRadius:"50%",background:C.s,border:"1px solid "+C.b,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}><TIcon size={14} color={C.d}/></button>
            </div>
          </div>
        )}
        {tab==="overview" && <Overview stats={stats} users={users} loading={loading}/>}
        {tab==="users"    && !selectedUser && <UsersSection users={users} loading={loading} onSelect={setSelectedUser}/>}
        {tab==="users"    && selectedUser  && <UserDetail user={selectedUser} onBack={()=>setSelectedUser(null)} onUpdate={updateUser}/>}
        {tab==="finanzas" && <Finanzas users={users} expenses={expenses} stats={stats} loading={loading}/>}
        {tab==="expenses" && <Expenses expenses={expenses} setExpenses={setExpenses} loading={loading} authFetch={authFetch}/>}
        {tab==="sistema"  && <SystemStatus systemStatus={systemStatus} setSystemStatus={setSystemStatus} loading={loading} authFetch={authFetch}/>}
        {tab==="config"   && <SysConfig/>}
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
