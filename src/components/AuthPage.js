import { useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";

const API_BASE = "https://sarthsiyaram-therapist-bot.hf.space";

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1"  x2="12" y2="3"  />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1"  y1="12" x2="3"  y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function AuthPage({ onAuth, theme, onToggleTheme }) {
  const [isLogin, setIsLogin]       = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) { setError("Please fill in all fields"); return; }
    setError("");
    setLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const body = { password, [isEmail ? "email" : "phone"]: identifier };
      const res  = await fetch(`${API_BASE}/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");
      onAuth(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(v => !v); setError(""); };

  return (
    <div className="auth-wrapper">
      {/* Theme toggle */}
      <motion.button
        className="btn-icon"
        onClick={onToggleTheme}
        style={{ position: "fixed", top: 18, right: 18, zIndex: 10 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </motion.button>

      {/* Card — always-on rotating gem border */}
      <motion.div
        className="auth-card gem-border-always"
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="auth-header">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="logo" style={{ justifyContent: "center", marginBottom: "10px" }}>
              <Logo size={34} animate />
              serenora
            </h1>
          </motion.div>
          <p className="tagline">Your sanctuary for mental wellness</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`tab-btn ${isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${!isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: isLogin ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="input-group">
              <label>Email or Phone</label>
              <input
                type="text"
                placeholder="you@example.com or +1234567890"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="glass-input"
                autoComplete="username"
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="glass-input"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
          </motion.div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.985 }}
          >
            {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" className="link-btn" onClick={switchMode}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}