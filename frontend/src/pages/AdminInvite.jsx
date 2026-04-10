import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Check } from "lucide-react";

const C = {
  bg:"#080808", s:"#111111", s2:"#161616", b:"#1E1E1E",
  t:"#F9FAFB", d:"#6B7280", a:"#4ADE80", r:"#EF4444",
};

export default function AdminInvite() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const API          = import.meta.env.VITE_API_URL;

  const [info,     setInfo]     = useState(null);   // { email, role }
  const [error,    setError]    = useState("");
  const [pass,     setPass]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); }
        else { setInfo(d); }
        setLoading(false);
      })
      .catch(() => { setError("Error de conexión"); setLoading(false); });
  }, [token]);

  const checks = [
    { l:"Mínimo 8 caracteres",   ok: pass.length >= 8 },
    { l:"Letras y números",      ok: /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass) },
    { l:"Un símbolo (!@#$%)",    ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass) },
  ];
  const allChecks = checks.every(c => c.ok);
  const canSave   = allChecks && pass === confirm;

  const accept = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/invite/${token}/accept`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password: pass }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Error al activar cuenta"); setSaving(false); return; }
      localStorage.setItem("adminToken", d.token);
      setDone(true);
      setTimeout(() => navigate("/admin"), 2000);
    } catch { setError("Error de conexión"); }
    setSaving(false);
  };

  const fi = {
    width:"100%", padding:"14px 16px", borderRadius:12,
    border:"1px solid "+C.b, background:C.s, color:C.t,
    fontSize:15, fontFamily:"inherit", outline:"none",
    boxSizing:"border-box", marginBottom:10,
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:C.bg, color:C.t, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      <div style={{ width:"100%", maxWidth:380, textAlign:"center" }}>

        {/* Logo */}
        <div style={{ marginBottom:28 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, background:"linear-gradient(100deg,#4ADE80,#22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>cleo.</span>
          <div style={{ fontFamily:"monospace", fontSize:10, letterSpacing:2.5, color:C.d, marginTop:2 }}>powered by ia</div>
        </div>

        {loading && <div style={{ fontSize:14, color:C.d }}>Verificando invitación...</div>}

        {!loading && error && (
          <div style={{ background:C.r+"10", border:"1px solid "+C.r+"30", borderRadius:14, padding:24 }}>
            <div style={{ fontSize:16, fontWeight:700, color:C.r, marginBottom:8 }}>Invitación no válida</div>
            <div style={{ fontSize:13, color:C.d, lineHeight:1.5 }}>{error}</div>
          </div>
        )}

        {!loading && !error && done && (
          <div style={{ background:C.a+"10", border:"1px solid "+C.a+"30", borderRadius:14, padding:32 }}>
            <Check size={32} color={C.a} style={{ marginBottom:12 }}/>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Cuenta activada</div>
            <div style={{ fontSize:13, color:C.d }}>Redirigiendo al panel...</div>
          </div>
        )}

        {!loading && !error && !done && info && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:6 }}>
              <Shield size={16} color={C.a}/>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>Activar cuenta admin</h1>
            </div>
            <div style={{ fontSize:13, color:C.d, marginBottom:4 }}>Acceso como</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{info.email}</div>
            <div style={{ display:"inline-block", padding:"2px 10px", borderRadius:6, background:C.a+"18", color:C.a, fontSize:11, fontWeight:700, marginBottom:28 }}>
              {info.role === "owner" ? "Dueño" : "Soporte"}
            </div>

            <p style={{ fontSize:13, color:C.d, marginBottom:16, textAlign:"left" }}>Crea tu contraseña para acceder al panel:</p>

            <div style={{ position:"relative" }}>
              <input
                value={pass} onChange={e=>setPass(e.target.value)}
                type={showPw?"text":"password"} placeholder="Contraseña"
                style={{...fi, paddingRight:48}}
              />
              <button onClick={()=>setShowPw(!showPw)} style={{ position:"absolute",right:14,top:14,background:"none",border:"none",cursor:"pointer",color:C.d }}>
                {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>

            {/* Indicadores */}
            {pass && (
              <div style={{ textAlign:"left", marginBottom:12 }}>
                {checks.map((ch,i)=>(
                  <div key={i} style={{ fontSize:12, color:ch.ok?C.a:C.d, display:"flex", alignItems:"center", gap:6, padding:"2px 0" }}>
                    <div style={{ width:14,height:14,borderRadius:"50%",border:"1.5px solid "+(ch.ok?C.a:C.b),background:ch.ok?C.a+"18":"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
                      {ch.ok && <Check size={8} color={C.a} strokeWidth={3}/>}
                    </div>
                    {ch.l}
                  </div>
                ))}
              </div>
            )}

            <input
              value={confirm} onChange={e=>setConfirm(e.target.value)}
              type="password" placeholder="Confirmar contraseña"
              style={fi}
            />
            {confirm && pass !== confirm && <div style={{ fontSize:12, color:C.d, marginBottom:8, textAlign:"left" }}>Las contraseñas no coinciden</div>}

            {error && <div style={{ fontSize:12, color:C.r, marginBottom:10 }}>{error}</div>}

            <button onClick={accept} disabled={!canSave||saving}
              style={{ width:"100%",padding:15,borderRadius:12,border:"none",background:canSave?C.a:C.b,color:canSave?C.bg:C.d,fontSize:15,fontWeight:700,cursor:canSave?"pointer":"default",fontFamily:"inherit" }}>
              {saving?"Activando...":"Activar cuenta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
