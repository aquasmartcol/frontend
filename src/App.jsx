import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "https://backend-48ai.onrender.com";
const WS_URL  = "wss://backend-48ai.onrender.com/ws";
/* ═══════════════════════════════════════════════════════════════════
   AQUASMART — Sistema de Telemetría de Acueducto Rural
   Roles: público (solo lectura) | operario | administrador
   Un tanque de reserva
═══════════════════════════════════════════════════════════════════ */

// ── Usuarios del sistema ────────────────────────────────────────────
const USERS = {
  operario: { password: "operario123", role: "operator", label: "Operario" },
  admin:    { password: "admin2024",   role: "admin",    label: "Administrador" },
};

// ── Umbrales por defecto ────────────────────────────────────────────
const DEFAULT_THRESHOLDS = { low: 30, high: 90 };

// ── Datos simulados del tanque ──────────────────────────────────────
const TANK_INIT = {
  name:     "Tanque Principal",
  location: "Lérida, Tolima",
  level:    54,
  pump:     false,
  valve:    true,
  flow:     2.1,
  temp:     18,
  pressure: 1.4,
  online:   true,
};

/* ═══════════════════════════════════════════════════════════════════
   PALETA DE COLORES
═══════════════════════════════════════════════════════════════════ */
const C = {
  navy:    "#0a1628",
  blue:    "#1565c0",
  blueMid: "#1976d2",
  blueL:   "#42a5f5",
  cyan:    "#00acc1",
  teal:    "#00897b",
  success: "#2e7d32",
  warning: "#f57c00",
  danger:  "#c62828",
  purple:  "#6a1b9a",
  bg:      "#f0f4f8",
  card:    "#ffffff",
  border:  "#dde3ea",
  text:    "#0d1b2a",
  muted:   "#607080",
};

