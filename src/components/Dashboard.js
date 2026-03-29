import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API_BASE = "https://sarthsiyaram-therapist-bot.hf.space";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function Dashboard({ token, onStartSession, onLogout, activeSession }) {
  const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0, lastSession: null });
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/session/history`, { headers: authHeaders(token) });
      const data = await res.json();
      const sessions = data.sessions || [];
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_min || 0), 0);
      const lastSession = sessions[0] || null;
      setStats({ totalSessions, totalMinutes, lastSession });
      setRecentSessions(sessions.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    setStarting(true);
    try {
      const res = await fetch(`${API_BASE}/session/start`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      onStartSession({
        sessionId: data.session_id,
        startedAt: Date.now(),
        messages: [{ role: "bot", text: data.reply }],
      });
    } catch (err) {
      console.error(err);
      alert("Could not start session. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const continueSession = () => {
    if (activeSession) onStartSession(activeSession);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="logo">
          seren<span>ora</span>
        </h1>
        <button className="btn-ghost" onClick={onLogout}>
          Sign Out
        </button>
      </div>
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back</h2>
          <p>Your journey to mental wellness continues here.</p>
        </div>
        <div className="action-cards">
          {activeSession ? (
            <div className="action-card continue-card glass">
              <div className="card-icon">🔄</div>
              <h3>Continue Session</h3>
              <p>You have an ongoing session from earlier</p>
              <button className="btn-primary" onClick={continueSession}>
                Resume Session
              </button>
            </div>
          ) : (
            <div className="action-card start-card glass">
              <div className="card-icon">🌿</div>
              <h3>Start New Session</h3>
              <p>30 minutes of guided therapeutic conversation</p>
              <button className="btn-primary" onClick={startNewSession} disabled={starting}>
                {starting ? "Starting..." : "Begin Session"}
              </button>
            </div>
          )}
        </div>
        <div className="stats-section">
          <h3>Your Progress</h3>
          <div className="stats-grid">
            <div className="stat-card glass">
              <div className="stat-value">{stats.totalSessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-value">{Math.floor(stats.totalMinutes)}</div>
              <div className="stat-label">Minutes Spent</div>
            </div>
            <div className="stat-card glass">
              <div className="stat-value">{stats.lastSession ? formatDate(stats.lastSession.date) : "Never"}</div>
              <div className="stat-label">Last Session</div>
            </div>
          </div>
        </div>
        <div className="recent-section">
          <h3>Recent Sessions</h3>
          <div className="sessions-list">
            {loading ? (
              <div className="loading-sessions">🌸 Loading your sessions...</div>
            ) : recentSessions.length === 0 ? (
              <div className="empty-state glass">
                <p>✨ No sessions yet. Start your first session above.</p>
              </div>
            ) : (
              recentSessions.map((session, idx) => (
                <div key={idx} className="session-item glass">
                  <div className="session-info">
                    <div className="session-date">{session.date}</div>
                    <div className="session-duration">{session.duration_min} minutes</div>
                  </div>
                  <div className="session-preview">
                    {session.tasks_given && session.tasks_given !== "None"
                      ? `📋 ${session.tasks_given.substring(0, 60)}...`
                      : "🌱 No tasks assigned"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}