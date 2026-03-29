import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "https://sarthsiyaram-therapist-bot.hf.space";
const SESSION_DURATION = 30 * 60;

const EMOTION_COLORS = {
  happy: "#F7C948",
  sad: "#6B9FD4",
  angry: "#E05C5C",
  fear: "#B06FD8",
  trust: "#52C98A",
  disgust: "#8B7355",
  calm: "#7EC8C8",
  excited: "#FF9040",
  attraction: "#E87EA1",
  curiosity: "#A8D672",
  stress: "#E07C5C",
  neutral: "#9CA3AF",
};

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatTime(seconds) {
  const m = Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(Math.max(0, seconds) % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function SessionPage({ token, sessionId: initialSessionId, onEndSession, onBackToDashboard }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`session_serenora_${initialSessionId}_messages`);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(initialSessionId);
  const [elapsed, setElapsed] = useState(() => {
    const savedStart = localStorage.getItem(`session_serenora_${initialSessionId}_start`);
    if (savedStart) {
      const elapsedSeconds = (Date.now() - parseInt(savedStart)) / 1000;
      return Math.min(elapsedSeconds, SESSION_DURATION);
    }
    return 0;
  });
  const [ended, setEnded] = useState(false);
  const [emotions, setEmotions] = useState(
    Object.fromEntries(Object.keys(EMOTION_COLORS).map((k) => [k, 0]))
  );

  const startRef = useRef(
    localStorage.getItem(`session_serenora_${initialSessionId}_start`)
      ? parseInt(localStorage.getItem(`session_serenora_${initialSessionId}_start`))
      : null
  );
  const timerRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0 && !ended) {
      fetchFirstResponse();
    }
  }, []);

  useEffect(() => {
    if (ended || elapsed >= SESSION_DURATION) return;

    if (!startRef.current) {
      startRef.current = Date.now();
      localStorage.setItem(`session_serenora_${sessionId}_start`, startRef.current.toString());
    }

    timerRef.current = setInterval(() => {
      const newElapsed = (Date.now() - startRef.current) / 1000;
      setElapsed(newElapsed);
      localStorage.setItem(`session_serenora_${sessionId}_elapsed`, newElapsed.toString());

      if (newElapsed >= SESSION_DURATION) {
        clearInterval(timerRef.current);
        endSession();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ended, sessionId]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`session_serenora_${sessionId}_messages`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const fetchFirstResponse = async () => {
    if (messages.length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/session/start`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setMessages([{ role: "bot", text: data.reply }]);
    } catch (err) {
      console.error("Failed to start session:", err);
      setMessages([{ role: "bot", text: "Could not connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (ended) return;
    setEnded(true);
    clearInterval(timerRef.current);

    try {
      await fetch(`${API_BASE}/session/end`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          session_id: sessionId,
          elapsed_seconds: elapsed,
        }),
      });
    } catch (err) {
      console.error("Failed to save session:", err);
    }

    localStorage.removeItem(`session_serenora_${sessionId}_messages`);
    localStorage.removeItem(`session_serenora_${sessionId}_start`);
    localStorage.removeItem(`session_serenora_${sessionId}_elapsed`);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || ended) return;

    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/session/message`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          session_id: sessionId,
          user_message: text,
          elapsed_seconds: elapsed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
      if (data.emotion_vector) setEmotions(data.emotion_vector);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "I'm having trouble responding. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEndEarly = async () => {
    await endSession();
    onEndSession();
  };

  const pct = Math.min((elapsed / SESSION_DURATION) * 100, 100);
  const timeLeft = SESSION_DURATION - elapsed;
  const sortedEmotions = Object.entries(emotions).sort((a, b) => b[1] - a[1]);

  return (
    <div className="session-container">
      <div className="session-header glass">
        <motion.button
          className="btn-back"
          onClick={onBackToDashboard}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Dashboard
        </motion.button>
        <h1 className="logo-small">
          seren<span>ora</span>
        </h1>
        <div className="header-right">
          <div className="timer-display">{formatTime(timeLeft)}</div>
          <div className="timer-bar">
            <motion.div
              className="timer-fill"
              style={{ width: `${pct}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <motion.button
            className="btn-end"
            onClick={handleEndEarly}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            End Session
          </motion.button>
        </div>
      </div>

      <div className="session-main">
        <div className="chat-area glass">
          <div className="messages-container">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`message ${msg.role}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                >
                  <div className="message-avatar">{msg.role === "bot" ? "🌿" : "👤"}</div>
                  <div className="message-bubble">{msg.text}</div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div className="message bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="message-avatar">🌿</div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="input-area">
            <textarea
              ref={inputRef}
              className="message-input"
              placeholder="Share what's on your mind..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={ended}
            />
            <motion.button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim() || ended}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send
            </motion.button>
          </div>
        </div>

        <div className="sidebar glass">
          <div className="emotion-section">
            <h3>Emotional State</h3>
            <div className="emotion-list">
              {sortedEmotions.slice(0, 6).map(([emotion, val]) => (
                <motion.div
                  key={emotion}
                  className="emotion-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="emotion-label">{emotion}</div>
                  <div className="emotion-bar">
                    <motion.div
                      className="emotion-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${val * 100}%` }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
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
              <span>Duration:</span>
              <strong>{formatTime(elapsed)} / 30:00</strong>
            </div>
            <div className="info-row">
              <span>Messages:</span>
              <strong>{messages.length}</strong>
            </div>
            <div className="info-row">
              <span>Status:</span>
              <strong className={ended ? "ended" : "active"}>
                {ended ? "Complete" : "Active"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {ended && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content glass"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="modal-icon">✨</div>
              <h2>Session Complete</h2>
              <p>You've done meaningful work today. Take a moment to reflect.</p>
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