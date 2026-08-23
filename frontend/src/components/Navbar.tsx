import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-sky-500/20 to-blue-500/20 border border-sky-500/30 rounded-xl text-sky-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 leading-tight tracking-tight">
            Society Tracker
          </h1>
          <p className="text-xs text-slate-400">Green Valley Heights Residence</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              {user.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <UserIcon className="w-4 h-4 text-sky-400" />
              )}
              <span className="font-medium text-slate-200">{user.name}</span>
            </div>
            <span className="text-slate-600">•</span>
            <span
              className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                user.role === 'admin'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
              }`}
            >
              {user.role}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
