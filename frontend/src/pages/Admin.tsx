import { useState, useEffect, useRef, FormEvent } from 'react';
import { BarChart3, Users, DollarSign, Settings, Search, ChevronRight, X, Eye, EyeOff, Shield, TrendingUp, Wifi, WifiOff, AlertTriangle, RefreshCw, Minus, Pause, Play, Mail, StickyNote, Moon, Sun, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';

// ============================================
// TYPES
// ============================================
interface Business {
  id: string;
  email: string;
  business_name: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  messages_used: number;
  email_verified: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  mrr: number;
  churnRate: number;
  planCounts: Record<string, number>;
}

// ============================================
// THEME
// ============================================
const T = {
  dark: { bg:"#080808",s:"#111111",s2:"#161616",b:"#1E1E1E",t:"#F9FAFB",d:"#6B7280",a:"#4ADE80",r:"#EF4444",glow:"rgba(74,222,128,0.08)",ia:"#6B7280",cyan:"#22D3EE" },
  light: { bg:"#FAFAFA",s:"#FFFFFF",s2:"#F3F4F6",b:"#E5E7EB",t:"#111827",d:"#6B7280",a:"#16A34A",r:"#DC2626",glow:"rgba(22,163,74,0.06)",ia:"#9CA3AF",cyan:"#0891B2" },
};
let C = T.dark;

const PLAN_LABEL: Record<string, string> = { free:"Gratis", trial:"Prueba", basic:"Básico", pro:"Pro", enterprise:"Enterprise", cancelled:"Cancelado", canceled:"Cancelado", suspended:"Suspendido", churned:"Cancelado", active:"Activo" };
const PLAN_COLORS: Record<string, string> = { free:"#6B7280", trial:"#6B7280", basic:"#3B82F6", pro:"#F59E0B", enterprise:"#8B5CF6", cancelled:"#EF4444", canceled:"#EF4444", suspended:"#EF4444", churned:"#EF4444" };

// ============================================
// SMALL COMPONENTS
// ============================================
function Counter({ target }: { target: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) return;
    let c = 0;
    const s = Math.ceil(target / (600 / 16));
    const t = setInterval(() => { c += s; if (c >= target) { setV(target); clearInterval(t); } else setV(c); }, 16);
    return () => clearInterval(t);
  }, [target]);
  return <>{v}</>;
}

function Badge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] || C.a;
  return <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:color+"18", color }}>{PLAN_LABEL[plan] || plan}</span>;
}

function AdminLogo({ size = 20 }: { size?: number }) {
  return (
    <span style={{ display:"inline-flex", flexDirection:"column", alignItems:"flex-start", userSelect:"none" }}>
      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:size, lineHeight:1, letterSpacing:-0.8, background:"linear-gradient(100deg,#4ADE80 0%,#22D3EE 50%,#4ADE80 100%)", backgroundSize:"300% 100%", animation:"gradBreathe 2.5s ease-in-out infinite", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>cleo<span style={{ WebkitTextFillColor:"inherit" }}>.</span></span>
      <span style={{ fontFamily:"monospace", fontSize:Math.max(size*0.32,7), letterSpacing:2.5, color:C.ia, marginTop:1 }}>powered by ia</span>
    </span>
  );
}

