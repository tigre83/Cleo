import { useState, useEffect } from "react";

export function CleoButton({ onClick, C }) {
  const [breathe, setBreathe] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setBreathe(b => !b), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <button onClick={onClick} title="Abrir Cleo Copiloto"
      style={{ position:"fixed", bottom:90, right:16, zIndex:99, width:48, height:48, borderRadius:"50%", border:`1.5px solid ${C.accent}50`, background:C.bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 24px rgba(0,0,0,0.4), 0 0 ${breathe?"24px":"12px"} ${C.accent}${breathe?"30":"18"}`, transform:`scale(${breathe?1.05:1})`, transition:"all 0.8s ease", outline:"none" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.1)"; e.currentTarget.style.boxShadow=`0 6px 28px rgba(0,0,0,0.5), 0 0 28px ${C.accent}40`; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow=`0 4px 24px rgba(0,0,0,0.4), 0 0 12px ${C.accent}18`; }}>
      <div style={{ position:"relative", width:28, height:28 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:`radial-gradient(circle, ${C.accent}20 0%, transparent 70%)` }}/>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:12, height:12, borderRadius:"50%", background:C.accent, boxShadow:`0 0 10px ${C.accent}, 0 0 20px ${C.accent}60` }}/>
        <div style={{ position:"absolute", bottom:0, right:0, width:9, height:9, borderRadius:"50%", background:"#22C55E", border:`2px solid ${C.bg}` }}/>
      </div>
    </button>
  );
}
