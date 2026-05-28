"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  {
    icon: "🧠",
    title: "Real-Time AI Analysis",
    desc: "Every move rated instantly — Brilliant, Great, Good, Inaccuracy, Mistake, Blunder.",
  },
  {
    icon: "⚡",
    title: "Stockfish 18 Engine",
    desc: "Grandmaster-level chess engine running entirely in your browser. Zero latency.",
  },
  {
    icon: "💬",
    title: "AI Coach Explanations",
    desc: "Natural language explanations powered by Gemini. Understand why each move matters.",
  },
  {
    icon: "🎮",
    title: "Play vs AI or Friends",
    desc: "Adjustable difficulty from 800 to 3200+ ELO, or share a code to play with friends.",
  },
  {
    icon: "📊",
    title: "Post-Game Reports",
    desc: "Accuracy scores, move breakdowns, and critical moments — all in a beautiful report.",
  },
  {
    icon: "🔒",
    title: "100% Free & Private",
    desc: "No account required. No data collected. Everything runs in your browser.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Gradient glow */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(124,92,252,0.08)_0%,transparent_70%)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 rounded-full text-sm font-medium text-[var(--color-accent-light)] mb-10">
            <span className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-pulse" />
            AI-Powered Chess Platform
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(3rem,7vw,5.5rem)] font-black tracking-[-3px] leading-[1.05] mb-6"
        >
          <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-cyan)] to-[var(--color-pink)] bg-clip-text text-transparent">
            Wazeer
          </span>
          <br />
          <span className="text-[var(--color-text)]">AI-Powered Chess</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-[var(--color-text-muted)] max-w-xl mb-12 leading-relaxed"
        >
          Every move you make is analyzed, rated, and explained by AI in
          real-time. Play against an intelligent engine or challenge friends —
          and get smarter with every game.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-4 flex-wrap justify-center"
        >
          <Link
            href="/play"
            className="px-8 py-3.5 rounded-xl text-sm font-bold
                       bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                       text-white shadow-lg shadow-[var(--color-accent)]/25
                       hover:shadow-[var(--color-accent)]/40 hover:scale-105
                       active:scale-[0.98] transition-all"
          >
            Play Now ♟
          </Link>
        </motion.div>

        {/* Hero stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex gap-10 mt-16 flex-wrap justify-center"
        >
          {[
            { value: "$0", label: "AI API Cost" },
            { value: "3", label: "AI Models" },
            { value: "∞", label: "Move Analysis" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-[var(--color-accent-light)]">
                {stat.value}
              </div>
              <div className="text-[11px] text-[var(--color-text-dim)] uppercase tracking-[2px] mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-r-2 border-b-2 border-[var(--color-text-dim)] rotate-45 animate-bounce" />
        </div>
      </div>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-[var(--color-border)]">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[2px] text-[var(--color-accent)] mb-4">
            <span className="w-6 h-0.5 bg-[var(--color-accent)]" />
            Features
          </div>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-1.5px] mb-4">
            Intelligence at every move
          </h2>
          <p className="text-[var(--color-text-muted)] max-w-xl mx-auto">
            Powered by Stockfish 18, Gemini AI, and modern web technology.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8
                         hover:border-[var(--color-border-light)] hover:-translate-y-1 transition-all group"
            >
              <div className="text-3xl mb-5">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 tracking-[-0.5px] group-hover:text-[var(--color-accent-light)] transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="text-center px-6 py-24 border-t border-[var(--color-border)]">
        <h2 className="text-3xl font-extrabold tracking-[-1px] mb-4">
          Ready to play smarter?
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8 max-w-md mx-auto">
          No account needed. No downloads. Just click and play.
        </p>
        <Link
          href="/play"
          className="inline-block px-10 py-4 rounded-xl text-base font-bold
                     bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                     text-white shadow-lg shadow-[var(--color-accent)]/25
                     hover:shadow-[var(--color-accent)]/40 hover:scale-105
                     active:scale-[0.98] transition-all"
        >
          Start Playing ♟
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-[var(--color-border)]">
        <p className="text-lg font-extrabold tracking-[-0.5px] mb-1">Wazeer</p>
        <p className="text-xs text-[var(--color-text-dim)]">
          AI-Powered Chess · Built for Antigravity · 2026
        </p>
      </footer>
    </div>
  );
}
