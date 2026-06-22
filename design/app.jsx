// app.jsx — root App component, wires everything together

const { useState: useS_app, useEffect: useE_app } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "ADMIN",
  "density": "regular",
  "accent": "#4F7DFF",
  "showLogin": false,
  "compactSidebar": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useS_app("dashboard");
  const [loggedIn, setLoggedIn] = useS_app(true);

  // active user based on selected role
  const activeUser = window.USERS.find(u => u.role === t.role) || window.USERS[0];

  // apply accent
  useE_app(() => {
    const styleId = "__accent-override";
    let el = document.getElementById(styleId);
    if (!el) { el = document.createElement("style"); el.id = styleId; document.head.appendChild(el); }
    const a = t.accent;
    el.textContent = `
      :root {
        --accent: ${a};
        --accent-hover: ${a};
        --accent-press: ${a};
        --accent-soft: ${a}1F;
        --accent-line: ${a}55;
      }
    `;
  }, [t.accent]);

  const counts = {
    clientes: window.CLIENTES.length,
    planes: window.CLIENTES.filter(c => c.plan).length,
    actividades: window.ACTIVIDADES.length,
  };

  // show login state
  if (t.showLogin) {
    return (
      <>
        <LoginScreen onLogin={() => setTweak("showLogin", false)} />
        <TweaksMount t={t} setTweak={setTweak} />
      </>
    );
  }

  const Screen = {
    dashboard:     Dashboard,
    clientes:      Clientes,
    planes:        Planes,
    catalogo:      Catalogo,
    comisiones:    Comisiones,
    actividades:   Actividades,
    whatsapp:      WhatsAppScreen,
    messenger:     MessengerScreen,
    configuracion: Configuracion,
    "design-system": DesignSystem,
  }[route] || Dashboard;

  return (
    <>
      <div className="app">
        <Sidebar route={route} setRoute={setRoute} activeUser={activeUser} counts={counts} />
        <main className="main" data-screen-label={route}>
          <Screen user={activeUser} density={t.density} setRoute={setRoute} />
        </main>
      </div>
      <TweaksMount t={t} setTweak={setTweak} />
    </>
  );
}

function TweaksMount({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Rol activo" />
      <TweakRadio
        label="Ver como"
        value={t.role}
        options={[
          { value: "ADMIN", label: "Admin" },
          { value: "SUPERVISOR", label: "Supervisor" },
          { value: "AGENTE", label: "Agente" },
        ]}
        onChange={v => setTweak("role", v)}
      />

      <TweakSection label="Tabla" />
      <TweakRadio
        label="Densidad"
        value={t.density}
        options={["compact", "regular", "comfy"]}
        onChange={v => setTweak("density", v)}
      />

      <TweakSection label="Theming" />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={["#4F7DFF", "#34D399", "#A78BFA", "#F4B95E", "#F87171"]}
        onChange={v => setTweak("accent", v)}
      />

      <TweakSection label="Navegación" />
      <TweakToggle
        label="Ver pantalla de login"
        value={t.showLogin}
        onChange={v => setTweak("showLogin", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
