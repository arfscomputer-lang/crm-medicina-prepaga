// shell.jsx — Sidebar, Topbar, App shell

const { useState: useState_s, useEffect: useEffect_s } = React;

function Sidebar({ route, setRoute, activeUser, counts }) {
  const main = [
    { id: "dashboard",   label: "Dashboard",     icon: "Home" },
    { id: "clientes",    label: "Clientes",      icon: "Users",       count: counts.clientes },
    { id: "planes",      label: "Planes",        icon: "ShieldCheck", count: counts.planes },
    { id: "catalogo",    label: "Catálogo",      icon: "BookOpen" },
    { id: "comisiones",  label: "Comisiones",    icon: "DollarSign" },
    { id: "actividades", label: "Actividades",   icon: "Activity",    count: counts.actividades },
  ];
  const channels = [
    { id: "whatsapp",  label: "WhatsApp",  icon: "MessageCircle", count: 4 },
    { id: "messenger", label: "Messenger", icon: "MessageSquare", count: 2 },
  ];
  const config = [
    { id: "configuracion", label: "Configuración", icon: "Settings" },
    { id: "design-system", label: "Design System", icon: "Palette" },
  ];

  const Item = (item) => (
    <div
      key={item.id}
      className={"sb-link " + (route === item.id ? "active" : "")}
      onClick={() => setRoute(item.id)}
    >
      <Icon name={item.icon} size={15} />
      <span>{item.label}</span>
      {item.count != null ? <span className="count">{item.count}</span> : null}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <Logo size={28} />
        <div className="sb-brand-text">
          <span className="nm">SeguroCRM</span>
          <span className="sb">Medicina prepaga</span>
        </div>
      </div>

      <div className="sb-org">
        <span className="ic">EB</span>
        <span className="nm">EBSA Asunción Centro</span>
        <Icon name="ChevronsUpDown" size={12} className="chev" />
      </div>

      <div className="sb-section">Principal</div>
      <div className="sb-nav">{main.map(Item)}</div>

      <div className="sb-section">Canales</div>
      <div className="sb-nav">{channels.map(Item)}</div>

      <div className="sb-section">Sistema</div>
      <div className="sb-nav">{config.map(Item)}</div>

      <div className="sb-footer">
        <div className="sb-user">
          <Avatar name={activeUser.nombre} gradient={activeUser.color} />
          <div className="meta">
            <span className="nm">{activeUser.nombre}</span>
            <span className="em">{activeUser.email}</span>
          </div>
          <Icon name="MoreHorizontal" size={14} className="more" />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, crumbs, right }) {
  return (
    <div className="topbar">
      {crumbs ? (
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <Icon name="ChevronRight" size={12} className="sep" /> : null}
              <span style={{ color: i === crumbs.length - 1 ? "var(--fg)" : "var(--fg-2)" }}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <h1>{title}</h1>
      )}
      <div className="topbar-right">{right}</div>
    </div>
  );
}

function GlobalSearch() {
  return (
    <div className="input-with-icon" style={{ width: 280 }}>
      <Icon name="Search" size={13} className="ic" />
      <input className="input" placeholder="Buscar clientes, planes, actividades..." />
      <span className="kbd">⌘K</span>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, GlobalSearch });
