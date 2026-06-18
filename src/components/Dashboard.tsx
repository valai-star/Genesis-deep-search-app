import React, { useState } from "react";
import { Search, Plus, Calendar, HelpCircle, FileText, TrendingUp, ShieldAlert, BookOpen, Trash2 } from "lucide-react";
import { ModePreference, PortfolioHolding } from "../types";

interface DashboardProps {
  mode: ModePreference;
  onSearch: (ticker: string) => void;
  personalSources: { [ticker: string]: string[] };
  onAddPersonalSource: (ticker: string, url: string) => void;
  onRemovePersonalSource: (ticker: string, index: number) => void;
  watchlist: string[];
  onRemoveFromWatchlist: (ticker: string) => void;
  portfolio: PortfolioHolding[];
  onSaveHolding: (ticker: string, shares: number, avgCost: number) => void;
  onRemoveHolding: (ticker: string) => void;
}

export default function Dashboard({
  mode,
  onSearch,
  personalSources,
  onAddPersonalSource,
  onRemovePersonalSource,
  watchlist,
  onRemoveFromWatchlist,
  portfolio,
  onSaveHolding,
  onRemoveHolding,
}: DashboardProps) {
  const [searchInput, setSearchInput] = useState("");
  const [showLearningQuestion, setShowLearningQuestion] = useState(false);
  const [learningUrlInput, setLearningUrlInput] = useState("");
  
  // States to add new holding
  const [newHoldTicker, setNewHoldTicker] = useState("");
  const [newHoldShares, setNewHoldShares] = useState<number | "">("");
  const [newHoldCost, setNewHoldCost] = useState<number | "">("");

  const handlePreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    // Auto prompt user for learning question
    setShowLearningQuestion(true);
  };

  const handleSkipLearning = () => {
    onSearch(searchInput.toUpperCase());
    setShowLearningQuestion(false);
    setSearchInput("");
  };

  const handleAcceptLearning = () => {
    if (learningUrlInput.trim()) {
      onAddPersonalSource(searchInput.toUpperCase(), learningUrlInput.trim());
    }
    onSearch(searchInput.toUpperCase());
    setLearningUrlInput("");
    setShowLearningQuestion(false);
    setSearchInput("");
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoldTicker || !newHoldShares || !newHoldCost) return;
    onSaveHolding(
      newHoldTicker.toUpperCase(),
      Number(newHoldShares),
      Number(newHoldCost)
    );
    setNewHoldTicker("");
    setNewHoldShares("");
    setNewHoldCost("");
  };

  const isExpert = mode === ModePreference.EXPERT;
  const isGenesis = mode === ModePreference.GENESIS;

  const quickTickers = ["NVDA", "AAPL", "TSLA", "MSFT", "AMD", "PLTR", "TSMC", "MU"];

  return (
    <div className="space-y-8">
      {/* Search Console HUD */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-cyan-500/5 blur-3xl rounded-full -ml-32 -mb-32"></div>

        <div className="relative max-w-2xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-3 py-1 rounded-full uppercase">
            SEC EDGAR / FRED / COMMODITIES / CHAT RADAR INTERFACE
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">
            Launch Deep Intelligence Scan
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Input a stock ticker to query financial fundamentals, social calendars, SEC filing notes, and real-time competitor ripple maps.
          </p>

          {/* Search bar */}
          {!showLearningQuestion ? (
            <form onSubmit={handlePreSearch} className="flex flex-col sm:flex-row gap-2 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter Stock Ticker (e.g. NVDA, PLTR, AAPL)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-700 bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none transition font-mono uppercase ${
                    isGenesis ? "focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]/20" : "focus:border-[#FF9100] focus:ring-1 focus:ring-[#FF9100]/20"
                  }`}
                  required
                />
              </div>
              <button
                type="submit"
                className={`px-6 py-3.5 rounded-xl font-display font-bold transition-all duration-300 active:scale-[0.98] shadow-lg flex items-center justify-center gap-1.5 ${
                  isGenesis 
                    ? "bg-[#00E5FF] hover:bg-[#00D0EB] text-slate-950 shadow-cyan-500/10 hover:shadow-cyan-500/20" 
                    : "bg-[#FF9100] hover:bg-[#E08000] text-slate-950 shadow-amber-500/10 hover:shadow-amber-500/20"
                }`}
              >
                SCAN & INTERPRET
              </button>
            </form>
          ) : (
            /* Gemini Context-Caching Source registration */
            <div className={`mt-6 p-5 rounded-xl border text-left space-y-4 shadow-xl animate-fade-in ${
              isGenesis ? "border-[#00E5FF]/40 bg-[#00E5FF]/5" : "border-[#FF9100]/40 bg-[#FF9100]/5"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded mt-0.5 border ${
                  isGenesis ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20" : "bg-[#FF9100]/10 text-[#FF9100] border-[#FF9100]/20"
                }`}>
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-semibold text-white font-display">
                    Gemini Context Cache Engine for <span className={`${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"} font-mono font-bold`}>{searchInput.toUpperCase()}</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Prior to executing this intelligence query, register any research portals, premium publications, news feeds, or financial websites into Gemini's persistent context-caching layer. Gemini will officially execute learning, URL mapping, and personalized memory tracking for subsequent sweeps.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <input
                  type="url"
                  placeholder="https://example.com/newsletter or NicheBlogName..."
                  value={learningUrlInput}
                  onChange={(e) => setLearningUrlInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#040812] text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  autoFocus
                />
                
                <div className="flex justify-end gap-2 text-xs font-mono">
                  <button
                    onClick={handleSkipLearning}
                    className="px-3.5 py-2 rounded bg-[#0b1329] border border-slate-850 hover:bg-[#14234c] text-slate-400 hover:text-slate-200"
                  >
                    No personal list (Proceed)
                  </button>
                  <button
                    onClick={handleAcceptLearning}
                    className={`px-3.5 py-2 rounded text-slate-950 font-bold ${
                      isGenesis ? "bg-[#00E5FF] hover:bg-[#00D0EB]" : "bg-[#FF9100] hover:bg-[#E08000]"
                    }`}
                  >
                    Commit to Gemini Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick recommendations */}
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">POPULAR TECH SECURITIES:</span>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {quickTickers.map((tick) => (
                <button
                  key={tick}
                  onClick={() => {
                    setSearchInput(tick);
                    setShowLearningQuestion(true);
                  }}
                  className="text-xs bg-slate-950/40 hover:bg-slate-950 hover:border-slate-600 text-slate-300 font-mono px-3 py-1 rounded border border-slate-800"
                >
                  {tick}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
