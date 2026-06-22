// screens-clientes.jsx

const { useState: useState_c, useMemo: useMemo_c } = React;

function Clientes({ user, density, setRoute }) {
  const [search, setSearch] = useState_c("");
  const [estadoFilter, setEstadoFilter] = useState_c("todos");
  const [planFilter, setPlanFilter] = useState_c("todos");
  const [agenteFilter, setAgenteFilter] = useState_c("todos");
  const [sort, setSort] = useState_c({ key: "nombre", dir: "asc" });
  const [selected, setSelected] = useState_c(new Set());
  const [detalle, setDetalle] = useState_c(null);
  const [showNuevo, setShowNuevo] = useState_c(false);
  const [showEmpty, setShowEmpty] = useState_c(false);

  const filtered = useMemo_c(() => {
    let list = window.CLIENTES.slice();
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.nombre.toLowerCase().includes(s) ||
        c.ci.includes(s) ||
        c.tel.includes(s) ||
        c.email.toLowerCase().includes(s)
      );
    }
    if (estadoFilter !== "todos") list = list.filter(c => c.estado === estadoFilter);
    if (planFilter !== "todos") list = list.filter(c => c.plan === planFilter);
    if (agenteFilter !== "todos") list = list.filter(c => c.agente === agenteFilter);

    list.sort((a, b) => {
      const A = a[sort.key], B = b[sort.key];
      const cmp = (A ?? "") < (B ?? "") ? -1 : (A ?? "") > (B ?? "") ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [search, estadoFilter, planFilter, agenteFilter, sort]);

  const onSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSel = selected.size > 0 && selected.size === filtered.length;
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map(c => c.id)));

  const displayList = showEmpty ? [] : filtered;

  return (
    <>
      <Topbar
        title="Clientes"
        right={<>
          <GlobalSearch />
          <button className="btn btn-icon" data-tip="Empty state demo" onClick={() => setShowEmpty(e => !e)}>
            <Icon name="Eye" size={14} />
          </button>
          <button className="btn"><Icon name="Download" size={13} className="ic" />Exportar</button>
          <button className="btn btn-primary" onClick={() => setShowNuevo(true)}><Icon name="Plus" size={13} className="ic" />Nuevo cliente</button>
        </>}
      />

      <div className="scroll-area">
        <div className="page">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Clientes</div>
              <div className="fg-3" style={{ fontSize: 13 }}>
                {filtered.length} de {window.CLIENTES.length} clientes · {filtered.filter(c => c.estado === "activo").length} activos
              </div>
            </div>
            <div className="hstack">
              <Segmented options={[
                { value: "todos", label: "Todos" },
                { value: "mios",  label: "Mi cartera" },
                { value: "fav",   label: "Favoritos" },
              ]} value="todos" onChange={() => {}} />
            </div>
          </div>

          {/* Table */}
          <div className={`tbl-wrap density-${density}`}>
            <div className="tbl-toolbar">
              <div className="left">
                <div className="input-with-icon" style={{ width: 280 }}>
                  <Icon name="Search" size={13} className="ic" />
                  <input
                    className="input"
                    placeholder="Buscar por nombre, CI, teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="dvd-v" />
                <select className="select" style={{ width: 130 }} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                  <option value="todos">Estado: todos</option>
                  <option value="activo">Activo</option>
                  <option value="cotizado">Cotizado</option>
                  <option value="negociacion">Negociación</option>
                  <option value="prospecto">Prospecto</option>
                  <option value="contactado">Contactado</option>
                  <option value="vencido">Vencido</option>
                </select>
                <select className="select" style={{ width: 130 }} value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                  <option value="todos">Plan: todos</option>
                  {window.PLAN_LIST.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {user.role !== "AGENTE" ? (
                  <select className="select" style={{ width: 150 }} value={agenteFilter} onChange={(e) => setAgenteFilter(e.target.value)}>
                    <option value="todos">Agente: todos</option>
                    {window.USERS.filter(u => u.role === "AGENTE").map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                ) : null}
              </div>
              <div className="right">
                {selected.size > 0 ? (
                  <>
                    <span className="fg-3" style={{ fontSize: 12 }}>{selected.size} seleccionados</span>
                    <button className="btn btn-sm"><Icon name="Mail" size={12} className="ic" />Email</button>
                    <button className="btn btn-sm"><Icon name="Trash" size={12} className="ic" />Archivar</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-ghost"><Icon name="Filter" size={12} className="ic" />Más filtros</button>
                )}
              </div>
            </div>

            {displayList.length === 0 ? (
              <Empty
                icon="Users"
                title="No hay clientes que coincidan"
                sub={showEmpty
                  ? "Probá importar tu cartera desde una planilla de Excel o agregar el primero manualmente. Una vez que cargues clientes vas a poder hacer seguimiento, generar cotizaciones y registrar pagos."
                  : "Ajustá los filtros o probá con otra búsqueda. También podés crear un nuevo cliente desde el botón arriba."}
                action={<div className="hstack" style={{ marginTop: 4 }}>
                  <button className="btn"><Icon name="Upload" size={13} className="ic" />Importar Excel</button>
                  <button className="btn btn-primary" onClick={() => setShowNuevo(true)}><Icon name="Plus" size={13} className="ic" />Nuevo cliente</button>
                </div>}
              />
            ) : (
              <>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="col-checkbox">
                        <input type="checkbox" className="chk" checked={allSel} onChange={toggleAll} />
                      </th>
                      <SortHeader active={sort.key === "nombre"} dir={sort.dir} onClick={() => onSort("nombre")}>Cliente</SortHeader>
                      <th>CI</th>
                      <th>Teléfono</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <SortHeader active={sort.key === "ultimoContacto"} dir={sort.dir} onClick={() => onSort("ultimoContacto")}>Último contacto</SortHeader>
                      {user.role !== "AGENTE" ? <th>Agente</th> : null}
                      <th className="col-actions">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map(c => {
                      const ag = window.userById(c.agente);
                      return (
                        <tr key={c.id} className={selected.has(c.id) ? "selected" : ""}>
                          <td className="col-checkbox">
                            <input type="checkbox" className="chk" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                          </td>
                          <td>
                            <div className="hstack" style={{ cursor: "pointer" }} onClick={() => setDetalle(c)}>
                              <Avatar name={c.nombre} size="sm" />
                              <div>
                                <div style={{ color: "var(--fg)", fontWeight: 500 }}>{c.nombre}</div>
                                <div className="fg-3" style={{ fontSize: 11.5 }}>{c.ciudad}</div>
                              </div>
                            </div>
                          </td>
                          <td className="mono fg-2">{c.ci}</td>
                          <td className="mono fg-2">{c.tel}</td>
                          <td>{c.plan ? <PlanChip planId={c.plan} /> : <span className="fg-3">—</span>}</td>
                          <td><EstadoBadge estado={c.estado} /></td>
                          <td className="fg-2">{c.ultimoContacto}</td>
                          {user.role !== "AGENTE" ? (
                            <td>
                              {ag ? (
                                <div className="hstack">
                                  <Avatar name={ag.nombre} size="sm" gradient={ag.color} />
                                  <span className="fg-2" style={{ fontSize: 12 }}>{ag.nombre.split(" ")[0]}</span>
                                </div>
                              ) : null}
                            </td>
                          ) : null}
                          <td className="col-actions">
                            <div className="hstack" style={{ justifyContent: "flex-end" }}>
                              <button className="btn btn-icon btn-sm btn-ghost" data-tip="WhatsApp" style={{ color: "var(--success)" }} onClick={() => setRoute("whatsapp")}><Icon name="MessageCircle" size={13} /></button>
                              <button className="btn btn-icon btn-sm btn-ghost" data-tip="Llamar"><Icon name="Phone" size={13} /></button>
                              <button className="btn btn-icon btn-sm btn-ghost" onClick={() => setDetalle(c)}><Icon name="MoreHorizontal" size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="tbl-foot">
                  <span>Mostrando {displayList.length} resultados</span>
                  <div className="hstack">
                    <button className="btn btn-sm btn-ghost"><Icon name="ChevronLeft" size={12} /></button>
                    <span className="mono fg-2" style={{ fontSize: 12 }}>1 / 1</span>
                    <button className="btn btn-sm btn-ghost"><Icon name="ChevronRight" size={12} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ClienteDetalle cliente={detalle} onClose={() => setDetalle(null)} setRoute={setRoute} />

      <Modal open={showNuevo} onClose={() => setShowNuevo(false)} title="Nuevo cliente" subtitle="Ingresá los datos básicos. Podrás completar el resto luego." size="md"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShowNuevo(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => setShowNuevo(false)}>Crear cliente</button>
        </>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "span 2" }}>
            <label className="label">Nombre completo</label>
            <input className="input" placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className="label">Cédula de identidad</label>
            <input className="input mono" placeholder="0.000.000" />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input className="input mono" placeholder="DD/MM/AAAA" />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input mono" placeholder="+595 9_ _ ___-____" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" placeholder="nombre@email.com" />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input className="input" placeholder="Asunción" />
          </div>
          <div>
            <label className="label">Origen del lead</label>
            <select className="select">
              <option>Facebook Ads</option>
              <option>Referido</option>
              <option>Sitio web</option>
              <option>WhatsApp</option>
              <option>Otro</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ClienteDetalle({ cliente, onClose, setRoute }) {
  const [tab, setTab] = useState_c("info");
  if (!cliente) return null;
  const plan = window.planById(cliente.plan);
  const ag = window.userById(cliente.agente);
  const acts = window.ACTIVIDADES.filter(a => a.clienteId === cliente.id);

  return (
    <SidePanel
      open={!!cliente}
      onClose={onClose}
      title={cliente.nombre}
      subtitle={`${cliente.ciudad} · CI ${cliente.ci}`}
      actions={
        <>
          <button className="btn btn-icon btn-sm btn-ghost" data-tip="Editar"><Icon name="Edit" size={13} /></button>
          <button className="btn btn-icon btn-sm btn-ghost" data-tip="Más"><Icon name="MoreVertical" size={13} /></button>
        </>
      }
    >
      <div style={{ padding: "16px 18px 0" }}>
        {/* Hero */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
          <Avatar name={cliente.nombre} size="xl" />
          <div style={{ flex: 1 }}>
            <div className="hstack" style={{ marginBottom: 4 }}>
              <EstadoBadge estado={cliente.estado} />
              {plan ? <PlanChip planId={cliente.plan} /> : null}
            </div>
            <div className="title-md">{cliente.nombre}</div>
            <div className="fg-3" style={{ fontSize: 12 }}>
              Cliente desde {cliente.inicio !== "—" ? cliente.inicio : "—"} · {cliente.beneficiarios} beneficiario{cliente.beneficiarios === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Quick contact */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
          <button className="btn" onClick={() => setRoute("whatsapp")} style={{ color: "var(--success)" }}>
            <Icon name="MessageCircle" size={13} />WhatsApp
          </button>
          <button className="btn" onClick={() => setRoute("messenger")} style={{ color: "var(--info)" }}>
            <Icon name="MessageSquare" size={13} />Messenger
          </button>
          <button className="btn"><Icon name="Phone" size={13} />Llamar</button>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "info",         label: "Información" },
            { value: "beneficiarios",label: "Beneficiarios", count: cliente.beneficiarios },
            { value: "planes",       label: "Planes" },
            { value: "actividad",    label: "Actividad",     count: acts.length },
          ]}
        />
      </div>

      <div style={{ padding: 18 }}>
        {tab === "info" ? (
          <div className="vstack" style={{ gap: 16 }}>
            <InfoBlock title="Datos personales">
              <InfoRow lbl="Cédula"    val={<span className="mono">{cliente.ci}</span>} />
              <InfoRow lbl="Teléfono"  val={<span className="mono">{cliente.tel}</span>} icon="Phone" />
              <InfoRow lbl="Email"     val={cliente.email} icon="Mail" />
              <InfoRow lbl="Ciudad"    val={cliente.ciudad} icon="MapPin" />
            </InfoBlock>

            <InfoBlock title="Cuenta">
              <InfoRow lbl="Agente asignado" val={ag ? <div className="hstack"><Avatar name={ag.nombre} size="sm" gradient={ag.color} /><span>{ag.nombre}</span></div> : "—"} />
              <InfoRow lbl="Origen" val="Facebook Ads" />
              <InfoRow lbl="Último contacto" val={cliente.ultimoContacto} icon="Clock" />
            </InfoBlock>

            <InfoBlock title="Plan activo">
              {plan ? (
                <div style={{ padding: 12, background: `var(--plan-${plan.tone}-soft)`, border: `1px solid var(--border-soft)`, borderLeft: `2px solid var(--plan-${plan.tone})`, borderRadius: "var(--r-md)" }}>
                  <div className="hstack" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{plan.name}</div>
                      <div className="fg-3" style={{ fontSize: 11.5, marginTop: 2 }}>Vigencia: {cliente.inicio} → {cliente.fin}</div>
                    </div>
                    <div className="mono" style={{ fontSize: 16, color: `var(--plan-${plan.tone})` }}>{window.fmtGs(cliente.prima)}</div>
                  </div>
                </div>
              ) : <div className="fg-3" style={{ fontSize: 13 }}>Sin plan contratado</div>}
            </InfoBlock>
          </div>
        ) : null}

        {tab === "beneficiarios" ? (
          <div className="vstack" style={{ gap: 8 }}>
            {Array.from({ length: cliente.beneficiarios || 0 }).map((_, i) => (
              <div key={i} style={{ padding: 12, border: "1px solid var(--border-soft)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={`B${i+1}`} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{["Cónyuge","Hijo/a","Hijo/a","Padre/Madre","Hijo/a"][i] || "Beneficiario"}</div>
                  <div className="fg-3" style={{ fontSize: 11.5 }}>CI {Math.floor(Math.random()*9000000 + 1000000).toLocaleString("es-PY")}</div>
                </div>
                <button className="btn btn-sm btn-ghost btn-icon"><Icon name="MoreHorizontal" size={13} /></button>
              </div>
            ))}
            {cliente.beneficiarios === 0 ? (
              <div className="fg-3" style={{ fontSize: 13, textAlign: "center", padding: 24 }}>Sin beneficiarios registrados</div>
            ) : null}
            <button className="btn" style={{ marginTop: 6 }}><Icon name="Plus" size={13} className="ic" />Agregar beneficiario</button>
          </div>
        ) : null}

        {tab === "planes" ? (
          <div className="vstack" style={{ gap: 10 }}>
            {plan ? (
              <div className="card" style={{ borderLeft: `2px solid var(--plan-${plan.tone})` }}>
                <div className="card-pad">
                  <div className="hstack" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{plan.name}</div>
                      <div className="fg-3" style={{ fontSize: 11.5 }}>Vigente</div>
                    </div>
                    <Badge variant="success" dot>Activo</Badge>
                  </div>
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div className="fg-3" style={{ fontSize: 11 }}>Prima</div><div className="mono">{window.fmtGs(cliente.prima)}</div></div>
                    <div><div className="fg-3" style={{ fontSize: 11 }}>Comisión</div><div className="mono">{plan.comision}%</div></div>
                    <div><div className="fg-3" style={{ fontSize: 11 }}>Inicio</div><div className="mono">{cliente.inicio}</div></div>
                    <div><div className="fg-3" style={{ fontSize: 11 }}>Fin</div><div className="mono">{cliente.fin}</div></div>
                  </div>
                </div>
              </div>
            ) : <div className="fg-3" style={{ fontSize: 13, textAlign: "center", padding: 24 }}>Sin planes contratados</div>}
            <button className="btn"><Icon name="Plus" size={13} className="ic" />Contratar nuevo plan</button>
          </div>
        ) : null}

        {tab === "actividad" ? (
          <div className="vstack" style={{ gap: 0 }}>
            {acts.length === 0 ? <div className="fg-3" style={{ fontSize: 13, textAlign: "center", padding: 24 }}>Sin actividad registrada</div> : null}
            {acts.map(a => {
              const canal = window.CANALES[a.canal];
              return (
                <div key={a.id} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--bg-3)", display: "grid", placeItems: "center", color: canal.color, flexShrink: 0 }}>
                    <Icon name={canal.ic} size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="hstack" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{canal.label}</span>
                      <span className="fg-3 mono" style={{ fontSize: 11 }}>{a.fecha}</span>
                    </div>
                    <div className="fg-2" style={{ fontSize: 12.5, marginTop: 2 }}>{a.resumen}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </SidePanel>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div>
      <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 }}>{title}</div>
      <div className="vstack" style={{ gap: 1, background: "var(--bg-1)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 4 }}>
        {children}
      </div>
    </div>
  );
}
function InfoRow({ lbl, val, icon }) {
  return (
    <div style={{ display: "flex", padding: "8px 10px", alignItems: "center", gap: 10 }}>
      <span className="fg-3" style={{ fontSize: 12, width: 130, display: "flex", alignItems: "center", gap: 6 }}>
        {icon ? <Icon name={icon} size={12} /> : null}{lbl}
      </span>
      <span style={{ fontSize: 13, color: "var(--fg)", flex: 1 }}>{val}</span>
    </div>
  );
}

window.Clientes = Clientes;
