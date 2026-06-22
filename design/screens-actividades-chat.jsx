// screens-actividades-chat.jsx — Actividades, WhatsApp, Messenger

const { useState: useS_ac, useMemo: useM_ac, useRef: useR_ac, useEffect: useE_ac } = React;

// ─── ACTIVIDADES ────────────────────────────────────────────────────────
function Actividades({ user, density }) {
  const [canal, setCanal] = useS_ac("todos");
  const [agente, setAgente] = useS_ac("todos");
  const [showReg, setShowReg] = useS_ac(false);

  const items = useM_ac(() => {
    let r = window.ACTIVIDADES;
    if (canal !== "todos") r = r.filter(a => a.canal === canal);
    if (agente !== "todos") r = r.filter(a => a.agente === agente);
    return r;
  }, [canal, agente]);

  // group by day label
  const groups = {};
  items.forEach(a => {
    const key = a.fecha.startsWith("Hoy") ? "Hoy" :
                a.fecha.startsWith("Ayer") ? "Ayer" :
                a.fecha.startsWith("Hace 1") ? "Esta semana" :
                a.fecha.includes("días") ? "Más antiguo" : "Hoy";
    (groups[key] = groups[key] || []).push(a);
  });

  return (
    <>
      <Topbar
        title="Actividades"
        right={<>
          <GlobalSearch />
          <button className="btn btn-primary" onClick={() => setShowReg(true)}><Icon name="Plus" size={13} className="ic" />Registrar actividad</button>
        </>}
      />

      <div className="scroll-area">
        <div className="page page-narrow">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div className="title-xl" style={{ marginBottom: 4 }}>Actividades</div>
              <div className="fg-3" style={{ fontSize: 13 }}>{items.length} interacciones · Última actualización hace 4 min</div>
            </div>
          </div>

          {/* Filters */}
          <div className="hstack" style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <Segmented value={canal} onChange={setCanal} options={[
              { value: "todos", label: "Todos" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "messenger", label: "Messenger" },
              { value: "llamada", label: "Llamada" },
              { value: "email", label: "Email" },
              { value: "reunion", label: "Reunión" },
            ]} />
            {user.role !== "AGENTE" ? (
              <select className="select" style={{ width: 180 }} value={agente} onChange={e => setAgente(e.target.value)}>
                <option value="todos">Agente: todos</option>
                {window.USERS.filter(u => u.role === "AGENTE").map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            ) : null}
          </div>

          {/* Timeline */}
          <div className="card">
            {Object.entries(groups).map(([day, list], gi) => (
              <div key={day}>
                <div style={{ padding: "10px 16px", borderTop: gi === 0 ? "none" : "1px solid var(--border-soft)", borderBottom: "1px solid var(--border-soft)", background: "var(--bg-1)" }}>
                  <span className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{day}</span>
                  <span className="fg-3 mono" style={{ fontSize: 11, marginLeft: 8 }}>· {list.length}</span>
                </div>
                <div>
                  {list.map(a => {
                    const cliente = window.clienteById(a.clienteId);
                    const ag = window.userById(a.agente);
                    const cn = window.CANALES[a.canal];
                    return (
                      <div key={a.id} style={{ display: "flex", padding: "14px 16px", borderBottom: "1px solid var(--border-soft)", gap: 14 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9,
                            background: "var(--bg-3)",
                            border: "1px solid var(--border-soft)",
                            display: "grid", placeItems: "center",
                            color: cn.color
                          }}>
                            <Icon name={cn.ic} size={15} />
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 2 }}>
                            <div className="hstack">
                              <span style={{ fontWeight: 500, fontSize: 13.5 }}>{cliente?.nombre}</span>
                              <Badge variant="neutral">{cn.label}</Badge>
                            </div>
                            <span className="fg-3 mono" style={{ fontSize: 11 }}>{a.fecha}</span>
                          </div>
                          <div className="fg-1" style={{ fontSize: 13, lineHeight: 1.5 }}>{a.resumen}</div>
                          <div className="hstack" style={{ marginTop: 6 }}>
                            {ag ? <div className="hstack"><Avatar name={ag.nombre} size="sm" gradient={ag.color} /><span className="fg-3" style={{ fontSize: 11.5 }}>{ag.nombre}</span></div> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showReg} onClose={() => setShowReg(false)} title="Registrar actividad" size="md"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setShowReg(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => setShowReg(false)}>Guardar</button>
        </>}>
        <div className="vstack" style={{ gap: 14 }}>
          <div>
            <label className="label">Canal</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {Object.entries(window.CANALES).map(([id, c]) => (
                <button key={id} className="btn" style={{ flexDirection: "column", height: 60, gap: 4, color: c.color }}>
                  <Icon name={c.ic} size={16} />
                  <span style={{ fontSize: 11, color: "var(--fg-2)" }}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Cliente</label>
            <select className="select">
              {window.CLIENTES.map(c => <option key={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" style={{ minHeight: 100 }} placeholder="Resumen de la interacción..." />
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── CHAT CONSOLE (shared for WhatsApp + Messenger) ─────────────────────
function ChatConsole({ canalId }) {
  const canal = window.CANALES[canalId];
  const [activeId, setActiveId] = useS_ac("w1");
  const [draft, setDraft] = useS_ac("");
  const [showTemplates, setShowTemplates] = useS_ac(false);
  const [tab, setTab] = useS_ac("chats");
  const messagesRef = useR_ac(null);

  const conv = window.WA_CONVS.find(c => c.id === activeId);
  const cliente = conv ? window.clienteById(conv.clienteId) : null;

  useE_ac(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [activeId]);

  const sendDraft = () => {
    if (!draft.trim()) return;
    setDraft("");
  };

  return (
    <>
      <Topbar
        title={canal.label}
        right={<>
          <Segmented value={tab} onChange={setTab} options={[
            { value: "chats", label: `Chats (${window.WA_CONVS.length})` },
            { value: "campanas", label: "Campañas" },
            { value: "plantillas", label: "Plantillas" },
          ]} />
          <button className="btn btn-icon"><Icon name="Settings" size={14} /></button>
        </>}
      />

      {tab === "chats" ? (
        <div className="cv">
          {/* Conversations list */}
          <div className="cv-list">
            <div className="hd">
              <div className="input-with-icon">
                <Icon name="Search" size={13} className="ic" />
                <input className="input" placeholder="Buscar conversación..." />
              </div>
              <div className="hstack" style={{ marginTop: 10, justifyContent: "space-between" }}>
                <Segmented value="todos" onChange={() => {}} options={[
                  { value: "todos", label: "Todos" },
                  { value: "noleidos", label: "No leídos" },
                  { value: "mios", label: "Mis chats" },
                ]} />
              </div>
            </div>
            <div className="items">
              {window.WA_CONVS.map(c => {
                const cl = window.clienteById(c.clienteId);
                return (
                  <div key={c.id} className={"cv-item " + (activeId === c.id ? "active" : "")} onClick={() => setActiveId(c.id)}>
                    <Avatar name={cl?.nombre || "?"} />
                    <div className="meta">
                      <div className="top">
                        <span className="nm">{cl?.nombre}</span>
                        <span className="tm">{c.time}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span className="preview" style={{ flex: 1 }}>{c.last}</span>
                        {c.unread > 0 ? <span className="unread">{c.unread}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thread */}
          <div className="cv-thread">
            {cliente ? (
              <>
                <div className="cv-thread-hd">
                  <Avatar name={cliente.nombre} />
                  <div style={{ flex: 1 }}>
                    <div className="hstack">
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{cliente.nombre}</span>
                      <Badge variant="neutral" dot={false}>
                        <Icon name={canal.ic} size={11} style={{ color: canal.color }} /> {canal.label}
                      </Badge>
                    </div>
                    <div className="fg-3 mono" style={{ fontSize: 11.5 }}>{cliente.tel}</div>
                  </div>
                  <div className="hstack">
                    <button className="btn btn-sm"><Icon name="Phone" size={12} className="ic" />Llamar</button>
                    <button className="btn btn-sm btn-icon" data-tip="Más"><Icon name="MoreVertical" size={13} /></button>
                  </div>
                </div>

                <div className="cv-messages" ref={messagesRef}>
                  <div className="cv-day">HOY · 26 DE MAYO</div>
                  {window.WA_THREAD.map((m, i) => (
                    <div key={i} className={"cv-msg " + m.who} style={{ animation: `fade-up 200ms ease-out ${i * 30}ms backwards` }}>
                      {m.text}
                      <span className="tm">{m.tm}</span>
                    </div>
                  ))}
                </div>

                {showTemplates ? (
                  <div style={{ borderTop: "1px solid var(--border-soft)", padding: 12, background: "var(--bg-1)", maxHeight: 200, overflowY: "auto" }}>
                    <div className="hstack" style={{ marginBottom: 8, justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Plantillas guardadas</span>
                      <button className="btn btn-sm btn-ghost btn-icon" onClick={() => setShowTemplates(false)}><Icon name="X" size={12} /></button>
                    </div>
                    <div className="vstack" style={{ gap: 6 }}>
                      {window.WA_TEMPLATES.map(t => (
                        <button key={t.id} className="btn" style={{ flexDirection: "column", alignItems: "flex-start", height: "auto", padding: "8px 10px", textAlign: "left", gap: 4 }} onClick={() => { setDraft(t.body); setShowTemplates(false); }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{t.titulo}</span>
                          <span className="fg-3" style={{ fontSize: 11, fontWeight: 400, whiteSpace: "normal", lineHeight: 1.4 }}>{t.body}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="cv-composer">
                  <button className="btn btn-icon btn-ghost" data-tip="Adjuntar"><Icon name="Paperclip" size={15} /></button>
                  <button className="btn btn-icon btn-ghost" data-tip="Plantillas" onClick={() => setShowTemplates(s => !s)} style={{ color: showTemplates ? "var(--accent)" : "" }}><Icon name="Sparkles" size={15} /></button>
                  <textarea
                    className="input"
                    placeholder={`Escribir mensaje por ${canal.label}...`}
                    style={{ minHeight: 38, maxHeight: 100, padding: "8px 10px", flex: 1 }}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDraft(); } }}
                  />
                  <button className="btn btn-primary btn-icon" onClick={sendDraft} disabled={!draft.trim()}><Icon name="Send" size={14} /></button>
                </div>
              </>
            ) : null}
          </div>

          {/* Side */}
          <div className="cv-side">
            {cliente ? (
              <div className="vstack" style={{ gap: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <Avatar name={cliente.nombre} size="xl" />
                  <div style={{ fontWeight: 500, fontSize: 14, marginTop: 10 }}>{cliente.nombre}</div>
                  <div className="fg-3" style={{ fontSize: 12 }}>{cliente.ciudad}</div>
                  <div className="hstack" style={{ justifyContent: "center", marginTop: 8 }}>
                    <EstadoBadge estado={cliente.estado} />
                    {cliente.plan ? <PlanChip planId={cliente.plan} /> : null}
                  </div>
                </div>

                <div className="dvd" />

                <div className="vstack" style={{ gap: 8 }}>
                  <div className="hstack"><Icon name="Phone" size={12} className="fg-3" /><span className="mono fg-2" style={{ fontSize: 12 }}>{cliente.tel}</span></div>
                  <div className="hstack"><Icon name="Mail" size={12} className="fg-3" /><span className="fg-2" style={{ fontSize: 12 }}>{cliente.email}</span></div>
                  <div className="hstack"><Icon name="MapPin" size={12} className="fg-3" /><span className="fg-2" style={{ fontSize: 12 }}>{cliente.ciudad}</span></div>
                </div>

                <div className="dvd" />

                <div>
                  <div className="fg-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontWeight: 500 }}>Sugerencias</div>
                  <div className="vstack" style={{ gap: 6 }}>
                    <button className="btn" style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="FileText" size={13} className="ic" />Enviar cotización Confort</button>
                    <button className="btn" style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="Calendar" size={13} className="ic" />Agendar reunión</button>
                    <button className="btn" style={{ width: "100%", justifyContent: "flex-start" }}><Icon name="CheckCircle" size={13} className="ic" />Marcar como ganado</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : tab === "campanas" ? (
        <CampanasPanel canalId={canalId} />
      ) : (
        <PlantillasPanel canalId={canalId} />
      )}
    </>
  );
}

function CampanasPanel({ canalId }) {
  const [tplId, setTplId] = useS_ac("t1");
  const [selected, setSelected] = useS_ac(new Set(window.CLIENTES.filter(c => c.estado === "prospecto" || c.estado === "contactado").map(c => c.id)));
  const tpl = window.WA_TEMPLATES.find(t => t.id === tplId);
  const canal = window.CANALES[canalId];

  return (
    <div className="scroll-area">
      <div className="page page-narrow">
        <div style={{ marginBottom: 20 }}>
          <div className="title-xl" style={{ marginBottom: 4 }}>Campaña masiva</div>
          <div className="fg-3" style={{ fontSize: 13 }}>Enviá un mensaje a múltiples contactos por {canal.label}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          {/* Left: contacts */}
          <div className="card">
            <div className="card-hd">
              <div>
                <div className="ttl">Destinatarios</div>
                <div className="sub">{selected.size} de {window.CLIENTES.length} seleccionados</div>
              </div>
              <div className="hstack">
                <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set(window.CLIENTES.map(c => c.id)))}>Seleccionar todos</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>Limpiar</button>
              </div>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {window.CLIENTES.map(c => {
                const isSel = selected.has(c.id);
                return (
                  <label key={c.id} style={{ display: "flex", gap: 10, padding: "8px 16px", borderBottom: "1px solid var(--border-soft)", cursor: "pointer", alignItems: "center" }}>
                    <input type="checkbox" className="chk" checked={isSel} onChange={() => setSelected(s => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} />
                    <Avatar name={c.nombre} size="sm" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.nombre}</div>
                      <div className="fg-3 mono" style={{ fontSize: 11 }}>{c.tel}</div>
                    </div>
                    <EstadoBadge estado={c.estado} />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right: template + send */}
          <div className="vstack" style={{ gap: 14 }}>
            <div className="card">
              <div className="card-hd">
                <div className="ttl">Plantilla</div>
              </div>
              <div className="card-body">
                <select className="select" value={tplId} onChange={e => setTplId(e.target.value)}>
                  {window.WA_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
                <div style={{ marginTop: 12, padding: 12, background: "var(--bg-1)", borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: "var(--fg-1)", border: "1px solid var(--border-soft)" }}>
                  {tpl?.body}
                </div>
                <div className="fg-3" style={{ fontSize: 11.5, marginTop: 8 }}>Las variables <span className="mono">{"{{nombre}}"}</span>, <span className="mono">{"{{plan}}"}</span>, etc. se reemplazan por contacto.</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="fg-2" style={{ fontSize: 12 }}>Mensajes a enviar</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{selected.size}</span>
                </div>
                <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="fg-2" style={{ fontSize: 12 }}>Costo estimado</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{window.fmtGs(selected.size * 250)}</span>
                </div>
                <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                  <span className="fg-2" style={{ fontSize: 12 }}>Tiempo estimado</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{Math.ceil(selected.size / 12)} min</span>
                </div>
                <button className="btn btn-primary" style={{ width: "100%" }} disabled={selected.size === 0}>
                  <Icon name="Send" size={13} className="ic" />Enviar campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlantillasPanel({ canalId }) {
  return (
    <div className="scroll-area">
      <div className="page page-narrow">
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div className="title-xl" style={{ marginBottom: 4 }}>Plantillas</div>
            <div className="fg-3" style={{ fontSize: 13 }}>{window.WA_TEMPLATES.length} plantillas aprobadas</div>
          </div>
          <button className="btn btn-primary"><Icon name="Plus" size={13} className="ic" />Nueva plantilla</button>
        </div>

        <div className="vstack" style={{ gap: 10 }}>
          {window.WA_TEMPLATES.map(t => (
            <div key={t.id} className="card card-pad">
              <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <div className="hstack">
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{t.titulo}</span>
                  <Badge variant="success" dot>Aprobada</Badge>
                </div>
                <div className="hstack">
                  <button className="btn btn-sm btn-icon btn-ghost"><Icon name="Edit" size={13} /></button>
                  <button className="btn btn-sm btn-icon btn-ghost"><Icon name="Copy" size={13} /></button>
                </div>
              </div>
              <div className="fg-1" style={{ fontSize: 13, lineHeight: 1.6, padding: 10, background: "var(--bg-1)", borderRadius: 6, border: "1px solid var(--border-soft)" }}>{t.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhatsAppScreen() { return <ChatConsole canalId="whatsapp" />; }
function MessengerScreen() { return <ChatConsole canalId="messenger" />; }

Object.assign(window, { Actividades, WhatsAppScreen, MessengerScreen });
