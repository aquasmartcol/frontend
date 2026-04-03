import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   AQUASMART — App.jsx limpio
   Todo el diseño está en index.css
   Roles: público | operario | administrador
═══════════════════════════════════════════════════════════════ */

const API = "https://backend-48ai.onrender.com";
const WS  = "wss://backend-48ai.onrender.com/ws";

// ── Cambia esta ruta por la de tu logo (png, jpg, ico, svg) ────
// Pon el archivo en la carpeta public/ y escribe el nombre aquí.
// Ejemplo: const LOGO_SRC = "/logo.png";
// Si es null, se muestra el ícono SVG de gota de agua por defecto.
const LOGO_SRC = "./img/AquaSmart2.png";

const USERS = {
  operario: { password: "operario123", role: "operator", label: "Operario" },
  admin:    { password: "admin2024",   role: "admin",    label: "Administrador" },
};

const DEFAULT_THRESHOLDS = { low: 30, high: 90 };

const TANK_INIT = {
  name:     "Tanque Principal",
  location: "Lérida, Tolima",
  level:    54,
  pump:     false,
  valve:    true,
  flow:     2.1,
  temp:     18,
  pressure: 1.4,
  online:   false,
};

/* ═══════════════════════════════════════════════════════════════
   ÍCONOS SVG
═══════════════════════════════════════════════════════════════ */
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
  eyeOff:   (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  settings: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  check:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  close:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  log:      (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  wifi:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  sliders:  (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  mode:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>,
  edit:     (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  tool:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  menu:     (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENTES BASE
═══════════════════════════════════════════════════════════════ */

function Toggle({ on, onChange, disabled = false, size = "md" }) {
  return (
    <button
      className={`aq-toggle ${on ? "on" : ""} ${size === "sm" ? "sm" : ""}`}
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
    >
      <span className="aq-toggle-thumb" />
    </button>
  );
}

function WaterGauge({ level, thresholds, size = 110 }) {
  const danger  = "#c62828", warning = "#f57c00", teal = "#00897b";
  const color   = level <= thresholds.low ? danger : level >= thresholds.high ? warning : teal;
  const r       = size / 2 - 8;
  const cx      = size / 2, cy = size / 2;
  const circ    = 2 * Math.PI * r;
  const off     = circ * (1 - level / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eceff1" strokeWidth="9" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease, stroke 0.4s" }} />
      <circle cx={cx} cy={8} r="3" fill={danger}
        transform={`rotate(${thresholds.low * 3.6}, ${cx}, ${cy})`} />
      <circle cx={cx} cy={8} r="3" fill={warning}
        transform={`rotate(${thresholds.high * 3.6}, ${cx}, ${cy})`} />
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
    <div className="aq-toast-wrapper">
      {toasts.map(t => (
        <div key={t.id} className={`aq-toast ${t.type}`}>
          <span style={{ marginTop: 1, flexShrink: 0 }}>
            {t.type === "success" ? Ic.check() : t.type === "error" ? Ic.close() : Ic.alert()}
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [user,    setUser]    = useState("");
  const [pass,    setPass]    = useState("");
  const [err,     setErr]     = useState("");
  const [busy,    setBusy]    = useState(false);
  const [showPwd, setShowPwd] = useState(false); // ← ojito

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    const found = USERS[user.toLowerCase()];
    if (found && found.password === pass) {
      onLogin({ username: user.toLowerCase(), role: found.role, label: found.label, password: pass });
    } else {
      setErr("Usuario o contraseña incorrectos");
    }
    setBusy(false);
  };

  return (
    <div className="login-root">
      {/* Anillos decorativos */}
      {[320, 480, 620].map((s, i) => (
        <div key={i} className="login-ring" style={{ width: s, height: s }} />
      ))}

      <div className="login-wrapper">
        {/* Logo */}
        <div className="login-logo-box">
          {LOGO_SRC ? (
            <img src={LOGO_SRC} alt="AquaSmart logo" className="login-logo-img" />
          ) : (
            <div className="login-logo-icon">
              <span style={{ color: "#fff" }}>{Ic.drop(36)}</span>
            </div>
          )}
          <h1 className="login-logo-title">AquaSmart</h1>
          <p className="login-logo-sub">Sistema de Telemetría — Lérida, Tolima</p>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Banner público */}
          <div className="login-public-banner">
            <span style={{ color: "#4dd0e1", flexShrink: 0 }}>{Ic.eye(16)}</span>
            <p style={{ margin: 0 }}>
              La vista pública no requiere iniciar sesión.{" "}
              <button
                className="login-public-link"
                onClick={() => onLogin({ username: "publico", role: "public", label: "Público" })}
              >
                Ver datos en tiempo real →
              </button>
            </p>
          </div>

          <div className="login-form-body">
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Campo usuario */}
              <div>
                <label className="login-label">USUARIO</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon-left">{Ic.user(16)}</span>
                  <input
                    className="login-input"
                    value={user}
                    onChange={e => { setUser(e.target.value); setErr(""); }}
                    placeholder="operario / admin"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Campo contraseña con ojito */}
              <div>
                <label className="login-label">CONTRASEÑA</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon-left">{Ic.lock(16)}</span>
                  <input
                    className="login-input"
                    type={showPwd ? "text" : "password"}
                    value={pass}
                    onChange={e => { setPass(e.target.value); setErr(""); }}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                  />
                  {/* Botón ojito */}
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    {showPwd ? Ic.eyeOff(16) : Ic.eye(16)}
                  </button>
                </div>
              </div>

              {/* Error */}
              {err && (
                <div className="login-error">
                  <span style={{ flexShrink: 0 }}>{Ic.alert(16)}</span>
                  {err}
                </div>
              )}

              {/* Botón ingresar */}
              <button type="submit" className="login-btn-primary" disabled={busy}>
                {busy ? "Verificando..." : "Iniciar sesión"}
              </button>
            </form>

            {/* Credenciales demo */}
            <div className="login-demo-box">
              <span className="login-demo-label">CREDENCIALES DE DEMO</span>
              <div className="login-demo-grid">
                {[
                  { label: "Operario", user: "operario", pass: "operario123", color: "#00897b" },
                  { label: "Admin",    user: "admin",    pass: "admin2024",   color: "#6a1b9a" },
                ].map(d => (
                  <button
                    key={d.label}
                    className="login-demo-btn"
                    onClick={() => { setUser(d.user); setPass(d.pass); setErr(""); }}
                    style={{
                      border: `1px solid ${d.color}44`,
                      background: `${d.color}15`,
                      color: d.color,
                    }}
                  >
                    {d.label}
                    <span className="login-demo-btn-sub">{d.user} / {d.pass}</span>
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

/* ═══════════════════════════════════════════════════════════════
   VISTA PÚBLICA
═══════════════════════════════════════════════════════════════ */
function PublicView({ tank, thresholds, alerts, onLogin }) {
  const danger  = "#c62828", warning = "#f57c00", teal = "#00897b";
  const color   = tank.level <= thresholds.low ? danger : tank.level >= thresholds.high ? warning : teal;
  const status  = tank.level <= thresholds.low ? "NIVEL BAJO" : tank.level >= thresholds.high ? "NIVEL ALTO" : "NORMAL";
  const badgeCls = tank.level <= thresholds.low ? "low" : tank.level >= thresholds.high ? "high" : "normal";

  return (
    <div className="pub-root">
      {/* Header */}
      <header className="pub-header">
        {LOGO_SRC
          ? <img src={LOGO_SRC} alt="logo" style={{ height: 32, width: "auto", borderRadius: 6 }} />
          : <span style={{ color: "#42a5f5" }}>{Ic.drop(22)}</span>
        }
        <span className="pub-header-logo-text">AquaSmart</span>
        <span className="pub-header-location">— Lérida, Tolima</span>
        <div className="pub-header-right">
          <div className="aq-live-pill">
            <span className="aq-live-dot" />
            En vivo
          </div>
          <button className="pub-header-login-btn" onClick={() => onLogin(null)}>
            {Ic.user(14)} Iniciar sesión
          </button>
        </div>
      </header>

      <main className="pub-main">
        {/* Banner */}
        <div className="pub-info-banner">
          {Ic.eye(16)}
          <span>Vista pública — datos en tiempo real. Solo operarios y administradores pueden controlar el sistema.</span>
        </div>

        {/* Tank card */}
        <div className="pub-tank-card">
          <div className="pub-tank-status-bar" style={{ background: color }} />
          <div className="pub-tank-body">
            <div className="pub-gauge-row">
              <div className="pub-gauge-left">
                <div className="pub-gauge-wrap">
                  <WaterGauge level={tank.level} thresholds={thresholds} size={120} />
                  <div className="pub-gauge-label">
                    <span className="pub-gauge-pct" style={{ color }}>{tank.level}%</span>
                    <span className="pub-gauge-unit">nivel</span>
                  </div>
                </div>
                <div>
                  <h2 className="pub-tank-name">{tank.name}</h2>
                  <p className="pub-tank-loc">{tank.location}</p>
                  <span className={`aq-badge ${badgeCls}`}>{status}</span>
                </div>
              </div>
              <div className="pub-gauge-right">
                <p className="pub-device-label">MOTOBOMBA</p>
                <div className="pub-device-val" style={{ color: tank.pump ? "#2e7d32" : "#607080" }}>
                  <span className="pub-device-dot"
                    style={{ background: tank.pump ? "#2e7d32" : "#b0bec5" }} />
                  {tank.pump ? "Activa" : "Inactiva"}
                </div>
                <p className="pub-device-label" style={{ marginTop: 8 }}>COMPUERTA</p>
                <div className="pub-device-val" style={{ color: tank.valve ? "#1565c0" : "#607080" }}>
                  {tank.valve ? "Abierta" : "Cerrada"}
                </div>
              </div>
            </div>

            {/* Level bar */}
            <div className="pub-level-bar-wrap">
              <div className="pub-level-track">
                <div className="pub-level-fill" style={{ width: `${tank.level}%`, background: color }} />
                {[
                  { pct: thresholds.low, col: danger },
                  { pct: thresholds.high, col: warning },
                ].map(m => (
                  <div key={m.pct} className="pub-level-marker" style={{ left: `${m.pct}%` }}>
                    <div className="pub-level-marker-line" style={{ background: m.col }} />
                  </div>
                ))}
              </div>
              <div className="pub-level-labels">
                <span style={{ color: danger }}>↑ {thresholds.low}% activar bomba</span>
                <span style={{ color: warning }}>{thresholds.high}% cerrar ↑</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="pub-metrics-grid">
              {[
                { icon: Ic.flow(16),     label: "Flujo",       value: `${tank.flow} L/s`,     color: "#1565c0" },
                { icon: Ic.temp(16),     label: "Temperatura", value: `${tank.temp}°C`,        color: "#00acc1" },
                { icon: Ic.pressure(16), label: "Presión",     value: `${tank.pressure} bar`,  color: "#00897b" },
              ].map((m, i) => (
                <div key={i} className="pub-metric-card">
                  <div className="pub-metric-icon-row" style={{ color: m.color }}>
                    {m.icon}
                    <span className="pub-metric-label">{m.label}</span>
                  </div>
                  <p className="pub-metric-val">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 className="pub-alerts-title">Alertas recientes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.slice(0, 5).map(a => (
                <div key={a.id} className={`pub-alert-item ${a.type}`}>
                  <span style={{ flexShrink: 0, color: a.type === "danger" ? danger : a.type === "warning" ? warning : "#1565c0" }}>
                    {Ic.alert(16)}
                  </span>
                  <div>
                    <p className="pub-alert-msg">{a.msg}</p>
                    <p className="pub-alert-time">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ESP32 bar */}
        <div className="pub-esp-bar">
          <div className="pub-esp-left">
            <span style={{ color: tank.online ? "#2e7d32" : "#c62828" }}>{Ic.wifi(16)}</span>
            <span style={{ fontWeight: 600, color: "#0d1b2a" }}>ESP32</span>
            <span style={{ color: tank.online ? "#2e7d32" : "#c62828" }}>
              {tank.online ? "● Conectado" : "● Offline"}
            </span>
          </div>
          <span className="pub-esp-right">Actualización cada 3 segundos</span>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VISTA OPERARIO
═══════════════════════════════════════════════════════════════ */
function OperatorView({ user, tank, thresholds, alerts, autoMode, onTogglePump, onToggleValve, onLogout, toastFn }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const danger  = "#c62828", warning = "#f57c00", teal = "#00897b", blue = "#1565c0";
  const color   = tank.level <= thresholds.low ? danger : tank.level >= thresholds.high ? warning : teal;
  const status  = tank.level <= thresholds.low ? "NIVEL BAJO" : tank.level >= thresholds.high ? "NIVEL ALTO" : "NORMAL";
  const histRef = useRef(Array.from({ length: 20 }, () => tank.level + (Math.random() - 0.5) * 8));

  const NAV = [
    { icon: Ic.drop(16),  label: "Panel principal" },
    { icon: Ic.alert(16), label: `Alertas (${alerts.filter(a => a.type === "danger").length})` },
    { icon: Ic.log(16),   label: "Registro" },
  ];

  return (
    <div className="op-root">
      {/* Overlay móvil */}
      <div className={`op-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`op-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="op-sidebar-logo">
          {LOGO_SRC
            ? <img src={LOGO_SRC} alt="logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
            : <div className="op-sidebar-logo-icon"><span style={{ color: "#fff" }}>{Ic.drop(18)}</span></div>
          }
          <div>
            <p className="op-sidebar-logo-name">AquaSmart</p>
            <p className="op-sidebar-logo-role">Operario</p>
          </div>
        </div>
        <nav className="op-nav">
          {NAV.map((n, i) => (
            <button key={i} className={`op-nav-item ${i === 0 ? "active" : ""}`}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div className="op-user-footer">
          <div className="op-user-row">
            <div className="op-avatar">{user.label[0]}</div>
            <div>
              <p className="op-username">{user.label}</p>
              <p className="op-userhandle">@{user.username}</p>
            </div>
          </div>
          <button className="op-logout-btn" onClick={onLogout}>
            {Ic.logout(14)} Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="op-content">
        {/* Top bar */}
        <div className="op-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="op-menu-btn" onClick={() => setSidebarOpen(v => !v)}>
              {Ic.menu(20)}
            </button>
            <div>
              <h1 className="op-topbar-title">Panel del Operario</h1>
              <p className="op-topbar-sub">{tank.name} · {tank.location}</p>
            </div>
          </div>
          <div className="op-topbar-pills">
            <div className="aq-live-pill"><span className="aq-live-dot" />En vivo</div>
            <div className={`aq-mode-pill ${autoMode ? "auto" : "manual"}`}>
              {autoMode ? "Modo AUTO" : "Modo MANUAL"}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="op-kpi-grid">
          {[
            { label: "Nivel actual", value: `${tank.level}%`,        icon: Ic.drop(18),     color },
            { label: "Flujo",        value: `${tank.flow} L/s`,       icon: Ic.flow(18),     color: blue },
            { label: "Temperatura",  value: `${tank.temp}°C`,         icon: Ic.temp(18),     color: "#00acc1" },
            { label: "Presión",      value: `${tank.pressure} bar`,   icon: Ic.pressure(18), color: teal },
          ].map((k, i) => (
            <div key={i} className="op-kpi-card">
              <div className="op-kpi-top">
                <span style={{ color: k.color }}>{k.icon}</span>
                <span className="op-kpi-online" />
              </div>
              <p className="op-kpi-val">{k.value}</p>
              <p className="op-kpi-label">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="op-main-grid">
          {/* Gauge card */}
          <div className="op-gauge-card">
            <div className="op-gauge-card-header" style={{ borderLeftColor: color }}>
              <h2 className="op-gauge-card-title">{tank.name}</h2>
              <span className={`aq-badge ${tank.level <= thresholds.low ? "low" : tank.level >= thresholds.high ? "high" : "normal"}`}>
                {status}
              </span>
            </div>
            <div className="op-gauge-inner">
              <div style={{ position: "relative", flexShrink: 0 }}>
                <WaterGauge level={tank.level} thresholds={thresholds} size={140} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{tank.level}%</span>
                  <span style={{ fontSize: 11, color: "#607080" }}>nivel</span>
                </div>
              </div>
              <div className="op-level-section">
                <div className="op-level-labels"><span>0%</span><span>100%</span></div>
                <div className="op-level-track">
                  <div className="op-level-fill" style={{ width: `${tank.level}%`, background: color }} />
                  <div className="op-level-marker" style={{ left: `${thresholds.low}%` }}>
                    <div className="op-level-marker-line" style={{ background: danger }} />
                  </div>
                  <div className="op-level-marker" style={{ left: `${thresholds.high}%` }}>
                    <div className="op-level-marker-line" style={{ background: warning }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 3 }}>
                  <span style={{ color: danger }}>↑{thresholds.low}%</span>
                  <span style={{ color: warning }}>{thresholds.high}%↑</span>
                </div>
                <p className="op-sparkline-label">Historial nivel</p>
                <Sparkline data={histRef.current} color={color} />
              </div>
            </div>
          </div>

          {/* Controls card */}
          <div className="op-ctrl-card">
            <h3 className="op-ctrl-title">Control de Dispositivos</h3>
            {autoMode && (
              <div className="op-auto-notice">
                ℹ️ Modo automático activo. Los cambios manuales pueden revertirse.
              </div>
            )}
            {/* Motobomba */}
            <div className={`op-device-card ${tank.pump ? "active-pump" : ""}`}>
              <div className="op-device-row">
                <div className="op-device-left">
                  <div className={`op-device-icon ${tank.pump ? "on-pump" : ""}`}>
                    <span style={{ color: "#fff" }}>{Ic.pump(18)}</span>
                  </div>
                  <div>
                    <p className="op-device-name">Motobomba</p>
                    <p className="op-device-status" style={{ color: tank.pump ? "#2e7d32" : "#607080" }}>
                      {tank.pump ? "Encendida" : "Apagada"}
                    </p>
                  </div>
                </div>
                <Toggle on={tank.pump} onChange={() => { onTogglePump(); toastFn(`Motobomba ${!tank.pump ? "encendida" : "apagada"}`, !tank.pump ? "success" : "info"); }} />
              </div>
            </div>
            {/* Compuerta */}
            <div className={`op-device-card ${tank.valve ? "active-valve" : ""}`}>
              <div className="op-device-row">
                <div className="op-device-left">
                  <div className={`op-device-icon ${tank.valve ? "on-valve" : ""}`}>
                    <span style={{ color: "#fff" }}>{Ic.valve(18)}</span>
                  </div>
                  <div>
                    <p className="op-device-name">Compuerta</p>
                    <p className="op-device-status" style={{ color: tank.valve ? blue : "#607080" }}>
                      {tank.valve ? "Abierta" : "Cerrada"}
                    </p>
                  </div>
                </div>
                <Toggle on={tank.valve} onChange={() => { onToggleValve(); toastFn(`Compuerta ${!tank.valve ? "abierta" : "cerrada"}`, "info"); }} />
              </div>
            </div>
            {/* ESP32 */}
            <div className="op-esp-pill">
              <span style={{ color: tank.online ? "#2e7d32" : "#c62828" }}>{Ic.wifi(16)}</span>
              <span className="op-esp-label">ESP32</span>
              <span style={{ fontSize: 12, color: tank.online ? "#2e7d32" : "#c62828" }}>
                {tank.online ? "Conectado" : "Sin conexión"}
              </span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="op-alerts-card">
          <h3 className="op-alerts-title">Alertas del sistema</h3>
          {alerts.length === 0
            ? <p className="op-alerts-empty">Sin alertas recientes</p>
            : (
              <div className="op-alerts-list">
                {alerts.slice(0, 8).map(a => (
                  <div key={a.id} className={`op-alert-row ${a.type}`}>
                    <span style={{ color: a.type === "danger" ? danger : a.type === "warning" ? warning : blue, flexShrink: 0 }}>
                      {Ic.alert(16)}
                    </span>
                    <div className="op-alert-body">
                      <p className="op-alert-msg">{a.msg}</p>
                      <p className="op-alert-time">{a.time}</p>
                    </div>
                    <span className="op-alert-badge"
                      style={{ background: a.type === "danger" ? "#ffcdd2" : a.type === "warning" ? "#fff9c4" : "#e3f2fd",
                        color: a.type === "danger" ? danger : a.type === "warning" ? warning : blue }}>
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

/* ═══════════════════════════════════════════════════════════════
   VISTA ADMINISTRADOR
═══════════════════════════════════════════════════════════════ */
function AdminView({ user, tank, thresholds, alerts, autoMode, logs,
  onTogglePump, onToggleValve, onSetThresholds, onToggleAutoMode,
  onRenameTank, onClearAlerts, onLogout, toastFn }) {

  const [section,    setSection]    = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localLow,   setLocalLow]   = useState(thresholds.low);
  const [localHigh,  setLocalHigh]  = useState(thresholds.high);
  const [editName,   setEditName]   = useState(false);
  const [nameVal,    setNameVal]    = useState(tank.name);
  const [saved,      setSaved]      = useState(false);

  const danger = "#c62828", warning = "#f57c00", teal = "#00897b", blue = "#1565c0";
  const color  = tank.level <= thresholds.low ? danger : tank.level >= thresholds.high ? warning : teal;
  const status = tank.level <= thresholds.low ? "NIVEL BAJO" : tank.level >= thresholds.high ? "NIVEL ALTO" : "NORMAL";

  const SECTIONS = [
    { id: "dashboard",  icon: Ic.drop(16),    label: "Dashboard"    },
    { id: "control",    icon: Ic.tool(16),    label: "Control"      },
    { id: "thresholds", icon: Ic.sliders(16), label: "Umbrales"     },
    { id: "alerts",     icon: Ic.alert(16),   label: `Alertas ${alerts.filter(a=>a.type==="danger").length > 0 ? `(${alerts.filter(a=>a.type==="danger").length})` : ""}` },
    { id: "config",     icon: Ic.settings(16),label: "Configuración"},
    { id: "logs",       icon: Ic.log(16),     label: "Registro"     },
  ];

  const saveThresholds = () => {
    if (localLow >= localHigh) { toastFn("Umbral bajo debe ser menor al alto", "error"); return; }
    onSetThresholds({ low: localLow, high: localHigh });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    toastFn(`Umbrales: ${localLow}% — ${localHigh}%`, "success");
  };

  return (
    <div className="adm-root">
      {/* Overlay móvil */}
      <div className={`adm-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="adm-sidebar-logo">
          {LOGO_SRC
            ? <img src={LOGO_SRC} alt="logo" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "contain" }} />
            : <div className="adm-sidebar-logo-icon"><span style={{ color: "#fff" }}>{Ic.shield(18)}</span></div>
          }
          <div>
            <p className="adm-sidebar-logo-name">AquaSmart</p>
            <p className="adm-sidebar-logo-role">ADMINISTRADOR</p>
          </div>
        </div>
        <nav className="adm-nav">
          {SECTIONS.map(s => (
            <button key={s.id} className={`adm-nav-btn ${section === s.id ? "active" : ""}`}
              onClick={() => { setSection(s.id); setSidebarOpen(false); }}>
              {s.icon} {s.label}
            </button>
          ))}
        </nav>
        <div className="adm-user-footer">
          <div className="op-user-row" style={{ marginBottom: 12 }}>
            <div className="adm-avatar">{user.label[0]}</div>
            <div>
              <p className="adm-username">{user.label}</p>
              <p className="adm-userhandle">@{user.username}</p>
            </div>
          </div>
          <button className="adm-logout-btn" onClick={onLogout}>
            {Ic.logout(14)} Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="adm-content">
        {/* Top bar con hamburguesa en móvil */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button className="adm-menu-btn" onClick={() => setSidebarOpen(v => !v)}>
            {Ic.menu(20)}
          </button>
          <div>
            <h1 className="adm-section-title" style={{ marginBottom: 2 }}>
              {SECTIONS.find(s => s.id === section)?.label}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#546e7a" }}>{tank.name} · {tank.location}</p>
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        {section === "dashboard" && (
          <>
            <div className="adm-kpi-grid">
              {[
                { label: "Nivel",       value: `${tank.level}%`,       icon: Ic.drop(18),     color },
                { label: "Flujo",       value: `${tank.flow} L/s`,      icon: Ic.flow(18),     color: blue },
                { label: "Temperatura", value: `${tank.temp}°C`,        icon: Ic.temp(18),     color: "#00acc1" },
                { label: "Presión",     value: `${tank.pressure} bar`,  icon: Ic.pressure(18), color: teal },
              ].map((k, i) => (
                <div key={i} className="adm-kpi-card">
                  <div className="adm-kpi-top">
                    <span style={{ color: k.color }}>{k.icon}</span>
                    <span className="adm-kpi-dot" />
                  </div>
                  <p className="adm-kpi-val">{k.value}</p>
                  <p className="adm-kpi-label">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="adm-dash-grid">
              <div className="adm-gauge-card">
                <h3 className="adm-gauge-title">{tank.name}</h3>
                <div className="adm-gauge-inner">
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <WaterGauge level={tank.level} thresholds={thresholds} size={150} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'DM Mono',monospace" }}>{tank.level}%</span>
                      <span style={{ fontSize: 10, color: "#546e7a" }}>nivel agua</span>
                    </div>
                  </div>
                  <div className="adm-gauge-right">
                    {[
                      { label: "Motobomba", val: tank.pump ? "Activa" : "Inactiva",   color: tank.pump ? "#2e7d32" : "#546e7a" },
                      { label: "Compuerta", val: tank.valve ? "Abierta" : "Cerrada",  color: tank.valve ? blue : "#546e7a" },
                      { label: "Modo",      val: autoMode ? "Automático" : "Manual",  color: autoMode ? teal : warning },
                      { label: "ESP32",     val: tank.online ? "En línea" : "Offline", color: tank.online ? "#2e7d32" : danger },
                    ].map((d, i) => (
                      <div key={i} className="adm-stat-mini">
                        <p className="adm-stat-mini-label">{d.label}</p>
                        <p className="adm-stat-mini-val" style={{ color: d.color }}>{d.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="adm-alerts-card">
                <h3 className="adm-alerts-title">Alertas</h3>
                {alerts.length === 0
                  ? <p style={{ color: "#546e7a", fontSize: 13 }}>Sin alertas</p>
                  : alerts.slice(0, 5).map(a => (
                    <div key={a.id} className="adm-alert-dark">
                      <span style={{ color: a.type === "danger" ? danger : a.type === "warning" ? warning : "#42a5f5", flexShrink: 0 }}>
                        {Ic.alert(14)}
                      </span>
                      <div>
                        <p className="adm-alert-dark-msg">{a.msg}</p>
                        <p className="adm-alert-dark-time">{a.time}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* ── CONTROL ── */}
        {section === "control" && (
          <>
            <div className="adm-ctrl-card">
              <div className="adm-mode-row">
                <div>
                  <p className="adm-mode-title">Modo de operación</p>
                  <p className="adm-mode-sub">
                    {autoMode ? "Automático — el sistema controla por umbrales" : "Manual — control directo habilitado"}
                  </p>
                </div>
                <div className="adm-mode-right">
                  <span className="adm-mode-side-label">Manual</span>
                  <Toggle on={autoMode} onChange={v => { onToggleAutoMode(v); toastFn(`Modo ${v ? "automático" : "manual"}`, "info"); }} />
                  <span className="adm-mode-side-label" style={{ color: autoMode ? teal : "#546e7a", fontWeight: 600 }}>Auto</span>
                </div>
              </div>
            </div>

            {/* Motobomba */}
            <div className={`adm-device-card ${tank.pump ? "pump-on" : "off"}`}>
              <div className="adm-device-row">
                <div className="adm-device-left">
                  <div className={`adm-device-icon-dark ${tank.pump ? "on-pump" : ""}`}>
                    <span style={{ color: "#fff" }}>{Ic.pump(22)}</span>
                  </div>
                  <div>
                    <p className="adm-device-name">Motobomba</p>
                    <p className="adm-device-status" style={{ color: tank.pump ? "#a5d6a7" : "#546e7a" }}>
                      {tank.pump ? "● Encendida" : "○ Apagada"}
                    </p>
                  </div>
                </div>
                <div className="adm-device-right">
                  <button className={`adm-device-btn ${tank.pump ? "stop" : "start"}`}
                    onClick={() => { onTogglePump(); toastFn(`Motobomba ${!tank.pump ? "encendida" : "apagada"}`, !tank.pump ? "success" : "info"); }}>
                    {tank.pump ? "Apagar bomba" : "Encender bomba"}
                  </button>
                  <Toggle on={tank.pump} onChange={() => { onTogglePump(); }} />
                </div>
              </div>
            </div>

            {/* Compuerta */}
            <div className={`adm-device-card ${tank.valve ? "valve-on" : "off"}`}>
              <div className="adm-device-row">
                <div className="adm-device-left">
                  <div className={`adm-device-icon-dark ${tank.valve ? "on-valve" : ""}`}>
                    <span style={{ color: "#fff" }}>{Ic.valve(22)}</span>
                  </div>
                  <div>
                    <p className="adm-device-name">Compuerta principal</p>
                    <p className="adm-device-status" style={{ color: tank.valve ? "#90caf9" : "#546e7a" }}>
                      {tank.valve ? "● Abierta — permite flujo" : "○ Cerrada — flujo detenido"}
                    </p>
                  </div>
                </div>
                <div className="adm-device-right">
                  <button className={`adm-device-btn ${tank.valve ? "close" : "open"}`}
                    onClick={() => { onToggleValve(); toastFn(`Compuerta ${!tank.valve ? "abierta" : "cerrada"}`, "info"); }}>
                    {tank.valve ? "Cerrar compuerta" : "Abrir compuerta"}
                  </button>
                  <Toggle on={tank.valve} onChange={() => { onToggleValve(); }} />
                </div>
              </div>
            </div>

            {/* Lógica activa */}
            <div className="adm-ctrl-card">
              <h3 className="adm-ctrl-card-title">Lógica de automatización activa</h3>
              {[
                { cond: `Nivel ≤ ${thresholds.low}%`, action: "Encender bomba + abrir compuerta", color: danger },
                { cond: `Nivel ≥ ${thresholds.high}%`, action: "Apagar bomba + cerrar compuerta", color: warning },
                { cond: "Rango normal",                action: "Sistema en espera — LED verde",    color: teal   },
              ].map((r, i) => (
                <div key={i} className="adm-logic-rule" style={{ marginBottom: 8 }}>
                  <span className="adm-logic-cond" style={{ color: r.color }}>{r.cond}</span>
                  <span className="adm-logic-arrow">→</span>
                  <span className="adm-logic-action">{r.action}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── UMBRALES ── */}
        {section === "thresholds" && (
          <>
            <div className="adm-thresh-card">
              <div className="adm-thresh-header">
                <div>
                  <p className="adm-thresh-title">Umbral bajo — activar motobomba</p>
                  <p className="adm-thresh-sub">Si el nivel cae por debajo, la bomba se enciende</p>
                </div>
                <span className="adm-thresh-big" style={{ color: danger }}>{localLow}%</span>
              </div>
              <input type="range" min="5" max="50" step="1" value={localLow}
                onChange={e => setLocalLow(+e.target.value)}
                className="adm-range" style={{ accentColor: danger }} />
              <div className="adm-range-labels"><span>5%</span><span>50%</span></div>
            </div>

            <div className="adm-thresh-card">
              <div className="adm-thresh-header">
                <div>
                  <p className="adm-thresh-title">Umbral alto — apagar bomba y cerrar</p>
                  <p className="adm-thresh-sub">Al llegar aquí, la bomba se apaga y la compuerta se cierra</p>
                </div>
                <span className="adm-thresh-big" style={{ color: warning }}>{localHigh}%</span>
              </div>
              <input type="range" min="55" max="98" step="1" value={localHigh}
                onChange={e => setLocalHigh(+e.target.value)}
                className="adm-range" style={{ accentColor: warning }} />
              <div className="adm-range-labels"><span>55%</span><span>98%</span></div>
            </div>

            <div className="adm-preview-wrap">
              <p className="adm-preview-title">Vista previa del rango operativo</p>
              <div className="adm-preview-track">
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${localLow}%`, background: `${danger}80` }} />
                <div style={{ position: "absolute", left: `${localLow}%`, top: 0, bottom: 0, width: `${localHigh - localLow}%`, background: `${teal}80` }} />
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${100 - localHigh}%`, background: `${warning}80` }} />
              </div>
              <div className="adm-preview-labels">
                <span style={{ color: danger }}>Bomba ON ↓{localLow}%</span>
                <span style={{ color: teal }}>Zona normal</span>
                <span style={{ color: warning }}>{localHigh}%↑ Apagar</span>
              </div>
            </div>

            <button className={`adm-save-btn ${saved ? "saved" : ""}`} onClick={saveThresholds}>
              {saved ? "✓ Umbrales guardados y aplicados" : "Guardar y aplicar umbrales"}
            </button>
          </>
        )}

        {/* ── ALERTAS ── */}
        {section === "alerts" && (
          <div className="adm-alerts-section">
            <div className="adm-alerts-section-header">
              <h2 className="adm-section-title" style={{ margin: 0 }}>Historial de alertas</h2>
              <button className="adm-clear-btn"
                onClick={() => { onClearAlerts(); toastFn("Alertas limpiadas", "success"); }}>
                Limpiar alertas
              </button>
            </div>
            {alerts.length === 0
              ? <p style={{ color: "#546e7a", fontSize: 15, textAlign: "center", padding: "40px 0" }}>Sin alertas registradas</p>
              : alerts.map(a => (
                <div key={a.id} className="adm-alert-full">
                  <span style={{ color: a.type === "danger" ? danger : a.type === "warning" ? warning : "#42a5f5", flexShrink: 0, marginTop: 1 }}>
                    {Ic.alert(16)}
                  </span>
                  <div className="adm-alert-full-body">
                    <p className="adm-alert-full-msg">{a.msg}</p>
                    <p className="adm-alert-full-time">{a.time}</p>
                  </div>
                  <span className={`adm-alert-pill ${a.type}`}>
                    {a.type === "danger" ? "CRÍTICO" : a.type === "warning" ? "AVISO" : "INFO"}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* ── CONFIGURACIÓN ── */}
        {section === "config" && (
          <>
            <div className="adm-config-card">
              <h3 className="adm-config-title">Nombre del tanque</h3>
              <div className="adm-rename-row">
                <input className="adm-rename-input" value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  disabled={!editName} />
                {editName ? (
                  <>
                    <button className="adm-save-name-btn"
                      onClick={() => { onRenameTank(nameVal); setEditName(false); toastFn("Nombre actualizado", "success"); }}>
                      Guardar
                    </button>
                    <button className="adm-cancel-btn"
                      onClick={() => { setEditName(false); setNameVal(tank.name); }}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button className="adm-edit-btn" onClick={() => setEditName(true)}>
                    {Ic.edit(14)} Editar
                  </button>
                )}
              </div>
            </div>
            <div className="adm-config-card">
              <h3 className="adm-config-title">Información del sistema</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Versión",          "AquaSmart v1.0"],
                  ["Dispositivo",      "ESP32 DevKit v1"],
                  ["Sensor",           "HC-SR04 Ultrasónico"],
                  ["Protocolo",        "WebSocket + REST API"],
                  ["Base de datos",    "MongoDB Atlas"],
                  ["Backend",          "FastAPI (Python)"],
                  ["Frontend",         "React 18 + Vite"],
                  ["Despliegue",       "Render + Vercel"],
                ].map(([k, v]) => (
                  <div key={k} className="adm-info-row">
                    <span className="adm-info-key">{k}</span>
                    <span className="adm-info-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── REGISTRO ── */}
        {section === "logs" && (
          <>
            <h2 className="adm-section-title">Registro de acciones</h2>
            {logs.map(l => (
              <div key={l.id} className="adm-log-item">
                <div className="adm-log-avatar">{l.user[0].toUpperCase()}</div>
                <div className="adm-log-body">
                  <p className="adm-log-action">{l.action}</p>
                  <p className="adm-log-meta">{l.user} · {l.time}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [session,    setSession]    = useState(null);
  const [tank,       setTank]       = useState(TANK_INIT);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [autoMode,   setAutoMode]   = useState(true);
  const [alerts,     setAlerts]     = useState([
    { id: 1, type: "warning", msg: "Sistema iniciado correctamente", time: "hace un momento" },
  ]);
  const [logs,   setLogs]   = useState([{ id: 1, user: "sistema", action: "Sistema AquaSmart iniciado", time: "ahora" }]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(200);
  const wsRef   = useRef(null);

  const addToast = useCallback((msg, type = "info") => {
    const id = toastId.current++;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const addLog = useCallback((user, action) => {
    setLogs(prev => [{ id: Date.now(), user, action, time: "ahora" }, ...prev.slice(0, 49)]);
  }, []);

  // ── WebSocket con reconexión automática ─────────────────────
  useEffect(() => {
    let ws, reconnectTimer;
    function connect() {
      ws = new WebSocket(WS);
      wsRef.current = ws;
      ws.onopen = () => {
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, 20000);
        ws._ping = ping;
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "initial") {
          if (msg.thresholds) setThresholds(msg.thresholds);
          if (msg.auto_mode !== undefined) setAutoMode(msg.auto_mode);
          if (msg.tank && Object.keys(msg.tank).length > 0)
            setTank(prev => ({ ...prev, ...msg.tank, online: msg.esp32_online }));
        }
        if (msg.type === "telemetry" && msg.data)
          setTank(prev => ({ ...prev, level: msg.data.level ?? prev.level,
            pump: msg.data.pump ?? prev.pump, valve: msg.data.valve ?? prev.valve,
            temp: msg.data.temp ?? prev.temp, flow: msg.data.flow ?? prev.flow,
            pressure: msg.data.pressure ?? prev.pressure, online: true }));
        if (msg.type === "alert" && msg.data) {
          const a = { id: Date.now(), type: msg.data.alert_type === "low" ? "danger" : msg.data.alert_type === "high" ? "warning" : "info",
            msg: msg.data.msg || `Alerta nivel: ${msg.data.level}%`, time: "ahora" };
          setAlerts(prev => [a, ...prev.slice(0, 29)]);
          addToast(a.msg, a.type === "danger" ? "error" : "info");
        }
        if (msg.type === "thresholds_update") setThresholds(msg.thresholds);
        if (msg.type === "auto_mode_update")   setAutoMode(msg.auto_mode);
        if (msg.type === "pump_update")  setTank(prev => ({ ...prev, pump: msg.pump }));
        if (msg.type === "valve_update") setTank(prev => ({ ...prev, valve: msg.valve }));
        if (msg.type === "esp32_online") {
          setTank(prev => ({ ...prev, online: msg.online }));
          addToast(msg.online ? "ESP32 conectado" : "ESP32 desconectado", msg.online ? "success" : "error");
        }
        if (msg.type === "tank_renamed") setTank(prev => ({ ...prev, name: msg.name }));
      };
      ws.onclose = () => { if (ws._ping) clearInterval(ws._ping); reconnectTimer = setTimeout(connect, 4000); };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { clearTimeout(reconnectTimer); if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); } };
  }, [addToast]);

  // ── Simulación local (cuando ESP32 no está conectado) ────────
  useEffect(() => {
    const iv = setInterval(() => {
      setTank(prev => {
        if (prev.online === true) return prev;
        const delta = (Math.random() - 0.49) * 1.5;
        const newLevel = Math.max(3, Math.min(99, prev.level + delta));
        let pump = prev.pump, valve = prev.valve;
        if (autoMode) {
          if (newLevel <= thresholds.low && !prev.pump) {
            pump = true; valve = true;
            const a = { id: Date.now(), type: "danger", msg: `Nivel al ${Math.round(newLevel)}% — Motobomba activada automáticamente`, time: "ahora" };
            setAlerts(p => [a, ...p.slice(0, 29)]);
            addToast("⚠️ Nivel bajo — bomba activada", "error");
          }
          if (newLevel >= thresholds.high && prev.pump) {
            pump = false; valve = false;
            const a = { id: Date.now() + 1, type: "warning", msg: `Nivel al ${Math.round(newLevel)}% — Bomba apagada, compuerta cerrada`, time: "ahora" };
            setAlerts(p => [a, ...p.slice(0, 29)]);
            addToast("⚡ Nivel alto — sistema detenido", "info");
          }
          if (newLevel > thresholds.low + 5 && newLevel < thresholds.high - 5 && prev.pump) pump = false;
        }
        return { ...prev, level: Math.round(newLevel * 10) / 10, pump, valve, online: false,
          flow: Math.round((Math.random() * 2 + 0.8) * 10) / 10,
          temp: prev.temp + (Math.random() > 0.95 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          pressure: Math.round((Math.random() * 0.4 + 1.2) * 10) / 10 };
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [thresholds, autoMode, addToast]);

  // ── Llamadas a la API ────────────────────────────────────────
  const callAPI = useCallback(async (endpoint, body, token) => {
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch { return false; }
  }, []);

  const togglePump = useCallback(() => {
    setTank(p => {
      const next = !p.pump;
      addLog(session?.username || "sistema", `Motobomba ${next ? "encendida" : "apagada"} manualmente`);
      if (session?.token) callAPI("/api/control/pump", { on: next }, session.token);
      return { ...p, pump: next };
    });
  }, [session, addLog, callAPI]);

  const toggleValve = useCallback(() => {
    setTank(p => {
      const next = !p.valve;
      addLog(session?.username || "sistema", `Compuerta ${next ? "abierta" : "cerrada"} manualmente`);
      if (session?.token) callAPI("/api/control/valve", { open: next }, session.token);
      return { ...p, valve: next };
    });
  }, [session, addLog, callAPI]);

  const handleSetThresholds = useCallback((t) => {
    setThresholds(t);
    addLog(session?.username || "admin", `Umbrales → bajo=${t.low}%, alto=${t.high}%`);
    if (session?.token) callAPI("/api/control/thresholds", t, session.token);
  }, [session, addLog, callAPI]);

  const handleToggleAutoMode = useCallback((v) => {
    setAutoMode(v);
    addLog(session?.username || "admin", `Modo ${v ? "automático" : "manual"} activado`);
    if (session?.token) callAPI("/api/control/auto-mode", { enabled: v }, session.token);
  }, [session, addLog, callAPI]);

  const handleRenameTank = useCallback((name) => {
    setTank(p => {
      addLog(session?.username || "admin", `Tanque renombrado a "${name}"`);
      if (session?.token) callAPI("/api/control/rename", { name }, session.token);
      return { ...p, name };
    });
  }, [session, addLog, callAPI]);

  // ── Login ────────────────────────────────────────────────────
  const handleLogin = useCallback(async (sessionData) => {
    if (sessionData.role === "public") { setSession(sessionData); return; }
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${sessionData.username}&password=${sessionData.password}`,
      });
      if (res.ok) {
        const data = await res.json();
        setSession({ ...sessionData, token: data.access_token, role: data.role, label: data.label });
        addLog(sessionData.username, "Sesión iniciada");
      } else { return false; }
    } catch { setSession(sessionData); }
    return true;
  }, [addLog]);

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const shared = { tank, thresholds, alerts, onTogglePump: togglePump, onToggleValve: toggleValve,
    onLogout: () => { setSession(null); addLog("sistema", "Sesión cerrada"); }, toastFn: addToast };

  return (
    <>
      {session.role === "public"   && <PublicView   {...shared} onLogin={() => setSession(null)} />}
      {session.role === "operator" && <OperatorView {...shared} user={session} autoMode={autoMode} />}
      {session.role === "admin"    && (
        <AdminView {...shared} user={session} autoMode={autoMode} logs={logs}
          onSetThresholds={handleSetThresholds} onToggleAutoMode={handleToggleAutoMode}
          onRenameTank={handleRenameTank} onClearAlerts={() => setAlerts([])} />
      )}
      <Toast toasts={toasts} />
    </>
  );
}
