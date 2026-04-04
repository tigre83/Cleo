import { useState, useEffect, useRef } from "react";
import { BarChart3, Users, DollarSign, Mail, Settings, Search, ChevronRight, ChevronDown, Check, X, Loader, Eye, EyeOff, Shield, TrendingUp, Calendar, Clock, Wifi, WifiOff, Trash2, AlertTriangle, Filter, Download, RefreshCw, Minus, Cloud, Brain, Smartphone, Wrench, Briefcase, Pause, Play, StickyNote, Sun, Moon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const T = {
  dark: { bg:"#080808",s:"#111111",s2:"#161616",b:"#1E1E1E",t:"#F9FAFB",d:"#6B7280",a:"#4ADE80",r:"#EF4444",glow:"rgba(74,222,128,0.08)",ia:"#6B7280" },
  light: { bg:"#FAFAFA",s:"#FFFFFF",s2:"#F3F4F6",b:"#E5E7EB",t:"#111827",d:"#6B7280",a:"#16A34A",r:"#DC2626",glow:"rgba(22,163,74,0.06)",ia:"#9CA3AF" },
};
let C = T.dark;

// Mock data
const MOCK_USERS = [
  { id:1, name:"Glamour Studio", email:"glamour@email.com", plan:"negocio", status:"active", trial_days:0, registered:"2026-02-15", last_active:"2026-04-02", wa:true, convos:187, appts:34, type:"peluqueria", billing:"monthly", renews:"2026-05-01", notes:[{text:"Cliente desde feb, pago puntual",date:"2026-03-01"}] },
  { id:2, name:"Dental Care Plus", email:"dental@email.com", plan:"pro", status:"active", trial_days:0, registered:"2026-01-10", last_active:"2026-04-02", wa:true, convos:423, appts:89, type:"clinica_dental", billing:"annual", renews:"2027-01-10", notes:[{text:"Cliente VIP — dar soporte prioritario",date:"2026-02-10"},{text:"Pidió factura electrónica",date:"2026-03-20"}] },
  { id:3, name:"Nail Art Studio", email:"nails@email.com", plan:"basico", status:"active", trial_days:0, registered:"2026-03-01", last_active:"2026-04-01", wa:true, convos:98, appts:22, type:"manicura", billing:"monthly", renews:"2026-05-01", notes:[] },
  { id:4, name:"Zen Spa Quito", email:"zen@email.com", plan:"negocio", status:"active", trial_days:0, registered:"2026-02-20", last_active:"2026-04-02", wa:true, convos:156, appts:41, type:"spa", billing:"annual", renews:"2027-02-20", notes:[] },
  { id:5, name:"Barber Kings", email:"barber@email.com", plan:"trial", status:"trial", trial_days:3, registered:"2026-03-30", last_active:"2026-04-02", wa:true, convos:12, appts:3, type:"peluqueria", billing:"monthly", renews:null, notes:[] },
  { id:6, name:"Dra. López Dental", email:"lopez@email.com", plan:"trial", status:"trial", trial_days:5, registered:"2026-03-28", last_active:"2026-04-01", wa:false, convos:8, appts:1, type:"clinica_dental", billing:"monthly", renews:null, notes:[] },
  { id:7, name:"Beauty Room EC", email:"beauty@email.com", plan:"basico", status:"active", trial_days:0, registered:"2026-03-05", last_active:"2026-03-30", wa:true, convos:67, appts:15, type:"spa", billing:"monthly", renews:"2026-05-01", notes:[{text:"No pagó febrero, contactado por WA el 15/03",date:"2026-03-15"}] },
  { id:8, name:"Petite Nails", email:"petite@email.com", plan:"negocio", status:"active", trial_days:0, registered:"2026-01-25", last_active:"2026-04-02", wa:true, convos:234, appts:56, type:"manicura", billing:"monthly", renews:"2026-05-01", notes:[] },
  { id:9, name:"Smile Center", email:"smile@email.com", plan:"cancelled", status:"cancelled", trial_days:0, registered:"2026-01-15", last_active:"2026-03-15", wa:false, convos:0, appts:0, type:"clinica_dental", billing:"monthly", renews:null, notes:[{text:"Canceló por falta de uso",date:"2026-03-15"}] },
  { id:10, name:"Fresh Cuts", email:"fresh@email.com", plan:"trial", status:"trial", trial_days:1, registered:"2026-03-26", last_active:"2026-04-02", wa:true, convos:23, appts:5, type:"peluqueria", billing:"monthly", renews:null, notes:[] },
];
const GROWTH = [{m:"Ene",u:12},{m:"Feb",u:34},{m:"Mar",u:82},{m:"Abr",u:124}];
const PLAN_PRICES = { basico:29, negocio:59, pro:99 };
const PAYMENTS = [
  { id:1, user:"Glamour Studio", plan:"negocio", amount:59, date:"2026-04-01", method:"Transferencia", status:"pagado" },
  { id:2, user:"Dental Care Plus", plan:"pro", amount:99, date:"2026-04-01", method:"Transferencia", status:"pagado" },
  { id:3, user:"Nail Art Studio", plan:"basico", amount:29, date:"2026-04-01", method:"Efectivo", status:"pagado" },
  { id:4, user:"Zen Spa Quito", plan:"negocio", amount:59, date:"2026-04-01", method:"Transferencia", status:"pendiente" },
  { id:5, user:"Petite Nails", plan:"negocio", amount:59, date:"2026-04-01", method:"Transferencia", status:"pagado" },
];
const MOCK_EXPENSES = [
  { id:1, category:"infra", description:"Vercel Pro — abril 2026", amount:20, date:"2026-04-01", recurring:true },
  { id:2, category:"infra", description:"Supabase Pro", amount:25, date:"2026-04-01", recurring:true },
  { id:3, category:"infra", description:"Dominio cleo.app", amount:2.5, date:"2026-04-01", recurring:true },
  { id:4, category:"ia", description:"Claude API — marzo", amount:48, date:"2026-04-02", recurring:false },
  { id:5, category:"email", description:"Resend", amount:0, date:"2026-04-01", recurring:true, notes:"Plan gratuito" },
  { id:6, category:"wa", description:"Meta WhatsApp API", amount:0, date:"2026-04-01", recurring:true, notes:"Sin costo directo" },
  { id:7, category:"tools", description:"GitHub Pro", amount:4, date:"2026-04-01", recurring:true },
];
const EXP_CATS = [
  { v:"infra", l:"Infraestructura", Icon: Cloud },
  { v:"ia", l:"IA (Claude API)", Icon: Brain },
  { v:"wa", l:"WhatsApp (Meta)", Icon: Smartphone },
  { v:"email", l:"Email (Resend)", Icon: Mail },
  { v:"tools", l:"Herramientas", Icon: Wrench },
  { v:"other", l:"Otros", Icon: Briefcase },
];
const INCOME_MONTHS = [{m:"Ene",v:520},{m:"Feb",v:890},{m:"Mar",v:1680},{m:"Abr",v:2150}];
const EXPENSE_MONTHS = [{m:"Ene",v:62},{m:"Feb",v:78},{m:"Mar",v:92},{m:"Abr",v:100}];

function Counter({ target }) {
  const [v, setV] = useState(0);
  useEffect(() => { if(!target) return; let c=0; const s=Math.ceil(target/(600/16)); const t=setInterval(()=>{c+=s;if(c>=target){setV(target);clearInterval(t)}else setV(c)},16); return()=>clearInterval(t); }, [target]);
  return v;
}

const PLAN_LABEL = { trial:"Prueba", basico:"Básico", negocio:"Negocio", pro:"Pro", cancelled:"Cancelado", suspended:"Suspendido", active:"Activo" };

const Badge = ({plan}) => {
  const colors = { trial:"#6B7280", basico:"#3B82F6", negocio:C.a, pro:"#F59E0B", cancelled:"#EF4444", suspended:"#EF4444", active:C.a };
  return <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:(colors[plan]||"#666")+"18", color:colors[plan]||"#666" }}>{PLAN_LABEL[plan] || plan}</span>;
};

