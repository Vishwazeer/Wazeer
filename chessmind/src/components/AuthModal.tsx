"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

type Tab = "google" | "email" | "phone";

export default function AuthModal() {
  const authModalOpen = useAuthStore((s) => s.authModalOpen);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signInWithPhone = useAuthStore((s) => s.signInWithPhone);
  const confirmPhoneCode = useAuthStore((s) => s.confirmPhoneCode);

  const [tab, setTab] = useState<Tab>("google");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (authModalOpen) {
      setTab("google");
      setError(null);
      setLoading(false);
      setEmail("");
      setPassword("");
      setPhone("");
      setOtp("");
      setStep("phone");
      setConfirmationResult(null);
    }
  }, [authModalOpen]);

  // Cleanup recaptcha on tab change or close
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, [tab, authModalOpen]);

  if (!authModalOpen) return null;

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password, isSignUp);
    } catch (e: any) {
      const msg = e.code === "auth/user-not-found" ? "No account with that email. Try signing up."
        : e.code === "auth/wrong-password" ? "Incorrect password."
        : e.code === "auth/email-already-in-use" ? "Email already in use. Try signing in."
        : e.code === "auth/weak-password" ? "Password should be at least 6 characters."
        : e.code === "auth/invalid-email" ? "Please enter a valid email."
        : e.message || "Sign-in failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { RecaptchaVerifier } = await import("firebase/auth");
      const { auth: firebaseAuth } = await import("@/lib/firebase");

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
      }
      const result = await signInWithPhone(phone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP. Check phone number format (+countrycode...).");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!confirmationResult) throw new Error("No confirmation result. Please resend OTP.");
      await confirmPhoneCode(confirmationResult, otp);
    } catch (e: any) {
      setError(e.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "google", label: "Google", icon: "🌐" },
    { id: "email", label: "Email", icon: "✉️" },
    { id: "phone", label: "Phone", icon: "📱" },
  ];

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              style={{ boxShadow: "0 0 80px rgba(124,92,252,0.15), 0 24px 64px rgba(0,0,0,0.5)" }}
            >
              {/* Header glow strip */}
              <div className="h-[3px] w-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-cyan)] to-[var(--color-pink)]" />

              <div className="p-7">
                {/* Title */}
                <div className="text-center mb-6">
                  <div className="text-2xl font-black tracking-tight mb-1">
                    <span className="bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-cyan)] to-[var(--color-pink)] bg-clip-text text-transparent">
                      Wazeer
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Sign in to save your game progress
                  </p>
                </div>

                {/* Tab Pills */}
                <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)] mb-5">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setError(null); }}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1
                        ${tab === t.id
                          ? "bg-[var(--color-accent)] text-white shadow-md"
                          : "text-[var(--color-text-muted)] hover:text-white"
                        }
                      `}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-[var(--color-red)]/10 border border-[var(--color-red)]/25 rounded-xl text-xs text-[var(--color-red)] text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* ── Google Tab ── */}
                {tab === "google" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button
                      onClick={handleGoogle}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl
                                 bg-white text-gray-800 font-bold text-sm
                                 hover:bg-gray-100 active:scale-[0.98] transition-all shadow-md
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {loading ? "Signing in..." : "Continue with Google"}
                    </button>
                    <p className="text-center text-[10px] text-[var(--color-text-dim)] mt-4">
                      Secure sign-in via Google. No password needed.
                    </p>
                  </motion.div>
                )}

                {/* ── Email Tab ── */}
                {tab === "email" && (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleEmail}
                    className="space-y-3"
                  >
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3
                                 text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)]
                                 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3
                                 text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)]
                                 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white
                                 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                                 hover:opacity-90 active:scale-[0.98] transition-all shadow-md
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                      className="w-full text-xs text-[var(--color-text-muted)] hover:text-white transition-colors text-center"
                    >
                      {isSignUp ? "Already have an account? Sign in" : "No account? Create one →"}
                    </button>
                  </motion.form>
                )}

                {/* ── Phone Tab ── */}
                {tab === "phone" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {step === "phone" ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3
                                     text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)]
                                     focus:outline-none focus:border-[var(--color-accent)]/50 transition-all"
                        />
                        <p className="text-[10px] text-[var(--color-text-dim)] text-center">
                          Include country code, e.g. +91 for India
                        </p>
                        <div id="recaptcha-container" ref={recaptchaContainerRef} />
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 rounded-xl text-sm font-bold text-white
                                     bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                                     hover:opacity-90 active:scale-[0.98] transition-all shadow-md
                                     disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loading ? "Sending OTP..." : "Send OTP →"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <p className="text-xs text-[var(--color-text-muted)] text-center mb-2">
                          Enter the 6-digit code sent to <span className="text-white font-mono">{phone}</span>
                        </p>
                        <input
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          required
                          maxLength={6}
                          className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-4 py-3
                                     text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)]
                                     focus:outline-none focus:border-[var(--color-accent)]/50 transition-all text-center
                                     tracking-[0.3em] font-mono text-lg"
                        />
                        <button
                          type="submit"
                          disabled={loading || otp.length < 6}
                          className="w-full py-3 rounded-xl text-sm font-bold text-white
                                     bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-cyan)]
                                     hover:opacity-90 active:scale-[0.98] transition-all shadow-md
                                     disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loading ? "Verifying..." : "Verify OTP ✓"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStep("phone"); setOtp(""); setError(null); }}
                          className="w-full text-xs text-[var(--color-text-muted)] hover:text-white transition-colors"
                        >
                          ← Change number
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={closeAuthModal}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg
                           text-[var(--color-text-dim)] hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
