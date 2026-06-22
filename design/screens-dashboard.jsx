// screens-dashboard.jsx

function Dashboard({ user, density, setRoute }) {
  const today = "Martes, 26 de mayo de 2026";
  const greet = user.nombre.split(" ")[0];

  const kpisTop = [
    { label: "Pólizas este mes",  icon: "Shield",       value: "12",        delta: 8,   spark: [3,4,4,6,7,5,8,9,8,11,12] },
    { label: "Prima promedio",    icon: "DollarSign",   value: "Gs. 612K",  delta: 12,  spark: [420,440,500,510,560,580,600,612] },
    { label: "Tasa de cierre",    icon: "TrendingUp",   value: "28",   unit: "%", delta: -3, spark: [32,30,29,31,27,28,28] },
    { label: "Leads activos",     icon: "Users",        value: "46",        delta: 14,  spark: [22,28,30,35,40,42,46] },
  ];

  const kpisBot = [
    { label: "Clientes totales",  icon: "Users",         value: "184",            delta: 4, spark: [160,164,170,175,178,182,184] },
    { label: "Planes activos",    icon: "ShieldCheck",   value: "168",            delta: 5, spark: [150,154,158,162,164,166,168] },
    { label: "Prima mensual",     icon: "DollarSign",    value: "Gs. 88.4M",      delta: 6, spark: [70,72,76,78,82,85,88] },
    { label: "Comisión mensual",  icon: "CreditCard",    value: "Gs. 12.3M",      delta: 11, spark: [9,10,10,11,11,12,12] },
  ];

  const planDist = [
    { id: "sana",      planId: "sana",      count: 48, pct: 28.5 },
    { id: "confort",   planId: "confort",   count: 67, pct: 39.8 },
    { id: "excellent", planId: "excellent", count: 31, pct: 18.5 },
    { id: "adultos",   planId: "adultos",   count: 22, pct: 13.1 },
  ];

  const recientes = window.ACTIVIDADES.slice(0, 6);

  return (
    <>
      <Topbar
        title="Dashboard"
        right={<>
          <GlobalSearch />
          <button className="btn"><Icon name="Calendar" size={13} className="ic" />Mayo 2026</button>
          <button className="btn btn-icon" data-tip="Notificaciones"><Icon name="Bell" size={14} /></button>
        </>}
      />

      <div className="scroll-area">
        <div className="page">

          {/* Greeting */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Hola, {greet}</div>
              <div className="fg-3" style={{ fontSize: 13 }}>{today} · 8 tareas pendientes · 3 leads sin contactar</div>
            </div>
            <div className="hstack">
              <RolePill role={user.role} />
              <button className="btn btn-primary"><Icon name="Plus" size={13} className="ic" />Nuevo cliente</button>
            </div>
          </div>

          {/* Top KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            {kpisTop.map((k, i) => <KPI key={i} {...k} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {kpisBot.map((k, i) => <KPI key={i} {...k} />)}
          </div>

          {/* Renewal banner */}
          <div className="banner banner-warning" style={{ marginBottom: 20 }}>
            <Icon name="AlertTriangle" size={16} />
            <div style={{ flex: 1 }}>
              <span className="lbl"><b>3 planes vencen en los próximos 14 días</b></span>
              <span className="sub" style={{ marginLeft: 8 }}>Marlene Cantero, Hugo Villalba y Néstor Riveros — Gs. 2.445.000 en primas</span>
            </div>
            <button className="btn btn-sm" onClick={() => setRoute("planes")}>Ver detalle <Icon name="ChevronRight" size={12} className="ic" /></button>
          </div>

          {/* Pipeline */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-hd">
              <div>
                <div className="ttl">Pipeline de ventas</div>
                <div className="sub">70 oportunidades activas · Gs. 20.7M en negociación</div>
              </div>
              <div className="hstack">
                <Segmented options={[{ value: "mes", label: "Este mes" }, { value: "tri", label: "Trimestre" }, { value: "año", label: "Año" }]} value="mes" onChange={() => {}} />
              </div>
            </div>
            <div className="card-body">
              <div className="pipeline">
                {window.PIPELINE_STAGES.map((s, i) => {
                  const total = window.PIPELINE_STAGES.reduce((a, x) => a + x.count, 0);
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div key={s.id} className={`pipe-stage s-${i + 1}`}>
                      <div className="lbl">{s.label}</div>
                      <div className="val">{s.count}</div>
                      <div className="pct">{pct}% · {s.monto ? window.fmtGs(s.monto) : "—"}</div>
                      <div className="bar"><i style={{ width: `${pct * 3.5}%`, maxWidth: "100%" }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two-col: plan distribution + recent activity */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>

            {/* Plan distribution */}
            <div className="card">
              <div className="card-hd">
                <div className="ttl">Distribución de planes activos</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setRoute("planes")}>Ver todos <Icon name="ArrowRight" size={12} className="ic" /></button>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {planDist.map(p => {
                    const plan = window.planById(p.planId);
                    return (
                      <div key={p.id} style={{
                        padding: 14,
                        border: "1px solid var(--border)",
                        background: `linear-gradient(180deg, var(--plan-${plan.tone}-soft) 0%, transparent 100%)`,
                        borderRadius: "var(--r-md)",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `var(--plan-${plan.tone})` }} />
                        <div className="hstack" style={{ marginBottom: 6 }}>
                          <span className={`plan-dot plan-${plan.tone}`} />
                          <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>{plan.name}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.count}</div>
                        <div className="hstack" style={{ justifyContent: "space-between", marginTop: 4 }}>
                          <span className="fg-3" style={{ fontSize: 11 }}>{p.pct}% del total</span>
                          <span className="mono" style={{ fontSize: 11, color: `var(--plan-${plan.tone})` }}>{plan.comision}% com.</span>
                        </div>
                        <div className="progress" style={{ marginTop: 10, height: 4 }}>
                          <i style={{ width: `${p.pct * 2.5}%`, background: `var(--plan-${plan.tone})` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="card">
              <div className="card-hd">
                <div className="ttl">Actividad reciente</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setRoute("actividades")}>Ver todo <Icon name="ArrowRight" size={12} className="ic" /></button>
              </div>
              <div style={{ padding: "4px 0" }}>
                {recientes.map((a, i) => {
                  const cliente = window.clienteById(a.clienteId);
                  const ag = window.userById(a.agente);
                  const canal = window.CANALES[a.canal];
                  return (
                    <div key={a.id} style={{ padding: "10px 16px", borderBottom: i === recientes.length - 1 ? "none" : "1px solid var(--border-soft)", display: "flex", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: "var(--bg-3)",
                        display: "grid", placeItems: "center",
                        color: canal.color, flexShrink: 0,
                        border: "1px solid var(--border-soft)"
                      }}>
                        <Icon name={canal.ic} size={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cliente?.nombre}</div>
                          <span className="fg-3 mono" style={{ fontSize: 11 }}>{a.fecha}</span>
                        </div>
                        <div className="fg-2" style={{ fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.resumen}
                        </div>
                        <div className="hstack" style={{ marginTop: 4, fontSize: 11, color: "var(--fg-3)" }}>
                          <span>{canal.label}</span>
                          <span>·</span>
                          <span>{ag?.nombre}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.Dashboard = Dashboard;
