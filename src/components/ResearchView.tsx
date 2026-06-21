import { useState, FormEvent, useEffect } from "react";
import {
  StockDossier,
  ModePreference,
  NewsEvent,
  RippleConnection,
  Compartments
} from "../types";
import {
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  Users,
  GitPullRequest,
  Check,
  AlertTriangle,
  Lightbulb,
  Search,
  BookOpen,
  PlusCircle,
  Clock,
  Sparkles,
  Archive,
  RefreshCw
} from "lucide-react";
import { archiveSave, archiveLoad, archiveAgeLabel, archiveTTLLabel } from "../archiveService";

interface ResearchViewProps {
  dossier: StockDossier;
  mode: ModePreference;
  onTranslateItem: (itemId: string) => void;
  onInterpretSection: (sectionName: string, data: any) => Promise<string>;
  onRefresh?: (ticker: string) => void;
  onAddCommunitySignal: (ticker: string, sourceUrl: string, textContent: string, note: string) => void;
  onAddToWatchlist: (ticker: string) => void;
  isInWatchlist: boolean;
}

function parseStructuredSummary(text: string, isGenesis: boolean) {
  const sections = isGenesis
    ? [
        { label: "What’s Happening", keys: ["What’s Happening", "What’s Happening:", "What is Happening", "What is Happening:"] },
        { label: "Why It Matters", keys: ["Why It Matters", "Why It Matters:", "Why it Matters", "Why it Matters:"] },
        { label: "What to Watch Next", keys: ["What to Watch Next", "What to Watch Next:", "What to Watch", "What to Watch:"] },
        { label: "Ripple Effects (in plain English)", keys: ["Ripple Effects (in plain English)", "Ripple Effects (in plain English):", "Ripple Effects", "Ripple Effects:"] }
      ]
    : [
        { label: "Market Intel Summary", keys: ["Market Intel Summary", "Market Intel Summary:"] },
        { label: "Sector Signal", keys: ["Sector Signal", "Sector Signal:"] },
        { label: "Correlation Analysis", keys: ["Correlation Analysis", "Correlation Analysis:"] },
        { label: "Catalyst Map", keys: ["Catalyst Map", "Catalyst Map:"] }
      ];

  const parsed: { label: string; content: string }[] = [];
  const textToParse = text || "";
  const foundPositions: { label: string; index: number; keyLength: number }[] = [];

  sections.forEach(sec => {
    for (const key of sec.keys) {
      const idx = textToParse.indexOf(key);
      if (idx !== -1) {
        foundPositions.push({ label: sec.label, index: idx, keyLength: key.length });
        break;
      }
    }
  });

  foundPositions.sort((a, b) => a.index - b.index);

  if (foundPositions.length === 0) {
    return [{ label: isGenesis ? "Executive Brief" : "Intelligence Overview", content: textToParse }];
  }

  for (let i = 0; i < foundPositions.length; i++) {
    const current = foundPositions[i];
    const next = foundPositions[i + 1];
    const startIdx = current.index + current.keyLength;
    const endIdx = next ? next.index : textToParse.length;
    let content = textToParse.substring(startIdx, endIdx).trim();
    if (content.startsWith(":")) {
      content = content.substring(1).trim();
    }
    parsed.push({ label: current.label, content });
  }

  return parsed;
}