// ============================================
// LOGIN
// ============================================
function AdminLogin({ onLogin }: { onLogin: (email: string) => void }) {
  const [step, setStep] = useState(0);
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sp, setSp] = useState(false);
  const [code, setCode] = useState(["","","","","",""]);
  const [countdown, setCountdown] = useState(0);
  const [resends, setResends] = useState(0);
  const cRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { if (countdown <= 0) return; const t = setTimeout(() => setCountdown(countdown - 1), 1000); return () => clearTimeout(t); }, [countdown]);

  const go = async () => {
    if (!e || !p) { setErr("Completa los campos"); return; }
    setLoading(true); setErr("");
    try {
      await api.post('/admin/login', { email: e, password: p });
      setStep(1); setCountdown(60); setResends(1);
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async (i: number, v: string) => {
    const clean = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const nc = [...code]; nc[i] = clean.slice(0, 1); setCode(nc); setErr("");
    if (clean && i < 5) cRefs.current[i + 1]?.focus();
    const fullCode = nc.join("");
    if (fullCode.length === 6) {
      setLoading(true);
      try {
        const { data } = await api.post('/admin/verify-2fa', { code: fullCode });
        localStorage.setItem('cleo_admin_token', data.token);
        onLogin(e);
      } catch (error: any) {
        setErr(error.response?.data?.error || 'Código inválido');
        setCode(["","","","","",""]); cRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    }
  };

  const resend = async () => {
    if (resends >= 3) { setErr("Demasiados intentos. Intenta en 30 minutos."); return; }
    setCode(["","","","","",""]); setErr("");
    try {
      await api.post('/admin/login', { email: e, password: p });
      setCountdown(60); setResends(resends + 1);
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Error al reenviar');
    }
  };

  const cMin = Math.floor(countdown / 60);
  const cSec = String(countdown % 60).padStart(2, "0");
  const fi: React.CSSProperties = { width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 };

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
            <input value={e} onChange={x => setE(x.target.value)} placeholder="Email admin" style={fi} />
            <div style={{ position:"relative" }}>
              <input value={p} onChange={x => setP(x.target.value)} type={sp ? "text" : "password"} placeholder="Contraseña" onKeyDown={x => x.key === "Enter" && go()} style={{...fi, paddingRight:48}} />
              <button onClick={() => setSp(!sp)} style={{ position:"absolute", right:14, top:14, background:"none", border:"none", cursor:"pointer", color:C.d }}>{sp ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            {err ? <div style={{ fontSize:12, color:C.r, marginBottom:10 }}>{err}</div> : null}
            <button onClick={go} disabled={loading} style={{ width:"100%", padding:15, borderRadius:12, border:"none", background:loading ? C.b : C.a, color:loading ? C.d : C.bg, fontSize:15, fontWeight:700, cursor:loading ? "default" : "pointer", fontFamily:"inherit" }}>{loading ? "Verificando..." : "Entrar"}</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:13, color:C.d, marginBottom:4 }}>Código enviado a</p>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>{e}</p>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:12 }}>
              {code.map((c, i) => (
                <input key={i} ref={el => { cRefs.current[i] = el; }} type="text" inputMode="text" maxLength={1} value={c}
                  onChange={ev => handleCode(i, ev.target.value)}
                  onKeyDown={ev => { if (ev.key === "Backspace" && !code[i] && i > 0) cRefs.current[i - 1]?.focus(); }}
                  style={{ width:42, height:50, textAlign:"center", fontSize:20, fontWeight:700, fontFamily:"monospace", background:c ? C.glow : C.s, border:"2px solid "+(c ? C.a : C.b), borderRadius:10, color:C.t, outline:"none" }}
                />
              ))}
            </div>
            {loading && <div style={{ fontSize:12, color:C.d, marginBottom:8 }}>Verificando...</div>}
            {err ? <div style={{ fontSize:12, color:C.r, marginBottom:8 }}>{err}</div> : null}
            <div style={{ marginTop:8 }}>
              {countdown > 0 ? <span style={{ fontSize:12, color:"#555" }}>{"Reenviar en "+cMin+":"+cSec}</span>
              : resends < 3 ? <button onClick={resend} style={{ background:"none", border:"none", color:C.a, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Reenviar código</button>
              : <span style={{ fontSize:12, color:"#555" }}>Demasiados intentos</span>}
            </div>
            <button onClick={() => { setStep(0); setCode(["","","","","",""]); setErr(""); }} style={{ marginTop:16, background:"none", border:"none", color:C.d, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Volver al inicio</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// OVERVIEW
// ============================================
function Overview({ users, stats, loading }: { users: Business[]; stats: Stats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}>
        <Loader size={24} color={C.a} style={{ animation:"spin 1s linear infinite" }} />
      </div>
    );
  }

  const card: React.CSSProperties = { background:C.s, border:"1px solid "+C.b, borderRadius:14, padding:"20px 16px" };
  const label: React.CSSProperties = { fontSize:11, color:C.d, marginTop:4 };

  const newThisWeek = users.filter(u => {
    const d = new Date(u.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d > weekAgo;
  }).length;

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Resumen</h2>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.a }}><Counter target={stats.totalUsers} /></div><div style={label}>Total usuarios</div></div>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.a }}>$<Counter target={stats.mrr} /></div><div style={label}>MRR</div></div>
        <div style={card}><div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.t }}><Counter target={newThisWeek} /></div><div style={label}>Nuevos esta semana</div></div>
      </div>

      {/* Plan distribution */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${Object.keys(stats.planCounts).length}, 1fr)`, gap:6, marginBottom:20 }}>
        {Object.entries(stats.planCounts).map(([plan, count]) => (
          <div key={plan} style={{ ...card, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color: PLAN_COLORS[plan] || C.a }}>{count}</div>
            <div style={{ fontSize:9, color:C.d, marginTop:2 }}>{PLAN_LABEL[plan] || plan}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        <div style={card}><div style={{ fontSize:12, color:C.d }}>Usuarios activos</div><div style={{ fontSize:20, fontWeight:700, marginTop:4, color:C.a }}>{stats.activeUsers}</div></div>
        <div style={card}><div style={{ fontSize:12, color:C.d }}>Churn rate</div><div style={{ fontSize:20, fontWeight:700, marginTop:4, color:stats.churnRate > 10 ? C.r : C.t }}>{stats.churnRate}%</div></div>
      </div>

      {/* Revenue per plan */}
      <div style={{ ...card, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Ingresos por plan</div>
        {Object.entries(stats.planCounts).filter(([plan]) => plan !== 'free' && plan !== 'trial').map(([plan, count]) => {
          const prices: Record<string, number> = { basic:29, pro:79, enterprise:199 };
          const price = prices[plan] || 0;
          const total = count * price;
          return (
            <div key={plan} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid "+C.b }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:PLAN_COLORS[plan] || C.a }} />
                <span style={{ fontSize:12, fontWeight:600 }}>{PLAN_LABEL[plan] || plan}</span>
                <span style={{ fontSize:10, color:C.d }}>{count} x ${price}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:C.a }}>${total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// USERS LIST
// ============================================
function UsersSection({ users, onSelect, loading }: { users: Business[]; onSelect: (u: Business) => void; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");

  const filtered = users.filter(u => {
    if (filterPlan !== "all" && u.plan !== filterPlan) return false;
    if (search && !u.business_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}>
        <Loader size={24} color={C.a} style={{ animation:"spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:16 }}>Usuarios</h2>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={14} color={C.d} style={{ position:"absolute", left:12, top:13 }} />
          <input value={search} onChange={ev => setSearch(ev.target.value)} placeholder="Buscar por nombre o email" style={{ width:"100%", padding:"10px 12px 10px 34px", borderRadius:10, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
        <select value={filterPlan} onChange={ev => setFilterPlan(ev.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:"1px solid "+C.b, background:C.s, color:C.t, fontSize:12, fontFamily:"inherit", outline:"none" }}>
          <option value="all">Todos</option>
          <option value="free">Gratis</option>
          <option value="basic">Básico</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      <div style={{ fontSize:11, color:C.d, marginBottom:8 }}>{filtered.length} usuarios</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(u => (
          <button key={u.id} onClick={() => onSelect(u)} style={{ background:C.s, border:"1px solid "+C.b, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontFamily:"inherit", textAlign:"left", width:"100%" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:C.glow, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:C.a, flexShrink:0 }}>{u.business_name?.[0] || '?'}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.t, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.business_name}</span>
                <Badge plan={u.plan} />
              </div>
              <div style={{ fontSize:11, color:C.d, marginTop:2 }}>{u.email}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.t }}>{u.messages_used}</div>
              <div style={{ fontSize:9, color:C.d }}>mensajes</div>
            </div>
            <ChevronRight size={14} color={C.d} />
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:32, color:C.d, fontSize:13 }}>No se encontraron usuarios</div>
      )}
    </div>
  );
}

// ============================================
// USER DETAIL
// ============================================
function UserDetail({ user, onBack, onUpdate }: { user: Business; onBack: () => void; onUpdate: (id: string, updates: { plan?: string; status?: string }) => void }) {
  const [plan, setPlan] = useState(user.plan);
  const isSuspended = user.status === 'suspended';

  const card: React.CSSProperties = { background:C.s, border:"1px solid "+C.b, borderRadius:10, padding:"10px 12px" };

  const infoFields = [
    { l:"Plan", v: user.plan, color: true },
    { l:"Estado", v: user.status, color: true },
    { l:"Email verificado", v: user.email_verified ? "Sí" : "No" },
    { l:"Mensajes usados", v: String(user.messages_used) },
    { l:"Registro", v: new Date(user.created_at).toLocaleDateString() },
    { l:"Trial expira", v: user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString() : "—" },
  ];

  return (
    <div>
      <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.d, fontSize:13, cursor:"pointer", fontFamily:"inherit", marginBottom:16 }}>
        <X size={14} /> Volver a la lista
      </button>

      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:C.glow, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:C.a }}>{user.business_name?.[0] || '?'}</div>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>{user.business_name}</div>
          <div style={{ fontSize:12, color:C.d }}>{user.email}</div>
        </div>
      </div>

      {isSuspended && (
        <div style={{ background:C.r+"10", border:"1px solid "+C.r+"25", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
          <AlertTriangle size={14} color={C.r} />
          <span style={{ fontSize:12, color:C.r, fontWeight:600 }}>Cuenta suspendida</span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16, marginTop: isSuspended ? 0 : 16 }}>
        {infoFields.map((f, i) => (
          <div key={i} style={card}>
            <div style={{ fontSize:10, color:C.d, marginBottom:4 }}>{f.l}</div>
            {f.color ? <Badge plan={String(f.v)} /> : <div style={{ fontSize:14, fontWeight:600 }}>{f.v}</div>}
          </div>
        ))}
      </div>

      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:10, marginTop:24 }}>Acciones</div>

      {/* Change plan */}
      <div style={{ background:C.s, border:"1px solid "+C.b, borderRadius:12, padding:"14px 16px", marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.d, marginBottom:6 }}>Cambiar plan</div>
        <div style={{ display:"flex", gap:6 }}>
          <select value={plan} onChange={ev => setPlan(ev.target.value)} style={{ flex:1, padding:"10px 12px", borderRadius:8, border:"1px solid "+C.b, background:C.s2, color:C.t, fontSize:13, fontFamily:"inherit", outline:"none" }}>
            <option value="free">Gratis</option>
            <option value="basic">Básico</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <button onClick={() => onUpdate(user.id, { plan })} style={{ padding:"10px 16px", borderRadius:8, border:"none", background:C.a, color:C.bg, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Aplicar</button>
        </div>
      </div>

      {/* Suspend / Reactivate */}
      {isSuspended ? (
        <button onClick={() => onUpdate(user.id, { status: 'active' })} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.a+"40", background:C.glow, color:C.a, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Play size={12} /> Reactivar cuenta</button>
      ) : user.status !== 'canceled' && user.status !== 'churned' ? (
        <button onClick={() => onUpdate(user.id, { status: 'suspended' })} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.r+"25", background:C.r+"08", color:C.r, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Pause size={12} /> Suspender cuenta</button>
      ) : null}
    </div>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
export default function Admin() {
  const [theme, setTheme] = useState("dark");
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  C = T[resolved as keyof typeof T];
  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");

  const [authed, setAuthed] = useState(() => !!localStorage.getItem('cleo_admin_token'));
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedUser, setSelectedUser] = useState<Business | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [mob, setMob] = useState(false);

  useEffect(() => { const c = () => setMob(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes gradBreathe{0%{background-position:0% 50%;filter:brightness(1)}50%{background-position:100% 50%;filter:brightness(1.2)}100%{background-position:0% 50%;filter:brightness(1)}}*{box-sizing:border-box}::-webkit-scrollbar{display:none}`;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  const adminHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('cleo_admin_token')}` },
  });

  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users', adminHeaders()),
        api.get('/admin/stats', adminHeaders()),
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch {
      localStorage.removeItem('cleo_admin_token');
      setAuthed(false);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  const updateUser = async (id: string, updates: { plan?: string; status?: string }) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}`, updates, adminHeaders());
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...data } : u)));
      if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, ...data });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const logout = () => {
    localStorage.removeItem('cleo_admin_token');
    setAuthed(false);
    setUsers([]);
    setStats(null);
  };

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  const tabs = [
    { id:"overview", label:"Resumen", Icon: BarChart3 },
    { id:"users", label:"Usuarios", Icon: Users },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.t, minHeight:"100vh", display:"flex", flexDirection:mob ? "column" : "row", overflowX:"hidden", maxWidth:"100vw" }}>

      {/* SIDEBAR desktop */}
      {!mob && (
        <div style={{ width:220, borderRight:"1px solid "+C.b, padding:"20px 12px", flexShrink:0, position:"sticky", top:0, height:"100vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28, paddingLeft:8 }}>
            <AdminLogo size={16} />
          </div>
          <div style={{ flex:1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedUser(null); }} style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"none", background:tab === t.id ? C.glow : "transparent", color:tab === t.id ? C.a : C.d, fontSize:13, fontWeight:tab === t.id ? 600 : 500, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, marginBottom:2, textAlign:"left" }}>
                <t.Icon size={16} /> {t.label}
              </button>
            ))}
          </div>
          <div>
            <button onClick={cycleTheme} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.d, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", marginBottom:6, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {resolved === "dark" ? <Moon size={13} /> : resolved === "light" ? <Sun size={13} /> : <Settings size={13} />}
              {resolved === "dark" ? "Oscuro" : resolved === "light" ? "Claro" : "Sistema"}
            </button>
            <button onClick={() => fetchData()} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.d, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", marginBottom:6, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <RefreshCw size={13} /> Actualizar datos
            </button>
            <button onClick={logout} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid "+C.b, background:"transparent", color:C.d, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{ flex:1, padding:mob ? "16px 16px 80px" : "24px 28px", maxWidth:mob ? "100%" : 900, overflowY:"auto" }}>
        {mob && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <AdminLogo size={14} />
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={() => fetchData()} style={{ width:32, height:32, borderRadius:"50%", background:C.s, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <RefreshCw size={14} color={C.d} />
              </button>
              <button onClick={cycleTheme} style={{ width:32, height:32, borderRadius:"50%", background:C.s, border:"1px solid "+C.b, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                {resolved === "dark" ? <Moon size={14} color={C.d} /> : resolved === "light" ? <Sun size={14} color={C.d} /> : <Settings size={14} color={C.d} />}
              </button>
            </div>
          </div>
        )}
        {tab === "overview" && <Overview users={users} stats={stats} loading={dataLoading} />}
        {tab === "users" && !selectedUser && <UsersSection users={users} onSelect={setSelectedUser} loading={dataLoading} />}
        {tab === "users" && selectedUser && <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} onUpdate={updateUser} />}
      </div>

      {/* BOTTOM NAV mobile */}
      {mob && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.bg, borderTop:"1px solid "+C.b, display:"flex", padding:"8px 0 4px", zIndex:100 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedUser(null); }} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"6px 0" }}>
              <t.Icon size={18} color={tab === t.id ? C.a : C.d} strokeWidth={tab === t.id ? 2.5 : 1.5} />
              <span style={{ fontSize:9, fontWeight:tab === t.id ? 700 : 500, color:tab === t.id ? C.a : C.d }}>{t.label}</span>
            </button>
          ))}
          <button onClick={logout} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:"none", border:"none", cursor:"pointer", padding:"6px 0" }}>
            <X size={18} color={C.d} strokeWidth={1.5} />
            <span style={{ fontSize:9, fontWeight:500, color:C.d }}>Salir</span>
          </button>
        </div>
      )}
    </div>
  );
}
