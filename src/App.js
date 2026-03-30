import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import SessionPage from "./components/SessionPage";
import LoadingScreen from "./components/Loadingscreen";
import "./App.css";

const AnimatedBackground = () => (
  <div className="animated-bg">
    <div className="bg-orb orb-1" />
    <div className="bg-orb orb-2" />
    <div className="bg-orb orb-3" />
  </div>
);

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.26, ease: "easeIn" } },
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("serenora_token") || "");
  const [page, setPage]   = useState("auth");
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem("active_session_serenora");
    return saved ? JSON.parse(saved) : null;
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem("serenora_theme") || "dark"
  );
  const [appLoading, setAppLoading] = useState(true);

  /* Apply theme attribute */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("serenora_theme", theme);
  }, [theme]);

  /* Initial boot loading (1.8 s) */
  useEffect(() => {
    document.title = "Serenora — Mindful";
    const t = setTimeout(() => setAppLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  /* Route based on token */
  useEffect(() => {
    setPage(token ? "dashboard" : "auth");
  }, [token]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const handleAuth = (newToken) => {
    localStorage.setItem("serenora_token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("serenora_token");
    localStorage.removeItem("active_session_serenora");
    setToken("");
    setActiveSession(null);
  };

  const handleStartSession = (sessionData) => {
    setActiveSession(sessionData);
    localStorage.setItem("active_session_serenora", JSON.stringify(sessionData));
    setPage("session");
  };

  const handleEndSession = () => {
    setActiveSession(null);
    localStorage.removeItem("active_session_serenora");
    setPage("dashboard");
  };

  return (
    <div className="app">
      <AnimatedBackground />

      {/* Initial boot loader */}
      <AnimatePresence>
        {appLoading && (
          <LoadingScreen
            visible={appLoading}
            label="serenora"
            onDone={() => setAppLoading(false)}
          />
        )}
      </AnimatePresence>

      {!appLoading && (
        <AnimatePresence mode="wait">
          {page === "auth" && (
            <motion.div
              key="auth"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="page-container"
            >
              <AuthPage
                onAuth={handleAuth}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          )}

          {page === "dashboard" && (
            <motion.div
              key="dashboard"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="page-container"
            >
              <Dashboard
                token={token}
                onStartSession={handleStartSession}
                onLogout={handleLogout}
                activeSession={activeSession}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          )}

          {page === "session" && activeSession && (
            <motion.div
              key="session"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="page-container"
            >
              <SessionPage
                token={token}
                sessionId={activeSession.sessionId}
                onEndSession={handleEndSession}
                onBackToDashboard={() => setPage("dashboard")}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}