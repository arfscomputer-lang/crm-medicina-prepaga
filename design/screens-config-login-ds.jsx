// screens-config-login-ds.jsx — Configuración, Login, Design System

const { useState: useS_cl, useEffect: useE_cl, useRef: useR_cl } = React;

// ─── CONFIGURACIÓN ─────────────────────────────────────────────────────
function Configuracion({ user, density }) {
  const [section, setSection] = useS_cl("perfil");
  const sections = [
    { id: "perfil",        label: "Perfil",            icon: "Users" },
    { id: "organizacion",  label: "Organización",      icon: "Building" },
    { id: "usuarios",      label: "Usuarios y roles",  icon: "Shield" },
    { id: "seguridad",     label: "Seguridad (MFA)",   icon: "Lock" },
    { id: "integraciones", label: "Integraciones",     icon: "Zap" },
  ];

  return (
    <>
      <Topbar title="Configuración" right={<GlobalSearch />} />
      <div className="scroll-area">
        <div className="page">
          <div style={{ marginBottom: 20 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Configuración</div>
            <div className="fg-3" style={{ fontSize: 13 }}>Gestioná tu perfil, equipo, seguridad e integraciones</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
            {/* Sub-nav */}
            <div className="vstack" style={{ gap: 2 }}>
              {sections.map(s => (
                <div
                  key={s.id}
                  className={"sb-link " + (section === s.id ? "active" : "")}
                  onClick={() => setSection(s.id)}
                  style={{ padding: "8px 12px" }}
                >
                  <Icon name={s.icon} size={14} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <div>
              {section === "perfil" && <ConfigPerfil user={user} />}
              {section === "organizacion" && <ConfigOrg />}
              {section === "usuarios" && <ConfigUsuarios density={density} />}
              {section === "seguridad" && <ConfigSeguridad />}
              {section === "integraciones" && <ConfigIntegraciones />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ConfigPerfil({ user }) {
  return (
    <div className="vstack" style={{ gap: 20 }}>
      <SectionCard title="Información personal">
        <div className="hstack" style={{ marginBottom: 20 }}>
          <Avatar name={user.nombre} size="xl" gradient={user.color} />
          <div className="vstack" style={{ gap: 6 }}>
            <button className="btn btn-sm">Cambiar foto</button>
            <span className="fg-3" style={{ fontSize: 11 }}>JPG o PNG · máx. 2MB</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label className="label">Nombre completo</label><input className="input" defaultValue={user.nombre} /></div>
          <div><label className="label">Email</label><input className="input" defaultValue={user.email} /></div>
          <div><label className="label">Teléfono</label><input className="input mono" defaultValue="+595 981 224-117" /></div>
          <div><label className="label">Zona horaria</label><select className="select" defaultValue="GMT-3"><option>GMT-3 · Asunción</option><option>GMT-4 · Asunción (DST)</option></select></div>
        </div>
      </SectionCard>

      <SectionCard title="Preferencias">
        <RowToggle label="Notificaciones push" sub="Recibir alertas en el navegador para mensajes nuevos." defaultOn />
        <RowToggle label="Resumen diario por email" sub="Reporte de actividad enviado todas las mañanas a las 8:00." defaultOn />
        <RowToggle label="Asistente de copy AI" sub="Sugerencias de respuesta automáticas en chats." />
      </SectionCard>
    </div>
  );
}

function ConfigOrg() {
  return (
    <SectionCard title="Organización">
      <div className="hstack" style={{ marginBottom: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), #7BA0FF)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontFamily: "var(--font-mono)" }}>EB</div>
        <div className="vstack" style={{ gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>EBSA Asunción Centro</span>
          <span className="fg-3" style={{ fontSize: 12 }}>Agencia oficial · RUC 80012458-9</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label className="label">Razón social</label><input className="input" defaultValue="EBSA Asunción Centro S.A." /></div>
        <div><label className="label">RUC</label><input className="input mono" defaultValue="80012458-9" /></div>
        <div><label className="label">Dirección</label><input className="input" defaultValue="Av. Mariscal López 1234, Asunción" /></div>
        <div><label className="label">Plan SeguroCRM</label><div className="hstack" style={{ marginTop: 8 }}><Badge variant="accent" dot>Business</Badge><span className="fg-3" style={{ fontSize: 12 }}>10 usuarios incluidos · renueva 14 jun</span></div></div>
      </div>
    </SectionCard>
  );
}

function ConfigUsuarios({ density }) {
  return (
    <div className="vstack" style={{ gap: 20 }}>
      <SectionCard title={`Usuarios (${window.USERS.length})`} action={<button className="btn btn-primary btn-sm"><Icon name="Plus" size={12} className="ic" />Invitar usuario</button>}>
        <div className={`tbl-wrap density-${density}`} style={{ background: "var(--bg-1)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {window.USERS.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="hstack">
                      <Avatar name={u.nombre} size="sm" gradient={u.color} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.nombre}</div>
                        <div className="fg-3" style={{ fontSize: 11 }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><RolePill role={u.role} /></td>
                  <td><Badge variant="success" dot>Activo</Badge></td>
                  <td className="fg-2 mono" style={{ fontSize: 12 }}>{["Hace 5 min", "Hace 1h", "Hoy 09:42", "Ayer 18:30", "Hoy 11:15", "Hace 2 días"][window.USERS.indexOf(u)]}</td>
                  <td className="col-actions">
                    <button className="btn btn-sm btn-ghost">Editar permisos</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Roles disponibles">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {Object.values(window.ROLES).map(r => (
            <div key={r.id} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--border-soft)", borderRadius: 8 }}>
              <div className="hstack" style={{ marginBottom: 4 }}>
                <RolePill role={r.id} />
                <span className="fg-3" style={{ fontSize: 11 }}>{r.id === "ADMIN" ? "1 usuario" : r.id === "SUPERVISOR" ? "1 usuario" : r.id === "AGENTE" ? "3 usuarios" : "1 usuario"}</span>
              </div>
              <div className="fg-2" style={{ fontSize: 12.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ConfigSeguridad() {
  const [mfaOn, setMfaOn] = useS_cl(true);
  const [showSetup, setShowSetup] = useS_cl(false);

  return (
    <div className="vstack" style={{ gap: 20 }}>
      <SectionCard title="Autenticación de dos factores (MFA)">
        <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="hstack">
              <span style={{ fontSize: 14, fontWeight: 500 }}>App autenticadora</span>
              {mfaOn ? <Badge variant="success" dot>Activo</Badge> : <Badge variant="neutral">Inactivo</Badge>}
            </div>
            <div className="fg-3" style={{ fontSize: 12, marginTop: 4 }}>Configurada con Google Authenticator el 12 mar 2026</div>
          </div>
          <div className="hstack">
            <button className="btn btn-sm" onClick={() => setShowSetup(true)}>Reconfigurar</button>
            <Toggle on={mfaOn} onChange={setMfaOn} />
          </div>
        </div>

        <div style={{ padding: 14, border: "1px solid var(--success-line)", background: "var(--success-soft)", borderRadius: 8 }}>
          <div className="hstack" style={{ color: "var(--success)" }}>
            <Icon name="ShieldCheck" size={14} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Tu cuenta está protegida</span>
          </div>
          <div className="fg-2" style={{ fontSize: 12, marginTop: 4 }}>Se requerirá un código de 6 dígitos en cada inicio de sesión.</div>
        </div>
      </SectionCard>

      <SectionCard title="Sesiones activas">
        <div className="vstack" style={{ gap: 8 }}>
          <SessionRow device="MacBook Pro · Chrome 124" location="Asunción · Paraguay" current />
          <SessionRow device="iPhone 15 · Safari" location="Asunción · Paraguay" time="Hace 2h" />
          <SessionRow device="Pixel 7 · Chrome Mobile" location="Encarnación · Paraguay" time="Ayer 19:30" />
        </div>
      </SectionCard>

      <Modal open={showSetup} onClose={() => setShowSetup(false)} title="Reconfigurar MFA" subtitle="Escaneá el código con tu app autenticadora" size="md"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShowSetup(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => setShowSetup(false)}>Confirmar</button>
        </>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <FakeQR />
            <div className="fg-3" style={{ fontSize: 11, marginTop: 10 }}>Escaneá este QR con Google Authenticator, Authy o 1Password</div>
          </div>
          <div className="vstack" style={{ gap: 14 }}>
            <div>
              <label className="label">O ingresá esta clave manualmente</label>
              <div className="hstack" style={{ background: "var(--bg-1)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 10 }}>
                <span className="mono" style={{ fontSize: 14, letterSpacing: "0.06em" }}>JBSWY3DPEHPK3PXP</span>
                <button className="btn btn-sm btn-icon btn-ghost" style={{ marginLeft: "auto" }}><Icon name="Copy" size={12} /></button>
              </div>
            </div>
            <div>
              <label className="label">Ingresá el código de 6 dígitos</label>
              <input className="input mono" placeholder="000000" maxLength={6} style={{ letterSpacing: "0.4em", fontSize: 18, textAlign: "center", height: 44 }} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SessionRow({ device, location, time = "Activa ahora", current }) {
  return (
    <div style={{ padding: 12, border: "1px solid var(--border-soft)", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, background: "var(--bg-1)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-3)", display: "grid", placeItems: "center", color: "var(--fg-2)" }}>
        <Icon name="Globe" size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="hstack">
          <span style={{ fontSize: 13, fontWeight: 500 }}>{device}</span>
          {current ? <Badge variant="success" dot>Esta sesión</Badge> : null}
        </div>
        <div className="fg-3" style={{ fontSize: 11.5 }}>{location} · {time}</div>
      </div>
      {!current ? <button className="btn btn-sm btn-ghost btn-danger">Cerrar</button> : null}
    </div>
  );
}

function FakeQR() {
  // procedurally generate a fake QR
  const cells = 25;
  const seed = 0xACE17;
  const grid = [];
  let s = seed;
  for (let r = 0; r < cells; r++) {
    const row = [];
    for (let c = 0; c < cells; c++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      row.push(s & 1);
    }
    grid.push(row);
  }
  // finder patterns
  const setFinder = (r, c) => {
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const onFrame = i === 0 || i === 6 || j === 0 || j === 6;
      const onInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      grid[r + i][c + j] = onFrame || onInner ? 1 : 0;
    }
  };
  setFinder(0, 0); setFinder(0, cells - 7); setFinder(cells - 7, 0);
  const size = 180;
  const cs = size / cells;
  return (
    <div style={{ display: "inline-block", padding: 12, background: "white", borderRadius: 10 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.flatMap((row, r) => row.map((v, c) => v ? <rect key={`${r}-${c}`} x={c * cs} y={r * cs} width={cs} height={cs} fill="#0F1117" /> : null))}
      </svg>
    </div>
  );
}

function ConfigIntegraciones() {
  return (
    <div className="vstack" style={{ gap: 20 }}>
      <SectionCard title="WhatsApp Business API">
        <div className="hstack" style={{ marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--success-soft)", display: "grid", placeItems: "center", color: "var(--success)" }}>
            <Icon name="MessageCircle" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="hstack"><span style={{ fontSize: 14, fontWeight: 500 }}>WhatsApp Business</span><Badge variant="success" dot>Conectado</Badge></div>
            <div className="fg-3" style={{ fontSize: 12 }}>+595 981 224-117 · 4.823 mensajes enviados este mes</div>
          </div>
          <button className="btn btn-sm">Probar conexión</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label className="label">Phone Number ID</label><input className="input mono" defaultValue="105234817749210" /></div>
          <div><label className="label">Business Account ID</label><input className="input mono" defaultValue="220198567710334" /></div>
          <div style={{ gridColumn: "span 2" }}>
            <label className="label">Access Token</label>
            <div className="input-with-icon">
              <input className="input mono" type="password" defaultValue="EAAJ8...token oculto..." />
              <button className="btn btn-sm btn-icon btn-ghost" style={{ position: "absolute", right: 6, top: 4 }}><Icon name="Eye" size={13} /></button>
            </div>
            <div className="hint">Token de Meta Cloud API. Permanece encriptado en reposo.</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Messenger">
        <div className="hstack" style={{ marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--info-soft)", display: "grid", placeItems: "center", color: "var(--info)" }}>
            <Icon name="MessageSquare" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="hstack"><span style={{ fontSize: 14, fontWeight: 500 }}>Facebook Messenger</span><Badge variant="success" dot>Conectado</Badge></div>
            <div className="fg-3" style={{ fontSize: 12 }}>Página: EBSA Asunción · 1.245 mensajes este mes</div>
          </div>
          <button className="btn btn-sm">Reconectar</button>
        </div>
      </SectionCard>

      <SectionCard title="Otras integraciones">
        <div className="vstack" style={{ gap: 8 }}>
          <IntegrationRow icon="Mail"       name="Email (SMTP)"     status="Conectado" />
          <IntegrationRow icon="Calendar"   name="Google Calendar"  status="Conectado" />
          <IntegrationRow icon="CreditCard" name="Bancard Tigo Money" status="No conectado" />
          <IntegrationRow icon="FileText"   name="Webhooks"         status="No conectado" />
        </div>
      </SectionCard>
    </div>
  );
}

function IntegrationRow({ icon, name, status }) {
  const ok = status === "Conectado";
  return (
    <div style={{ padding: 12, border: "1px solid var(--border-soft)", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, background: "var(--bg-1)" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-3)", display: "grid", placeItems: "center", color: "var(--fg-2)" }}><Icon name={icon} size={16} /></div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{name}</span>
      {ok ? <Badge variant="success" dot>{status}</Badge> : <Badge variant="neutral">{status}</Badge>}
      <button className="btn btn-sm">{ok ? "Configurar" : "Conectar"}</button>
    </div>
  );
}

function RowToggle({ label, sub, defaultOn }) {
  const [on, setOn] = useS_cl(defaultOn || false);
  return (
    <div style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid var(--border-soft)", alignItems: "center", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div className="fg-3" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle on={on} onChange={setOn} />
    </div>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <div className="card">
      <div className="card-hd"><div className="ttl">{title}</div>{action}</div>
      <div className="card-body" style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [step, setStep] = useS_cl("login"); // login | mfa
  const [email, setEmail] = useS_cl("");
  const [pwd, setPwd] = useS_cl("");
  const [otp, setOtp] = useS_cl(["", "", "", "", "", ""]);
  const [error, setError] = useS_cl(null);
  const otpRefs = useR_cl([]);

  const submit = () => {
    if (!email || !pwd) { setError("Ingresá email y contraseña"); return; }
    setError(null);
    setStep("mfa");
  };
  const submitOtp = () => {
    if (otp.join("").length < 6) { setError("Código incompleto"); return; }
    onLogin(window.USERS[0]);
  };
  const pickDemo = (u) => { setEmail(u.email); setPwd("•••••••••"); setStep("mfa"); };

  const setOtpAt = (i, v) => {
    const arr = otp.slice();
    arr[i] = v.slice(-1);
    setOtp(arr);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const numpadPress = (val) => {
    if (val === "clear") {
      // clear last filled
      const arr = otp.slice();
      for (let i = arr.length - 1; i >= 0; i--) if (arr[i]) { arr[i] = ""; setOtp(arr); otpRefs.current[i]?.focus(); return; }
    } else {
      const idx = otp.findIndex(x => !x);
      if (idx >= 0) {
        const arr = otp.slice(); arr[idx] = String(val); setOtp(arr);
        if (idx < 5) otpRefs.current[idx + 1]?.focus();
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.2fr 1fr", background: "var(--bg)" }}>
      {/* Left: hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(79,125,255,0.12) 0%, rgba(167,139,250,0.05) 100%), var(--bg-1)",
        padding: "48px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        borderRight: "1px solid var(--border)", position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -100, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,125,255,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="hstack">
          <Logo size={36} />
          <div style={{ marginLeft: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>SeguroCRM</div>
            <div className="fg-3" style={{ fontSize: 11 }}>Medicina prepaga · Paraguay</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 16, maxWidth: 480 }}>
            Convertí prospectos en afiliados.
          </div>
          <div className="fg-2" style={{ fontSize: 15, maxWidth: 440, lineHeight: 1.6 }}>
            El CRM de medicina prepaga diseñado para agentes en Paraguay. Pipeline visual, WhatsApp integrado y comisiones automáticas en una sola pantalla.
          </div>

          <div className="hstack" style={{ marginTop: 32, gap: 28 }}>
            <Stat lbl="Pólizas mensuales" val="12K+" />
            <Stat lbl="Agencias activas" val="48" />
            <Stat lbl="Tiempo de cierre" val="-38%" />
          </div>
        </div>

        <div className="fg-3" style={{ fontSize: 11.5 }}>© 2026 SeguroCRM · v3.4.2 · Hecho en Asunción</div>
      </div>

      {/* Right: login form */}
      <div style={{ padding: "48px", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "auto" }}>
        <div style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
          {step === "login" ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <div className="title-lg" style={{ fontSize: 22, marginBottom: 6 }}>Iniciar sesión</div>
                <div className="fg-3" style={{ fontSize: 13 }}>Ingresá a tu cuenta para empezar</div>
              </div>

              {error ? (
                <div style={{ padding: 10, background: "var(--error-soft)", border: "1px solid var(--error-line)", color: "var(--error)", borderRadius: 8, marginBottom: 16, fontSize: 12.5 }}>
                  <Icon name="AlertCircle" size={12} /> {error}
                </div>
              ) : null}

              <button className="btn btn-lg" style={{ width: "100%", marginBottom: 14, justifyContent: "center" }} onClick={() => setStep("mfa")}>
                <Icon name="Globe" size={15} className="ic" />
                Continuar con Google
              </button>

              <div className="hstack" style={{ margin: "16px 0" }}>
                <div className="dvd" style={{ flex: 1 }} />
                <span className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>o</span>
                <div className="dvd" style={{ flex: 1 }} />
              </div>

              <div className="vstack" style={{ gap: 12 }}>
                <div><label className="label">Email</label>
                  <input className="input input-lg" placeholder="vos@empresa.com.py" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div><label className="label hstack" style={{ justifyContent: "space-between" }}>Contraseña <a className="link" style={{ fontSize: 11 }}>¿Olvidaste?</a></label>
                  <input className="input input-lg" type="password" placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit}>
                  Continuar <Icon name="ArrowRight" size={14} className="ic" />
                </button>
              </div>

              <div style={{ marginTop: 28 }}>
                <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontWeight: 500 }}>Usuarios demo</div>
                <div className="vstack" style={{ gap: 4 }}>
                  {window.USERS.slice(0, 4).map(u => (
                    <button key={u.id} className="btn" style={{ width: "100%", justifyContent: "flex-start", height: 44, padding: "0 12px" }} onClick={() => pickDemo(u)}>
                      <Avatar name={u.nombre} size="sm" gradient={u.color} />
                      <div style={{ textAlign: "left", flex: 1, marginLeft: 2 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{u.nombre}</div>
                        <div className="fg-3" style={{ fontSize: 11 }}>{u.email}</div>
                      </div>
                      <RolePill role={u.role} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep("login")} style={{ marginBottom: 12, padding: "4px 8px" }}><Icon name="ChevronLeft" size={12} />Volver</button>
                <div className="title-lg" style={{ fontSize: 22, marginBottom: 6 }}>Verificación de seguridad</div>
                <div className="fg-3" style={{ fontSize: 13 }}>Ingresá el código de 6 dígitos generado por tu app autenticadora</div>
              </div>

              <div className="otp" style={{ marginBottom: 16 }}>
                {otp.map((v, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    className={v ? "filled" : ""}
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={e => setOtpAt(i, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !v && i > 0) otpRefs.current[i - 1]?.focus();
                    }}
                  />
                ))}
              </div>

              {error ? <div style={{ color: "var(--error)", fontSize: 12, textAlign: "center", marginBottom: 8 }}>{error}</div> : null}

              <div className="numpad">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => numpadPress(n)}>{n}</button>
                ))}
                <button className="clear" onClick={() => numpadPress("clear")}>⌫</button>
                <button onClick={() => numpadPress(0)}>0</button>
                <button className="clear" onClick={submitOtp} style={{ color: "var(--accent)" }}><Icon name="ArrowRight" size={18} /></button>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 24 }} onClick={submitOtp}>
                Verificar y entrar
              </button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <a className="link" style={{ fontSize: 12 }}>¿Problemas con tu código? Usar código de respaldo</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ lbl, val }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.02em" }}>{val}</div>
      <div className="fg-3" style={{ fontSize: 11, marginTop: 2 }}>{lbl}</div>
    </div>
  );
}

// ─── DESIGN SYSTEM page ────────────────────────────────────────────────
function DesignSystem() {
  return (
    <>
      <Topbar title="Design System" right={<GlobalSearch />} />
      <div className="scroll-area">
        <div className="page">
          <div style={{ marginBottom: 24 }}>
            <div className="title-xl" style={{ marginBottom: 4 }}>Design System</div>
            <div className="fg-3" style={{ fontSize: 13 }}>Foundations, tokens y componentes base de SeguroCRM</div>
          </div>

          {/* Colors */}
          <SectionCard title="Colores">
            <div className="vstack" style={{ gap: 18 }}>
              <div>
                <SubLabel>Superficies</SubLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  <Swatch name="bg"    val="#0F1117" />
                  <Swatch name="bg-1"  val="#14171F" />
                  <Swatch name="bg-2"  val="#1A1E28" />
                  <Swatch name="bg-3"  val="#21252F" />
                  <Swatch name="bg-4"  val="#2A2F3B" />
                </div>
              </div>
              <div>
                <SubLabel>Texto</SubLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  <Swatch name="fg"    val="#E8EAF0" textOn="#0F1117" />
                  <Swatch name="fg-1"  val="#B6BCC9" textOn="#0F1117" />
                  <Swatch name="fg-2"  val="#8A91A2" textOn="#0F1117" />
                  <Swatch name="fg-3"  val="#5E6677" textOn="#0F1117" />
                  <Swatch name="fg-4"  val="#3F4555" textOn="#0F1117" />
                </div>
              </div>
              <div>
                <SubLabel>Semánticos</SubLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  <Swatch name="accent"  val="#4F7DFF" />
                  <Swatch name="success" val="#34D399" textOn="#0F1117" />
                  <Swatch name="warning" val="#FBBF24" textOn="#0F1117" />
                  <Swatch name="error"   val="#F87171" />
                  <Swatch name="info"    val="#60A5FA" />
                </div>
              </div>
              <div>
                <SubLabel>Planes EBSA</SubLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  <Swatch name="Sana"      val="#34D399" textOn="#0F1117" />
                  <Swatch name="Confort"   val="#60A5FA" />
                  <Swatch name="Excellent" val="#F4B95E" textOn="#0F1117" />
                  <Swatch name="Adultos Mayores" val="#A78BFA" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Typography */}
          <SectionCard title="Tipografía">
            <div className="vstack" style={{ gap: 16 }}>
              <TypeRow size={36} weight={600} label="Display / 36 · 600" sample="Convertí prospectos en afiliados" />
              <TypeRow size={24} weight={600} label="Title XL / 24 · 600" sample="Dashboard" />
              <TypeRow size={20} weight={600} label="Title LG / 20 · 600" sample="Pipeline de ventas" />
              <TypeRow size={16} weight={500} label="Title MD / 16 · 500" sample="Datos personales" />
              <TypeRow size={14} weight={500} label="Title SM / 14 · 500" sample="Plan activo" />
              <TypeRow size={13} weight={400} label="Body / 13 · 400" sample="Lourdes acaba de enviar una cotización Confort al cliente Fernando Ojeda." />
              <TypeRow size={12} weight={400} label="Small / 12 · 400" sample="Hace 4 minutos · WhatsApp" />
              <TypeRow size={11} weight={500} label="Caption / 11 · 500 · UPPER" sample="ESTADO" upper />
              <TypeRow size={22} weight={500} label="Mono Numeric / 22 · 500" sample="Gs. 12.345.678" mono />
            </div>
          </SectionCard>

          {/* Spacing & radii */}
          <SectionCard title="Espaciado y radios">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
              <div>
                <SubLabel>Spacing scale</SubLabel>
                <div className="vstack" style={{ gap: 6 }}>
                  {[4,8,12,16,20,24,32,40,48].map(n => (
                    <div key={n} className="hstack">
                      <span className="mono fg-3" style={{ fontSize: 11, width: 50 }}>{n}px</span>
                      <div style={{ height: 6, width: n * 3, background: "var(--accent)", opacity: 0.6, borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SubLabel>Border radius</SubLabel>
                <div className="hstack" style={{ flexWrap: "wrap", gap: 12 }}>
                  {[{l:"xs", v:4},{l:"sm", v:6},{l:"md", v:8},{l:"lg", v:10},{l:"xl", v:14},{l:"2xl", v:20}].map(r => (
                    <div key={r.l} style={{ textAlign: "center" }}>
                      <div style={{ width: 64, height: 64, background: "var(--bg-3)", border: "1px solid var(--border-soft)", borderRadius: r.v, marginBottom: 6 }} />
                      <div className="fg-3 mono" style={{ fontSize: 11 }}>{r.l} · {r.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Components */}
          <SectionCard title="Botones">
            <div className="hstack" style={{ flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <button className="btn btn-primary">Primary</button>
              <button className="btn">Secondary</button>
              <button className="btn btn-soft">Soft</button>
              <button className="btn btn-ghost">Ghost</button>
              <button className="btn btn-danger">Danger</button>
              <button className="btn btn-primary"><Icon name="Plus" size={13} className="ic" />Con icono</button>
              <button className="btn btn-icon"><Icon name="MoreHorizontal" size={14} /></button>
            </div>
            <div className="hstack" style={{ gap: 10 }}>
              <button className="btn btn-primary btn-sm">Small</button>
              <button className="btn btn-primary">Default</button>
              <button className="btn btn-primary btn-lg">Large</button>
            </div>
          </SectionCard>

          <SectionCard title="Badges & estados">
            <div className="vstack" style={{ gap: 14 }}>
              <div className="hstack" style={{ flexWrap: "wrap", gap: 8 }}>
                <Badge variant="success" dot>Activo</Badge>
                <Badge variant="warning" dot>Cotizado</Badge>
                <Badge variant="info" dot>Negociación</Badge>
                <Badge variant="error" dot>Vencido</Badge>
                <Badge variant="neutral" dot>Prospecto</Badge>
                <Badge variant="accent" dot>Business</Badge>
              </div>
              <div className="hstack" style={{ gap: 8 }}>
                <RolePill role="ADMIN" />
                <RolePill role="SUPERVISOR" />
                <RolePill role="AGENTE" />
                <RolePill role="VIEWER" />
              </div>
              <div className="hstack" style={{ gap: 8 }}>
                {window.PLAN_LIST.map(p => <PlanChip key={p.id} planId={p.id} />)}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Inputs">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label className="label">Default</label><input className="input" placeholder="Ingresá texto..." /></div>
              <div><label className="label">Con icono</label>
                <div className="input-with-icon"><Icon name="Search" size={13} className="ic" /><input className="input" placeholder="Buscar..." /></div>
              </div>
              <div><label className="label">Disabled</label><input className="input" placeholder="No editable" disabled /></div>
              <div><label className="label">Select</label><select className="select"><option>Plan Confort</option><option>Plan Excellent</option></select></div>
            </div>
          </SectionCard>

          <SectionCard title="KPI cards">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <KPI label="Ejemplo positivo" icon="TrendingUp" value="184" delta={8} spark={[120,130,140,160,165,170,180,184]} />
              <KPI label="Ejemplo negativo" icon="TrendingDown" value="Gs. 88K" delta={-3} spark={[100,98,95,92,90,89,88]} />
              <KPI label="Sin tendencia" icon="Activity" value="46" />
            </div>
          </SectionCard>

          <SectionCard title="Empty state">
            <Empty
              icon="Users"
              title="Aún no hay clientes"
              sub="Importá tu cartera desde Excel o agregá el primer cliente manualmente para empezar a trabajar."
              action={<div className="hstack" style={{ marginTop: 4 }}>
                <button className="btn"><Icon name="Upload" size={13} className="ic" />Importar Excel</button>
                <button className="btn btn-primary"><Icon name="Plus" size={13} className="ic" />Nuevo cliente</button>
              </div>}
            />
          </SectionCard>

          <SectionCard title="Loading skeleton">
            <div className="vstack" style={{ gap: 10 }}>
              <Skel w="60%" h={16} />
              <Skel w="40%" h={12} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <Skel h={80} r={8} />
                <Skel h={80} r={8} />
                <Skel h={80} r={8} />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function Swatch({ name, val, textOn }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ height: 56, background: val, borderRadius: 8, border: "1px solid var(--border-soft)", display: "grid", placeItems: "center", color: textOn || "white", fontSize: 11, fontFamily: "var(--font-mono)" }}>{val}</div>
      <div className="fg-2 mono" style={{ fontSize: 11 }}>{name}</div>
    </div>
  );
}
function SubLabel({ children }) { return <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontWeight: 500 }}>{children}</div>; }
function TypeRow({ size, weight, label, sample, mono, upper }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <span className="fg-3 mono" style={{ fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: size, fontWeight: weight, fontFamily: mono ? "var(--font-mono)" : undefined, textTransform: upper ? "uppercase" : undefined, letterSpacing: upper ? "0.06em" : undefined }}>{sample}</span>
    </div>
  );
}

Object.assign(window, { Configuracion, LoginScreen, DesignSystem });
