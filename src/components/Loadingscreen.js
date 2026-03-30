import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";

/**
 * LoadingScreen
 * ─────────────
 * Full-screen overlay with a super-blurred backdrop and 5 gem-colored
 * orbs that move on independent orbital paths, creating a hypnotic
 * looping effect.
 *
 * Props:
 *   visible  — boolean  controls visibility
 *   label    — string   optional label below the logo (default: "serenora")
 *   onDone   — fn       called after fade-out completes
 */
export default function LoadingScreen({ visible = true, label = "serenora", onDone }) {
  const [phase, setPhase] = useState("in"); // "in" | "visible" | "out" | "gone"

  useEffect(() => {
    if (visible) {
      setPhase("in");
    } else {
      setPhase("out");
      const t = setTimeout(() => {
        setPhase("gone");
        onDone?.();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (phase === "gone") return null;

  return (
    <motion.div
      className={`loading-screen${phase === "out" ? " fade-out" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Glowing orbiting color masses ── */}
      <div className="loading-orbs">
        <div className="l-orb l-orb-1" />
        <div className="l-orb l-orb-2" />
        <div className="l-orb l-orb-3" />
        <div className="l-orb l-orb-4" />
        <div className="l-orb l-orb-5" />
      </div>

      {/* ── Center content ── */}
      <div className="loading-content">
        {/* Logo with pulsing rings */}
        <div className="loading-logo-wrap">
          <div className="loading-ring loading-ring-1" />
          <div className="loading-ring loading-ring-2" />
          <div className="loading-ring loading-ring-3" />
          <Logo size={48} animate />
        </div>

        {/* Brand name */}
        <div className="loading-label">{label}</div>

        {/* Typing dots */}
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </motion.div>
  );
}