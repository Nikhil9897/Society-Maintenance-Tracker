import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BlueprintSVG } from '../components/BlueprintSVG';

import { Variants } from 'framer-motion';

type Mode = 'login' | 'register';
type Role = 'resident' | 'admin';

const inputVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
};

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('resident');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', name: '', flat_number: '',
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const setField = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.name, form.flat_number, role);
      }
      setSuccess(true);
      setTimeout(() => {
        const storedUser = localStorage.getItem('society_user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/resident');
        }
      }, 700);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.');
      // Shake animation via class toggle handled by error state on form
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError('');
    setForm({ email: '', password: '', name: '', flat_number: '' });
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blueprint motif */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <BlueprintSVG size={700} opacity={0.05} />
      </div>

      {/* Back to landing */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-slate hover:text-parchment transition-colors"
        aria-label="Back to homepage"
      >
        <ArrowLeft size={14} />
        <span className="font-mono text-xs tracking-wide">SocioSphere</span>
      </Link>

      {/* Auth card */}
      <motion.div
        className="relative z-10 w-full"
        style={{ maxWidth: mode === 'register' ? '440px' : '400px' }}
        layout
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="rounded-xl border border-parchment/10 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)' }}
          layout
        >
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-parchment/10">
            <motion.div layout className="mb-5">
              <span
                className="font-display text-2xl text-parchment block"
                style={{ fontVariationSettings: '"SOFT" 50, "opsz" 24' }}
              >
                SocioSphere
              </span>
            </motion.div>

            {/* Mode tabs */}
            <div
              className="flex rounded-lg p-1 relative"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              role="tablist"
            >
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2 text-sm font-medium rounded-md relative z-10 transition-colors duration-200"
                  style={{ color: mode === m ? '#F6F4EF' : 'rgba(246,244,239,0.4)' }}
                >
                  {m === 'login' ? 'Sign in' : 'Register'}
                  {mode === m && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <motion.div className="px-8 py-6" layout>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  className="flex flex-col items-center justify-center py-8 gap-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(22,163,74,0.15)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                  >
                    <Check size={24} className="text-status-resolved" />
                  </motion.div>
                  <span className="text-parchment text-sm font-medium">
                    {mode === 'login' ? 'Welcome back!' : 'Account created!'} Redirecting…
                  </span>
                </motion.div>
              ) : (
                <motion.form
                  key={mode}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Register-only: name + flat */}
                  <AnimatePresence>
                    {mode === 'register' && (
                      <>
                        <motion.div
                          key="name"
                          custom={0}
                          variants={inputVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <label className="text-xs text-slate block mb-1.5 font-medium">Full name</label>
                          <input
                            className="input-field"
                            type="text"
                            placeholder="Priya Malhotra"
                            value={form.name}
                            onChange={e => setField('name', e.target.value)}
                            required
                            autoComplete="name"
                          />
                        </motion.div>

                        <motion.div
                          key="flat"
                          custom={1}
                          variants={inputVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <label className="text-xs text-slate block mb-1.5 font-medium">Flat / unit number</label>
                          <input
                            className="input-field"
                            type="text"
                            placeholder="B-204"
                            value={form.flat_number}
                            onChange={e => setField('flat_number', e.target.value)}
                            autoComplete="off"
                          />
                        </motion.div>

                        {/* Single Admin info badge / Resident role */}
                        <motion.div
                          key="role"
                          custom={2}
                          variants={inputVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="p-3 rounded-lg bg-white/[0.03] border border-parchment/10 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-semibold text-parchment block">Resident Account</span>
                            <span className="text-[11px] text-parchment/60 font-mono block">
                              Unit / Flat Member Portal
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-brass bg-brass/10 border border-brass/25 px-2 py-0.5 rounded uppercase">
                            Resident
                          </span>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <motion.div custom={mode === 'login' ? 0 : 3} variants={inputVariants} initial="hidden" animate="visible">
                    <label className="text-xs text-slate block mb-1.5 font-medium">Email address</label>
                    <input
                      className={`input-field ${error ? 'input-error' : ''}`}
                      type="email"
                      placeholder="you@society.in"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div custom={mode === 'login' ? 1 : 4} variants={inputVariants} initial="hidden" animate="visible">
                    <label className="text-xs text-slate block mb-1.5 font-medium">Password</label>
                    <div className="relative">
                      <input
                        className={`input-field pr-12 ${error ? 'input-error' : ''}`}
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => setField('password', e.target.value)}
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate hover:text-parchment transition-colors"
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        className="text-xs text-status-overdue text-center py-2 px-3 rounded-lg"
                        style={{ background: 'rgba(220,38,38,0.1)' }}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="btn-brass w-full py-3.5 mt-1 justify-center"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : mode === 'login' ? 'Sign in' : 'Create account'}
                  </motion.button>

                  {/* Switch mode hint */}
                  <p className="text-center text-xs text-slate mt-1">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="text-brass hover:underline transition-all"
                    >
                      {mode === 'login' ? 'Register' : 'Sign in'}
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Brass divider below card */}
        <div className="mt-6 flex items-center gap-4 px-2">
          <span className="h-px flex-1" style={{ background: 'rgba(201,164,104,0.15)' }} />
          <span className="text-2xs font-mono text-slate/50 tracking-widest">SECURE · ENCRYPTED</span>
          <span className="h-px flex-1" style={{ background: 'rgba(201,164,104,0.15)' }} />
        </div>
      </motion.div>
    </div>
  );
};