/* ═══════════════════════════════════════════════════════════════════
   ÍCONOS SVG INLINE
═══════════════════════════════════════════════════════════════════ */
const Ic = {
  drop:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z"/></svg>,
  pump:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  valve:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="9" width="20" height="6" rx="2"/><path d="M8 9V5M16 9V5M8 19v-4M16 19v-4"/></svg>,
  alert:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="white"/></svg>,
  flow:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  temp:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  pressure: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  shield:   (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  user:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:   (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  lock:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  eye:      (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  settings: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  check:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  close:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  log:      (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  wifi:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  sliders:  (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  mode:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>,
  edit:     (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  tool:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTES REUTILIZABLES
═══════════════════════════════════════════════════════════════════ */

function Toggle({ on, onChange, disabled = false, size = "md" }) {
  const w = size === "sm" ? 32 : 40;
  const h = size === "sm" ? 18 : 22;
  const th = size === "sm" ? 14 : 18;
  const tOn = size === "sm" ? 14 : 20;
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: w, height: h, borderRadius: h / 2,
        background: on ? C.blue : "#b0bec5",
        border: "none", padding: 0, position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.25s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: (h - th) / 2,
        left: on ? tOn : (h - th) / 2,
        width: th, height: th, borderRadius: "50%",
        background: "#fff", transition: "left 0.25s",
      }} />
    </button>
  );
}

function WaterGauge({ level, thresholds, size = 110 }) {
  const color = level <= thresholds.low ? C.danger : level >= thresholds.high ? C.warning : C.teal;
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - level / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eceff1" strokeWidth="9" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s" }} />
      {/* Low threshold marker */}
      <circle cx={cx} cy={8}
        r="3" fill={C.danger} transform={`rotate(${thresholds.low * 3.6}, ${cx}, ${cy})`} />
      {/* High threshold marker */}
      <circle cx={cx} cy={8}
        r="3" fill={C.warning} transform={`rotate(${thresholds.high * 3.6}, ${cx}, ${cy})`} />
    </svg>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 28 - ((v - min) / (max - min || 1)) * 25;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 30" style={{ width: "100%", height: 28 }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 14px", borderRadius: 12, fontSize: 13,
          background: t.type === "success" ? "#e8f5e9" : t.type === "error" ? "#ffebee" : "#e3f2fd",
          color: t.type === "success" ? C.success : t.type === "error" ? C.danger : C.blue,
          border: `1px solid ${t.type === "success" ? "#a5d6a7" : t.type === "error" ? "#ef9a9a" : "#90caf9"}`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          animation: "slideIn 0.25s ease",
        }}>
          <span style={{ marginTop: 1, flexShrink: 0 }}>
            {t.type === "success" ? Ic.check() : t.type === "error" ? Ic.close() : Ic.alert()}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PANTALLA DE LOGIN
═══════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    const found = USERS[user.toLowerCase()];
    if (found && found.password === pass) {
      onLogin({ username: user.toLowerCase(), role: found.role, label: found.label });
    } else {
      setErr("Usuario o contraseña incorrectos");
    }
    setBusy(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(145deg, ${C.navy} 0%, #0d2137 40%, #0a3050 100%)`,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        input:focus { outline: none; border-color: ${C.blueL} !important; box-shadow: 0 0 0 3px rgba(66,165,245,0.15) !important; }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* Anillos decorativos */}
      {[320, 480, 620].map((s, i) => (
        <div key={i} style={{
          position: "fixed", width: s, height: s, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.05)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }} />
      ))}

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#1565c0,#00acc1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(21,101,192,0.4)",
          }}>
            <span style={{ color: "#fff" }}>{Ic.drop(36)}</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 700, margin: "0 0 4px",
            fontFamily: "'DM Sans', sans-serif", letterSpacing: -0.5 }}>
            AquaSmart
          </h1>
          <p style={{ color: "#78909c", fontSize: 14, margin: 0 }}>
            Sistema de Telemetría — Lérida, Tolima
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)", overflow: "hidden",
        }}>
          {/* Aviso público */}
          <div style={{
            padding: "12px 24px", background: "rgba(0,172,193,0.12)",
            borderBottom: "1px solid rgba(0,172,193,0.2)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: "#4dd0e1" }}>{Ic.eye(16)}</span>
            <p style={{ color: "#b2ebf2", fontSize: 12, margin: 0 }}>
              La vista pública no requiere iniciar sesión.{" "}
              <button onClick={() => onLogin({ username: "publico", role: "public", label: "Público" })}
                style={{ color: "#4dd0e1", background: "none", border: "none", cursor: "pointer",
                  padding: 0, fontSize: 12, fontWeight: 600, textDecoration: "underline" }}>
                Ver datos en tiempo real →
              </button>
            </p>
          </div>

          <div style={{ padding: 28 }}>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", color: "#90a4ae", fontSize: 11,
                  fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>USUARIO</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%",
                    transform: "translateY(-50%)", color: "#546e7a" }}>{Ic.user(16)}</span>
                  <input value={user} onChange={e => { setUser(e.target.value); setErr(""); }}
                    placeholder="operario / admin"
                    style={{
                      width: "100%", padding: "11px 12px 11px 38px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10, color: "#fff", fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                    }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "#90a4ae", fontSize: 11,
                  fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>CONTRASEÑA</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%",
                    transform: "translateY(-50%)", color: "#546e7a" }}>{Ic.lock(16)}</span>
                  <input type="password" value={pass}
                    onChange={e => { setPass(e.target.value); setErr(""); }}
                    placeholder="••••••••••"
                    style={{
                      width: "100%", padding: "11px 12px 11px 38px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10, color: "#fff", fontSize: 14,
                      fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                    }} />
                </div>
              </div>

              {err && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
                  background: "rgba(198,40,40,0.15)", borderRadius: 8,
                  border: "1px solid rgba(198,40,40,0.3)", color: "#ef9a9a", fontSize: 13,
                }}>
                  <span style={{ flexShrink: 0 }}>{Ic.alert(16)}</span> {err}
                </div>
              )}

              <button type="submit" disabled={busy} style={{
                padding: "12px", borderRadius: 10, border: "none", cursor: busy ? "wait" : "pointer",
                background: busy ? "#546e7a" : "linear-gradient(135deg,#1565c0,#00acc1)",
                color: "#fff", fontSize: 15, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: busy ? "none" : "0 4px 16px rgba(21,101,192,0.35)",
                transition: "all 0.2s",
              }}>
                {busy ? "Verificando..." : "Iniciar sesión"}
              </button>
            </form>

            {/* Credenciales demo */}
            <div style={{ marginTop: 20, padding: 14, borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ color: "#78909c", fontSize: 11, fontWeight: 600,
                letterSpacing: 1, margin: "0 0 8px" }}>CREDENCIALES DE DEMO</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Operario", user: "operario", pass: "operario123", color: C.teal },
                  { label: "Admin", user: "admin", pass: "admin2024", color: C.purple },
                ].map(d => (
                  <button key={d.label} onClick={() => { setUser(d.user); setPass(d.pass); setErr(""); }}
                    style={{
                      padding: "8px 10px", borderRadius: 8, border: `1px solid ${d.color}44`,
                      background: `${d.color}15`, color: d.color, fontSize: 12,
                      fontWeight: 600, cursor: "pointer", textAlign: "left",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                    {d.label}<br />
                    <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 11 }}>{d.user} / {d.pass}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VISTA PÚBLICA — Solo lectura, sin login
═══════════════════════════════════════════════════════════════════ */
function PublicView({ tank, thresholds, alerts, onLogin }) {
  const color = tank.level <= thresholds.low ? C.danger
    : tank.level >= thresholds.high ? C.warning : C.teal;
  const status = tank.level <= thresholds.low ? "NIVEL BAJO"
    : tank.level >= thresholds.high ? "NIVEL ALTO" : "NORMAL";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {/* Header */}
      <header style={{
        background: C.navy, borderBottom: `3px solid ${C.blue}`,
        padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ color: C.blueL }}>{Ic.drop(22)}</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>AquaSmart</span>
        <span style={{ color: "#546e7a", fontSize: 13 }}>— Lérida, Tolima</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
            background: "#e8f5e9", borderRadius: 20, fontSize: 12, color: C.success, fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success,
              animation: "pulse 1.5s infinite" }} />
            En vivo
          </div>
          <button onClick={() => onLogin(null)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.blue}`,
            background: "transparent", color: C.blueL, fontSize: 12, cursor: "pointer", fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {Ic.user(14)} Iniciar sesión
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
        {/* Banner informativo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          background: "#e3f2fd", borderRadius: 10, marginBottom: 28,
          border: "1px solid #90caf9", fontSize: 13, color: C.blue,
        }}>
          <span>{Ic.eye(16)}</span>
          <span>Vista pública — datos en tiempo real. Solo los operarios y administradores pueden controlar el sistema.</span>
        </div>

        {/* Card principal del tanque */}
        <div style={{
          background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
          overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}>
          {/* Barra de color de estado */}
          <div style={{ height: 5, background: color }} />

          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              {/* Info + gauge */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ position: "relative" }}>
                  <WaterGauge level={tank.level} thresholds={thresholds} size={120} />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{tank.level}%</span>
                    <span style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>nivel</span>
                  </div>
                </div>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: C.text }}>{tank.name}</h2>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: C.muted }}>{tank.location}</p>
                  <span style={{
                    display: "inline-block", padding: "4px 12px", borderRadius: 20,
                    background: color + "18", color, fontSize: 12, fontWeight: 700,
                  }}>{status}</span>
                </div>
              </div>
              {/* Estado bomba (solo visual) */}
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: C.muted, fontWeight: 600 }}>MOTOBOMBA</p>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end",
                  fontSize: 15, fontWeight: 700,
                  color: tank.pump ? C.success : C.muted,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%",
                    background: tank.pump ? C.success : "#b0bec5" }} />
                  {tank.pump ? "Activa" : "Inactiva"}
                </div>
                <p style={{ margin: "8px 0 4px", fontSize: 11, color: C.muted, fontWeight: 600 }}>COMPUERTA</p>
                <div style={{ fontSize: 15, fontWeight: 700, color: tank.valve ? C.blue : C.muted }}>
                  {tank.valve ? "Abierta" : "Cerrada"}
                </div>
              </div>
            </div>

            {/* Barra de nivel */}
            <div style={{ margin: "24px 0 8px" }}>
              <div style={{
                height: 10, borderRadius: 5, background: "#eceff1", overflow: "visible",
                position: "relative",
              }}>
                <div style={{
                  height: "100%", borderRadius: 5, background: color,
                  width: `${tank.level}%`, transition: "width 0.8s ease",
                }} />
                {/* Marcadores de umbral */}
                {[
                  { pct: thresholds.low, color: C.danger, label: `${thresholds.low}%` },
                  { pct: thresholds.high, color: C.warning, label: `${thresholds.high}%` },
                ].map(m => (
                  <div key={m.pct} style={{ position: "absolute", top: -4, left: `${m.pct}%`,
                    transform: "translateX(-50%)" }}>
                    <div style={{ width: 2, height: 18, background: m.color, borderRadius: 1 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.danger }}>↑ {thresholds.low}% activar bomba</span>
                <span style={{ fontSize: 11, color: C.warning }}>{thresholds.high}% cerrar ↑</span>
              </div>
            </div>

            {/* Métricas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 20 }}>
              {[
                { icon: Ic.flow(16), label: "Flujo", value: `${tank.flow} L/s`, color: C.blue },
                { icon: Ic.temp(16), label: "Temperatura", value: `${tank.temp}°C`, color: C.cyan },
                { icon: Ic.pressure(16), label: "Presión", value: `${tank.pressure} bar`, color: C.teal },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: "12px 14px", borderRadius: 12,
                  background: "#f5f7fa", border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: m.color, marginBottom: 4 }}>
                    {m.icon}
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{m.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas recientes */}
        {alerts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: C.text }}>
              Alertas recientes
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.slice(0, 5).map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 14px", borderRadius: 10,
                  background: a.type === "danger" ? "#ffebee" : a.type === "warning" ? "#fff8e1" : "#e3f2fd",
                  border: `1px solid ${a.type === "danger" ? "#ef9a9a" : a.type === "warning" ? "#ffe082" : "#90caf9"}`,
                }}>
                  <span style={{ color: a.type === "danger" ? C.danger : a.type === "warning" ? C.warning : C.blue, flexShrink: 0 }}>
                    {Ic.alert(16)}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: C.text }}>{a.msg}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ESP32 status */}
        <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 12,
          background: C.card, border: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: tank.online ? C.success : C.danger }}>{Ic.wifi(16)}</span>
            <span style={{ color: C.text, fontWeight: 600 }}>ESP32</span>
            <span style={{ color: tank.online ? C.success : C.danger }}>
              {tank.online ? "● Conectado" : "● Offline"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: C.muted }}>
            Actualización automática cada 3 segundos
          </span>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VISTA OPERARIO — Lectura + control básico de bomba y compuerta
═══════════════════════════════════════════════════════════════════ */
function OperatorView({ user, tank, thresholds, alerts, autoMode, onTogglePump, onToggleValve, onLogout, toastFn }) {
  const color = tank.level <= thresholds.low ? C.danger
    : tank.level >= thresholds.high ? C.warning : C.teal;
  const status = tank.level <= thresholds.low ? "NIVEL BAJO"
    : tank.level >= thresholds.high ? "NIVEL ALTO" : "NORMAL";
  const histRef = useRef(Array.from({ length: 20 }, () => tank.level + (Math.random() - 0.5) * 8));

  return (
    <div style={{ minHeight: "100vh", background: "#eef2f7", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)} }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: "#1a2744", display: "flex", flexDirection: "column",
        padding: "0 0 20px",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#1565c0,#00acc1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff" }}>{Ic.drop(18)}</span>
            </div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 15 }}>AquaSmart</p>
              <p style={{ margin: 0, color: "#546e7a", fontSize: 11 }}>Operario</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {[
            { icon: Ic.drop(16), label: "Panel principal" },
            { icon: Ic.alert(16), label: `Alertas (${alerts.filter(a => a.type === "danger").length})` },
            { icon: Ic.log(16), label: "Registro" },
          ].map((n, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 8, marginBottom: 2, cursor: "pointer",
              background: i === 0 ? "rgba(21,101,192,0.25)" : "transparent",
              color: i === 0 ? C.blueL : "#78909c", fontSize: 13, fontWeight: i === 0 ? 600 : 400,
            }}>
              {n.icon} {n.label}
            </div>
          ))}
        </div>

        {/* User info */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg,#00695c,#00acc1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>{user.label[0]}</div>
            <div>
              <p style={{ margin: 0, color: "#cfd8dc", fontSize: 13, fontWeight: 600 }}>{user.label}</p>
              <p style={{ margin: 0, color: "#546e7a", fontSize: 11 }}>@{user.username}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px", borderRadius: 8, border: "1px solid rgba(239,83,80,0.3)",
            background: "rgba(239,83,80,0.08)", color: "#ef9a9a", fontSize: 12,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
          }}>
            {Ic.logout(14)} Cerrar sesión
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft: 220, padding: "24px 28px", minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Panel del Operario</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: C.muted }}>
              {tank.name} · {tank.location}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              background: "#e8f5e9", borderRadius: 20, fontSize: 12, color: C.success, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success,
                animation: "pulse 1.5s infinite" }} />
              En vivo
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: autoMode ? "#e3f2fd" : "#fff8e1",
              color: autoMode ? C.blue : C.warning,
            }}>
              {autoMode ? "Modo AUTO" : "Modo MANUAL"}
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Nivel actual", value: `${tank.level}%`, color, icon: Ic.drop(18) },
            { label: "Flujo", value: `${tank.flow} L/s`, color: C.blue, icon: Ic.flow(18) },
            { label: "Temperatura", value: `${tank.temp}°C`, color: C.cyan, icon: Ic.temp(18) },
            { label: "Presión", value: `${tank.pressure} bar`, color: C.teal, icon: Ic.pressure(18) },
          ].map((k, i) => (
            <div key={i} style={{
              background: C.card, borderRadius: 14, padding: "16px",
              border: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: k.color }}>{k.icon}</span>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf50" }} />
              </div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>{k.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Main panel: gauge + controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
          {/* Gauge card */}
          <div style={{
            background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
            padding: 24, boxShadow: "0 1px 8px rgba(0,0,0,0.04)", overflow: "hidden",
          }}>
            <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: 14, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>{tank.name}</h2>
              <span style={{
                display: "inline-block", marginTop: 4, padding: "3px 10px",
                borderRadius: 20, background: color + "18", color, fontSize: 12, fontWeight: 700,
              }}>{status}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <WaterGauge level={tank.level} thresholds={thresholds} size={140} />
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{tank.level}%</span>
                  <span style={{ fontSize: 11, color: C.muted }}>nivel</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {/* Barra de nivel */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    <span>0%</span><span>100%</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 6, background: "#eceff1",
                    position: "relative", overflow: "visible" }}>
                    <div style={{
                      height: "100%", borderRadius: 6,
                      width: `${tank.level}%`, background: color,
                      transition: "width 0.8s ease",
                    }} />
                    <div style={{ position: "absolute", top: -2, left: `${thresholds.low}%`,
                      transform: "translateX(-50%)", width: 2, height: 16, background: C.danger, borderRadius: 1 }} />
                    <div style={{ position: "absolute", top: -2, left: `${thresholds.high}%`,
                      transform: "translateX(-50%)", width: 2, height: 16, background: C.warning, borderRadius: 1 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: C.danger }}>↑{thresholds.low}% bomba ON</span>
                    <span style={{ fontSize: 10, color: C.warning }}>{thresholds.high}% cerrar↑</span>
                  </div>
                </div>
                {/* Sparkline */}
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: C.muted }}>Historial nivel</p>
                  <Sparkline data={histRef.current} color={color} />
                </div>
              </div>
            </div>
          </div>

          {/* Controls card */}
          <div style={{
            background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
            padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>
              Control de Dispositivos
            </h3>

            {/* Advertencia modo auto */}
            {autoMode && (
              <div style={{
                padding: "8px 12px", borderRadius: 8, background: "#e3f2fd",
                border: "1px solid #90caf9", fontSize: 12, color: C.blue,
              }}>
                ℹ️ Modo automático activo. Los cambios manuales pueden ser revertidos por el sistema.
              </div>
            )}

            {/* Motobomba */}
            <div style={{
              padding: 16, borderRadius: 12,
              background: tank.pump ? "#e8f5e9" : "#f5f7fa",
              border: `1.5px solid ${tank.pump ? "#a5d6a7" : C.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: tank.pump ? C.success : "#b0bec5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff" }}>{Ic.pump(18)}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Motobomba</p>
                    <p style={{ margin: 0, fontSize: 12, color: tank.pump ? C.success : C.muted }}>
                      {tank.pump ? "Encendida" : "Apagada"}
                    </p>
                  </div>
                </div>
                <Toggle on={tank.pump} onChange={() => {
                  onTogglePump();
                  toastFn(`Motobomba ${!tank.pump ? "encendida" : "apagada"}`, !tank.pump ? "success" : "info");
                }} />
              </div>
            </div>

            {/* Compuerta */}
            <div style={{
              padding: 16, borderRadius: 12,
              background: tank.valve ? "#e3f2fd" : "#f5f7fa",
              border: `1.5px solid ${tank.valve ? "#90caf9" : C.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: tank.valve ? C.blue : "#b0bec5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff" }}>{Ic.valve(18)}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Compuerta</p>
                    <p style={{ margin: 0, fontSize: 12, color: tank.valve ? C.blue : C.muted }}>
                      {tank.valve ? "Abierta" : "Cerrada"}
                    </p>
                  </div>
                </div>
                <Toggle on={tank.valve} onChange={() => {
                  onToggleValve();
                  toastFn(`Compuerta ${!tank.valve ? "abierta" : "cerrada"}`, "info");
                }} />
              </div>
            </div>

            {/* Estado ESP32 */}
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "#f5f7fa", border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: tank.online ? C.success : C.danger }}>{Ic.wifi(16)}</span>
              <div style={{ flex: 1, fontSize: 12 }}>
                <span style={{ color: C.text, fontWeight: 600 }}>ESP32 </span>
                <span style={{ color: tank.online ? C.success : C.danger }}>
                  {tank.online ? "Conectado" : "Sin conexión"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div style={{
          background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
          padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: C.text }}>
            Alertas del sistema
          </h3>
          {alerts.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Sin alertas recientes
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.slice(0, 8).map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px",
                  borderRadius: 10,
                  background: a.type === "danger" ? "#ffebee" : a.type === "warning" ? "#fff8e1" : "#e3f2fd",
                  border: `1px solid ${a.type === "danger" ? "#ef9a9a" : a.type === "warning" ? "#ffe082" : "#90caf9"}`,
                }}>
                  <span style={{ color: a.type === "danger" ? C.danger : a.type === "warning" ? C.warning : C.blue, flexShrink: 0 }}>
                    {Ic.alert(16)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: C.text }}>{a.msg}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{a.time}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: a.type === "danger" ? C.danger + "18" : a.type === "warning" ? C.warning + "18" : C.blue + "18",
                    color: a.type === "danger" ? C.danger : a.type === "warning" ? C.warning : C.blue,
                  }}>
                    {a.type === "danger" ? "CRÍTICO" : a.type === "warning" ? "AVISO" : "INFO"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VISTA ADMINISTRADOR — Control total
═══════════════════════════════════════════════════════════════════ */
function AdminView({ user, tank, thresholds, alerts, autoMode, logs,
  onTogglePump, onToggleValve, onSetThresholds, onToggleAutoMode,
  onRenameTank, onClearAlerts, onLogout, toastFn }) {

  const [section, setSection] = useState("dashboard");
  const [localLow,  setLocalLow]  = useState(thresholds.low);
  const [localHigh, setLocalHigh] = useState(thresholds.high);
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal]   = useState(tank.name);
  const [saved, setSaved] = useState(false);

  const color = tank.level <= thresholds.low ? C.danger
    : tank.level >= thresholds.high ? C.warning : C.teal;
  const status = tank.level <= thresholds.low ? "NIVEL BAJO"
    : tank.level >= thresholds.high ? "NIVEL ALTO" : "NORMAL";

  const SECTIONS = [
    { id: "dashboard", icon: Ic.drop(16), label: "Dashboard" },
    { id: "control",   icon: Ic.tool(16), label: "Control" },
    { id: "thresholds",icon: Ic.sliders(16), label: "Umbrales" },
    { id: "alerts",    icon: Ic.alert(16), label: `Alertas ${alerts.filter(a=>a.type==="danger").length > 0 ? `(${alerts.filter(a=>a.type==="danger").length})` : ""}` },
    { id: "config",    icon: Ic.settings(16), label: "Configuración" },
    { id: "logs",      icon: Ic.log(16), label: "Registro" },
  ];

  const saveThresholds = () => {
    if (localLow >= localHigh) { toastFn("El umbral bajo debe ser menor al alto", "error"); return; }
    onSetThresholds({ low: localLow, high: localHigh });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toastFn(`Umbrales actualizados: ${localLow}% — ${localHigh}%`, "success");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e1621", fontFamily: "'DM Sans','Segoe UI',sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)} }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #263547; border-radius: 4px; }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb { width: 16px; height: 16px; border-radius: 50%; margin-top: -6px; cursor: pointer; }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* Sidebar oscuro */}
      <aside style={{
        width: 240, flexShrink: 0, background: "#080e1a",
        borderRight: "1px solid #1a2744", display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1a2744" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(135deg,#6a1b9a,#1565c0)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff" }}>{Ic.shield(18)}</span>
            </div>
            <div>
              <p style={{ margin: 0, color: "#eceff1", fontWeight: 700, fontSize: 15 }}>AquaSmart</p>
              <p style={{ margin: 0, color: "#6a1b9a", fontSize: 11, fontWeight: 600 }}>ADMINISTRADOR</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer",
              background: section === s.id ? "rgba(106,27,154,0.25)" : "transparent",
              border: section === s.id ? "1px solid rgba(106,27,154,0.4)" : "1px solid transparent",
              color: section === s.id ? "#ce93d8" : "#607080",
              fontSize: 13, fontWeight: section === s.id ? 600 : 400,
              fontFamily: "'DM Sans',sans-serif", textAlign: "left",
              transition: "all 0.2s",
            }}>
              {s.icon} {s.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #1a2744" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg,#6a1b9a,#1565c0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>{user.label[0]}</div>
            <div>
              <p style={{ margin: 0, color: "#cfd8dc", fontSize: 13, fontWeight: 600 }}>{user.label}</p>
              <p style={{ margin: 0, color: "#546e7a", fontSize: 11 }}>@{user.username}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px", borderRadius: 8, border: "1px solid rgba(239,83,80,0.3)",
            background: "rgba(239,83,80,0.08)", color: "#ef9a9a", fontSize: 12,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
          }}>
            {Ic.logout(14)} Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ marginLeft: 240, flex: 1, padding: "28px 30px", minHeight: "100vh" }}>

        {/* ── DASHBOARD ── */}
        {section === "dashboard" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#eceff1" }}>Dashboard</h1>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#546e7a" }}>{tank.name} · {tank.location}</p>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Nivel", value: `${tank.level}%`, color, icon: Ic.drop(18) },
                { label: "Flujo", value: `${tank.flow} L/s`, color: C.blue, icon: Ic.flow(18) },
                { label: "Temperatura", value: `${tank.temp}°C`, color: C.cyan, icon: Ic.temp(18) },
                { label: "Presión", value: `${tank.pressure} bar`, color: C.teal, icon: Ic.pressure(18) },
              ].map((k, i) => (
                <div key={i} style={{
                  background: "#111e2e", borderRadius: 14, padding: "16px",
                  border: "1px solid #1a2744",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: k.color }}>{k.icon}</span>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#eceff1", fontFamily: "'DM Mono',monospace" }}>{k.value}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#546e7a" }}>{k.label}</p>
                </div>
              ))}
            </div>

            {/* Gauge + estado */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
              <div style={{
                background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 24,
              }}>
                <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#eceff1" }}>{tank.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <WaterGauge level={tank.level} thresholds={thresholds} size={150} />
                    <div style={{ position: "absolute", inset: 0, display: "flex",
                      flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1,
                        fontFamily: "'DM Mono',monospace" }}>{tank.level}%</span>
                      <span style={{ fontSize: 10, color: "#546e7a" }}>nivel agua</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: 11, color: "#546e7a", marginBottom: 4 }}>
                        <span>0%</span><span>100%</span>
                      </div>
                      <div style={{ height: 10, borderRadius: 5, background: "#1a2744",
                        position: "relative", overflow: "visible" }}>
                        <div style={{ height: "100%", borderRadius: 5, background: color,
                          width: `${tank.level}%`, transition: "width 0.8s ease" }} />
                        <div style={{ position: "absolute", top: -3, left: `${thresholds.low}%`,
                          transform: "translateX(-50%)", width: 2, height: 16,
                          background: C.danger, borderRadius: 1 }} />
                        <div style={{ position: "absolute", top: -3, left: `${thresholds.high}%`,
                          transform: "translateX(-50%)", width: 2, height: 16,
                          background: C.warning, borderRadius: 1 }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Motobomba", val: tank.pump ? "Activa" : "Inactiva", color: tank.pump ? C.success : "#546e7a" },
                        { label: "Compuerta", val: tank.valve ? "Abierta" : "Cerrada", color: tank.valve ? C.blue : "#546e7a" },
                        { label: "Modo", val: autoMode ? "Automático" : "Manual", color: autoMode ? C.teal : C.warning },
                        { label: "ESP32", val: tank.online ? "En línea" : "Offline", color: tank.online ? C.success : C.danger },
                      ].map((d, i) => (
                        <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: "#0e1621", border: "1px solid #1a2744" }}>
                          <p style={{ margin: 0, fontSize: 10, color: "#546e7a" }}>{d.label}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: d.color }}>{d.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertas resumen */}
              <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#eceff1" }}>Alertas</h3>
                {alerts.length === 0
                  ? <p style={{ color: "#546e7a", fontSize: 13 }}>Sin alertas</p>
                  : alerts.slice(0, 5).map(a => (
                    <div key={a.id} style={{
                      display: "flex", gap: 8, padding: "8px 0",
                      borderBottom: "1px solid #1a2744", alignItems: "flex-start",
                    }}>
                      <span style={{ color: a.type === "danger" ? C.danger : a.type === "warning" ? C.warning : C.blue, flexShrink: 0 }}>
                        {Ic.alert(14)}
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, color: "#cfd8dc" }}>{a.msg}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "#546e7a" }}>{a.time}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTROL ── */}
        {section === "control" && (
          <div>
            <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#eceff1" }}>Control del sistema</h1>

            {/* Modo auto/manual */}
            <div style={{
              background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744",
              padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#eceff1" }}>Modo de operación</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#546e7a" }}>
                    {autoMode
                      ? "Automático — el sistema controla la bomba según umbrales"
                      : "Manual — el administrador controla todo directamente"}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#546e7a" }}>Manual</span>
                  <Toggle on={autoMode} onChange={(v) => {
                    onToggleAutoMode(v);
                    toastFn(`Modo ${v ? "automático" : "manual"} activado`, "info");
                  }} />
                  <span style={{ fontSize: 13, color: autoMode ? C.teal : "#546e7a", fontWeight: 600 }}>Auto</span>
                </div>
              </div>
            </div>

            {/* Motobomba */}
            <div style={{
              background: "#111e2e", borderRadius: 16, border: `1px solid ${tank.pump ? "#2e7d3240" : "#1a2744"}`,
              padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: tank.pump ? C.success : "#263547",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.3s",
                  }}>
                    <span style={{ color: "#fff" }}>{Ic.pump(22)}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#eceff1" }}>Motobomba</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: tank.pump ? C.success : "#546e7a" }}>
                      {tank.pump ? "● Encendida" : "○ Apagada"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => { onTogglePump(); toastFn(`Motobomba ${!tank.pump ? "encendida" : "apagada"}`, !tank.pump ? "success" : "info"); }} style={{
                    padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: tank.pump ? "rgba(198,40,40,0.15)" : "rgba(46,125,50,0.15)",
                    color: tank.pump ? "#ef9a9a" : "#a5d6a7",
                    fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                    border: `1px solid ${tank.pump ? "#c6282830" : "#2e7d3230"}`,
                  }}>
                    {tank.pump ? "Apagar bomba" : "Encender bomba"}
                  </button>
                  <Toggle on={tank.pump} onChange={() => {
                    onTogglePump();
                    toastFn(`Motobomba ${!tank.pump ? "encendida" : "apagada"}`, !tank.pump ? "success" : "info");
                  }} />
                </div>
              </div>
            </div>

            {/* Compuerta */}
            <div style={{
              background: "#111e2e", borderRadius: 16, border: `1px solid ${tank.valve ? "#1565c040" : "#1a2744"}`,
              padding: 20, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: tank.valve ? C.blue : "#263547",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.3s",
                  }}>
                    <span style={{ color: "#fff" }}>{Ic.valve(22)}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#eceff1" }}>Compuerta principal</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: tank.valve ? C.blueL : "#546e7a" }}>
                      {tank.valve ? "● Abierta — permite flujo de agua" : "○ Cerrada — flujo detenido"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => { onToggleValve(); toastFn(`Compuerta ${!tank.valve ? "abierta" : "cerrada"}`, "info"); }} style={{
                    padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: tank.valve ? "rgba(198,40,40,0.15)" : "rgba(21,101,192,0.15)",
                    color: tank.valve ? "#ef9a9a" : "#90caf9",
                    fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                    border: `1px solid ${tank.valve ? "#c6282830" : "#1565c030"}`,
                  }}>
                    {tank.valve ? "Cerrar compuerta" : "Abrir compuerta"}
                  </button>
                  <Toggle on={tank.valve} onChange={() => {
                    onToggleValve();
                    toastFn(`Compuerta ${!tank.valve ? "abierta" : "cerrada"}`, "info");
                  }} />
                </div>
              </div>
            </div>

            {/* Lógica automática */}
            <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#eceff1" }}>
                Lógica de automatización activa
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { cond: `Nivel ≤ ${thresholds.low}%`, action: "Encender motobomba + abrir compuerta", color: C.danger },
                  { cond: `Nivel ≥ ${thresholds.high}%`, action: "Apagar motobomba + cerrar compuertas", color: C.warning },
                  { cond: "Rango normal", action: "Sistema en espera — LED verde", color: C.teal },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    borderRadius: 10, background: "#0e1621", border: "1px solid #1a2744",
                    fontSize: 13,
                  }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", color: r.color, fontWeight: 600, flexShrink: 0 }}>
                      {r.cond}
                    </span>
                    <span style={{ color: "#546e7a" }}>→</span>
                    <span style={{ color: "#cfd8dc" }}>{r.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── UMBRALES ── */}
        {section === "thresholds" && (
          <div>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: "#eceff1" }}>Umbrales</h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#546e7a" }}>
              Define los porcentajes de nivel que activan o detienen la motobomba automáticamente.
            </p>

            {/* Umbral bajo */}
            <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#eceff1" }}>Umbral bajo — activar motobomba</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#546e7a" }}>Si el nivel cae por debajo, la bomba se enciende automáticamente</p>
                </div>
                <span style={{ fontSize: 36, fontWeight: 800, color: C.danger, fontFamily: "'DM Mono',monospace" }}>
                  {localLow}%
                </span>
              </div>
              <input type="range" min="5" max="50" step="1" value={localLow}
                onChange={e => setLocalLow(+e.target.value)}
                style={{ width: "100%", accentColor: C.danger, height: 4 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#546e7a", marginTop: 4 }}>
                <span>5%</span><span>50%</span>
              </div>
            </div>

            {/* Umbral alto */}
            <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#eceff1" }}>Umbral alto — apagar bomba y cerrar</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#546e7a" }}>Al alcanzar este nivel, la bomba se apaga y la compuerta se cierra</p>
                </div>
                <span style={{ fontSize: 36, fontWeight: 800, color: C.warning, fontFamily: "'DM Mono',monospace" }}>
                  {localHigh}%
                </span>
              </div>
              <input type="range" min="55" max="98" step="1" value={localHigh}
                onChange={e => setLocalHigh(+e.target.value)}
                style={{ width: "100%", accentColor: C.warning, height: 4 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#546e7a", marginTop: 4 }}>
                <span>55%</span><span>98%</span>
              </div>
            </div>

            {/* Vista previa */}
            <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 20, marginBottom: 16 }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#eceff1" }}>Vista previa del rango operativo</p>
              <div style={{ height: 16, borderRadius: 8, background: "#0e1621", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${localLow}%`, background: C.danger + "80" }} />
                <div style={{ position: "absolute", left: `${localLow}%`, top: 0, bottom: 0,
                  width: `${localHigh - localLow}%`, background: C.teal + "80" }} />
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0,
                  width: `${100 - localHigh}%`, background: C.warning + "80" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
                <span style={{ color: C.danger }}>Bomba ON ↓{localLow}%</span>
                <span style={{ color: C.teal }}>Zona normal</span>
                <span style={{ color: C.warning }}>{localHigh}%↑ Apagar todo</span>
              </div>
            </div>

            <button onClick={saveThresholds} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: saved ? "rgba(46,125,50,0.2)" : "linear-gradient(135deg,#6a1b9a,#1565c0)",
              border: saved ? `1px solid ${C.success}` : "none",
              color: saved ? C.success : "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", transition: "all 0.3s",
            }}>
              {saved ? "✓ Umbrales guardados y aplicados" : "Guardar y aplicar umbrales"}
            </button>
          </div>
        )}

        {/* ── ALERTAS ── */}
        {section === "alerts" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#eceff1" }}>
                Historial de alertas
              </h1>
              <button onClick={() => { onClearAlerts(); toastFn("Alertas limpiadas", "success"); }} style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(198,40,40,0.3)",
                background: "rgba(198,40,40,0.1)", color: "#ef9a9a",
                fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>
                Limpiar alertas
              </button>
            </div>
            {alerts.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0", color: "#546e7a", fontSize: 15 }}>
                  Sin alertas registradas
                </div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {alerts.map(a => (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
                      borderRadius: 12, background: "#111e2e", border: "1px solid #1a2744",
                    }}>
                      <span style={{ color: a.type === "danger" ? C.danger : a.type === "warning" ? C.warning : C.blueL, flexShrink: 0, marginTop: 1 }}>
                        {Ic.alert(16)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#cfd8dc" }}>{a.msg}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#546e7a" }}>{a.time}</p>
                      </div>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: a.type === "danger" ? C.danger + "20" : a.type === "warning" ? C.warning + "20" : C.blue + "20",
                        color: a.type === "danger" ? "#ef9a9a" : a.type === "warning" ? "#ffcc02" : C.blueL,
                      }}>
                        {a.type === "danger" ? "CRÍTICO" : a.type === "warning" ? "AVISO" : "INFO"}
                      </span>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── CONFIGURACIÓN ── */}
        {section === "config" && (
          <div>
            <h1 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700, color: "#eceff1" }}>Configuración</h1>

            {/* Renombrar tanque */}
            <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 22, marginBottom: 16 }}>
              <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#eceff1" }}>Nombre del tanque</p>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={nameVal} onChange={e => setNameVal(e.target.value)} disabled={!editName}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10,
                    background: editName ? "#0e1621" : "#0a111a",
                    border: `1px solid ${editName ? C.purple : "#1a2744"}`,
                    color: "#eceff1", fontSize: 14, fontFamily: "'DM Sans',sans-serif",
                    outline: "none",
                  }} />
                {editName ? (
                  <>
                    <button onClick={() => { onRenameTank(nameVal); setEditName(false); toastFn("Nombre actualizado", "success"); }} style={{
                      padding: "10px 16px", borderRadius: 10, border: "none",
                      background: C.success, color: "#fff", cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
                    }}>Guardar</button>
                    <button onClick={() => { setEditName(false); setNameVal(tank.name); }} style={{
                      padding: "10px 16px", borderRadius: 10,
                      border: "1px solid #1a2744", background: "transparent",
                      color: "#546e7a", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                    }}>Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setEditName(true)} style={{
                    padding: "10px 16px", borderRadius: 10,
                    border: "1px solid rgba(106,27,154,0.4)",
                    background: "rgba(106,27,154,0.15)", color: "#ce93d8",
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {Ic.edit(14)} Editar
                  </button>
                )}
              </div>
            </div>

            {/* Info del sistema */}
            <div style={{ background: "#111e2e", borderRadius: 16, border: "1px solid #1a2744", padding: 22 }}>
              <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#eceff1" }}>Información del sistema</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Versión", "AquaSmart v1.0"],
                  ["Dispositivo", "ESP32 DevKit v1"],
                  ["Sensor", "HC-SR04 Ultrasónico"],
                  ["Protocolo", "WebSocket + REST API"],
                  ["Base de datos", "MongoDB Atlas"],
                  ["Backend", "FastAPI (Python)"],
                  ["Frontend", "React 18 + Vite"],
                  ["Despliegue", "Render + Vercel"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8, background: "#0e1621",
                    fontSize: 13 }}>
                    <span style={{ color: "#546e7a" }}>{k}</span>
                    <span style={{ color: "#cfd8dc", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REGISTRO ── */}
        {section === "logs" && (
          <div>
            <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: "#eceff1" }}>Registro de acciones</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map(l => (
                <div key={l.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                  borderRadius: 12, background: "#111e2e", border: "1px solid #1a2744",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(106,27,154,0.2)", border: "1px solid rgba(106,27,154,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ color: "#ce93d8", fontSize: 12, fontWeight: 700 }}>
                      {l.user[0].toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#cfd8dc" }}>{l.action}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 11, color: "#546e7a" }}>{l.user} · {l.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP ROOT — Orquesta estado global y simulación en tiempo real
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [session,    setSession]    = useState(null);
  const [tank,       setTank]       = useState(TANK_INIT);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [autoMode,   setAutoMode]   = useState(true);
  const [alerts,     setAlerts]     = useState([
    { id: 1, type: "warning", msg: "Sistema iniciado correctamente", time: "hace un momento" },
  ]);
  const [logs,  setLogs]  = useState([
    { id: 1, user: "sistema", action: "Sistema AquaSmart iniciado", time: "ahora" },
  ]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(200);

  // Toast helper
  const addToast = useCallback((msg, type = "info") => {
    const id = toastId.current++;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // Log helper
  const addLog = useCallback((user, action) => {
    setLogs(prev => [{ id: Date.now(), user, action, time: "ahora" }, ...prev.slice(0, 49)]);
  }, []);

  // ── Simulación en tiempo real ───────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setTank(prev => {
        const delta = (Math.random() - 0.49) * 1.5;
        const newLevel = Math.max(3, Math.min(99, prev.level + delta));
        let pump = prev.pump, valve = prev.valve;

        if (autoMode) {
          if (newLevel <= thresholds.low && !prev.pump) {
            pump = true; valve = true;
            const a = { id: Date.now(), type: "danger",
              msg: `Nivel al ${Math.round(newLevel)}% — Motobomba activada automáticamente`, time: "ahora" };
            setAlerts(p => [a, ...p.slice(0, 29)]);
            addToast("⚠️ Nivel bajo — bomba activada", "error");
          }
          if (newLevel >= thresholds.high && prev.pump) {
            pump = false; valve = false;
            const a = { id: Date.now() + 1, type: "warning",
              msg: `Nivel al ${Math.round(newLevel)}% — Bomba apagada, compuerta cerrada`, time: "ahora" };
            setAlerts(p => [a, ...p.slice(0, 29)]);
            addToast("⚡ Nivel alto — sistema detenido", "info");
          }
          if (newLevel > thresholds.low + 5 && newLevel < thresholds.high - 5 && prev.pump) {
            pump = false;
          }
        }

        return {
          ...prev,
          level: Math.round(newLevel * 10) / 10,
          pump, valve,
          flow: Math.round((Math.random() * 2 + 0.8) * 10) / 10,
          temp: prev.temp + (Math.random() > 0.95 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          pressure: Math.round((Math.random() * 0.4 + 1.2) * 10) / 10,
        };
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [thresholds, autoMode, addToast]);

  // ── Acciones ────────────────────────────────────────────────────
  const togglePump = useCallback(() => {
    setTank(p => {
      const next = !p.pump;
      addLog(session?.username || "sistema", `Motobomba ${next ? "encendida" : "apagada"} manualmente`);
      return { ...p, pump: next };
    });
  }, [session, addLog]);

  const toggleValve = useCallback(() => {
    setTank(p => {
      const next = !p.valve;
      addLog(session?.username || "sistema", `Compuerta ${next ? "abierta" : "cerrada"} manualmente`);
      return { ...p, valve: next };
    });
  }, [session, addLog]);

  const handleSetThresholds = useCallback((t) => {
    setThresholds(t);
    addLog(session?.username || "admin", `Umbrales actualizados: bajo=${t.low}%, alto=${t.high}%`);
  }, [session, addLog]);

  const handleToggleAutoMode = useCallback((v) => {
    setAutoMode(v);
    addLog(session?.username || "admin", `Modo ${v ? "automático" : "manual"} activado`);
  }, [session, addLog]);

  const handleRenameTank = useCallback((name) => {
    setTank(p => {
      addLog(session?.username || "admin", `Tanque renombrado a "${name}"`);
      return { ...p, name };
    });
  }, [session, addLog]);

  // Sin sesión → login
  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  // Props comunes
  const sharedProps = {
    tank, thresholds, alerts,
    onTogglePump: togglePump,
    onToggleValve: toggleValve,
    onLogout: () => setSession(null),
    toastFn: addToast,
  };

  return (
    <>
      {session.role === "public" && (
        <PublicView {...sharedProps} onLogin={() => setSession(null)} />
      )}
      {session.role === "operator" && (
        <OperatorView {...sharedProps} user={session} autoMode={autoMode} />
      )}
      {session.role === "admin" && (
        <AdminView
          {...sharedProps}
          user={session}
          autoMode={autoMode}
          logs={logs}
          onSetThresholds={handleSetThresholds}
          onToggleAutoMode={handleToggleAutoMode}
          onRenameTank={handleRenameTank}
          onClearAlerts={() => setAlerts([])}
        />
      )}
      <Toast toasts={toasts} />
    </>
  );
}
