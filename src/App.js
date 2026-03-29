import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import SessionPage from "./components/SessionPage";
import "./App.css";

// Animated background component
const AnimatedBackground = () => {
  return (
    <div className="animated-bg">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("serenora_token") || "");
  const [page, setPage] = useState("auth");
  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem("active_session_serenora");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    document.title = "Serenora — Mindful AI Therapy";
    if (token) {
      setPage("dashboard");
    } else {
      setPage("auth");
    }
  }, [token]);

  const handleAuth = (newToken) => {
    setToken(newToken);
    localStorage.setItem("serenora_token", newToken);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("serenora_token");
    localStorage.removeItem("active_session_serenora");
    setActiveSession(null);
    setPage("auth");
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

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div className="app">
      <div className="glass-bg" />
      <AnimatedBackground />
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
            <AuthPage onAuth={handleAuth} />
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}