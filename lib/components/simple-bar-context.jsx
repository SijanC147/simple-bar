import * as Uebersicht from "uebersicht";
import * as Aerospace from "../aerospace.js";

const { React } = Uebersicht;

// Create a context with default values
const SimpleBarContext = React.createContext({
  display: 1,
  SIPDisabled: false,
  settings: {},
  setSettings: () => {},
});

/**
 * Custom hook to use the SimpleBarContext
 * @returns {Object} The context value
 */
export function useSimpleBarContext() {
  return React.useContext(SimpleBarContext);
}

/**
 * Provides context for simple-bar.
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.initialSettings - The initial settings for the application.
 * @param {Array} props.displays - The initial displays configuration.
 * @param {boolean} props.SIPDisabled - Indicates if SIP (System Integrity Protection) is disabled.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 *
 * @returns {JSX.Element} The context provider component.
 */
export default function SimpleBarContextProvider({
  initialSettings,
  displays,
  SIPDisabled,
  children,
}) {
  const [settings, setSettings] = React.useState(initialSettings);
  const [_displays, setDisplays] = React.useState(displays);
  const [missives, setMissives] = React.useState([]);

  const { windowManager, enableServer, yabaiServerRefresh } = settings.global;
  const serverEnabled = enableServer && yabaiServerRefresh;
  const isYabai = windowManager === "yabai";

  const currentDisplays = serverEnabled && isYabai ? _displays : displays;

  const ubersichtDisplayId = parseInt(
    window.location.pathname.replace("/", ""),
    10
  );

  // Find the current display by walking down from ubersichtDisplayId
  // until we find a match. This handles phantom displays (closed lid,
  // previously connected monitors) that Übersicht still counts but
  // AeroSpace doesn't report.
  let currentDisplay = {};
  let displayIndex = 1;

  for (let candidateId = ubersichtDisplayId; candidateId >= 1; candidateId--) {
    const display = currentDisplays?.find((d) => {
      const id = Aerospace.getDisplayIndex(d) ?? d.id;
      return id === candidateId;
    });

    if (display) {
      currentDisplay = display;
      displayIndex =
        display.index ?? Aerospace.getScreenIndex(display) ?? 1;
      break;
    }
  }

  const pushMissive = (newMissive) => {
    const now = Date.now();
    const { content, side = "right", delay = 5000 } = newMissive;
    const timeout =
      typeof delay === "number" && delay !== 0
        ? setTimeout(() => {
            setMissives((current) => {
              return current.filter((m) => m.id !== now);
            });
          }, delay)
        : undefined;
    setMissives((current) => {
      return [...current, { id: now, content, side, timeout }];
    });
  };

  return (
    <SimpleBarContext.Provider
      value={{
        displayIndex,
        SIPDisabled,
        settings,
        setSettings,
        displays: currentDisplays,
        setDisplays,
        missives,
        setMissives,
        pushMissive,
      }}
    >
      {children}
    </SimpleBarContext.Provider>
  );
}