const AdminLogo = ({ size = 20 }) => (
  <span style={{ display:"inline-flex", flexDirection:"column", alignItems:"flex-start", userSelect:"none" }}>
    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:size, lineHeight:1, letterSpacing:-0.8, background:"linear-gradient(100deg,#4ADE80 0%,#22D3EE 50%,#4ADE80 100%)", backgroundSize:"300% 100%", animation:"gradBreathe 2.5s ease-in-out infinite", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>cleo<span style={{ WebkitTextFillColor:"inherit" }}>.</span></span>
    <span style={{ fontFamily:"monospace", fontSize:Math.max(size*0.32,7), letterSpacing:2.5, color:C.ia, marginTop:1 }}>powered by ia</span>
  </span>
);

// ============================================
// LOGIN
// ============================================
function AdminLogin({ onLogin }) {
  const [step, setStep] = useState(0);
  const [e, setE] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false); const [sp, setSp] = useState(false);
  const [code, setCode] = useState(["","","","","",""]); const [countdown, setCountdown] = useState(0); const [resends, setResends] = useState(0);
  const cRefs = useRef([]);

  useEffect(function(){ if(countdown<=0)return; const t=setTimeout(function(){setCountdown(countdown-1)},1000); return function(){clearTimeout(t)}; },[countdown]);

  const go = async () => {
    if(!e||!p){setErr("Completa los campos");return;}
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email:e, password:p }),
      });
      const d = await r.json();
      if(!r.ok){ setErr(d.error||"Credenciales inválidas"); setLoading(false); return; }
      setStep(1); setCountdown(60); setResends(1);
    } catch { setErr("Error de conexión"); }
    setLoading(false);
  };

  const handleCode = async (i, v) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const nc = [...code]; nc[i] = clean.slice(0,1); setCode(nc); setErr("");
    if(clean && i<5) cRefs.current[i+1]?.focus();
    if(nc.join("").length===6){
      setLoading(true);
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify-2fa`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ code:nc.join("") }),
        });
        const d = await r.json();
        if(!r.ok){ setErr(d.error||"Código inválido"); setLoading(false); return; }
        localStorage.setItem("adminToken", d.token);
        onLogin(e);
      } catch { setErr("Error de conexión"); }
      setLoading(false);
    }
  };

  const resend = async () => {
    if(resends>=3){setErr("Demasiados intentos. Intenta en 30 minutos.");return;}
    setCode(["","","","","",""]); setErr("");
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/login`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email:e, password:p }),
      });
      setCountdown(60); setResends(resends+1);
    } catch { setErr("Error de conexión"); }
  };

  const cMin = Math.floor(countdown/60); const cSec = String(countdown%60).padStart(2,"0");
  const fi = { width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.t, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:360, textAlign:"center" }}>
        <AdminLogo size={28} />
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:12, marginBottom:4 }}>
          <Shield size={16} color={C.a} />
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>Admin</h1>
        </div>

        {step === 0 ? (
          <div>
            <p style={{ fontSize:13, color:C.d, marginBottom:28 }}>Panel de administración</p>
            <input value={e} onChange={x=>setE(x.target.value)} placeholder="Email admin" style={fi} />
            <div style={{ position:"relative" }}>
              <input value={p} onChange={x=>setP(x.target.value)} type={sp?"text":"password"} placeholder="Contraseña" onKeyDown={x=>x.key==="Enter"&&go()} style={{...fi, paddingRight:48}} />
              <button onClick={()=>setSp(!sp)} style={{ position:"absolute", right:14, top:14, background:"none", border:"none", cursor:"pointer", color:C.d }}>{sp?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
            {err?<div style={{ fontSize:12, color:C.r, marginBottom:10 }}>{err}</div>:null}
            <button onClick={go} disabled={loading} style={{ width:"100%", padding:15, borderRadius:12, border:"none", background:loading?C.b:C.a, color:loading?C.d:C.bg, fontSize:15, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:"inherit" }}>{loading?"Verificando...":"Entrar"}</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:13, color:C.d, marginBottom:4 }}>Código enviado a</p>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>{e}</p>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:12 }}>
              {code.map(function(c,i){ return (
                <input key={i} ref={function(el){cRefs.current[i]=el}} type="text" inputMode="text" maxLength={1} value={c}
                  onChange={function(ev){handleCode(i,ev.target.value)}}
                  onKeyDown={function(ev){if(ev.key==="Backspace"&&!code[i]&&i>0)cRefs.current[i-1]?.focus()}}
                  style={{ width:42, height:50, textAlign:"center", fontSize:20, fontWeight:700, fontFamily:"monospace", background:c?C.glow:C.s, border:"2px solid "+(c?C.a:C.b), borderRadius:10, color:C.t, outline:"none" }}
                />
              )})}
            </div>
            {loading && <div style={{ fontSize:12, color:C.d, marginBottom:8 }}>Verificando...</div>}
            {err?<div style={{ fontSize:12, color:C.r, marginBottom:8 }}>{err}</div>:null}
            <div style={{ marginTop:8 }}>
              {countdown>0 ? <span style={{ fontSize:12, color:"#555" }}>{"Reenviar en "+cMin+":"+cSec}</span>
              : resends<3 ? <button onClick={resend} style={{ background:"none", border:"none", color:C.a, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Reenviar código</button>
              : <span style={{ fontSize:12, color:"#555" }}>Demasiados intentos</span>}
            </div>
            <button onClick={function(){setStep(0);setCode(["","","","","",""]);setErr("")}} style={{ marginTop:16, background:"none", border:"none", color:C.d, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Volver al inicio</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SECTIONS
// ============================================
function Overview({ users }) {
  const trial=users.filter(u=>u.plan==="trial").length;
  const basico=users.filter(u=>u.plan==="basico").length;
  const negocio=users.filter(u=>u.plan==="negocio").length;
  const pro=users.filter(u=>u.plan==="pro").length;
  const cancelled=users.filter(u=>u.plan==="cancelled").length;
  const mrr = basico*29 + negocio*59 + pro*99;
  const prevMrr = Math.round(mrr*0.87);
  const newThisWeek = users.filter(u=>new Date(u.registered)>new Date("2026-03-26")).length;
  const churn = users.length>0 ? ((cancelled/users.length)*100).toFixed(1) : 0;

  const card = { background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"20px 16px" };
  const label = { fontSize:11, color:C.d, marginTop:4 };

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Resumen</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.a }}><Counter target={users.length} /></div><div style={label}>Total usuarios</div></div>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.a }}>$<Counter target={mrr} /></div><div style={label}>MRR</div></div>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.t }}><Counter target={newThisWeek} /></div><div style={label}>Nuevos esta semana</div></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:20 }}>
        {[{l:"Prueba",v:trial,c:"#6B7280"},{l:"Básico",v:basico,c:"#3B82F6"},{l:"Negocio",v:negocio,c:C.a},{l:"Pro",v:pro,c:"#F59E0B"},{l:"Cancelados",v:cancelled,c:C.r}].map((p,i)=>(
          <div key={i} style={{ ...card, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:p.c }}>{p.v}</div>
            <div style={{ fontSize:9, color:C.d, marginTop:2 }}>{p.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        <div style={card}><div style={{ fontSize:12, color:C.d }}>Mes anterior</div><div style={{ fontSize:20, fontWeight:700, marginTop:4 }}>${prevMrr}</div></div>
        <div style={card}><div style={{ fontSize:12, color:C.d }}>Churn rate</div><div style={{ fontSize:20, fontWeight:700, marginTop:4, color:parseFloat(churn)>10?C.r:C.t }}>{churn}%</div></div>
      </div>
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Crecimiento de usuarios</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={GROWTH}><XAxis dataKey="m" tick={{fill:C.d,fontSize:11}} axisLine={false} tickLine={false} /><YAxis tick={{fill:C.d,fontSize:11}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{background:C.s2,border:"1px solid "+C.b,borderRadius:8,fontSize:12}} formatter={function(v){return [v,"Usuarios"]}} /><Line type="monotone" dataKey="u" stroke={C.a} strokeWidth={2} dot={{fill:C.a,r:4}} name="Usuarios" /></LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UsersSection({ users, setUsers, onSelect }) {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const filtered = users.filter(u => {
    if (filterPlan !== "all" && u.plan !== filterPlan) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Usuarios</h2>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={14} color={C.d} style={{ position:"absolute", left:12, top:13 }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o email" style={{ width:"100%", padding:"10px 12px 10px 34px", borderRadius:10, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
        <select value={filterPlan} onChange={e=>setFilterPlan(e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:12, fontFamily:"inherit", outline:"none" }}>
          <option value="all">Todos</option>
          <option value="trial">Prueba</option>
          <option value="basico">Básico</option>
          <option value="negocio">Negocio</option>
          <option value="pro">Pro</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>
      <div style={{ fontSize:11, color:C.d, marginBottom:8 }}>{filtered.length} usuarios</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(u => (
          <button key={u.id} onClick={()=>onSelect(u)} style={{ background:C.s, border:"1px solid "+C.b, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontFamily:"inherit", textAlign:"left", width:"100%" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:C.glow, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:C.a, flexShrink:0 }}>{u.name[0]}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</span>
                <Badge plan={u.plan} />
                {u.billing && u.plan !== "trial" && u.plan !== "cancelled" && <span style={{ fontSize:9, color:C.d, padding:"1px 4px", borderRadius:3, border:"1px solid "+C.b }}>{u.billing === "annual" ? "Anual" : "Mens."}</span>}
              </div>
              <div style={{ fontSize:11, color:C.d, marginTop:2 }}>{u.email}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.t }}>{u.convos}</div>
              <div style={{ fontSize:9, color:C.d }}>conv/mes</div>
            </div>
            <ChevronRight size={14} color={C.d} />
          </button>
        ))}
      </div>
    </div>
  );
}

function UserDetail({ user, onBack, onUpdate }) {
  const [plan, setPlan] = useState(user.plan);
  const [extraDays, setExtraDays] = useState("");
  const [newNote, setNewNote] = useState("");
  const isSuspended = user.status === "suspended";

  const handleSuspend = () => {
    onUpdate({...user, status:"suspended", previous_plan:user.plan, plan:"suspended"});
  };
  const handleReactivate = () => {
    const restored = user.previous_plan || "basico";
    onUpdate({...user, status:"active", plan:restored, previous_plan:null});
  };
  const addNote = () => {
    if (!newNote.trim()) return;
    const updated = {...user, notes:[...user.notes, {text:newNote.trim(), date:new Date().toISOString().split("T")[0]}]};
    onUpdate(updated);
    setNewNote("");
  };

  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.d, fontSize:13, cursor:"pointer", fontFamily:"inherit", marginBottom:16 }}>
        <X size={14} /> Volver a la lista
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:C.glow, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:C.a }}>{user.name[0]}</div>
        <div><div style={{ fontSize:18, fontWeight:700 }}>{user.name}</div><div style={{ fontSize:12, color:C.d }}>{user.email}</div></div>
      </div>
      {isSuspended && (
        <div style={{ background:C.r+"10", border:"1px solid "+C.r+"25", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
          <AlertTriangle size={14} color={C.r} />
          <span style={{ fontSize:12, color:C.r, fontWeight:600 }}>Cuenta suspendida</span>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16, marginTop:isSuspended?0:16 }}>
        {[{l:"Plan",v:user.plan,color:true},{l:"Facturación",v:user.billing==="annual"?"Anual":"Mensual"},{l:"Renovación",v:user.renews||"—"},{l:"Monto",v:user.billing==="annual"&&user.plan!=="trial"?"$"+({"basico":290,"negocio":590,"pro":990}[user.plan]||0)+"/año":"$"+({"basico":29,"negocio":59,"pro":99}[user.plan]||0)+"/mes"},{l:"Registro",v:user.registered},{l:"Última actividad",v:user.last_active},{l:"WhatsApp",v:user.wa?"Conectado":"Desconectado"},{l:"Conversaciones",v:user.convos},{l:"Citas",v:user.appts},{l:"Tipo",v:user.type}].map(function(f,i){
          return (
            <div key={i} style={{ background:C.s, border:"1px solid "+C.b, borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:10, color:C.d, marginBottom:4 }}>{f.l}</div>
              {f.color ? <Badge plan={String(f.v)} /> : <div style={{ fontSize:14, fontWeight:600 }}>{String(f.v)}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10, marginTop:24 }}>Acciones</div>
      <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:6 }}>Cambiar plan</div>
        <div style={{ display:"flex", gap:6 }}>
          <select value={plan} onChange={function(e){setPlan(e.target.value)}} style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none" }}>
            {[{v:"trial",l:"Prueba"},{v:"basico",l:"Básico"},{v:"negocio",l:"Negocio"},{v:"pro",l:"Pro"}].map(function(p){return <option key={p.v} value={p.v}>{p.l}</option>})}
          </select>
          <button onClick={function(){onUpdate({...user, plan, status: plan==="trial"?"trial":"active"});}} style={{ padding:"10px 16px", borderRadius:8, border:"none", background:C.a, color:C.bg, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Aplicar</button>
        </div>
      </div>
      {user.plan === "trial" && (
        <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
          <div style={{ fontSize:11, color:C.d, marginBottom:6 }}>Extender trial</div>
          <div style={{ display:"flex", gap:6 }}>
            <input value={extraDays} onChange={function(e){setExtraDays(e.target.value)}} type="number" placeholder="Días" style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none" }} />
            <button onClick={function(){if(extraDays) onUpdate({...user, trial_days: user.trial_days + parseInt(extraDays)});}} style={{ padding:"10px 16px", borderRadius:8, border:"none", background:C.a, color:C.bg, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Agregar</button>
          </div>
        </div>
      )}
      {isSuspended ? (
        <button onClick={handleReactivate} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.a+"40", background:C.glow, color:C.a, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Play size={12} /> Reactivar cuenta</button>
      ) : user.plan !== "cancelled" ? (
        <button onClick={handleSuspend} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.r+"25", background:C.r+"08", color:C.r, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Pause size={12} /> Suspender cuenta</button>
      ) : null}
      <button style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.d, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Mail size={12} /> Enviar email directo</button>
      <button style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.r, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Trash2 size={12} /> Eliminar cuenta</button>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10, marginTop:28 }}>Notas internas</div>
      <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
        <div style={{ display:"flex", gap:6, marginBottom: user.notes.length > 0 ? 12 : 0 }}>
          <input value={newNote} onChange={function(e){setNewNote(e.target.value)}} placeholder="Agregar nota sobre este cliente..." onKeyDown={function(e){if(e.key==="Enter") addNote();}} style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none" }} />
          <button onClick={addNote} disabled={!newNote.trim()} style={{ padding:"10px 14px", borderRadius:8, border:"none", background:newNote.trim()?C.a:C.b, color:newNote.trim()?C.bg:C.d, fontSize:12, fontWeight:600, cursor:newNote.trim()?"pointer":"default", fontFamily:"inherit" }}>Guardar</button>
        </div>
        {user.notes.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {user.notes.slice().reverse().map(function(n,i){
              return (
                <div key={i} style={{ padding:"8px 10px", borderRadius:8, background:C.s2, border:"1px solid "+C.b }}>
                  <div style={{ fontSize:12, color:C.t, lineHeight:1.4 }}>{n.text}</div>
                  <div style={{ fontSize:10, color:C.d, marginTop:4, display:"flex", alignItems:"center", gap:4 }}><StickyNote size={9} /> {n.date}</div>
                </div>
              );
            })}
          </div>
        )}
        {user.notes.length === 0 && !newNote && (
          <div style={{ fontSize:12, color:C.d, textAlign:"center", padding:"8px 0" }}>Sin notas</div>
        )}
      </div>
    </div>
  );
}

function Finanzas({ users, payments, expenses }) {
  const paid = users.filter(u=>["basico","negocio","pro"].includes(u.plan));
  const basico=paid.filter(u=>u.plan==="basico").length;
  const negocio=paid.filter(u=>u.plan==="negocio").length;
  const pro=paid.filter(u=>u.plan==="pro").length;
  const prices = {basico:29,negocio:59,pro:99};
  const annualPrices = {basico:290,negocio:590,pro:990};
  const mrrRows = [];
  ["basico","negocio","pro"].forEach(function(p){
    const monthly = paid.filter(u=>u.plan===p && u.billing==="monthly").length;
    const annual = paid.filter(u=>u.plan===p && u.billing==="annual").length;
    const mEq = +(annualPrices[p]/12).toFixed(2);
    if(monthly) mrrRows.push({label:p.charAt(0).toUpperCase()+p.slice(1)+" Mensual", count:monthly, unit:prices[p], total:monthly*prices[p], color:p==="basico"?"#3B82F6":p==="negocio"?C.a:"#F59E0B"});
    if(annual) mrrRows.push({label:p.charAt(0).toUpperCase()+p.slice(1)+" Anual", count:annual, unit:mEq, total:+(annual*mEq).toFixed(2), color:p==="basico"?"#3B82F6":p==="negocio"?C.a:"#F59E0B"});
  });
  const mrr = mrrRows.reduce((s,r)=>s+r.total,0);
  const cobrado = payments.filter(p=>p.status==="pagado").reduce((s,p)=>s+p.amount,0);
  const pendiente = mrr - cobrado;
  const prevIncome = Math.round(mrr*0.82);
  const projection = Math.round(mrr*1.08);
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  const prevExpenses = Math.round(totalExpenses*0.92);
  const net = cobrado - totalExpenses;
  const [showPay, setShowPay] = useState(false);
  const [payUser,setPayUser]=useState("");const[payPlan,setPayPlan]=useState("basico");const[payMethod,setPayMethod]=useState("Transferencia");
  const [period, setPeriod] = useState("abr-2026");
  const [view, setView] = useState("ambos");
  const card = { background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"14px 16px" };
  const periods = ["abr-2026","mar-2026","feb-2026","ene-2026","anual","todo"];
  const periodLabels = {"abr-2026":"Abr 2026","mar-2026":"Mar 2026","feb-2026":"Feb 2026","ene-2026":"Ene 2026","anual":"Este año","todo":"Todo el tiempo"};

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:12 }}>Finanzas</h2>
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <select value={period} onChange={function(e){setPeriod(e.target.value)}} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:12, fontFamily:"inherit", outline:"none" }}>
          {periods.map(function(p){ return <option key={p} value={p}>{periodLabels[p]}</option> })}
        </select>
        <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:"1px solid "+C.b }}>
          {["ingresos","egresos","ambos"].map(function(v){
            return <button key={v} onClick={function(){setView(v)}} style={{ padding:"8px 14px", border:"none", background:view===v?C.glow:"transparent", color:view===v?C.a:C.d, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", borderRight: v!=="ambos" ? "1px solid "+C.b : "none", textTransform:"capitalize" }}>{v}</button>
          })}
        </div>
      </div>
      <div style={{ ...card, textAlign:"center", marginBottom:16, background: net>=0 ? C.glow : C.r+"08", border: "1px solid "+(net>=0 ? C.a+"25" : C.r+"25") }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:4 }}>Ganancia neta del mes</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color: net>=0 ? C.a : C.r }}>${net.toFixed(0)}</div>
        <div style={{ fontSize:11, color:C.d, marginTop:4 }}>${cobrado} cobrado − ${totalExpenses.toFixed(0)} egresos</div>
      </div>
      {(view === "ingresos" || view === "ambos") && (<div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Ingresos</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div style={card}><div style={{ fontSize:10, color:C.d }}>MRR actual</div><div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.a, marginTop:2 }}>${mrr}</div></div>
        <div style={card}><div style={{ fontSize:10, color:C.d }}>Cobrado este mes</div><div style={{ fontSize:22, fontWeight:800, color:C.a, marginTop:2 }}>${cobrado}</div></div>
        <div style={card}><div style={{ fontSize:10, color:C.d }}>Pendiente</div><div style={{ fontSize:22, fontWeight:800, color:pendiente>0?"#F59E0B":C.a, marginTop:2 }}>${pendiente}</div></div>
        <div style={card}><div style={{ fontSize:10, color:C.d }}>Mes anterior</div><div style={{ fontSize:22, fontWeight:800, marginTop:2 }}>${prevIncome}</div></div>
      </div>
      <div style={{ ...card, marginBottom:8 }}>
        <div style={{ fontSize:10, color:C.d, marginBottom:2 }}>Proyección fin de mes</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.a }}>${projection}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:6, background:C.glow }}><TrendingUp size={11} color={C.a} /><span style={{ fontSize:11, fontWeight:600, color:C.a }}>+{Math.round((projection/prevIncome-1)*100)}%</span></div>
        </div>
      </div>
      <div style={{ ...card, marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:4 }}>MRR por plan</div>
        {mrrRows.map(function(m,i){return(
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:i<mrrRows.length-1?"1px solid "+C.b:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:m.color }} /><span style={{ fontSize:12, fontWeight:600 }}>{m.label}</span><span style={{ fontSize:10, color:C.d }}>{m.count}×${m.unit}</span></div>
            <span style={{ fontSize:13, fontWeight:700, color:C.a }}>${m.total}</span>
          </div>
        )})}
      </div>
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:8 }}>Ingresos mensuales</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={INCOME_MONTHS}><XAxis dataKey="m" tick={{fill:C.d,fontSize:10}} axisLine={false} tickLine={false} /><YAxis tick={{fill:C.d,fontSize:10}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{background:C.s2,border:"1px solid "+C.b,borderRadius:8,fontSize:11}} formatter={function(v){return ["$"+v,"Ingresos"]}} /><Bar dataKey="v" fill={C.a} radius={[4,4,0,0]} name="Ingresos" /></BarChart>
        </ResponsiveContainer>
      </div>
      </div>)}
      {(view === "egresos" || view === "ambos") && (<div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Egresos</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div style={card}><div style={{ fontSize:10, color:C.d }}>Total este mes</div><div style={{ fontSize:22, fontWeight:800, color:C.r, marginTop:2 }}>${totalExpenses.toFixed(0)}</div></div>
        <div style={card}><div style={{ fontSize:10, color:C.d }}>Mes anterior</div><div style={{ fontSize:22, fontWeight:800, marginTop:2 }}>${prevExpenses}</div></div>
      </div>
      <div style={{ ...card, marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:6 }}>Por categoría</div>
        {EXP_CATS.map(cat => {
          const total = expenses.filter(e=>e.category===cat.v).reduce((s,e)=>s+e.amount,0);
          if(total===0) return null;
          return <div key={cat.v} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 0" }}><span style={{ fontSize:12, display:"flex", alignItems:"center", gap:4 }}><cat.Icon size={12} color={C.d} /> {cat.l}</span><span style={{ fontSize:13, fontWeight:600 }}>${total.toFixed(0)}</span></div>;
        })}
      </div>
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:8 }}>Egresos mensuales</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={EXPENSE_MONTHS}><XAxis dataKey="m" tick={{fill:C.d,fontSize:10}} axisLine={false} tickLine={false} /><YAxis tick={{fill:C.d,fontSize:10}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{background:C.s2,border:"1px solid "+C.b,borderRadius:8,fontSize:11}} formatter={function(v){return ["$"+v,"Egresos"]}} /><Bar dataKey="v" fill={C.r} radius={[4,4,0,0]} name="Egresos" /></BarChart>
        </ResponsiveContainer>
      </div>
      </div>)}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>Pagos recientes</div>
        <button onClick={()=>setShowPay(!showPay)} style={{ padding:"5px 10px", borderRadius:6, border:"1px solid "+C.a+"40", background:C.glow, color:C.a, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ Registrar pago</button>
      </div>
      {showPay && (
        <div style={{ ...card, marginBottom:10 }}>
          <input value={payUser} onChange={e=>setPayUser(e.target.value)} placeholder="Nombre del negocio" style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:6 }} />
          <div style={{ display:"flex", gap:6, marginBottom:6 }}>
            <select value={payPlan} onChange={e=>setPayPlan(e.target.value)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:12, fontFamily:"inherit", outline:"none" }}>
              <option value="basico">Básico $29</option><option value="negocio">Negocio $59</option><option value="pro">Pro $99</option>
            </select>
            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:12, fontFamily:"inherit", outline:"none" }}>
              <option>Transferencia</option><option>Efectivo</option><option>Otro</option>
            </select>
          </div>
          <button onClick={()=>setShowPay(false)} style={{ width:"100%", padding:10, borderRadius:8, border:"none", background:C.a, color:C.bg, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Registrar</button>
        </div>
      )}
      {payments.map(p=>(
        <div key={p.id} style={{ background:C.s, border:"1px solid "+C.b, borderRadius:10, padding:"10px 14px", marginBottom:4, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div><div style={{ fontSize:12, fontWeight:600 }}>{p.user}</div><div style={{ fontSize:10, color:C.d }}>{p.date} · {p.method}</div></div>
          <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color:C.a }}>${p.amount}</div><span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:p.status==="pagado"?C.a+"18":C.r+"18", color:p.status==="pagado"?C.a:C.r }}>{p.status}</span></div>
        </div>
      ))}
    </div>
  );
}

