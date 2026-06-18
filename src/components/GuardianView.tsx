import React, { useState } from "react";
import { ModePreference, PortfolioHolding, StockDossier } from "../types";
import {
  ShieldAlert,
  Sparkles,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Play,
  CheckCircle,
  TrendingDown,
  BookOpen,
  Trash2,
  HelpCircle,
  Plus
} from "lucide-react";

interface GuardianViewProps {
  mode: ModePreference;
  portfolio: PortfolioHolding[];
  onTriggerGuardianApi: (portfolioTickers: string[], eventName: string) => Promise<string>;
  onSaveHolding: (ticker: string, shares: number, avgCost: number) => void;
  onRemoveHolding: (ticker: string) => void;
  watchlist: string[];
  onRemoveFromWatchlist: (ticker: string) => void;
  onSearch: (ticker: string) => void;
  personalSources: { [ticker: string]: string[] };
  onRemovePersonalSource: (ticker: string, index: number) => void;
  archiveData: { [ticker: string]: StockDossier };
  guardianFilterTicker: string | null;
  onSelectGuardianFilterTicker: (ticker: string | null) => void;
}

export default function GuardianView({
  mode,
  portfolio,
  onTriggerGuardianApi,
  onSaveHolding,
  onRemoveHolding,
  watchlist,
  onRemoveFromWatchlist,
  onSearch,
  personalSources,
  onRemovePersonalSource,
  archiveData,
  guardianFilterTicker,
  onSelectGuardianFilterTicker,
}: GuardianViewProps) {
  const [activeAlerts, setActiveAlerts] = useState<Array<{
    id: string;
    ticker: string;
    eventName: string;
    modePreference: ModePreference;
    timestamp: string;
    summary: string;
  }>>([
    {
      id: "alert_pre_nvda",
      ticker: "NVDA",
      eventName: "Q2 Earnings Strategy Target",
      modePreference: ModePreference.GENESIS,
      timestamp: "10 minutes ago",
      summary: `Heads up — Nvidia reports their earnings in 3 days. Earnings is when a company tells the world how much money they made last quarter. Wall Street analysts are expecting Nvidia to report strong results, especially from their AI chip business. In the last 4 earnings reports, Nvidia's stock moved an average of 9% the day after. Based on your holdings in NVDA, Dell, and Micron — all three of these are historically sensitive to Nvidia's earnings results.`
    },
    {
      id: "alert_post_fed",
      ticker: "MACRO/FED",
      eventName: "Federal Reserve Decision Sweep",
      modePreference: ModePreference.GENESIS,
      timestamp: "2 hours ago",
      summary: `The Federal Reserve just decided to hold interest rates steady. In plain English: they chose not to raise or lower the cost of borrowing money. This is generally considered neutral-to-positive for growth stocks. For your portfolio — tech heavy weights historically react positively when the Fed holds rates, as cheaper borrowing tends to support infrastructure investment.`
    }
  ]);

  const [loadingAiAlert, setLoadingAiAlert] = useState(false);
  const [aiGeneratedAlert, setAiGeneratedAlert] = useState<string | null>(null);
  const [simulatedEventType, setSimulatedEventType] = useState<string>("NVDA Earnings Result");

  // Add holding state fields
  const [newHoldTicker, setNewHoldTicker] = useState("");
  const [newHoldShares, setNewHoldShares] = useState<number | "">("");
  const [newHoldCost, setNewHoldCost] = useState<number | "">("");

  const isGenesis = mode === ModePreference.GENESIS;

  const handleAddHoldingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoldTicker.trim() || newHoldShares === "" || newHoldCost === "") return;
    onSaveHolding(
      newHoldTicker.trim().toUpperCase(),
      Number(newHoldShares),
      Number(newHoldCost)
    );
    setNewHoldTicker("");
    setNewHoldShares("");
    setNewHoldCost("");
  };

  const runSimulation = async (eventName: string) => {
    setLoadingAiAlert(true);
    setAiGeneratedAlert(null);
    try {
      const tickers = portfolio.map((h) => h.ticker);
      const tickersToUse = tickers.length > 0 ? tickers : ["NVDA", "DELL", "MU"];
      const briefOutput = await onTriggerGuardianApi(tickersToUse, eventName);
      
      setAiGeneratedAlert(briefOutput);

      // Prepend to active alerts log as well (extract plain brief if JSON)
      let summaryText = briefOutput;
      try {
        if (briefOutput.trim().startsWith("{")) {
          const parsed = JSON.parse(briefOutput);
          summaryText = parsed.genesis_brief || parsed.event_summary || briefOutput;
        }
      } catch (e) {
        // fail-safe
      }

      const newAlert = {
        id: "alert_sim_" + Date.now(),
        ticker: eventName.includes("Fed") ? "MACRO" : (tickersToUse[0] || "PORTFOLIO"),
        eventName: eventName,
        modePreference: mode,
        timestamp: "Just Now",
        summary: summaryText,
      };
      
      setActiveAlerts(prev => [newAlert, ...prev]);
    } catch (e) {
      console.error(e);
      setAiGeneratedAlert("Unexpected error. Check if your API key is correctly configured.");
    } finally {
      setLoadingAiAlert(false);
    }
  };

  const isExpert = mode === ModePreference.EXPERT;

  // Derive dynamic overnight alert briefs from watchlist items
  const generateWatchlistBriefs = () => {
    return watchlist.map((ticker) => {
      const dossier = archiveData[ticker];
      
      const price = dossier?.compartments.marketOverview.price || 150.0;
      const change = dossier?.compartments.marketOverview.changePercent || 0.0;
      const newsEvents = dossier?.compartments.newsEvents || [];
      const latestNews = newsEvents[0];
      const calendarEvents = dossier?.compartments.upcomingCalendar || [];
      const vwap = (price * 1.0004).toFixed(4);

      return {
        ticker,
        price,
        change,
        latestNews,
        calendarEvents,
        vwap,
        hasHolding: portfolio.some(h => h.ticker === ticker),
      };
    });
  };

  const alertMatrix = generateWatchlistBriefs();

  const filteredAlerts = guardianFilterTicker
    ? activeAlerts.filter(alert => alert.ticker.toUpperCase() === guardianFilterTicker.toUpperCase())
    : activeAlerts;

  return (
    <div className="space-y-6 animate-fade-in" id="portfolio-guardian-container">
      {/* Guardian Banner and Summary block */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full"></div>
        
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-900/40">
            Automated Watchlist Safeguard & Ripple Radar
          </span>
          <h2 className="text-2xl font-display font-bold text-white tracking-wide">
            Portfolio Guardian
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Guardian actively monitors the SEC repository, Federal Open Market Committee schedules, and supply-chain dependencies. 
            When a verified trigger occurs, Genesis alerts your watchlisted assets using the presentation modes configured below.
          </p>
        </div>

        {/* Status card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 font-mono text-xs text-slate-400 shrink-0 space-y-2 self-start md:self-center">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle className="h-4 w-4 text-emerald-400" /> GUARDIAN ACTIVE
          </div>
          <div>Watchlist count: {watchlist.length} items</div>
          <div>Crawl speed: 1.5 seconds latency</div>
        </div>
      </div>

      {/* SECTION B: Overnight Alert Matrix (Watchlisted stock updates) */}
      <div className="space-y-4 border-t border-slate-900 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-display font-medium text-white tracking-tight flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-cyan-400" /> Overnight Alert Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Live automated matching signals across stock ticker watches ({watchlist.length} items currently).
            </p>
          </div>
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {portfolio.length} ACTIVE POSITIONS SECURED
            </span>
          </div>
        </div>

        {alertMatrix.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs font-mono uppercase">
            No stock tickers currently flagged on your Watchlist. Go to Deep Research or add a ticker to see Overnight technical matrices here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alertMatrix.map((item) => (
              <div 
                key={item.ticker}
                className={`p-5 rounded-xl border bg-slate-900/25 transition flex flex-col justify-between h-full group ${
                  item.hasHolding 
                    ? "border-emerald-800/60 bg-emerald-950/5 hover:border-emerald-500/50" 
                    : "border-slate-800 bg-slate-900/20 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-white tracking-wider">
                        {item.ticker}
                      </span>
                      {item.hasHolding && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-400 font-mono text-[8px] font-bold uppercase tracking-wider">
                          ACTIVE HOLDING
                        </span>
                      )}
                    </div>
                    <div className="text-right font-mono text-[11.5px]">
                      <span className="text-slate-300 font-semibold">${item.price.toFixed(2)}</span>
                      <span className={`ml-1.5 font-bold ${item.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* News Signal section */}
                  {item.latestNews ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-cyan-400 font-bold uppercase tracking-wider">// LATEST SEC OVERNIGHT INGEST</span>
                        <span className="text-slate-500">{item.latestNews.date}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-100 font-display line-clamp-2 leading-relaxed">
                        {item.latestNews.headline}
                      </h4>
                      
                      {!isExpert ? (
                        <p className="text-slate-400 text-[11px] leading-relaxed pt-1 line-clamp-3 font-sans">
                          {item.latestNews.translatedContent || item.latestNews.originalContent}
                        </p>
                      ) : (
                        <div className="p-2.5 bg-slate-950 border border-slate-900 rounded font-mono text-[9px] text-slate-400 space-y-1">
                          <div className="truncate">CRAWL SOURCE: <span className="text-white">{item.latestNews.source}</span></div>
                          <div className="truncate">IMPACT METRIC: <span className="text-rose-400 font-bold">{item.latestNews.impact.toUpperCase()}</span></div>
                          <div className="truncate">VWAP LEVEL: <span className="text-white">${item.vwap}</span></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[11px] text-slate-500 italic font-mono uppercase">
                      No overnight reports index matches. Tracking active.
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-900/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 text-[9px] uppercase font-bold">
                    {item.calendarEvents.length > 0 ? `📅 ${item.calendarEvents.length} EVENT(S)` : "📅 NO EVENTS"}
                  </span>
                  <button
                    onClick={() => onSearch(item.ticker)}
                    className="text-cyan-400 hover:text-cyan-300 transition inline-flex items-center gap-1 text-[10px] font-bold"
                  >
                    RESEARCH FILE <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: 12-Column split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Trigger simulation & Logs (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Simulator Console */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/30 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 font-display flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-cyan-400" /> Trigger Guardian Agent Simulator
            </h3>
            
            <p className="text-xs text-slate-500">
              Force-simulate major geopolitical or corporate economic events. Watch Genesis process how these ripple changes impact your current registered portfolio: <strong className="text-white">{portfolio.length > 0 ? portfolio.map(h => h.ticker).join(", ") : "NVDA, DELL, MU (Defaults)"}</strong>.
            </p>

            <div className="space-y-3 pt-2">
              <label className="text-[10.5px] text-slate-400 block font-mono">CHOOSE EVENT TO TRIGGER</label>
              <select
                value={simulatedEventType}
                onChange={(e) => setSimulatedEventType(e.target.value)}
                className="w-full text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Nvidia Beats and Raises guidance (Earnings beat)">Nvidia Beats Q1 earnings and raises full-year guidance</option>
                <option value="Federal Reserve Holds Interest Rates steady">Federal Reserve chooses to hold interest rates steady</option>
                <option value="Taiwan Chip manufacturing delay report to SEC">Taiwan foundry experiences sudden 3nm wafer allocations delay</option>
                <option value="Dell enterprise server GPU deployment surges">Dell Enterprise hardware division secures massive cloud GPU contracts</option>
              </select>

              <button
                onClick={() => runSimulation(simulatedEventType)}
                disabled={loadingAiAlert}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-mono text-xs text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loadingAiAlert ? (
                  <span className="animate-spin text-sm block">&#x21BB; Running AI Simulation...</span>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> Fire Guardian Alert Simulation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Presentation Preferences */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 font-mono text-xs">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">GUARDIAN INTELLIGENCE RUNTIME EXPLANATIONS</span>
            <div className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <div className="border-l-2 border-emerald-500 pl-2">
                <span className="text-white font-bold block">Genesis Mode Feed</span>
                Shows plain English descriptions & explainers. Deconstructs complex acronyms (like Guidance, beat estimates, macro interest rate adjustments), then links directly to corresponding watchlisted stocks so beginner investors aren't left struggling with "What does this mean for NVDA?".
              </div>
              <div className="border-l-2 border-slate-600 pl-2 mt-3">
                <span className="text-white font-bold block">Expert Mode Feed</span>
                Displays target percentage bounds, actual-to-estimate EPS charts, implied volatility pricing indices, option contracts, and strict SEC metadata. Designed for swift, self-guided execution.
              </div>
            </div>
          </div>

          {/* Guardian Event Alerts feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono text-slate-400 font-bold uppercase tracking-widest pl-1 flex flex-wrap items-center gap-1.5">
                <Activity className="h-4 w-4 text-cyan-400 animate-pulse" /> Live Guardian Feed logs
                {guardianFilterTicker && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isGenesis
                      ? "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "border-[#FF9100]/30 bg-[#FF9100]/10 text-[#FF9100]"
                  }`}>
                    FILTER: {guardianFilterTicker}
                    <button
                      onClick={() => onSelectGuardianFilterTicker(null)}
                      className="hover:text-white font-bold ml-1 text-xs cursor-pointer focus:outline-none"
                      title="Clear Filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500 font-mono">ORDERED BY TIMESTAMP</span>
            </div>

            {aiGeneratedAlert && (!guardianFilterTicker || simulatedEventType.toUpperCase().includes(guardianFilterTicker.toUpperCase())) && (() => {
              let parsed: any = null;
              try {
                if (aiGeneratedAlert.trim().startsWith("{")) {
                  parsed = JSON.parse(aiGeneratedAlert);
                }
              } catch (e) {
                // Not JSON text
              }

              if (!parsed) {
                return (
                  <div className="p-5 rounded-xl border border-emerald-500 bg-[#060b13] space-y-3 relative overflow-hidden animate-fade-in text-xs font-sans text-slate-300 leading-normal whitespace-pre-wrap">
                    {aiGeneratedAlert}
                  </div>
                );
              }

              return (
                <div className="p-6 rounded-xl border border-emerald-500 bg-[#060b13] space-y-5 relative overflow-hidden animate-fade-in shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  
                  {/* Top Header Row */}
                  <div className="flex justify-between items-center text-[10.5px] font-mono border-b border-slate-900 pb-2.5">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-extrabold border border-emerald-800 uppercase flex items-center gap-1.5 animate-pulse">
                      <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" /> GUARDIAN RIPPLE REPORT COMPLETE
                    </span>
                    <span className="text-slate-500">REAL-TIME INGEST SYNCHRONIZED</span>
                  </div>

                  {/* Title and overall signal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold uppercase ${
                        parsed.event_signal === "bullish" 
                          ? "border-emerald-800 bg-emerald-950/40 text-emerald-400" 
                          : parsed.event_signal === "bearish"
                          ? "border-rose-800 bg-rose-950/40 text-[#ff4a4a]"
                          : "border-slate-800 bg-slate-900/40 text-slate-400"
                      }`}>
                        DIRECTIVE: {parsed.event_signal}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white font-display uppercase tracking-wide">
                      Ripple Alert: {parsed.event_title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans italic">
                      {parsed.event_summary}
                    </p>
                  </div>

                  {/* CEO brief */}
                  <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-900 space-y-2">
                    <span className="text-[9.5px] font-mono text-cyan-400 tracking-wider block font-bold uppercase">// GENESIS AI BRIEFING</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {parsed.genesis_brief}
                    </p>
                  </div>

                  {/* Holdings Impacts */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono text-slate-500 tracking-wider block font-bold uppercase border-b border-slate-905 pb-1.5">
                      Watchlist Portfolio Assets Impact Assessment
                    </span>
                    
                    <div className="space-y-3">
                      {parsed.holdings_impact.map((h: any, idx: number) => {
                        const isHigh = h.severity === "HIGH";
                        const isMed = h.severity === "MEDIUM";
                        return (
                          <div key={idx} className="p-3.5 rounded-lg border border-slate-900 bg-slate-950/40 space-y-2 text-xs font-sans leading-normal">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white font-bold">{h.ticker}</span>
                                <span className="text-[10.5px] text-slate-500">({h.company})</span>
                                <span className="text-[9px] font-mono text-slate-505 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800 lowercase">
                                  {h.connection} connection
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border leading-none uppercase ${
                                  isHigh 
                                    ? "border-rose-900 bg-rose-950/30 text-[#ff4a4a] animate-pulse" 
                                    : isMed 
                                    ? "border-amber-900 bg-amber-950/30 text-amber-400" 
                                    : "border-slate-800 bg-slate-900/30 text-slate-400"
                                }`}>
                                  {h.severity} SEVERITY
                                </span>
                                <span className={`text-[10px] font-mono font-bold ${
                                  h.direction === "positive" 
                                    ? "text-emerald-400" 
                                    : h.direction === "negative" 
                                    ? "text-red-400" 
                                    : "text-slate-400"
                                }`}>
                                  {h.direction === "positive" ? "▲ POSITIVE" : h.direction === "negative" ? "▼ NEGATIVE" : "⚖ MIXED"}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-300 leading-relaxed font-sans">{h.reason}</p>
                            <p className="text-[11px] text-slate-450 leading-relaxed font-sans border-t border-slate-950 pt-1.5">
                              <span className="text-cyan-400 font-mono text-[9.5px] font-bold tracking-widest">WHAT TO WATCH:</span> {h.what_to_watch}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ripple outside watchlist */}
                  {parsed.ripple_outside_portfolio && parsed.ripple_outside_portfolio.length > 0 && (
                    <div className="space-y-2 pt-1 font-sans">
                      <span className="text-[10px] font-mono text-slate-500 tracking-wider block font-bold uppercase border-b border-slate-900 pb-1">
                        Out-of-Portfolio Correlation Vectors
                      </span>
                      <div className="space-y-2 text-xs">
                        {parsed.ripple_outside_portfolio.map((op: any, index: number) => (
                          <div key={index} className="flex gap-2 items-start text-xs leading-relaxed">
                            <span className="text-[#00E5FF] font-black shrink-0 mt-0.5 font-mono">&rarr;</span>
                            <div className="leading-relaxed text-slate-400">
                              <strong className="text-white font-mono">{op.ticker}</strong> ({op.name}): <span className={op.direction === "positive" ? "text-emerald-400 font-bold" : op.direction === "negative" ? "text-red-400 font-bold" : "text-slate-300 font-bold"}>{op.direction} impact</span> &bull; {op.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guardian note */}
                  <div className="p-3 bg-slate-950/80 rounded border border-slate-900 text-[10.5px] font-mono text-slate-540 leading-normal flex items-start gap-1.5">
                    <HelpCircle className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>ADVISORY CLEARANCE NOTICE:</strong> {parsed.guardian_note}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs font-mono uppercase bg-slate-950/20">
                  No guardian feed alert logs match ticker "{guardianFilterTicker}". Click "✕" above to clear the filter.
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-bold border border-slate-800 uppercase">
                        {alert.ticker}
                      </span>
                      <span className="text-slate-500">{alert.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-mono font-bold text-slate-100 uppercase">
                      {alert.eventName}
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {alert.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-slate-900/60">
                      <span className="text-slate-500">SYSTEM PREFERENCE APPLIED: {mode.toUpperCase()} MODE</span>
                      <div className="text-slate-400 flex items-center gap-1">
                        <span>Targeted holdings:</span>
                        <span className="text-slate-200 font-bold">
                          {portfolio.length > 0 ? portfolio.map(h => h.ticker).join(", ") : "NVDA, DELL, MU"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Nested Asset/Watchlist Management (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Holdings Manager */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-5">
            <div className="space-y-0.5 border-b border-slate-900 pb-3">
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-1.5 font-display">
                <TrendingUp className="h-4 w-4 text-cyan-400" /> Active Holdings & Positions
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Secure your financial assets to model correlation offsets dynamically inside the feedback loop.
              </p>
            </div>

            {/* Active holdings list */}
            {portfolio.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-800/80 rounded-lg text-slate-500 text-xs font-mono">
                No active holdings declared.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-900 rounded-lg">
                <table className="w-full text-left font-mono text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[9px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5">Ticker</th>
                      <th className="p-2.5">Shares</th>
                      <th className="p-2.5">Avg Cost</th>
                      <th className="p-2.5 text-right">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {portfolio.map((hold) => (
                      <tr key={hold.ticker} className="hover:bg-slate-900/30 transition">
                        <td className="p-2.5 font-bold text-emerald-400">{hold.ticker}</td>
                        <td className="p-2.5">{hold.shares}</td>
                        <td className="p-2.5">${hold.avgCost.toFixed(2)}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => onRemoveHolding(hold.ticker)}
                            className="text-rose-500 hover:text-rose-400 text-[10px]"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add stock holding to model */}
            <form onSubmit={handleAddHoldingSubmit} className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/80 space-y-3 font-mono text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Add Stock Holding to Model</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">TICKER</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DELL"
                    value={newHoldTicker}
                    onChange={(e) => setNewHoldTicker(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-800 bg-slate-950 uppercase focus:border-cyan-500 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">SHARES</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={newHoldShares}
                    onChange={(e) => setNewHoldShares(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded border border-slate-800 bg-slate-950 focus:border-cyan-500 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block mb-1">COST</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.1"
                    placeholder="120.00"
                    value={newHoldCost}
                    onChange={(e) => setNewHoldCost(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded border border-slate-800 bg-slate-950 focus:border-cyan-500 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold rounded hover:brightness-110 active:scale-[0.99] transition text-center font-display"
              >
                + Initialize Safeguard
              </button>
            </form>
          </div>

          {/* Watchlist Directory */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide flex items-center gap-1.5 font-display">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Watchlist Directory
            </h3>

            {watchlist.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No watchlisted stocks yet.</p>
            ) : (
              <div className="space-y-2">
                {watchlist.map((ticker) => {
                  const sources = personalSources[ticker] || [];
                  const isFiltered = guardianFilterTicker?.toUpperCase() === ticker.toUpperCase();
                  return (
                    <div
                      key={ticker}
                      onClick={() => onSelectGuardianFilterTicker(isFiltered ? null : ticker)}
                      className={`flex items-center justify-between p-2.5 rounded-lg transition cursor-pointer select-none ${
                        isFiltered
                          ? "bg-cyan-500/10 border-2 border-[#00E5FF]/60 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                          : "bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSearch(ticker);
                            }}
                            className="font-mono font-bold text-sm text-emerald-400 hover:underline text-left block"
                          >
                            {ticker}
                          </button>
                          {isFiltered && (
                            <span className="text-[9px] font-mono font-bold bg-[#00E5FF]/20 text-[#00E5FF] px-1 py-0.2 rounded border border-[#00E5FF]/30 uppercase animate-pulse">
                              Active Filter 🎯
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {sources.length} CUSTOM {sources.length === 1 ? "SOURCE" : "SOURCES"} PERSISTED
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSearch(ticker)}
                          className="text-[10.5px] font-mono font-medium px-2 py-1 text-slate-400 hover:text-white bg-slate-950 rounded border border-slate-800"
                        >
                          Open Dossier
                        </button>
                        <button
                          onClick={() => onRemoveFromWatchlist(ticker)}
                          className="p-1 px-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-950/10 rounded transition"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gemini Context Caching & Memory Profile */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-5 space-y-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-slate-300 tracking-wide font-display">
                Gemini Context Caching & Memory Profile
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Custom publications and directory indexes registered permanently within Gemini's active context cache.
              </p>
            </div>

            {Object.keys(personalSources).length === 0 ? (
              <div className="p-3 text-center border border-dashed border-slate-800 rounded-lg text-slate-600 text-xs">
                Your custom database is empty. Scan a stock from the search console, then save publications to seed files.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(personalSources).map(([ticker, urls]) => {
                  if (urls.length === 0) return null;
                  return (
                    <div key={ticker} className="space-y-1.5 p-2 bg-slate-900/40 rounded border border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                          {ticker}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Saved Sources</span>
                      </div>
                      <ul className="space-y-1 font-mono text-[10.5px]">
                        {urls.map((u, i) => (
                          <li key={i} className="flex justify-between items-center text-slate-400 truncate pl-1 border-l border-emerald-500">
                            <span className="truncate flex-1 pr-2 hover:text-slate-200" title={u}>{u}</span>
                            <button
                              onClick={() => onRemovePersonalSource(ticker, i)}
                              className="text-slate-600 hover:text-slate-400"
                            >
                              &#x2715;
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
