import { useState } from "react";
import { ModePreference } from "../types";
import { Sparkles, Shield, Cpu, Activity, Clock, Image as ImageIcon, Check, X, Edit2, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { User } from "firebase/auth";

interface HeaderProps {
  mode: ModePreference;
  onToggleMode: (mode: ModePreference) => void;
  watchlist: string[];
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
  onOpenArchive: () => void;
  onOpenGuardian: () => void;
  view: "briefing" | "research" | "guardian" | "archive" | "correlation";
  onChangeView: (view: "briefing" | "research" | "guardian" | "archive" | "correlation") => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  authLoading: boolean;
}

export default function Header({
  mode,
  onToggleMode,
  watchlist,
  activeTicker,
  onSelectTicker,
  onOpenArchive,
  onOpenGuardian,
  view,
  onChangeView,
  user,
  onSignIn,
  onSignOut,
  authLoading,
}: HeaderProps) {
  const isExpert = mode === ModePreference.EXPERT;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            {/* Styled Logo Emblem with Dynamic Glow Aura Syncing with Global Color Toggle */}
            <div className={`h-10 w-10 rounded-lg overflow-hidden border bg-[#03060f] flex items-center justify-center p-0.5 transition-all duration-500 ${
              !isExpert 
                ? "border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.25)] animate-pulse" 
                : "border-[#FF9100]/40 shadow-[0_0_15px_rgba(255,145,0,0.25)]"
            }`}>
              <img 
                src="/src/assets/images/genesis_logo_detective_1781484329478.jpg" 
                alt="Genesis Detective Logo" 
                className="h-full w-full object-contain scale-110 select-none transition-transform duration-300 group-hover:scale-125"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-wide">
                GENESIS
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors duration-300 font-semibold tracking-wider ${
                !isExpert 
                  ? "border-cyan-800 bg-cyan-950/40 text-cyan-400" 
                  : "border-amber-800 bg-amber-950/40 text-amber-400"
              }`}>
                V3.5 INTEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Hedge fund intelligence & CIA-level strategic market interpretation
            </p>
          </div>
        </div>



        {/* Universal Mode Toggle Switches & Auth Widget */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {/* Active Mode Banner */}
          <div className="text-right hidden lg:block">
            <span className="text-[10px] text-slate-500 font-mono block">RUNNING PROFILE</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {isExpert ? "RAW EXPERT METRICS" : "COHESIVE CEO BRIEFS"}
            </span>
          </div>

          <div className="p-1 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center gap-1 shadow-inner font-mono">
            <button
              onClick={() => onToggleMode(ModePreference.GENESIS)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs px-2.5 transition-all duration-300 font-semibold ${
                !isExpert
                  ? "bg-[#00E5FF] text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Genesis Mode
            </button>
            <button
              onClick={() => onToggleMode(ModePreference.EXPERT)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs px-2.5 transition-all duration-300 font-semibold ${
                isExpert
                  ? "bg-[#FF9100] text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="h-3 w-3" />
              Expert Mode
            </button>
          </div>

          <div className="border-l border-slate-800 h-6 hidden sm:block"></div>

          {/* Secure Firebase Auth Section */}
          <div className="flex items-center gap-1.5 font-mono">
            {authLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse"></span>
                <span>Connecting...</span>
              </div>
            ) : user ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-750 bg-slate-950/60 text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="h-5 w-5 rounded-full object-cover border border-slate-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <UserIcon className="h-3 w-3 text-slate-400" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-[9px] text-slate-500 leading-none">SECURED ACCOUNT</div>
                  <div className="text-[10px] text-slate-200 font-bold max-w-[120px] truncate leading-tight">{user.email}</div>
                </div>
                <button
                  onClick={onSignOut}
                  title="Disconnect Cloud Sync"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all ml-1 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-inner transition-all duration-300 cursor-pointer ${
                  !isExpert
                    ? "border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10 active:bg-[#00E5FF]/20"
                    : "border-[#FF9100]/40 text-[#FF9100] hover:bg-[#FF9100]/10 active:bg-[#FF9100]/20"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Cloud Sync</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Watchlist tickers marquee strip */}
      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-2.5 pt-2 flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-xs">
        <span className="text-slate-500 flex items-center gap-1 text-[10px] tracking-wider uppercase font-bold shrink-0">
          <Activity className="h-3.5 w-3.5 text-cyan-500 animate-pulse" /> Active Radar:
        </span>
        <div className="flex items-center gap-2">
          {watchlist.map((tick) => (
            <button
              key={tick}
              onClick={() => {
                onSelectTicker(tick);
                onChangeView("research");
              }}
              className={`px-2.5 py-1 rounded border transition font-bold shrink-0 text-xs flex items-center gap-1.5 ${
                activeTicker === tick
                  ? "border-emerald-500 bg-emerald-950/20 text-emerald-400"
                  : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700"
              }`}
            >
              <span>{tick}</span>
              <span className="text-[10px] font-normal text-emerald-500">&#x25B2;</span>
            </button>
          ))}
        </div>
        <div className="border-l border-slate-800 h-4 mx-2"></div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1 ml-auto shrink-0 uppercase font-bold">
          <Clock className="h-3 w-3" /> EST Market Time: June 14, 2026
        </div>
      </div>
    </header>
  );
}
