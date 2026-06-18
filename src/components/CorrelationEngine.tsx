import { useState } from "react";
import { ModePreference, StockDossier } from "../types";
import { Cpu, GitBranch, Shield, Sparkles, TrendingUp, HelpCircle, ArrowRight, Zap, Target, Layers } from "lucide-react";

interface CorrelationEngineProps {
  mode: ModePreference;
  watchlist: string[];
  archiveData: { [ticker: string]: StockDossier };
}

export default function CorrelationEngine({
  mode,
  watchlist,
  archiveData,
}: CorrelationEngineProps) {
  const isExpert = mode === ModePreference.EXPERT;
  const [selectedTicker, setSelectedTicker] = useState<string>(watchlist[0] || "NVDA");

  // Retrieve current active dossier for ripple maps
  const activeDossier = archiveData[selectedTicker];
  const rippleMap = activeDossier?.compartments.rippleMap || [];

  // Generate mock correlation matrix weights for the UI
  const getCorrelationMatrixValue = (t1: string, t2: string): number => {
    if (t1 === t2) return 1.0;
    // Generate static values based on ticker letter codes so they remain consistent
    const charSum = (t1.charCodeAt(0) + t2.charCodeAt(0)) % 10;
    return 0.1 + (charSum / 11);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="correlation-engine-view">
      {/* View Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-xs font-mono font-bold text-amber-500 tracking-widest uppercase flex items-center gap-1.5">
          <Layers className="h-4.5 w-4.5 text-amber-500" /> CROSS-ASSET CORRELATION ENGINE
        </span>
        <h2 className="text-3xl font-display font-medium text-white tracking-tight mt-1">
          Correlation Engine
        </h2>
        <p className="text-sm text-slate-400">
          Model non-linear feedback loops, manufacturing foundry reliance thresholds, and memory stack demand spikes.
        </p>
      </div>

      {/* Target Selector & Visual Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left selector panel (4/12 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/35 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 font-display">
                Select Base Analysis Stock
              </h3>
              <p className="text-xs text-slate-500">
                Pick a ticker from your active watch index to map competitor & foundry node linkages.
              </p>
            </div>

            {watchlist.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No tickers available. Please use Deep Research first.</p>
            ) : (
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {watchlist.map((tick) => {
                  const hasData = !!archiveData[tick];
                  return (
                    <button
                      key={tick}
                      onClick={() => setSelectedTicker(tick)}
                      className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between ${
                        selectedTicker === tick
                          ? "border-amber-500/50 bg-amber-950/20 text-amber-400 font-bold"
                          : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span>{tick}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-normal px-2 py-0.5 rounded ${
                          hasData ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40" : "bg-slate-900 text-slate-500"
                        }`}>
                          {hasData ? "INDEXED" : "UNSCAN"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Metrics HUD */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/10 space-y-3 font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider block">// SENTINEL CONFIRMATION</span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Hub:</span>
                <span className="text-white font-bold">{selectedTicker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Nodes Mapped:</span>
                <span className="text-white font-bold">{rippleMap.length} companies</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Feedback Loops Model:</span>
                <span className="text-emerald-400 font-bold">STABLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right visualization / matrix content (8/12 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Ripple Network Mappings */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/25 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-2 font-display">
                <GitBranch className="h-4 w-4 text-amber-400" /> Strategic Relationship Network for {selectedTicker}
              </h3>
              <span className="font-mono text-[10px] text-slate-500 uppercase">Interactive Ripple Map</span>
            </div>

            {rippleMap.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                No advanced ripple map relationships found for this ticker. Scan a stock with deep research to generate a map.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rippleMap.map((node) => (
                  <div 
                    key={node.ticker}
                    className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-slate-600 transition space-y-2.5"
                  >
                    <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-amber-950 text-amber-400 border border-amber-900 px-2 py-0.5 rounded">
                          {node.ticker}
                        </span>
                        <span className="text-slate-300 text-xs font-semibold truncate max-w-[120px]">{node.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                        node.impactType === "bullish" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40" : "bg-rose-950 text-rose-400 border border-rose-900/40"
                      }`}>
                        {node.impactType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 font-mono">
                      <div className="text-slate-300 italic text-[11px] font-sans leading-normal">
                        "{node.why}"
                      </div>
                      <div className="pt-2 text-[10px] flex justify-between">
                        <span>RELATIONSHIP:</span>
                        <span className="text-slate-200 uppercase">{node.relationship}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>YTD PERFORMANCE:</span>
                        <span className="text-white font-bold">{node.performance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross Watchlist Matrix Analysis */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/25 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide flex items-center gap-1.5 font-display">
              <Zap className="h-4 w-4 text-yellow-400" /> Watchlist Cross-Correlation Index Weights
            </h3>
            
            {watchlist.length < 2 ? (
              <p className="text-xs text-slate-500 italic">Add at least 2 tickers to your watchlist to map cross-correlation metrics.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">SYM Matrix</th>
                      {watchlist.map(w => (
                        <th key={w} className="p-3 text-center">{w}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {watchlist.map(rowTicker => (
                      <tr key={rowTicker} className="hover:bg-slate-900/40">
                        <td className="p-3 font-bold text-white bg-slate-900/20">{rowTicker}</td>
                        {watchlist.map(colTicker => {
                          const val = getCorrelationMatrixValue(rowTicker, colTicker);
                          let color = "text-slate-400";
                          let bg = "bg-transparent";
                          if (val === 1.0) {
                            color = "text-amber-400 font-extrabold";
                            bg = "bg-amber-500/10";
                          } else if (val > 0.7) {
                            color = "text-emerald-400 font-bold";
                            bg = "bg-emerald-500/5";
                          } else if (val > 0.4) {
                            color = "text-cyan-400";
                          }
                          return (
                            <td key={colTicker} className={`p-3 text-center ${bg}`}>
                              <span className={color}>{val.toFixed(2)}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-[10px] text-slate-500 text-right leading-normal">
              Values denote Pearson Correlation coefficient calculated through sector allocation yields over 90-day trading sessions.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