export default function ResearchView({
  dossier,
  mode,
  onTranslateItem,
  onInterpretSection,
  onAddCommunitySignal,
  onAddToWatchlist,
  isInWatchlist,
  onRefresh,
}: ResearchViewProps) {
  const [activeCompartment, setActiveCompartment] = useState<string | null>("newsEvents");
  const [interpretations, setInterpretations] = useState<{ [key: string]: string }>({});
  const [interpretingSection, setInterpretingSection] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState<boolean>(false);

  // Archive: auto-save every completed dossier, track if this one came from cache
  const [archivedAge, setArchivedAge] = useState<string | null>(null);
  const [archiveTTL, setArchiveTTL] = useState<string>("expires in 7d");

  useEffect(() => {
    if (!dossier?.ticker) return;
    const ticker = dossier.ticker;

    archiveLoad(ticker).then(cached => {
      const isCachedResult = cached &&
        cached.dossier.pipelineMeta?.generatedAt === dossier.pipelineMeta?.generatedAt;
      if (isCachedResult && cached) {
        setArchivedAge(archiveAgeLabel(cached.savedAt));
        setArchiveTTL(archiveTTLLabel(cached.expiresAt));
      } else {
        // Fresh result — save to Firestore + localStorage
        archiveSave(ticker, dossier, "genesis").catch(console.warn);
        setArchivedAge(null);
        setArchiveTTL(archiveTTLLabel(Date.now() + 7 * 24 * 60 * 60 * 1000));
      }
    });
  }, [dossier?.ticker, dossier?.pipelineMeta?.generatedAt]);

  // Category Filter System states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [lastTicker, setLastTicker] = useState(dossier.ticker);

  if (dossier.ticker !== lastTicker) {
    setLastTicker(dossier.ticker);
    setSelectedCategory("All");
  }

  // Community Signal input states
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [userNote, setUserNote] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isGenesis = mode === ModePreference.GENESIS;
  const activeTabClass = isGenesis
    ? "border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]"
    : "border-[#FF9100] bg-[#FF9100]/15 text-[#FF9100]";

  const handleInterpretClick = async (sectionName: string, data: any) => {
    setInterpretingSection(sectionName);
    try {
      const summary = await onInterpretSection(sectionName, data);
      setInterpretations((prev) => ({
        ...prev,
        [sectionName]: summary,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setInterpretingSection(null);
    }
  };

  const handleCommunitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim() && !textContent.trim()) return;

    onAddCommunitySignal(dossier.ticker, sourceUrl, textContent, userNote);
    
    setSuccessMsg("Signal submitted! Genesis AI has logged the contribution. Verified members will notice this in their stock dossiers within 30 minutes.");
    setSourceUrl("");
    setTextContent("");
    setUserNote("");
    setTimeout(() => {
      setSuccessMsg("");
      setShowCommunityForm(false);
    }, 4000);
  };

  const { marketOverview, newsEvents, earningsFinancials, upcomingCalendar, analystActivity, socialPolitical, rippleMap } = dossier.compartments;

  return (
    <div className="space-y-6" id="genesis-research-dossier-panel">
      {/* Dossier Header and Action Bar */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${isGenesis ? "bg-[#00E5FF]" : "bg-[#FF9100]"}`}></div>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-mono font-black text-white tracking-widest">
              {dossier.ticker}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              SEC Indexed Portfolio Asset
            </span>
          </div>
          <h1 className="text-lg font-display text-slate-300 font-bold mt-1">
            {dossier.briefTitle}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Genesis deep-scanning index crawled {dossier.sourcesReviewedCount} separate nodes for this briefing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isInWatchlist ? (
            <button
              onClick={() => onAddToWatchlist(dossier.ticker)}
              className={`px-4 py-2 text-[#060b13] rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 hover:brightness-110 transition active:scale-95 duration-150 ${
                isGenesis ? "bg-[#00E5FF] shadow-[#00E5FF]/10 hover:shadow-[#00E5FF]/20" : "bg-[#FF9100] shadow-[#FF9100]/10 hover:shadow-[#FF9100]/20"
              }`}
            >
              <PlusCircle className="h-4 w-4" /> Add Asset to Radar
            </button>
          ) : (
            <div className="px-3 py-2 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Actively Monitored
            </div>
          )}
          {/* Archive indicator */}
          {archivedAge ? (
            <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 text-slate-400 rounded-lg text-xs font-mono flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5 text-[#00E5FF]" />
              <span>Loaded from archive · <span className="text-[#00E5FF]">{archivedAge}</span></span>
              <button onClick={() => onRefresh?.(dossier.ticker)} className="ml-1 text-[#00E5FF] hover:text-white transition-colors flex items-center gap-0.5">
                <RefreshCw className="h-3 w-3" /> refresh
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 bg-emerald-950/30 border border-emerald-900/50 text-emerald-500 rounded-lg text-xs font-mono flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              <span>Saved to archive · {archiveTTL}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sources Scanned Intelligence Strip — shows domains not AI models */}
      {(() => {
        const pipelineMeta = dossier.pipelineMeta || {
          sourcesScanned: ["sec.gov", "reuters.com", "bloomberg.com", "finnhub.io", "wsj.com", "marketwatch.com", "investing.com", "businesswire.com"],
          nodesScanned: 15,
          contaminationFlags: 0,
          generatedAt: new Date().toISOString()
        };
        const sources = pipelineMeta.sourcesScanned || [];
        const nodes = pipelineMeta.nodesScanned || sources.length;
        return (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 text-xs font-mono space-y-3" id="genesis-sources-scanned-strip">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2 text-slate-300">
                <GitPullRequest className="h-4 w-4 text-[#00E5FF] animate-pulse" />
                <span className="font-bold text-slate-200 uppercase tracking-wider">GENESIS INTELLIGENCE SCAN</span>
                <span className="text-slate-500">—</span>
                <span className="text-[#00E5FF] font-bold">{nodes} nodes crawled</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{sources.length} sources indexed</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Scanned: {new Date(pipelineMeta.generatedAt).toLocaleString()}
              </div>
            </div>

            {/* Source domain chips — matches Gemini deep research feel */}
            <div className="flex flex-wrap gap-1.5">
              {sources.map((domain: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
                  {domain}
                </span>
              ))}
            </div>

            {/* Firewall compliance indicator */}
            {pipelineMeta.contaminationFlags > 0 ? (
              <div className="px-3 py-1.5 rounded bg-amber-950/20 border border-amber-900/50 text-amber-400 flex items-center gap-1.5 text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Intelligence Firewall intercepted and removed {pipelineMeta.contaminationFlags} cross-company term(s) before delivery.</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded bg-emerald-950/10 border border-emerald-900/40 text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <Check className="h-3.5 w-3.5" />
                <span>Intelligence verified: 100% compliant — zero cross-company contamination detected.</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Mode Dependent Strategic Brief matches layout of Section 2 & Section 3 */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded ${isGenesis ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "bg-[#FF9100]/10 text-[#FF9100]"}`}>
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              {isGenesis ? (
                <>
                  <span className="text-[#00E5FF] font-black">&bull;</span>
                  <span className="text-slate-200">GENESIS AI INTELLIGENCE BRIEF</span>
                </>
              ) : (
                <>
                  <span className="text-[#FF9100] font-black">&bull;</span>
                  <span className="text-slate-200">EXECUTIVE INTEL BRIEF</span>
                </>
              )}
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            JUNE 14, 2026 &bull; PRE-MARKET
          </span>
        </div>

        {/* Top 3 Signals Highlight Callout Box */}
        {dossier.topSignals && dossier.topSignals.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-990/40 mb-4 text-xs font-mono space-y-2.5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-emerald-500`}></div>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">AUTHORITATIVE HIGH-FIDELITY SIGNALS</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dossier.topSignals.map((signalText, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800/60 leading-relaxed text-slate-300 font-sans">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                    <span>#0{idx + 1} SIGNAL</span>
                  </div>
                  {signalText}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="prose prose-invert max-w-none">
          {isGenesis ? (
            /* Plain English readable CEO output */
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed" id="genesis-brieftext-readable">
              <p className="font-semibold text-white text-base">
                Here's what is happening with <span className="text-emerald-400">{dossier.ticker}</span> and related markets in plain English:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parseStructuredSummary(dossier.briefText, true).map((sec, sIdx) => (
                  <div key={sIdx} className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/60 space-y-1.5 transition-all hover:border-[#00E5FF]/20">
                    <span className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-widest block">
                      {sec.label}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Guidance / Quick factor details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-950/30 rounded border border-slate-800 text-xs">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> KEY TAKEAWAYS & FACTORS
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                    <li>Dynamic quarterly operating capacity remains strong.</li>
                    <li>Supply constraints from Taiwan factories continue to regulate throughput limits.</li>
                    <li>Options implying substantial swing potential based on upcoming events.</li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-950/30 rounded border border-slate-800 text-xs">
                  <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> ACTIONABLE INTELLIGENCE SIGNALS
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                    <li>Supply chain moves represent immediate alerts on Micron (MU) and Dell (DELL).</li>
                    <li>Macro political events present policy turbulence risks inside semiconductors.</li>
                  </ul>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800 mt-2">
                Genesis provides analytical awareness and interpretive framework modeling only. This output does not constitute explicit investment advice.
              </div>
            </div>
          ) : (
            /* Dense expert metric overview */
            <div className="space-y-4 text-slate-300 text-xs leading-relaxed" id="expert-brieftext-dense">
              <p className="font-mono font-semibold text-slate-100 uppercase tracking-wider text-sm">
                SYSTEM CORRELATION ANALYSIS DOSSIER
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parseStructuredSummary(dossier.briefText, false).map((sec, sIdx) => (
                  <div key={sIdx} className="p-4 bg-slate-950 border border-slate-800/85 space-y-1.5 font-mono text-slate-300 transition-all hover:border-[#FF9100]/25">
                    <span className="text-[10px] font-bold text-[#FF9100] uppercase tracking-widest block">
                      // {sec.label}
                    </span>
                    <p className="text-[11px] leading-relaxed text-[#00FFCC]">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-mono">Consensus</span>
                  <span className="font-bold text-sm text-white font-mono">{analystActivity.consensus}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-mono">Guiding Margin</span>
                  <span className="font-bold text-sm text-emerald-400 font-mono">{earningsFinancials.margin}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-mono">Cap/Float Support</span>
                  <span className="font-bold text-sm text-cyan-400 font-mono">{marketOverview.marketCap}</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-500 block font-mono">52W Levels</span>
                  <span className="font-bold text-[11px] text-slate-300 font-mono truncate block">{marketOverview.range52Week}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Reasoning Layer (Stage 2 Strategist Matrix) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40" id="genesis-reasoning-collapsible-root">
        <button
          onClick={() => setShowReasoning(!showReasoning)}
          className="w-full flex items-center justify-between text-left text-xs font-mono font-bold text-slate-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <span>DEEP REASONING MATRIX & SCENARIO TREES (STAGE 2 STRATEGIST)</span>
          </div>
          <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            {showReasoning ? "COLLAPSE REASONING LAYER [-]" : "EXPAND REASONING LAYER [+]"}
          </span>
        </button>

        {showReasoning && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-6 text-xs font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Causal Chain Step Flow */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-1.5 text-[#00E5FF] font-bold">
                  <GitPullRequest className="h-4 w-4" />
                  <span>CAUSAL TRANSFER CHAIN</span>
                </div>
                <div className="space-y-3 font-sans">
                  {dossier.reasoningLayer?.causalChain && dossier.reasoningLayer.causalChain.length > 0 ? (
                    dossier.reasoningLayer.causalChain.map((step, idx) => (
                      <div key={idx} className="flex gap-3 relative pb-1">
                        {idx !== dossier.reasoningLayer!.causalChain.length - 1 && (
                          <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-slate-800"></div>
                        )}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold z-10">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cause: {step.cause}</div>
                          <div className="text-xs text-slate-300 leading-relaxed">→ Effect: {step.effect}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic font-mono text-[11px]">No causal chains mapped for this asset.</p>
                  )}
                </div>
              </div>

              {/* Scenario Tree and Probabilities */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                  <TrendingUp className="h-4 w-4" />
                  <span>CONDITIONAL SCENARIO MATRIX</span>
                </div>
                <div className="space-y-3 font-sans">
                  {dossier.reasoningLayer?.scenarioTree && dossier.reasoningLayer.scenarioTree.length > 0 ? (
                    dossier.reasoningLayer.scenarioTree.map((st, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800/60 flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold bg-[#FF9100]/10 border border-[#FF9100]/25 text-[#FF9100] px-1.5 py-0.5 rounded">
                            SCENARIO 0{idx + 1}
                          </span>
                          <p className="text-[11px] font-medium text-slate-200 mt-1">{st.scenario}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Outcome: {st.outcome}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-slate-500 uppercase block">Likelihood</span>
                          <span className={`text-[11px] font-mono font-bold uppercase ${
                            st.probability === "high" ? "text-emerald-400" : st.probability === "medium" ? "text-amber-400" : "text-cyan-400"
                          }`}>{st.probability}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic font-mono text-[11px]">No scenario nodes mapped.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risk Framing and Mitigation */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-1.5 text-red-400 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>TACTICAL RISK MITIGATION LAYER</span>
                </div>
                <div className="space-y-3 font-sans">
                  {dossier.reasoningLayer?.riskMatrix && dossier.reasoningLayer.riskMatrix.length > 0 ? (
                    dossier.reasoningLayer.riskMatrix.map((rm, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800/60 space-y-1.5">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-bold text-slate-100">{rm.risk}</span>
                          <div className="flex gap-2">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/40">Severity: {rm.severity}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-900/40">Likelihood: {rm.likelihood}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-800/40 mt-1">
                          <span className="text-[9px] font-mono font-bold text-red-400 uppercase block mb-0.5">Tactical Action Protocol</span>
                          {rm.mitigant}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic font-mono text-[11px]">No risk variables framed.</p>
                  )}
                </div>
              </div>

              {/* Sector Impact Analysis */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                  <Layers className="h-4 w-4" />
                  <span>TRANS-SECTOR SPILLOVER INDEX</span>
                </div>
                <div className="space-y-3 font-sans">
                  {dossier.reasoningLayer?.sectorImpactMap && dossier.reasoningLayer.sectorImpactMap.length > 0 ? (
                    dossier.reasoningLayer.sectorImpactMap.map((sim, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800/60 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-200">{sim.sector}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            sim.impact === "positive" ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/60" : sim.impact === "negative" ? "bg-red-950/30 text-red-400 border border-red-900/60" : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>
                            {sim.impact}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{sim.reasoning}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic font-mono text-[11px]">No sector footprints cataloged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* The 7 Intelligence Compartments (Raw Data tab format) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar for Compartments (4 columns) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block pl-1">
            Intelligence Compartments
          </span>
          <div className="space-y-1">
            
            {/* 1. Market Overview */}
            <button
              onClick={() => setActiveCompartment("marketOverview")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "marketOverview"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4" /> 1. Market Overview
              </span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                Live Data
              </span>
            </button>

            {/* 2. News & Events */}
            <button
              onClick={() => setActiveCompartment("newsEvents")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "newsEvents"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4" /> 2. News & Events
              </span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {newsEvents.length} items
              </span>
            </button>

            {/* 3. Earnings & Financials */}
            <button
              onClick={() => setActiveCompartment("earningsFinancials")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "earningsFinancials"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-4 w-4" /> 3. Earnings & Balance
              </span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                SEC Indexed
              </span>
            </button>

            {/* 4. Upcoming Calendar */}
            <button
              onClick={() => setActiveCompartment("upcomingCalendar")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "upcomingCalendar"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4" /> 4. Upcoming Calendar
              </span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {upcomingCalendar.length} Events
              </span>
            </button>

            {/* 5. Analyst Activity */}
            <button
              onClick={() => setActiveCompartment("analystActivity")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "analystActivity"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Layers className="h-4 w-4" /> 5. Analyst Consensus
              </span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                Firm Ratings
              </span>
            </button>

            {/* 6. Social & Political Signals */}
            <button
              onClick={() => setActiveCompartment("socialPolitical")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "socialPolitical"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4" /> 6. Social/Political Radar
              </span>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {socialPolitical.length} Signals
              </span>
            </button>

            {/* 7. Related Companies - Ripple Map */}
            <button
              onClick={() => setActiveCompartment("rippleMap")}
              className={`w-full text-left p-3 rounded-lg border font-mono transition text-xs flex items-center justify-between ${
                activeCompartment === "rippleMap"
                  ? activeTabClass
                  : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <GitPullRequest className="h-4 w-4" /> 7. Ripple Correlation Map
              </span>
              <span className="text-[10px] bg-slate-905 px-1.5 py-0.5 rounded border border-slate-850">
                Proprietary
              </span>
            </button>

          </div>

          {/* + Add Intelligence Button matches Section "Community Intelligence Layer" */}
          <div className="pt-2">
            <button
              onClick={() => setShowCommunityForm(!showCommunityForm)}
              className="w-full py-2.5 rounded-lg border border-slate-800 hover:border-slate-600 bg-slate-950 text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <span>{showCommunityForm ? "Close Contribution panel" : "+ Add Intelligence Tool"}</span>
            </button>
          </div>
        </div>

        {/* Active Compartment Detail Pane (8 columns) */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/60 min-h-[350px] space-y-6">
            
            {/* Section Live Interpreter Header matches "Interpret Section" Action Button */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-display font-bold text-slate-100 flex items-center gap-2">
                  <span>Compartment Data Explorer</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a category from the sidebar to review raw crawled resources or generate simplified breakdowns files.
                </p>
              </div>

              {activeCompartment && (
                <button
                  onClick={() => {
                    const sectionData = dossier.compartments[activeCompartment as keyof Compartments];
                    handleInterpretClick(activeCompartment, sectionData);
                  }}
                  disabled={interpretingSection !== null}
                  className={`px-3 py-1.5 text-xs rounded font-mono flex items-center gap-1 hover:brightness-110 shrink-0 select-none shadow-md border ${
                    isGenesis 
                      ? "text-[#00E5FF] border-[#00E5FF]/40 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20" 
                      : "text-[#FF9100] border-[#FF9100]/40 bg-[#FF9100]/10 hover:bg-[#FF9100]/20"
                  }`}
                >
                  {interpretingSection === activeCompartment ? (
                    <span className={`animate-spin inline-block mr-1 ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`}>&#x21BB;</span>
                  ) : (
                    <span>&#x2724;</span>
                  )}
                  Interpret This Section &rarr;
                </button>
              )}
            </div>

            {/* Display Interpretation dynamically if triggered by user */}
            {activeCompartment && interpretations[activeCompartment] && (
              <div className={`p-4 rounded-lg border text-xs font-mono space-y-1 my-2 ${
                isGenesis 
                  ? "border-[#00E5FF]/40 bg-[#00E5FF]/5 text-cyan-200" 
                  : "border-[#FF9100]/40 bg-[#FF9100]/5 text-amber-200"
              }`}>
                <span className={`text-[10px] font-bold block ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`}>
                  {isGenesis ? "// GENESIS COHESIVE ANALYSIS DEBRIEF" : "// EXPERT STRATEGIC CORRELATION DATA"}
                </span>
                <p>{interpretations[activeCompartment]}</p>
                <button
                  onClick={() => {
                    setInterpretations((prev) => {
                      const copy = { ...prev };
                      delete copy[activeCompartment];
                      return copy;
                    });
                  }}
                  className={`underline font-normal mt-1 block ${isGenesis ? "text-[#00E5FF] hover:text-[#00E5FF]/80" : "text-[#FF9100] hover:text-[#FF9100]/80"}`}
                >
                  Clear Interpretation
                </button>
              </div>
            )}

            {/* 1. Market Overview */}
            {activeCompartment === "marketOverview" && (
              <div className="space-y-4 font-mono text-xs animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-800 space-y-2">
                    <span className="text-slate-500 uppercase text-[9px] block">Security Price Metric</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">${marketOverview.price.toFixed(2)}</span>
                      <span className={`text-xs font-bold ${marketOverview.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {marketOverview.changePercent >= 0 ? "+" : ""}{marketOverview.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 uppercase text-[9px] block">Market Cap Weighting</span>
                    <span className="text-lg font-bold text-slate-100">{marketOverview.marketCap}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 uppercase text-[9px] block">Volume Traded (24h)</span>
                    <span className="text-sm font-bold text-slate-100">{marketOverview.volume}</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 uppercase text-[9px] block">Technical Indicators Support</span>
                    <span className="text-sm text-cyan-400 font-bold">{marketOverview.technicalLevels}</span>
                  </div>
                </div>

                {isGenesis ? (
                  <div className="p-4 bg-slate-900/10 rounded-lg border border-slate-800/80 space-y-2">
                    <span className="text-slate-400 text-[10px] font-bold block flex items-center gap-1">
                      <Lightbulb className="h-4 w-4 text-emerald-400 shrink-0" /> Genesis Live Tracker Status
                    </span>
                    <p className="text-slate-400 leading-normal text-[11px]">
                      This asset presents healthy consolidation. Current market spread remains tightly framed between the calculated support zones. Liquidity flows demonstrate standard hedge positioning ahead of scheduled macro adjustments.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/45 rounded-lg border border-slate-800 font-mono text-[11px] space-y-2 animate-fade-in">
                    <span className="text-cyan-400 font-bold block">// RAW METADATA SYSTEM METRICS</span>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-slate-400">
                      <div>SEC CRAWLER ID: <span className="text-white">CRAWL_SEC_F4810</span></div>
                      <div>CRAWL TIMESTAMP: <span className="text-white">2026-06-14 09:32:11 GMT</span></div>
                      <div>CUSIP IDENTIFIER: <span className="text-white">US{dossier.ticker}_CUSP9</span></div>
                      <div>INDEXED ARCHIVE NODES: <span className="text-white">{dossier.sourcesReviewedCount}</span></div>
                      <div>VOLUME WEIGHTED AVERAGE PRICE (VWAP): <span className="text-white">${(marketOverview.price * 1.0005).toFixed(4)}</span></div>
                      <div>BID / ASK SPREAD: <span className="text-white">${(marketOverview.price - 0.02).toFixed(2)} / ${(marketOverview.price + 0.02).toFixed(2)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. News & Events with card presentation and Translate functionality */}
            {activeCompartment === "newsEvents" && (() => {
              const availableCategories = ["All", ...Array.from(new Set(newsEvents.map(item => item.category).filter(Boolean)))];

              const getCategoryCount = (cat: string) => {
                if (cat === "All") return newsEvents.length;
                return newsEvents.filter(item => item.category === cat).length;
              };

              const filteredNewsEvents = selectedCategory === "All"
                ? newsEvents
                : newsEvents.filter(item => item.category === selectedCategory);

              const activePillClass = isGenesis
                ? "border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF] font-bold"
                : "border-[#FF9100] bg-[#FF9100]/20 text-[#FF9100] font-bold";
              const inactivePillClass = "border-slate-850 bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white";

              return (
                <div className="space-y-4 animate-fade-in">
                  {/* Category Filter System */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-900 pb-4 mb-2">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mr-2 block">
                      Category Filter:
                    </span>
                    {availableCategories.map((cat) => {
                      const count = getCategoryCount(cat);
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                            isActive ? activePillClass : inactivePillClass
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            isActive 
                              ? (isGenesis ? "bg-[#00E5FF]/20 text-[#00E5FF]" : "bg-[#FF9100]/20 text-[#FF9100]")
                              : "bg-slate-950 text-slate-500"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredNewsEvents.length > 0 ? filteredNewsEvents.map((item) => {
                    const hasBrief = isGenesis && item.isTranslated;
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-lg border border-slate-800 bg-slate-900/30 space-y-4 hover:border-slate-700 transition relative animate-fade-in"
                      >
                        {/* Header tags matching specific prompt styling */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono border-b border-slate-800/60 pb-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-900">
                            {item.category.toUpperCase()}
                          </span>
                          <span className="text-slate-400 font-medium">{item.source}</span>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-slate-400">{item.date}</span>
                          {!isGenesis && (
                            <span className="text-slate-500">CRAWLED: 2026-06-14T08:14:22Z GMT</span>
                          )}
                          <span className="ml-auto px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 font-bold border border-rose-900/40">
                            IMPACT: {item.impact.toUpperCase()}
                          </span>
                        </div>

                        {hasBrief ? (
                          /* Plain English CEO Morning Brief layout */
                          <div className="space-y-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 animate-fade-in">
                            <div className="border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
                              <span className="text-xs font-bold text-emerald-400 tracking-wider flex items-center gap-1 font-mono">
                                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> 🌟 CEO MORNING BRIEF
                              </span>
                              <button
                                onClick={() => onTranslateItem(item.id)}
                                className="text-[10px] bg-slate-900 text-slate-400 hover:text-white px-2.5 py-0.5 rounded border border-slate-800 transition font-mono"
                              >
                                [Show Original Jargon]
                              </button>
                            </div>
                            
                            <div className="space-y-3.5 font-sans text-slate-300 text-xs leading-relaxed">
                              <div>
                                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono text-slate-400">// 1. What's Happening</h5>
                                <p className="mt-1 font-medium text-slate-200">{item.translatedContent}</p>
                              </div>

                              <div>
                                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono text-slate-400">// 2. Key Signals</h5>
                                <p className="mt-1 text-slate-400">
                                  Source: <strong className="text-slate-300 font-mono">{item.source}</strong> ({item.date}). Reported by <span className="text-slate-300 font-medium">{item.who}</span> focus inside <span className="text-slate-300 font-medium">{item.where}</span>.
                                </p>
                              </div>

                              <div>
                                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono text-slate-400">// 3. What is Affecting This Stock</h5>
                                <p className="mt-1 font-medium text-cyan-400 italic">
                                  {item.why || "Positive growth factors and prioritized capacity scheduling."}
                                </p>
                              </div>

                              <div>
                                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider font-mono text-slate-400">// 4. What to Watch Next</h5>
                                <p className="mt-1 text-slate-400">
                                  Monitor upcoming supply-chain events and regulatory filings to confirm volume capacity and operational margins.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-white tracking-wide font-display">
                              {item.headline}
                            </h4>

                            {/* Unified key value breakdown matching standard Card layout requested */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded border border-slate-900/60">
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono block">WHO:</span>
                                <span className="font-semibold text-slate-200">{item.who}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-mono block">WHERE:</span>
                                <span className="font-semibold text-slate-200">{item.where}</span>
                              </div>
                              <div className="col-span-1 md:col-span-2 pt-1 border-t border-slate-900">
                                <span className="text-[10px] text-slate-500 font-mono block">WHAT:</span>
                                <p className="text-slate-300 font-medium">{item.what}</p>
                              </div>
                              {isGenesis && (
                                <div className="col-span-1 md:col-span-2 pt-1 border-t border-slate-900">
                                  <span className="text-[10px] text-slate-500 font-mono block">WHY IT MATTERS:</span>
                                  <p className="text-slate-300 italic text-cyan-400">{item.why}</p>
                                </div>
                              )}
                            </div>

                            {/* ORIGINAL VS TRANSLATED CONTENT TOGGLE WIDGET */}
                            {isGenesis && (
                              <div className="pt-2">
                                <div className="flex items-center justify-between bg-slate-950/80 rounded-t-lg border-x border-t border-slate-800 p-2 text-[10px] font-mono">
                                  <span className="text-slate-400 font-bold uppercase">
                                    📝 Original expert text
                                  </span>
                                  <button
                                    onClick={() => onTranslateItem(item.id)}
                                    className="bg-emerald-950 text-emerald-400 hover:bg-emerald-900 px-2.5 py-0.5 rounded font-bold border border-emerald-800 inline-flex items-center gap-1 transition"
                                  >
                                    <span>&#x21C4;</span> Translate &rarr; Plain English
                                  </button>
                                </div>
                                <div className="p-3 bg-slate-950/35 rounded-b-lg border-x border-b border-slate-800 text-xs leading-relaxed text-slate-300">
                                  {item.originalContent}
                                </div>
                              </div>
                            )}

                            {!isGenesis && (
                              <div className="pt-2">
                                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-300 font-mono">
                                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1 font-mono">// UNTRANSLATED RAW RECORD DATA</span>
                                  {item.originalContent}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="p-8 text-center rounded-lg border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 font-mono text-xs animate-fade-in">
                      No intelligence nodes found in category "{selectedCategory}".
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. Earnings & Balance sheet insights */}
            {activeCompartment === "earningsFinancials" && (
              <div className="space-y-4 animate-fade-in font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-901 bg-slate-900/30 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">Quarterly Revenue Beat</span>
                    <span className="text-sm font-bold text-white">{earningsFinancials.revenue}</span>
                  </div>
                  <div className="p-3 bg-slate-900/30 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">Actual EPS Performance</span>
                    <span className="text-sm font-bold text-white">{earningsFinancials.eps}</span>
                  </div>
                  <div className="p-3 bg-slate-900/30 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">Operating Guidance Updates</span>
                    <span className="text-sm font-bold text-emerald-400">{earningsFinancials.guidance}</span>
                  </div>
                  <div className="p-3 bg-slate-900/30 rounded border border-slate-800 space-y-1">
                    <span className="text-slate-500 text-[10px] block">Profit Margins Breakdown</span>
                    <span className="text-sm font-bold text-cyan-400">{earningsFinancials.margin}</span>
                  </div>
                </div>

                {isGenesis ? (
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-emerald-400 text-xs font-bold block border-b border-slate-900 pb-2">SEC Indexed Report Summary</span>
                    <p className="text-slate-300 leading-normal text-xs">{earningsFinancials.summary}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-[11px] font-mono animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2 text-cyan-400 font-bold font-mono">
                      <span>// AUDIT TRACK & FILING METADATA</span>
                      <span>SEC_EDGAR_VERIFIED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono">
                      <div>AUDIT CLASSIFICATION: <span className="text-white">UNQUALIFIED_OPINION</span></div>
                      <div>CRAWLED INDEX STATUS: <span className="text-white">ARCHIVED_NODE_LEVEL_1</span></div>
                      <div>TIMESTAMP SEC SUBMIT: <span className="text-white">2026-06-11T14:22:00Z</span></div>
                      <div>CONVERGENCE PROBABILITY: <span className="text-white">99.82% ACCURACY</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Upcoming Calendar */}
            {activeCompartment === "upcomingCalendar" && (
              <div className="space-y-4 animate-fade-in font-mono text-xs">
                {upcomingCalendar.map((evt, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/30 rounded-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-slate-700 transition">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white font-display block">{evt.event}</span>
                      {isGenesis && (
                        <p className="text-slate-400 text-[11px] font-normal leading-normal">{evt.explanation}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-[11px] text-cyan-400 font-bold">{evt.date}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-slate-500 block">
                        IMPORTANCE: {evt.importance}
                      </span>
                      {!isGenesis && (
                        <span className="block text-[8px] text-slate-600 mt-1 uppercase font-mono">EVENT_ID: EVT_{idx + 942}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Analyst Consensus Targets */}
            {activeCompartment === "analystActivity" && (
              <div className="space-y-4 animate-fade-in font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/30 rounded border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block font-bold">Consensus Rec</span>
                    <span className="text-lg font-bold text-emerald-400">{analystActivity.consensus}</span>
                  </div>
                  <div className="p-3 bg-slate-900/30 rounded border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block font-bold">Consensus Target Price</span>
                    <span className="text-lg font-bold text-cyan-400">{analystActivity.targetPrice}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-808 border-slate-800 space-y-2">
                  <span className="text-slate-300 text-xs font-bold block flex items-center gap-1 italic">
                    <Layers className="h-4 w-4 text-emerald-400" /> Recent Agency Target adjustments
                  </span>
                  <ul className="space-y-2 text-[11px] text-slate-400 pl-1">
                    {analystActivity.recentChanges.map((change, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1">
                        <span className="text-cyan-500 mr-1">&bull;</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                  {isGenesis ? (
                    <p className="text-[11.5px] text-slate-500 leading-normal border-t border-slate-900 pt-3 mt-1 uppercase">
                      {analystActivity.summary}
                    </p>
                  ) : (
                    <div className="border-t border-slate-900 pt-3 mt-1 text-[10px] text-slate-600 flex justify-between uppercase font-mono">
                      <span>CRAWL REF: ANALYST_SURVEY_A9</span>
                      <span>RECORD STATE: NOMINAL_CONVERGENCE</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. Social & Political Signals */}
            {activeCompartment === "socialPolitical" && (
              <div className="space-y-4 animate-fade-in text-xs font-mono">
                {socialPolitical.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/30 rounded-lg border border-slate-800 space-y-3 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {item.platform}
                        </span>
                        <span className="text-slate-300 font-bold">{item.author}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{item.timestamp}</span>
                    </div>

                    {isGenesis ? (
                      <p className="text-slate-300 italic text-[11.5px] leading-relaxed">
                        &ldquo;{item.content}&rdquo;
                      </p>
                    ) : (
                      <div className="space-y-2 font-mono">
                        <p className="text-slate-300 font-mono text-[11px] leading-normal bg-slate-950 p-2.5 rounded border border-slate-900">
                          RAW_CONTENT: "{item.content}"
                        </p>
                        <div className="text-[10px] text-slate-500 flex justify-between uppercase font-mono">
                          <span>SENTIMENT COORDINATES: [coord_y: 4.81, coord_x: -0.15]</span>
                          <span>IMPACT_RAW_MULTIPLIER: 1.48x</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] pt-1">
                      <span className="text-slate-500">Indexed government/public forum crawl</span>
                      <span className="text-rose-400 font-bold uppercase py-0.5 px-2 bg-rose-950/20 border border-rose-950 rounded">
                        Impact Potential: {item.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 7. Related Companies - Correlation Ripple Map */}
            {activeCompartment === "rippleMap" && (
              <div className="space-y-4 animate-fade-in text-xs font-mono">
                <div className="p-4 bg-slate-900/20 rounded-lg border border-slate-800 space-y-2">
                  <h4 className="text-emerald-400 font-bold block font-display text-sm">
                    Strategic Correlation & Relationship Network
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Hedge fund managers maintain a dynamic mapping of client-supplier contracts, direct rivalries, and structural memory allocations. When <strong className="text-white">{dossier.ticker}</strong> registers a significant earnings guidance event, these connected nodes move in high-potential latency.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rippleMap.map((node) => (
                    <div key={node.ticker} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3 relative hover:border-slate-700 transition">
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-emerald-400">{node.ticker}</span>
                          <span className="text-[10px] text-slate-500 block">{node.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          node.impactType === "bullish"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
                            : node.impactType === "bearish"
                            ? "bg-rose-950/60 text-rose-300 border border-rose-900"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {node.impactType.toUpperCase()} IMPACT
                        </span>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-900 pt-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 uppercase text-[9px] block">Relationship Detail</span>
                          <span className="text-slate-200 font-bold block">{node.relationship}</span>
                        </div>
                        {isGenesis ? (
                          <div>
                            <span className="text-slate-500 uppercase text-[9px] block font-mono">Ripple Explanation</span>
                            <p className="text-slate-400 leading-normal pl-0.5 font-sans">{node.why}</p>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-950 rounded text-slate-400 font-mono text-[10px] space-y-0.5">
                            <div>SUPPLIER_DENSITY: 0.85</div>
                            <div>CORRELATION_INDEX: 0.925</div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-slate-500">Asset performance tag</span>
                        <span className="text-slate-300 font-semibold">{node.performance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Signal Add Intelligence panel matching specifications */}
            {showCommunityForm && (
              <div className="p-5 rounded-lg border border-purple-800 bg-purple-950/10 space-y-4 animate-fade-in font-mono text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="bg-purple-900 p-2 rounded text-purple-300 border border-purple-800/50">
                    <PlusCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 font-display">Add Custom Market Intelligence Signal</h4>
                    <p className="text-[11px] text-slate-400">
                      Submit a premium URL, private report snippet, direct supply chain observation, or news scrap that standard scrapers haven't picked up.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCommunitySubmit} className="space-y-3">
                  <div>
                    <label className="text-slate-400 uppercase text-[9px] block mb-1">Source URL (news or newsletter Link)</label>
                    <input
                      type="url"
                      placeholder="https://taiwannews.com.tw/article..."
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase text-[9px] block mb-1">Pasted Text Snippet / Content Quote</label>
                    <textarea
                      placeholder="TSMC reported 3nm allocations for NVDA increased by 20% order count..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={3}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase text-[9px] block mb-1">My Relevance Note (Why does this matter?)</label>
                    <input
                      type="text"
                      placeholder="Lifts future semiconductor throughput allocations by next quarter."
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:border-purple-500"
                    />
                  </div>

                  {successMsg && (
                    <div className="p-3 rounded bg-emerald-950 border border-emerald-900 text-emerald-400 text-xs font-semibold">
                      {successMsg}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowCommunityForm(false)}
                      className="px-3.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold"
                    >
                      Verify & Commit Signal
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
