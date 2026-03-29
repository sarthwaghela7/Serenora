import { useState } from "react";
import { motion } from "framer-motion";

const API_BASE = "https://sarthsiyaram-therapist-bot.hf.space";

export default function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const body = {
        password,
        [isEmail ? "email" : "phone"]: identifier,
      };
      const res = await fetch(`${API_BASE}/auth/${isLogin ? "login" : "register"}`, {
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

  return (
    <div className="auth-wrapper">
      <motion.div
        className="auth-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="logo">
            seren<span>ora</span>
          </h1>
          <p className="tagline">Your sanctuary for mental wellness</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`tab-btn ${isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${!isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(false)}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email or Phone Number</label>
            <input
              type="text"
              placeholder="you@example.com or +1234567890"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}