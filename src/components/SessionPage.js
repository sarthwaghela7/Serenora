import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

const API_BASE        = "https://sarthsiyaram-therapist-bot.hf.space";
const SESSION_DURATION = 30 * 60;

const EMOTION_COLORS = {
  happy:      "#F7C948",
  sad:        "#6B9FD4",
  angry:      "#E05C5C",
  fear:       "#B06FD8",
  trust:      "#52C98A",
  disgust:    "#8B7355",
  calm:       "#7EC8C8",
  excited:    "#FF9040",
  attraction: "#E87EA1",
  curiosity:  "#A8D672",
  stress:     "#E07C5C",
  neutral:    "#9CA3AF",
};

/* Farewell messages — one is picked at random */
const FAREWELLS = [
  "Our session has come to a close. Thank you for opening up today — it takes real courage. Be gentle with yourself, and I'll be here whenever you're ready to talk again.",
  "This session has ended. Every word you shared today mattered. Remember — healing isn't linear. Take care of yourself, and I'll be right here next time.",
  "Our time together is complete for today. You've done something meaningful by showing up for yourself. Carry that with you. Until next time.",
];

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function formatTime(s) {
  const m = Math.floor(Math.max(0, s) / 60).toString().padStart(2, "0");
  const sec = Math.floor(Math.max(0, s) % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1"  x2="12" y2="3"  /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const UserAvatar = () => (
  <div className="message-avatar" style={{ background: "linear-gradient(135deg,rgba(214,36,159,0.16),rgba(40,90,235,0.16))", border: "1px solid rgba(214,36,159,0.18)" }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)" }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

export default function SessionPage({ token, sessionId: initialSessionId, onEndSession, onBackToDashboard, theme, onToggleTheme }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`session_serenora_${initialSessionId}_messages`);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sessionId]             = useState(initialSessionId);
  const [elapsed, setElapsed]   = useState(() => {
    const t = localStorage.getItem(`session_serenora_${initialSessionId}_start`);
    return t ? Math.min((Date.now() - parseInt(t)) / 1000, SESSION_DURATION) : 0;
  });
  const [ended, setEnded]       = useState(false);
  const [showModal, setShowModal] = useState(false);  // separate from ended
  const [emotions, setEmotions] = useState(
    Object.fromEntries(Object.keys(EMOTION_COLORS).map(k => [k, 0]))
  );

  const startRef = useRef(
    localStorage.getItem(`session_serenora_${initialSessionId}_start`)
      ? parseInt(localStorage.getItem(`session_serenora_${initialSessionId}_start`))
      : null
  );
  const timerRef  = useRef(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* Fetch first message on mount */
  useEffect(() => {
    if (messages.length === 0 && !ended) fetchFirstResponse();
  }, []);

  /* Timer */
  useEffect(() => {
    if (ended || elapsed >= SESSION_DURATION) return;

    if (!startRef.current) {
      startRef.current = Date.now();
      localStorage.setItem(`session_serenora_${sessionId}_start`, startRef.current.toString());
    }

    timerRef.current = setInterval(() => {
      const next = (Date.now() - startRef.current) / 1000;
      setElapsed(next);
      if (next >= SESSION_DURATION) {
        clearInterval(timerRef.current);
        endSession("timer");
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ended, sessionId]);

  /* Persist messages */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`session_serenora_${sessionId}_messages`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const fetchFirstResponse = async () => {
    if (messages.length > 0) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/session/start`, { method: "POST", headers: authHeaders(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessages([{ role: "bot", text: data.reply }]);
    } catch {
      setMessages([{ role: "bot", text: "Could not connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (trigger = "user") => {
    if (ended) return;
    setEnded(true);
    clearInterval(timerRef.current);

    /* ── Bot sends a farewell message first ── */
    const farewell = FAREWELLS[Math.floor(Math.random() * FAREWELLS.length)];
    setMessages(m => [...m, { role: "bot", text: farewell, farewell: true }]);

    /* Show modal after a short delay so user can read it */
    setTimeout(() => setShowModal(true), 1900);

    /* Save session to API */
    try {
      await fetch(`${API_BASE}/session/end`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ session_id: sessionId, elapsed_seconds: elapsed }),
      });
    } catch (e) { console.error("Failed to save session:", e); }

    /* Clear local storage */
    localStorage.removeItem(`session_serenora_${sessionId}_messages`);
    localStorage.removeItem(`session_serenora_${sessionId}_start`);
    localStorage.removeItem(`session_serenora_${sessionId}_elapsed`);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || ended) return;
    const text = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/session/message`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ session_id: sessionId, user_message: text, elapsed_seconds: elapsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setMessages(m => [...m, { role: "bot", text: data.reply }]);
      if (data.emotion_vector) setEmotions(data.emotion_vector);
    } catch {
      setMessages(m => [...m, { role: "bot", text: "I'm having trouble responding. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleEndEarly = () => endSession("user");

  const pct        = Math.min((elapsed / SESSION_DURATION) * 100, 100);
  const timeLeft   = SESSION_DURATION - elapsed;
  const sortedEmot = Object.entries(emotions).sort((a, b) => b[1] - a[1]);

  return (
    <div className="session-container">
      {/* ── Header ── */}
      <div className="session-header">
        <motion.button
          className="btn-back"
          onClick={onBackToDashboard}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Dashboard
        </motion.button>

        <h1 className="logo-small">
          <Logo size={24} />
          serenora
        </h1>

        <div className="header-right">
          <motion.button
            className="btn-icon"
            onClick={onToggleTheme}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            aria-label="Toggle theme"
            style={{ width: 32, height: 32 }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </motion.button>

          <div className="timer-display">{formatTime(timeLeft)}</div>

          <div className="timer-bar">
            <motion.div
              className="timer-fill"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: "linear" }}
            />
          </div>

          <motion.button
            className="btn-danger"
            onClick={handleEndEarly}
            disabled={ended}
            whileHover={{ scale: ended ? 1 : 1.03 }}
            whileTap={{ scale: ended ? 1 : 0.97 }}
          >
            End Session
          </motion.button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="session-main">
        {/* Chat */}
        <div className="chat-area glass">
          <div className="messages-container">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`message ${msg.role}${msg.farewell ? " farewell" : ""}`}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.34, type: "spring", stiffness: 360, damping: 28 }}
                >
                  {msg.role === "bot"
                    ? <div className="message-avatar"><Logo size={32} /></div>
                    : <UserAvatar />
                  }
                  <div className="message-bubble">{msg.text}</div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                className="message bot"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="message-avatar"><Logo size={32} /></div>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="input-area">
            <textarea
              ref={inputRef}
              className="message-input"
              placeholder={ended ? "Session has ended" : "Share what's on your mind…"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={ended}
            />
            <motion.button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim() || ended}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Send
            </motion.button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar glass">
          <div className="emotion-section">
            <h3>Emotional State</h3>
            <div className="emotion-list">
              {sortedEmot.slice(0, 6).map(([emotion, val]) => (
                <motion.div
                  key={emotion}
                  className="emotion-item"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="emotion-label">{emotion}</div>
                  <div className="emotion-bar">
                    <motion.div
                      className="emotion-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${val * 100}%` }}
                      transition={{ duration: 0.7, type: "spring", stiffness: 170 }}
                      style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                    />
                  </div>
                  <div className="emotion-value">{val.toFixed(1)}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="session-info-section">
            <h3>Session Info</h3>
            <div className="info-row">
              <span>Duration</span>
              <strong>{formatTime(elapsed)} / 30:00</strong>
            </div>
            <div className="info-row">
              <span>Messages</span>
              <strong>{messages.length}</strong>
            </div>
            <div className="info-row">
              <span>Status</span>
              <strong className={ended ? "ended" : "active"}>
                {ended ? "Complete" : "Active"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Session Complete Modal — shown after farewell delay ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content gem-border-always"
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              <div className="modal-icon">✨</div>
              <h2>Session Complete</h2>
              <p>
                You've done meaningful work today.
                <br />
                Take a moment to reflect and breathe.
              </p>
              <div className="modal-buttons">
                <motion.button
                  className="btn-secondary"
                  onClick={onBackToDashboard}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go to Dashboard
                </motion.button>
                <motion.button
                  className="btn-primary"
                  onClick={onEndSession}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start New Session
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}