function Expenses({ expenses, setExpenses }) {
  const [showForm, setShowForm] = useState(false);
  const [cat, setCat] = useState("infra"); const [desc, setDesc] = useState(""); const [amount, setAmount] = useState(""); const [date, setDate] = useState("2026-04-02"); const [recurring, setRecurring] = useState(false); const [notes, setNotes] = useState("");
  const total = expenses.reduce((s,e)=>s+e.amount,0);
  const card = { background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"14px 16px" };
  const fi = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:8 };

  const addExpense = () => {
    if(!desc||!amount) return;
    setExpenses([...expenses, { id:Date.now(), category:cat, description:desc, amount:parseFloat(amount), date, recurring, notes }]);
    setDesc(""); setAmount(""); setNotes(""); setShowForm(false);
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>Egresos</h2>
        <button onClick={()=>setShowForm(!showForm)} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid "+C.a+"40", background:C.glow, color:C.a, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ Registrar egreso</button>
      </div>
      <div style={{ ...card, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:13, color:C.d }}>Total egresos este mes</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:C.r }}>${total.toFixed(2)}</span>
      </div>
      {showForm && (
        <div style={{ ...card, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Nuevo egreso</div>
          <div style={{ fontSize:10, color:C.d, marginBottom:4 }}>Categoría</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:8 }}>
            {EXP_CATS.map(c=>(
              <button key={c.v} onClick={()=>setCat(c.v)} style={{ padding:"8px", borderRadius:8, border:"1.5px solid "+(cat===c.v?C.a:C.b), background:cat===c.v?C.glow:"transparent", color:cat===c.v?C.a:C.t, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", alignItems:"center", gap:5 }}><c.Icon size={13} color={cat===c.v?C.a:C.d} /> {c.l}</button>
            ))}
          </div>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder='Descripción (ej: "Vercel Pro — abril 2026")' style={fi} />
          <div style={{ display:"flex", gap:6 }}>
            <div style={{ flex:1, position:"relative" }}><span style={{ position:"absolute", left:12, top:10, color:C.d, fontSize:13 }}>$</span><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{...fi, paddingLeft:24}} /></div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{...fi, flex:1}} />
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={12} color={C.d} /><span style={{ fontSize:12 }}>Recurrente</span></div>
            <button onClick={()=>setRecurring(!recurring)} style={{ width:36, height:20, borderRadius:10, border:"none", cursor:"pointer", background:recurring?C.a:"#333", position:"relative" }}><div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:recurring?18:2, transition:"left 0.2s" }} /></button>
          </div>
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas (opcional)" style={fi} />
          <button onClick={addExpense} disabled={!desc||!amount} style={{ width:"100%", padding:10, borderRadius:8, border:"none", background:desc&&amount?C.a:C.b, color:desc&&amount?C.bg:C.d, fontSize:13, fontWeight:600, cursor:desc&&amount?"pointer":"default", fontFamily:"inherit" }}>Guardar egreso</button>
        </div>
      )}
      <div style={{ ...card, marginBottom:12 }}>
        <div style={{ fontSize:12, color:C.d, marginBottom:8 }}>Por categoría</div>
        {EXP_CATS.map(c => {
          const items = expenses.filter(e=>e.category===c.v);
          if(!items.length) return null;
          const catTotal = items.reduce((s,e)=>s+e.amount,0);
          return (
            <div key={c.v} style={{ marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}><c.Icon size={12} color={C.d} /> {c.l}</span>
                <span style={{ fontSize:12, fontWeight:600 }}>${catTotal.toFixed(2)}</span>
              </div>
              {items.map(e=>(
                <div key={e.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"4px 0 4px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    {e.recurring && <RefreshCw size={10} color={C.d} />}
                    <span style={{ fontSize:11, color:C.d }}>{e.description}</span>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600 }}>${e.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10 }}>Todos los egresos</div>
      {expenses.map(e => {
        const catInfo = EXP_CATS.find(c=>c.v===e.category);
        return (
          <div key={e.id} style={{ background:C.s, border:"1px solid "+C.b, borderRadius:10, padding:"10px 14px", marginBottom:4, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                {e.recurring && <RefreshCw size={10} color={C.a} />}
                {e.description}
              </div>
              <div style={{ fontSize:10, color:C.d, display:"flex", alignItems:"center", gap:3 }}>{catInfo ? <catInfo.Icon size={10} /> : null} {catInfo?catInfo.l:""} · {e.date}</div>
            </div>
            <span style={{ fontSize:13, fontWeight:700 }}>${e.amount.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

function SysConfig() {
  const [maint, setMaint] = useState(false); const [maintMsg, setMaintMsg] = useState("Estamos realizando mejoras. Volvemos en unos minutos.");
  const [prices, setPrices] = useState({basico:29,negocio:59,pro:99});
  const [limits, setLimits] = useState({basico:500,negocio:2000,pro:99999});
  const fi = { padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:14, fontFamily:"inherit", outline:"none", width:80, textAlign:"center" };

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Configuración</h2>
      <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"16px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: maint?12:0 }}>
          <div><div style={{ fontSize:14, fontWeight:600 }}>Modo mantenimiento</div><div style={{ fontSize:11, color:C.d }}>Bloquea el acceso a todos los usuarios</div></div>
          <button onClick={()=>setMaint(!maint)} style={{ width:40, height:22, borderRadius:11, border:"none", cursor:"pointer", background:maint?C.r:"#333", position:"relative" }}>
            <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:maint?20:2, transition:"left 0.2s" }} />
          </button>
        </div>
        {maint && <textarea value={maintMsg} onChange={e=>setMaintMsg(e.target.value)} rows={2} style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical" }} />}
      </div>
      <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"16px", marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Precios por plan</div>
        {["basico","negocio","pro"].map(p=>(
          <div key={p} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0" }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{PLAN_LABEL[p] || p}</span>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:13, color:C.d }}>$</span>
              <input type="number" value={prices[p]} onChange={e=>setPrices({...prices,[p]:parseInt(e.target.value)||0})} style={fi} />
              <span style={{ fontSize:11, color:C.d }}>/mes</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"16px" }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Límite de conversaciones</div>
        {["basico","negocio","pro"].map(p=>(
          <div key={p} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0" }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{PLAN_LABEL[p] || p}</span>
            <input type="number" value={limits[p]} onChange={e=>setLimits({...limits,[p]:parseInt(e.target.value)||0})} style={{...fi, width:100}} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN
// ============================================
export default function CleoAdmin() {
  const [theme, setTheme] = useState("dark");
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  C = T[resolved];
  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");

  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState(MOCK_USERS);
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mob, setMob] = useState(false);
  useEffect(()=>{const c=()=>setMob(window.innerWidth<768);c();window.addEventListener("resize",c);return()=>window.removeEventListener("resize",c);},[]);
  useEffect(()=>{const s=document.createElement("style");s.textContent=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes gradBreathe{0%{background-position:0% 50%;filter:brightness(1)}50%{background-position:100% 50%;filter:brightness(1.2)}100%{background-position:0% 50%;filter:brightness(1)}}*{box-sizing:border-box;margin:0;padding:0}html,body{overflow-x:hidden;width:100%;max-width:100vw}::-webkit-scrollbar{display:none}`;document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  const updateUser = (updated) => { setUsers(users.map(u=>u.id===updated.id?updated:u)); setSelectedUser(updated); };

  if (!authed) return <AdminLogin onLogin={()=>setAuthed(true)} />;

  const tabs = [
    { id:"overview", label:"Resumen", Icon:BarChart3 },
    { id:"users", label:"Usuarios", Icon:Users },
    { id:"finanzas", label:"Finanzas", Icon:DollarSign },
    { id:"expenses", label:"Egresos", Icon:Minus },
    { id:"config", label:"Config", Icon:Settings },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.t, minHeight:"100vh", display:"flex", flexDirection:mob?"column":"row", overflowX:"hidden", maxWidth:"100vw" }}>
      {!mob && (
        <div style={{ width:220, borderRight:"1px solid "+C.b, padding:"20px 12px", flexShrink:0, position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28, paddingLeft:8 }}>
            <AdminLogo size={16} />
          </div>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelectedUser(null);}} style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"none", background:tab===t.id?C.glow:"transparent", color:tab===t.id?C.a:C.d, fontSize:13, fontWeight:tab===t.id?600:500, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, marginBottom:2, textAlign:"left" }}>
              <t.Icon size={16} /> {t.label}
            </button>
          ))}
          <div style={{ position:"absolute", bottom:16, left:12, right:12 }}>
            <button onClick={cycleTheme} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.d, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", marginBottom:6, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {resolved === "dark" ? <Moon size={13} /> : resolved === "light" ? <Sun size={13} /> : <Settings size={13} />}
              {resolved === "dark" ? "Oscuro" : resolved === "light" ? "Claro" : "Sistema"}
            </button>
            <button onClick={()=>setAuthed(false)} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.d, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cerrar sesión</button>
          </div>
        </div>
      )}
      <div style={{ flex:1, padding:mob?"16px 16px 80px":"24px 28px", maxWidth:mob?"100%":900, overflowY:"auto" }}>
        {mob && (
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
            <button onClick={cycleTheme} style={{ width:32, height:32, borderRadius:"50%", background:C.s, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              {resolved === "dark" ? <Moon size={14} color={C.d} /> : resolved === "light" ? <Sun size={14} color={C.d} /> : <Settings size={14} color={C.d} />}
            </button>
          </div>
        )}
        {tab === "overview" && <Overview users={users} />}
        {tab === "users" && !selectedUser && <UsersSection users={users} setUsers={setUsers} onSelect={setSelectedUser} />}
        {tab === "users" && selectedUser && <UserDetail user={selectedUser} onBack={()=>setSelectedUser(null)} onUpdate={updateUser} />}
        {tab === "finanzas" && <Finanzas users={users} payments={PAYMENTS} expenses={expenses} />}
        {tab === "expenses" && <Expenses expenses={expenses} setExpenses={setExpenses} />}
        {tab === "config" && <SysConfig />}
      </div>
      {mob && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.bg, borderTop:"1px solid "+C.b, display:"flex", padding:"8px 0 4px", zIndex:100 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setSelectedUser(null);}} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"6px 0" }}>
              <t.Icon size={18} color={tab===t.id?C.a:C.d} strokeWidth={tab===t.id?2.5:1.5} />
              <span style={{ fontSize:9, fontWeight:tab===t.id?700:500, color:tab===t.id?C.a:C.d }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
