"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { checkEmail, loginUser, registerUser } from "@/app/actions/auth";
import { toast } from "react-toastify";
import { useGameStore } from "@/lib/store";

export default function AuthPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "login" | "register" | "verify">("email");
  
  // Login fields
  const [password, setPassword] = useState("");
  
  // Register fields
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const loginPassRef = useRef<HTMLInputElement>(null);
  const registerUserRef = useRef<HTMLInputElement>(null);
  const registerPassRef = useRef<HTMLInputElement>(null);
  const registerConfirmRef = useRef<HTMLInputElement>(null);
  const registerBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Small timeout ensures the DOM node is mounted and framer-motion hasn't blocked focus
    const timeout = setTimeout(() => {
      if (step === "email") emailRef.current?.focus();
      else if (step === "login") loginPassRef.current?.focus();
      else if (step === "register") registerUserRef.current?.focus();
    }, 50);
    return () => clearTimeout(timeout);
  }, [step]);

  const router = useRouter();

  const handleTab = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement | null>) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    const res = await checkEmail(email);
    if (res.exists) {
      setStep("login");
    } else {
      setStep("register");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginUser(email, password);
    if (res.success) {
      router.push(activeGame ? "/feed" : "/select");
    } else {
      toast.error(res.error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const res = await registerUser(email, username, password);
    if (res.success) {
      router.push(activeGame ? "/feed" : "/select");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <main className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#050505] px-4">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-white/5 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-neutral-900/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <Image src="/hatake_logo.png" alt="Hatake.Social Logo" width={200} height={80} className="object-contain mb-6" unoptimized />
          <h1 className="font-serif text-2xl text-white tracking-widest uppercase">Hatake.Social</h1>
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-neutral-500 mt-2">Authentication</p>
        </div>

        {step === "email" && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Email Address</label>
              <input 
                ref={emailRef}
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-3 text-white font-sans focus:outline-none transition-colors"
                placeholder="collector@hatake.social"
              />
            </div>
            <button type="submit" className="mt-4 w-full py-4 bg-white text-black font-sans text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors">
              Continue
            </button>
          </motion.form>
        )}

        {step === "login" && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Welcome Back</label>
              <p className="text-white font-serif">{email}</p>
            </div>
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Password</label>
              <input 
                ref={loginPassRef}
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-3 text-white font-sans focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button type="button" onClick={() => setStep("email")} className="w-1/3 py-4 border border-white/20 text-white font-sans text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">
                Back
              </button>
              <button type="submit" className="w-2/3 py-4 bg-white text-black font-sans text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors">
                Enter Realm
              </button>
            </div>
          </motion.form>
        )}

        {step === "register" && (
          <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleRegister} className="flex flex-col gap-6">
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">New Account</label>
              <p className="text-white font-serif">{email}</p>
            </div>
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Username</label>
              <input 
                ref={registerUserRef}
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => handleTab(e, registerPassRef)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-3 text-white font-sans focus:outline-none transition-colors"
                placeholder="LegendaryCollector"
              />
            </div>
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Password</label>
              <input 
                ref={registerPassRef}
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => handleTab(e, registerConfirmRef)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-3 text-white font-sans focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Confirm Password</label>
              <input 
                ref={registerConfirmRef}
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => handleTab(e, registerBtnRef)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white px-0 py-3 text-white font-sans focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button type="button" onClick={() => setStep("email")}  className="w-1/3 py-4 border border-white/20 text-white font-sans text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">
                Back
              </button>
              <button ref={registerBtnRef} type="submit" className="w-2/3 py-4 bg-white text-black font-sans text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors">
                Register
              </button>
            </div>
          </motion.form>
        )}

        {step === "verify" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 text-center py-8">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center text-white mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-white">Check Your Mail</h2>
            <p className="font-sans text-xs text-neutral-400 leading-relaxed max-w-xs">
              We've sent a verification link to <span className="text-white">{email}</span>. Please click the link to activate your vault.
            </p>
            <button onClick={() => setStep("email")} className="mt-6 font-sans text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors border-b border-white/20 pb-1">
              Start Over
            </button>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
