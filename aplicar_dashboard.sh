#!/bin/bash
# Script para aplicar cambios al Dashboard.jsx
# Ejecutar desde ~/Desktop/Cleo

FILE="frontend/src/pages/Dashboard.jsx"

echo "Aplicando cambios al Dashboard..."

# 1. Agregar ACENTOS_PLAN después de PLAN_LABEL
python3 << 'PYEOF2'
import re

with open("frontend/src/pages/Dashboard.jsx", "r") as f:
    content = f.read()

# Cambio 1: PLAN_LABEL + ACENTOS_PLAN
content = content.replace(
    'const PLAN_LABEL = { trial:"Prueba", basico:"Básico", negocio:"Negocio", pro:"Pro", suspended:"Suspendido", cancelled:"Cancelado" };',
    """const PLAN_LABEL = { trial:"Prueba", basico:"Básico", negocio:"Negocio", pro:"Pro ⭐", suspended:"Suspendido", cancelled:"Cancelado" };

const ACENTOS_PLAN = {
  trial:   { accent:"#4ADE80", accentGlow:"rgba(74,222,128,0.10)", grad:"linear-gradient(100deg,#4ADE80,#22D3EE)" },
  basico:  { accent:"#3B82F6", accentGlow:"rgba(59,130,246,0.08)", grad:"linear-gradient(100deg,#3B82F6,#60A5FA)" },
  negocio: { accent:"#4ADE80", accentGlow:"rgba(74,222,128,0.10)", grad:"linear-gradient(100deg,#4ADE80,#22D3EE)" },
  pro:     { accent:"#F59E0B", accentGlow:"rgba(245,158,11,0.10)", grad:"linear-gradient(100deg,#F59E0B,#FCD34D)" },
};"""
)

# Cambio 2: Aplicar acento por plan en CleoDashboard
old2 = '  C = THEMES[resolved];\n  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");'
new2 = """  C = THEMES[resolved];
  const _planAccent = ACENTOS_PLAN[biz?.plan] || ACENTOS_PLAN.negocio;
  C = { ...C, accent: _planAccent.accent, accentGlow: _planAccent.accentGlow, grad: _planAccent.grad };
  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");"""
content = content.replace(
    '  C = THEMES[resolved];
  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark");',
    new2
)

# Cambio 3: Borde dorado en header para Pro
content = content.replace(
    'background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "14px 20px"',
    'background: C.bg, borderBottom: `1px solid ${C.border}`, borderTop: biz?.plan === "pro" ? `2px solid ${C.accent}55` : "none", padding: "14px 20px"'
)

with open("frontend/src/pages/Dashboard.jsx", "w") as f:
    f.write(content)

# Verificaciones
assert "ACENTOS_PLAN" in content, "ERROR: ACENTOS_PLAN no se insertó"
assert "_planAccent" in content, "ERROR: aplicación de plan accent no encontrada"
assert "Pro ⭐" in content, "ERROR: badge Pro ⭐ no encontrado"
print("✅ Dashboard.jsx actualizado correctamente")
print(f"   - ACENTOS_PLAN: {'✅' if 'ACENTOS_PLAN' in content else '❌'}")
print(f"   - Plan accent:  {'✅' if '_planAccent' in content else '❌'}")
print(f"   - Pro ⭐:       {'✅' if 'Pro ⭐' in content else '❌'}")
print(f"   - Header Pro:   {'✅' if 'biz?.plan === \"pro\"' in content else '❌'}")
PYEOF2
