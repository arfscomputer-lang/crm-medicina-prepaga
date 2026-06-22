// screens-planes.jsx, screens-catalogo.jsx, screens-comisiones.jsx combined

const { useState: useS_pc, useMemo: useM_pc } = React;

// ─── PLANES ────────────────────────────────────────────────────────────
function Planes({ user, density, setRoute }) {
  const [tierFilter, setTierFilter] = useS_pc("todos");
  const [estadoFilter, setEstadoFilter] = useS_pc("todos");
  const [search, setSearch] = useS_pc("");
  const [showNuevo, setShowNuevo] = useS_pc(false);

  // build plan rows from active clients
  const todayMs = new Date("2026-05-26").getTime();
  const rows = window.CLIENTES.filter(c => c.plan && c.estado !== "prospecto" && c.estado !== "contactado" && c.estado !== "cotizado" && c.estado !== "negociacion").map(c => {
    const p = window.planById(c.plan);
    const finMs = c.fin && c.fin !== "—" ? new Date(c.fin).getTime() : null;
    const dias = finMs ? Math.round((finMs - todayMs) / (1000 * 60 * 60 * 24)) : null;
    return {
      id: c.id,
      cliente: c.nombre,
      ci: c.ci,
      plan: c.plan,
      tier: p.tier,
      prima: c.prima,
      comision: Math.round(c.prima * p.comision / 100),
      pct: p.comision,
      inicio: c.inicio,
      fin: c.fin,
      estado: c.estado,
      dias,
      agente: c.agente,
    };
  });

  const filtered = useM_pc(() => {
    let r = rows.slice();
    if (search) r = r.filter(x => x.cliente.toLowerCase().includes(search.toLowerCase()) || x.ci.includes(search));
    if (tierFilter !== "todos") r = r.filter(x => x.plan === tierFilter);
    if (estadoFilter !== "todos") {
      if (estadoFilter === "porvencer") r = r.filter(x => x.dias != null && x.dias < 30 && x.dias > 0);
      else r = r.filter(x => x.estado === estadoFilter);
    }
    r.sort((a, b) => (a.dias ?? 9999) - (b.dias ?? 9999));
    return r;
  }, [rows, search, tierFilter, estadoFilter]);

  return (
    <>
      <Topbar
        title="Planes"
        right={<>
          <GlobalSearch />
          <button className="btn"><Icon name="Download" size={13} className="ic" />Exportar</button>
          <button className="btn btn-primary" onClick={() => setShowNuevo(true)}><Icon name="Plus" size={13} className="ic" />Contratar plan</button>
        </>}
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Planes contratados</div>
              <div className="fg-3" style={{ fontSize: 13 }}>{rows.length} planes activos · {rows.filter(x => x.dias != null && x.dias < 30 && x.dias > 0).length} por vencer en menos de 30 días</div>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {window.PLAN_LIST.map(p => {
              const c = rows.filter(r => r.plan === p.id);
              const total = c.reduce((a, x) => a + x.prima, 0);
              return (
                <div key={p.id} className="card" style={{ padding: 14, borderTop: `2px solid var(--plan-${p.tone})` }}>
                  <div className="hstack" style={{ marginBottom: 6 }}>
                    <span className={`plan-dot plan-${p.tone}`} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>{c.length}</div>
                  <div className="fg-3" style={{ fontSize: 11, marginTop: 4 }}>{window.fmtGs(total)} en primas</div>
                </div>
              );
            })}
          </div>

          <div className={`tbl-wrap density-${density}`}>
            <div className="tbl-toolbar">
              <div className="left">
                <div className="input-with-icon" style={{ width: 280 }}>
                  <Icon name="Search" size={13} className="ic" />
                  <input className="input" placeholder="Buscar por cliente o CI..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select" style={{ width: 150 }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
                  <option value="todos">Tier: todos</option>
                  {window.PLAN_LIST.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="select" style={{ width: 170 }} value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                  <option value="todos">Estado: todos</option>
                  <option value="activo">Activos</option>
                  <option value="vencido">Vencidos</option>
                  <option value="porvencer">Por vencer (&lt;30d)</option>
                </select>
              </div>
            </div>

            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan</th>
                  <th className="num">Prima mensual</th>
                  <th className="num">Comisión</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Renovación</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const p = window.planById(r.plan);
                  const urgent = r.dias != null && r.dias < 30 && r.dias > 0;
                  const expired = r.estado === "vencido";
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="hstack">
                          <Avatar name={r.cliente} size="sm" />
                          <div>
                            <div style={{ fontWeight: 500 }}>{r.cliente}</div>
                            <div className="fg-3 mono" style={{ fontSize: 11 }}>{r.ci}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="hstack">
                          <span className={`plan-dot plan-${p.tone}`} />
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                            <div className="fg-3" style={{ fontSize: 11 }}>{p.tier}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num">{window.fmtGs(r.prima)}</td>
                      <td className="num"><span style={{ color: `var(--plan-${p.tone})` }}>{window.fmtGs(r.comision)}</span> <span className="fg-3" style={{ fontSize: 11 }}>({r.pct}%)</span></td>
                      <td className="mono fg-2">{r.inicio}</td>
                      <td className="mono fg-2">{r.fin}</td>
                      <td><EstadoBadge estado={r.estado} /></td>
                      <td>
                        {expired ? (
                          <Badge variant="error" dot>Vencido hace {Math.abs(r.dias || 0)}d</Badge>
                        ) : urgent ? (
                          <Badge variant="warning" dot>En {r.dias} días</Badge>
                        ) : (
                          <span className="fg-3 mono" style={{ fontSize: 12 }}>En {r.dias}d</span>
                        )}
                      </td>
                      <td className="col-actions">
                        <button className="btn btn-icon btn-sm btn-ghost"><Icon name="MoreHorizontal" size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={showNuevo} onClose={() => setShowNuevo(false)} title="Contratar nuevo plan" size="lg"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShowNuevo(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => setShowNuevo(false)}>Generar contrato</button>
        </>}>
        <NuevoPlanForm />
      </Modal>
    </>
  );
}

function NuevoPlanForm() {
  const [planId, setPlanId] = useS_pc("confort");
  const [benef, setBenef] = useS_pc(2);
  const [meses, setMeses] = useS_pc(12);
  const plan = window.planById(planId);
  const primaTotal = plan.prima * (1 + benef * 0.35);
  const comisionTotal = Math.round(primaTotal * plan.comision / 100);

  return (
    <div className="vstack" style={{ gap: 16 }}>
      <div>
        <label className="label">Cliente</label>
        <select className="select">
          {window.CLIENTES.filter(c => !c.plan).map(c => <option key={c.id}>{c.nombre} — CI {c.ci}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Plan</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {window.PLAN_LIST.map(p => (
            <button
              key={p.id}
              onClick={() => setPlanId(p.id)}
              className="btn"
              style={{
                height: "auto", padding: "12px 14px", justifyContent: "flex-start", textAlign: "left",
                background: planId === p.id ? `var(--plan-${p.tone}-soft)` : "var(--bg-1)",
                borderColor: planId === p.id ? `var(--plan-${p.tone})` : "var(--border-soft)",
                borderLeft: `2px solid var(--plan-${p.tone})`,
                color: "var(--fg)",
                flexDirection: "column", alignItems: "flex-start", gap: 4
              }}
            >
              <div className="hstack">
                <span className={`plan-dot plan-${p.tone}`} />
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span className="badge badge-neutral" style={{ marginLeft: "auto" }}>{p.tier}</span>
              </div>
              <div className="fg-3" style={{ fontSize: 11.5 }}>Desde {window.fmtGs(p.prima)} · {p.comision}% comisión</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label className="label">Beneficiarios adicionales</label>
          <input className="input mono" type="number" value={benef} onChange={e => setBenef(+e.target.value)} min={0} max={6} />
        </div>
        <div>
          <label className="label">Duración (meses)</label>
          <select className="select" value={meses} onChange={e => setMeses(+e.target.value)}>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
            <option value={24}>24 meses</option>
          </select>
        </div>
      </div>

      {/* Calculator card */}
      <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 14 }}>
        <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, fontWeight: 500 }}>Cálculo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            <div className="fg-3" style={{ fontSize: 11 }}>Prima mensual</div>
            <div className="mono" style={{ fontSize: 18 }}>{window.fmtGs(primaTotal)}</div>
          </div>
          <div>
            <div className="fg-3" style={{ fontSize: 11 }}>Total contrato</div>
            <div className="mono" style={{ fontSize: 18 }}>{window.fmtGs(primaTotal * meses)}</div>
          </div>
          <div>
            <div className="fg-3" style={{ fontSize: 11 }}>Tu comisión mensual</div>
            <div className="mono" style={{ fontSize: 18, color: `var(--plan-${plan.tone})` }}>{window.fmtGs(comisionTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CATÁLOGO ──────────────────────────────────────────────────────────
function Catalogo() {
  const [selected, setSelected] = useS_pc(["sana", "confort", "excellent"]);
  const [showCompare, setShowCompare] = useS_pc(false);
  const [expanded, setExpanded] = useS_pc(null);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 3 ? [...s, id] : s);

  return (
    <>
      <Topbar
        title="Catálogo EBSA"
        right={<>
          <GlobalSearch />
          <button className="btn" disabled={selected.length < 2} onClick={() => setShowCompare(true)}>
            <Icon name="Layers" size={13} className="ic" />
            Comparar ({selected.length})
          </button>
        </>}
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Planes EBSA</div>
              <div className="fg-3" style={{ fontSize: 13 }}>4 planes vigentes · Comisiones del 12% al 18%</div>
            </div>
            <div className="hstack">
              <span className="fg-3" style={{ fontSize: 12 }}>Seleccioná hasta 3 planes para comparar</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {window.PLAN_LIST.map(p => {
              const isSel = selected.includes(p.id);
              const isExp = expanded === p.id;
              return (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    borderTop: `3px solid var(--plan-${p.tone})`,
                    background: `linear-gradient(180deg, var(--plan-${p.tone}-soft) 0%, var(--bg-2) 120px)`,
                  }}
                >
                  <div style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <div className="hstack" style={{ marginBottom: 6 }}>
                          <span className="badge" style={{ background: `var(--plan-${p.tone}-soft)`, color: `var(--plan-${p.tone})`, border: `1px solid var(--plan-${p.tone})` }}>
                            {p.tier}
                          </span>
                          <span className="badge badge-neutral mono">{p.comision}% comisión</span>
                        </div>
                        <div className="title-lg" style={{ marginBottom: 2 }}>{p.name}</div>
                        <div className="fg-2" style={{ fontSize: 13 }}>{p.tagline}</div>
                      </div>
                      <label className="hstack" style={{ cursor: "pointer", flexShrink: 0 }}>
                        <input type="checkbox" className="chk" checked={isSel} onChange={() => toggle(p.id)} />
                      </label>
                    </div>

                    {/* Price */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "12px 0", borderTop: "1px solid var(--border-soft)", borderBottom: "1px solid var(--border-soft)" }}>
                      <span className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Desde</span>
                      <span className="mono" style={{ fontSize: 24, fontWeight: 500, color: `var(--plan-${p.tone})`, letterSpacing: "-0.02em" }}>{window.fmtGs(p.prima)}</span>
                      <span className="fg-3" style={{ fontSize: 12 }}>/ mes · titular</span>
                    </div>

                    {/* Coverage preview */}
                    <div style={{ marginTop: 14 }}>
                      <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 }}>Coberturas principales</div>
                      <div className="vstack" style={{ gap: 6 }}>
                        {window.COVERAGES.slice(0, isExp ? window.COVERAGES.length : 5).map(cov => (
                          <div key={cov.id} className="hstack" style={{ fontSize: 12.5, justifyContent: "space-between", padding: "4px 0" }}>
                            <span className="fg-2">{cov.label}</span>
                            <span style={{ color: cov[p.id] === "—" ? "var(--fg-3)" : cov[p.id] === "✓" ? `var(--plan-${p.tone})` : "var(--fg-1)" }}>{cov[p.id]}</span>
                          </div>
                        ))}
                      </div>
                      <button className="link" style={{ background: "transparent", border: 0, padding: "8px 0 0", fontSize: 12 }} onClick={() => setExpanded(isExp ? null : p.id)}>
                        {isExp ? "Ver menos" : `Ver las ${window.COVERAGES.length} coberturas`} <Icon name={isExp ? "ChevronUp" : "ChevronDown"} size={11} />
                      </button>
                    </div>

                    <div className="hstack" style={{ marginTop: 16, gap: 6 }}>
                      <button className="btn" style={{ flex: 1 }}><Icon name="Download" size={13} className="ic" />Folleto PDF</button>
                      <button className="btn btn-primary" style={{ flex: 1 }}><Icon name="Plus" size={13} className="ic" />Cotizar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={showCompare} onClose={() => setShowCompare(false)} title="Comparador de planes" subtitle={`Comparando ${selected.length} planes`} size="xl">
        <table className="tbl" style={{ borderRadius: 8, overflow: "hidden" }}>
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Cobertura</th>
              {selected.map(id => {
                const p = window.planById(id);
                return <th key={id} style={{ borderTop: `2px solid var(--plan-${p.tone})` }}>
                  <div className="hstack"><span className={`plan-dot plan-${p.tone}`} />{p.name}</div>
                </th>;
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prima</td>
              {selected.map(id => {
                const p = window.planById(id);
                return <td key={id} className="mono" style={{ fontWeight: 500, color: `var(--plan-${p.tone})` }}>{window.fmtGs(p.prima)}/mes</td>;
              })}
            </tr>
            <tr>
              <td className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Comisión</td>
              {selected.map(id => <td key={id} className="mono">{window.planById(id).comision}%</td>)}
            </tr>
            {window.COVERAGES.map(cov => (
              <tr key={cov.id}>
                <td className="fg-2">{cov.label}</td>
                {selected.map(id => <td key={id}>{cov[id]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </>
  );
}

// ─── COMISIONES ────────────────────────────────────────────────────────
function Comisiones({ user, density }) {
  const [mes, setMes] = useS_pc("2026-05");
  const [estado, setEstado] = useS_pc("todos");
  const [scope, setScope] = useS_pc(user.role === "AGENTE" ? "mias" : "equipo");

  const data = useM_pc(() => {
    let r = window.COMISIONES;
    if (scope === "mias") r = r.filter(c => c.agente === user.id);
    if (estado !== "todos") r = r.filter(c => c.estado === estado);
    return r;
  }, [scope, estado, user.id]);

  const totalGen = data.reduce((a, x) => a + x.monto, 0);
  const totalPen = data.filter(x => x.estado === "pendiente").reduce((a, x) => a + x.monto, 0);
  const totalPag = data.filter(x => x.estado === "pagado").reduce((a, x) => a + x.monto, 0);

  const maxBar = Math.max(...window.COMISIONES_HISTORICO.map(h => h.monto));

  return (
    <>
      <Topbar
        title="Comisiones"
        right={<>
          <GlobalSearch />
          <button className="btn"><Icon name="Download" size={13} className="ic" />Descargar liquidación</button>
        </>}
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Comisiones</div>
              <div className="fg-3" style={{ fontSize: 13 }}>
                {scope === "mias" ? "Mis comisiones" : "Comisiones del equipo"} · Mayo 2026
              </div>
            </div>
            <div className="hstack">
              {user.role !== "AGENTE" ? (
                <Segmented options={[{ value: "mias", label: "Mías" }, { value: "equipo", label: "Equipo" }]} value={scope} onChange={setScope} />
              ) : null}
              <select className="select" style={{ width: 140 }} value={mes} onChange={e => setMes(e.target.value)}>
                <option value="2026-05">Mayo 2026</option>
                <option value="2026-04">Abril 2026</option>
                <option value="2026-03">Marzo 2026</option>
                <option value="2026-02">Febrero 2026</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            <div className="card card-pad-lg">
              <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Generado</div>
              <div className="mono" style={{ fontSize: 28, marginTop: 6, letterSpacing: "-0.02em" }}>{window.fmtGs(totalGen)}</div>
              <div className="hstack" style={{ marginTop: 6 }}>
                <span className="kpi-trend up"><Icon name="ArrowUp" size={11} stroke={2.4} />11%</span>
                <span className="fg-3" style={{ fontSize: 11 }}>vs Abril 2026</span>
              </div>
            </div>
            <div className="card card-pad-lg" style={{ borderLeft: "2px solid var(--warning)" }}>
              <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Pendiente de cobro</div>
              <div className="mono" style={{ fontSize: 28, marginTop: 6, letterSpacing: "-0.02em", color: "var(--warning)" }}>{window.fmtGs(totalPen)}</div>
              <div className="fg-3" style={{ fontSize: 11, marginTop: 6 }}>{data.filter(d => d.estado === "pendiente").length} pólizas · Liquidación 30 jun</div>
            </div>
            <div className="card card-pad-lg" style={{ borderLeft: "2px solid var(--success)" }}>
              <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Pagado</div>
              <div className="mono" style={{ fontSize: 28, marginTop: 6, letterSpacing: "-0.02em", color: "var(--success)" }}>{window.fmtGs(totalPag)}</div>
              <div className="fg-3" style={{ fontSize: 11, marginTop: 6 }}>{data.filter(d => d.estado === "pagado").length} pólizas acreditadas</div>
            </div>
          </div>

          {/* Chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-hd">
              <div>
                <div className="ttl">Histórico últimos 6 meses</div>
                <div className="sub">Comisiones generadas por mes</div>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: 30 }}>
              <div className="bar-chart" style={{ height: 160 }}>
                {window.COMISIONES_HISTORICO.map((h, i) => {
                  const pct = (h.monto / maxBar) * 100;
                  const isLast = i === window.COMISIONES_HISTORICO.length - 1;
                  return (
                    <div key={h.mes} className="bar" style={{
                      height: `${pct}%`,
                      background: isLast ? "var(--accent-soft)" : "var(--bg-3)",
                      borderColor: isLast ? "var(--accent-line)" : "var(--border-soft)",
                    }}>
                      <span className="v">{(h.monto / 1_000_000).toFixed(1)}M</span>
                      <span className="lbl">{h.mes}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className={`tbl-wrap density-${density}`}>
            <div className="tbl-toolbar">
              <div className="left">
                <Segmented options={[
                  { value: "todos", label: `Todas (${data.length})` },
                  { value: "pendiente", label: `Pendientes (${data.filter(d => d.estado === "pendiente").length})` },
                  { value: "pagado", label: `Pagadas (${data.filter(d => d.estado === "pagado").length})` },
                ]} value={estado} onChange={setEstado} />
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan</th>
                  <th className="num">Prima</th>
                  <th className="num">%</th>
                  <th className="num">Comisión</th>
                  <th>Período</th>
                  {user.role !== "AGENTE" && scope === "equipo" ? <th>Agente</th> : null}
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map(c => {
                  const cl = window.clienteById(c.clienteId);
                  const p = window.planById(c.plan);
                  const ag = window.userById(c.agente);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="hstack">
                          <Avatar name={cl.nombre} size="sm" />
                          <span style={{ fontWeight: 500 }}>{cl.nombre}</span>
                        </div>
                      </td>
                      <td><PlanChip planId={c.plan} /></td>
                      <td className="num">{window.fmtGs(c.prima)}</td>
                      <td className="num">{c.pct}%</td>
                      <td className="num"><span style={{ fontWeight: 500, color: `var(--plan-${p.tone})` }}>{window.fmtGs(c.monto)}</span></td>
                      <td className="mono fg-2">{c.periodo}</td>
                      {user.role !== "AGENTE" && scope === "equipo" ? (
                        <td>
                          {ag ? <div className="hstack"><Avatar name={ag.nombre} size="sm" gradient={ag.color} /><span style={{ fontSize: 12 }}>{ag.nombre.split(" ")[0]}</span></div> : null}
                        </td>
                      ) : null}
                      <td><EstadoBadge estado={c.estado} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="tbl-foot">
              <span>{data.length} comisiones · Total: <span className="mono" style={{ color: "var(--fg-1)" }}>{window.fmtGs(totalGen)}</span></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Planes, Catalogo, Comisiones });
