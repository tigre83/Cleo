import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { Eye, EyeOff, Check } from "lucide-react";

export default function ResetPassword() {
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [err,     setErr]     = useState("");
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  const save = async () => {
    if (pw !== confirm) { setErr("Las contraseñas no coinciden"); return; }
    if (pw.length < 8)  { setErr("Mínimo 8 caracteres"); return; }
    setLoading(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); setLoading(false); return; }
    setMsg("Contraseña actualizada. Redirigiendo...");
    setTimeout(() => window.location.href = "/dashboard", 2000);
    setLoading(false);
  };

  const fi = { width:"100%", padding:"14px 16px", borderRadius:12, border:"1px solid #1E1E1E", background:"#111111", color:"#F9FAFB", fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#080808", color:"#F9FAFB", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@800&display=swap')`}</style>
      <div style={{ width:"100%", maxWidth:380, textAlign:"center" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:28, background:"linear-gradient(100deg,#4ADE80,#22D3EE)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>cleo.</div>
        {!ready && !msg && <div style={{ fontSize:14, color:"#6B7280" }}>Procesando enlace...</div>}
        {ready && !msg && (
          <div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:24 }}>Nueva contraseña</h1>
            <div style={{ position:"relative" }}>
              <input value={pw} onChange={e=>setPw(e.target.value)} type={showPw?"text":"password"} placeholder="Nueva contraseña" style={{...fi, paddingRight:48}}/>
              <button onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:14, top:14, background:"none", border:"none", cursor:"pointer", color:"#6B7280" }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" placeholder="Confirmar contraseña" style={fi}/>
            {err && <div style={{ fontSize:12, color:"#EF4444", marginBottom:10 }}>{err}</div>}
            <button onClick={save} disabled={!pw||!confirm||loading}
              style={{ width:"100%", padding:15, borderRadius:12, border:"none", background:pw&&confirm?"#4ADE80":"#1E1E1E", color:pw&&confirm?"#080808":"#6B7280", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </div>
        )}
        {msg && (
          <div>
            <Check size={32} color="#4ADE80" style={{ marginBottom:12 }}/>
            <div style={{ fontSize:14, color:"#4ADE80" }}>{msg}</div>
          </div>
        )}
      </div>
    </div>
  );
}
