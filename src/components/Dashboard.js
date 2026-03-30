import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";
import LoadingScreen from "./Loadingscreen";
const API_BASE = "https://sarthsiyaram-therapist-bot.hf.space";

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1"  x2="12" y2="3"  /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/* Staggered fade-up */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Dashboard({ token, onStartSession, onLogout, activeSession, theme, onToggleTheme }) {
  const [stats, setStats]               = useState({ totalSessions: 0, totalMinutes: 0, lastSession: null });
  const [recentSessions, setRecent]     = useState([]);
  const [historyLoading, setHistLoad]   = useState(true);
  const [starting, setStarting]         = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res  = await fetch(`${API_BASE}/session/history`, { headers: authHeaders(token) });
      const data = await res.json();
      const sessions     = data.sessions || [];
      const totalMinutes = sessions.reduce((s, r) => s + (r.duration_min || 0), 0);
      setStats({ totalSessions: sessions.length, totalMinutes, lastSession: sessions[0] || null });
      setRecent(sessions.slice(0, 5));
    } catch (e) { console.error(e); }
    finally     { setHistLoad(false); }
  };

  const startNewSession = async () => {
    setStarting(true);
    try {
      const res  = await fetch(`${API_BASE}/session/start`, { method: "POST", headers: authHeaders(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      onStartSession({ sessionId: data.session_id, startedAt: Date.now(), messages: [{ role: "bot", text: data.reply }] });
    } catch (e) {
      console.error(e);
      alert("Could not start session. Please try again.");
      setStarting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "Never";
    const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7)  return `${diff} days ago`;
    return new Date(d).toLocaleDateString();
  };

  return (
    <>
      {/* Full-screen loader when starting a session */}
      {starting && <LoadingScreen visible={starting} label="starting session" />}

      <div className="dashboard-container">
        {/* ── Header ── */}
        <div className="dashboard-header">
          <h1 className="logo">
            <Logo size={30} animate />
            serenora
          </h1>
          <div className="header-actions">
            <motion.button
              className="btn-icon"
              onClick={onToggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </motion.button>
            <button className="btn-ghost" onClick={onLogout}>Sign Out</button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="dashboard-content">

          {/* Welcome */}
          <motion.div className="welcome-section" variants={fadeUp} initial="hidden" animate="show" custom={0}>
            <h2>Welcome back</h2>
            <p>Your journey to mental wellness continues here.</p>
          </motion.div>

          {/* Action Card */}
          <motion.div className="action-cards" variants={fadeUp} initial="hidden" animate="show" custom={1}>
            {activeSession ? (
              <motion.div className="action-card hover-gem" whileTap={{ scale: 0.99 }}>
                <h3>Continue Session</h3>
                <p>You have an ongoing session from earlier. Pick up where you left off.</p>
                <motion.button
                  className="btn-primary"
                  onClick={() => onStartSession(activeSession)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  Resume Session
                </motion.button>
              </motion.div>
            ) : (
              <motion.div className="action-card hover-gem" whileTap={{ scale: 0.99 }}>
                <h3>New Session</h3>
                <p>30 minutes of guided therapeutic conversation with your AI companion.</p>
                <motion.button
                  className="btn-primary"
                  onClick={startNewSession}
                  disabled={starting}
                  whileHover={{ scale: starting ? 1 : 1.015 }}
                  whileTap={{ scale: starting ? 1 : 0.985 }}
                >
                  {starting ? "Starting…" : "Begin Session"}
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div className="stats-section" variants={fadeUp} initial="hidden" animate="show" custom={2}>
            <p className="section-label">Your Progress</p>
            <div className="stats-grid">
              {[
                { value: stats.totalSessions, label: "Sessions" },
                { value: Math.floor(stats.totalMinutes), label: "Minutes" },
                { value: stats.lastSession ? formatDate(stats.lastSession.date) : "—", label: "Last Session" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  className="stat-card glass"
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={2.2 + i * 0.12}
                  whileHover={{ y: -2 }}
                >
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent sessions */}
          <motion.div className="recent-section" variants={fadeUp} initial="hidden" animate="show" custom={3}>
            <p className="section-label">Recent Sessions</p>
            <div className="sessions-list">
              {historyLoading ? (
                <div className="loading-sessions">Loading your sessions…</div>
              ) : recentSessions.length === 0 ? (
                <div className="empty-state glass">
                  No sessions yet. Start your first session above.
                </div>
              ) : (
                recentSessions.map((s, i) => (
                  <motion.div
                    key={i}
                    className="session-item hover-gem"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={3 + i * 0.1}
                  >
                    <div className="session-info">
                      <div className="session-date">{s.date}</div>
                      <div className="session-duration">{s.duration_min} min</div>
                    </div>
                    <div className="session-preview">
                      {s.tasks_given && s.tasks_given !== "None"
                        ? `${s.tasks_given.substring(0, 72)}…`
                        : "No tasks assigned"}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}