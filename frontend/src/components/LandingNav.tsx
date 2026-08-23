import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export const LandingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="section-wrap py-5 flex items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(16,25,46,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(246,244,239,0.07)' : '1px solid transparent',
        }}
      >
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2 no-underline" aria-label="SocioSphere home">
          <span
            className="font-display text-xl text-parchment"
            style={{ fontVariationSettings: '"SOFT" 50, "opsz" 18' }}
          >
            SocioSphere
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#dashboard" className="nav-link">Dashboard</a>
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="btn-brass text-sm py-2.5 px-6 shadow-md shadow-brass/10">Sign in</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-parchment p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden border-b border-parchment/10 px-6 py-6 flex flex-col gap-4"
            style={{ background: 'rgba(16,25,46,0.98)', backdropFilter: 'blur(20px)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <a
              href="#how-it-works"
              className="text-base text-parchment py-2 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-base text-parchment py-2 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </a>
            <a
              href="#dashboard"
              className="text-base text-parchment py-2 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </a>
            <div className="flex flex-col gap-3 pt-4 border-t border-parchment/10">
              <Link to="/login" className="btn-brass text-center py-3" onClick={() => setMobileOpen(false)}>Sign in</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
