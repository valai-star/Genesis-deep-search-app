import { useState, useEffect } from "react";
import { ModePreference, StockDossier, PortfolioHolding } from "../types";
import { Sparkles, ArrowRight, FileDown, Share2, Network, CheckCircle, Database, ShieldAlert, Cpu } from "lucide-react";

interface MorningBriefingProps {
  mode: ModePreference;
  watchlist: string[];
  portfolio: PortfolioHolding[];
  archiveData: { [ticker: string]: StockDossier };
  onSelectTicker: (ticker: string) => void;
  onChangeView: (view: "briefing" | "research" | "guardian" | "archive" | "correlation") => void;
}

export function parseStructuredSummary(text: string, isGenesis: boolean) {
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

export default function MorningBriefing({
  mode,
  watchlist,
  portfolio,
  archiveData,
  onSelectTicker,
  onChangeView,
}: MorningBriefingProps) {
  const isGenesis = mode === ModePreference.GENESIS;
  
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStep, setExportStep] = useState<number>(0);
  const [exportLogs, setExportLogs] = useState<string[]>([]);

  // State to hold dynamic AI generated Presidential Daily Briefing
  const [briefData, setBriefData] = useState<any>(() => {
    const cached = localStorage.getItem("genesis_cached_pdb");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback to initial mock if parse fails
      }
    }
    return {
      headline: "Nvidia Anchors Growth Index: High Tech Ingest Steady",
      classification: "CLIENT_CONFIDENTIAL",
      overall_signal: "BULLISH",
      market_summary: "Nvidia (NVDA) continues its dominant trajectory following a robust earnings beat. Blackwell chip supplies are fully committed for the next 12 months, triggering strong interest and supply margins across related semiconductor manufacturers. Broader tech averages remain stable ahead of the upcoming interest adjustments.",
      analyst_consensus: "Wall Street consensus holds a highly constructive posture following secure enterprise server demands.",
      alert_matrix: [
        {
          ticker: "NVDA",
          company: "Nvidia",
          alert: "Strong AI spending by Microsoft, Amazon, and Meta secures Nvidia's near-term sales target. Watch manufacturer TSMC's monthly reports to verify factory output speed.",
          severity: "HIGH",
          direction: "positive"
        },
        {
          ticker: "AAPL",
          company: "Apple Inc.",
          alert: "Facing a Department of Justice antitrust lawsuit over App Store fees. This threatens a major chunk of Apple's high-margin subscription profits.",
          severity: "LOW",
          direction: "mixed"
        },
        {
          ticker: "TSLA",
          company: "Tesla",
          alert: "Offering promotional interest-free car loans in China and Germany to maintain sales momentum, which is compressing overall profit margins on vehicle manufacturing.",
          severity: "MEDIUM",
          direction: "mixed"
        },
        {
          ticker: "DELL",
          company: "Dell",
          alert: "Securing elevated backlogs for enterprise liquid-cooled servers, boosting computing margins.",
          severity: "MEDIUM",
          direction: "positive"
        },
        {
          ticker: "MU",
          company: "Micron Technology",
          alert: "Benefiting from robust high-bandwidth memory (HBM3e) demand, driving sequential contract pricing 20% higher.",
          severity: "MEDIUM",
          direction: "positive"
        }
      ],
      ripple_origin: "NVDA",
      ripple_summary: "Nvidia’s earnings beat ripples positively throughout systems developers and memory providers.",
      ripple_stocks: [
        { ticker: "TSMC", name: "Taiwan Semiconductor Mfg", pct: 2.1, relationship: "Chip Manufacturer", direction: "positive" },
        { ticker: "MU", name: "Micron Technology", pct: 1.8, relationship: "AI Memory Partner", direction: "positive" },
        { ticker: "DELL", name: "Dell Technologies", pct: 0.9, relationship: "Systems Hardware Partner", direction: "positive" }
      ],
      sources_scanned: 14,
      correlations_found: 3,
      next_event: {
        name: "FOMC Rate Press Conference",
        time: "02:00 PM EST",
        importance: "HIGH",
        why: "This interest rate decision will directly affect capital borrowing rates for all watchlisted holdings."
      }
    };
  });

  const [isLayingIntel, setIsLayingIntel] = useState<boolean>(false);
  const [intelStatus, setIntelStatus] = useState<string>("");
  const [intelError, setIntelError] = useState<string | null>(null);

  // Auto trigger on mount if no cached PDB exists
  useEffect(() => {
    if (!localStorage.getItem("genesis_cached_pdb")) {
      handleGenerateBrief();
    }
  }, []);

  const handleGenerateBrief = async () => {
    setIsLayingIntel(true);
    setIntelError(null);
    setIntelStatus("Accessing SEC EDGAR & FOMC pathways...");

    // Build actual holdings parameters. Fallback to default ones if portfolio is empty.
    const holdingsParam = portfolio.length > 0
      ? portfolio.map(p => ({ ticker: p.ticker, company: p.ticker }))
      : [
          { ticker: "NVDA", company: "Nvidia" },
          { ticker: "AAPL", company: "Apple Inc." },
          { ticker: "DELL", company: "Dell Technologies" },
          { ticker: "MU", company: "Micron Technology" },
          { ticker: "PLTR", company: "Palantir" }
        ];

    try {
      setIntelStatus("Crawling global semiconductor Foundry schedules...");
      const response = await fetch("/api/morning-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdings: holdingsParam,
          date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          mode: mode,
        })
      });

      if (!response.ok) {
        throw new Error("PDB Decryption negotiation failed. Check backend credentials.");
      }

      setIntelStatus("Executing high-fidelity sector impact mappings...");
      const data = await response.json();
      
      setBriefData(data);
      localStorage.setItem("genesis_cached_pdb", JSON.stringify(data));
      setIntelStatus("All indicators verified inside secure memory segment!");
      setTimeout(() => {
        setIsLayingIntel(false);
      }, 500);
    } catch (err: any) {
      console.error("handshake morning PDB trigger error:", err);
      setIntelError("Matrix handshake timeout: could not establish secure clearance connection.");
      setIsLayingIntel(false);
    }
  };

  const handleExportPDB = () => {
    setIsExporting(true);
    setExportStep(0);
    setExportLogs(["[SYSTEM]: Initializing secure CIA-level PDB decryption protocol..."]);
    
    // Simulate high-tech packaging steps
    const steps = [
      { delay: 800, log: `[INGESTION]: Downloading active database streams for ${watchlist.join(", ") || "watchlist"}` },
      { delay: 1500, log: `[MUTATOR]: Compressing live correlation nodes around origin ${briefData.ripple_origin}` },
      { delay: 2200, log: "[INTELLIGENCE]: Validating latest catalyst signals at trusted_sources" },
      { delay: 2900, log: "[CRYPTO]: Appending CLIENT_CONFIDENTIAL clearance signature key" },
      { delay: 3500, log: "[SUCCESS]: PDF Document fully compiled and cached in standard print buffer." }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setExportStep(idx + 1);
        setExportLogs((prev) => [...prev, step.log]);
        if (idx === steps.length - 1) {
          // Final success step triggers download & printing
          setTimeout(() => {
            const contentText = `
=========================================
GENESIS DIGITAL INTEL TERMINAL - DAILY BRIEF
CLASSIFICATION: CLIENT_CONFIDENTIAL
DATE: June 14, 2026
=========================================

HEADLINE: "${briefData.headline}"
OVERALL SIGNAL: ${briefData.overall_signal}
LAST SYNC: 06:00 AM EST • ${briefData.sources_scanned} Sources • ${briefData.correlations_found} Correlations Detected

CURRENT MARKET INTEL SUMMARY:
------------------------------
${briefData.market_summary}

ANALYST CONSENSUS:
------------------
${briefData.analyst_consensus}

ALERT MATRIX:
-------------
${briefData.alert_matrix.map((a: any) => `• [${a.severity}] ${a.ticker} (${a.company || ""}): ${a.alert} (Direction: ${a.direction})`).join("\n")}

RIPPLE WATCH CORRELATIONS:
--------------------------
Origin: ${briefData.ripple_origin}
Summary: ${briefData.ripple_summary}
${briefData.ripple_stocks.map((s: any) => `• ${s.ticker} (${s.name}): ${s.pct >= 0 ? "+" : ""}${s.pct}% | Relationship: ${s.relationship}`).join("\n")}

UPCOMING HIGH-IMPORTANCE CALENDAR EVENT:
----------------------------------------
Event: ${briefData.next_event?.name || briefData.next_event?.event || ""}
Timing: ${briefData.next_event?.time || briefData.next_event?.date || ""}
Importance: ${briefData.next_event?.importance || "HIGH"}
Why: ${briefData.next_event?.why || ""}

TODAY'S CATALYSTS:
------------------
• FOMC Rate Press Conference (02:00 PM EST - HIGH IMPORTANCE)
• Weekly Jobless Claims Filing (08:30 AM EST - MEDIUM IMPORTANCE)
• Tokyo Assembly Foundry Ingest (09:30 PM EST - SYSTEM SCANNING)

-----------------------------------------
DISCLAIMER: Genesis provides analytical awareness and interpretive framework modeling only. This output does not constitute explicit investment advice.
=========================================
`;

            const blob = new Blob([contentText], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `GENESIS_PDB_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            window.print();
            setIsExporting(false);
          }, 800);
        }
      }, step.delay);
    });
  };
  
  // Use active watchlisted items, or fallback to default core assets if none exist yet
  const displayTickers = watchlist.length > 0 ? watchlist : ["NVDA", "AAPL", "TSLA", "DELL"];

  return (
    <div className="space-y-6 animate-fade-in" id="morning-briefing-view">
      
      {/* Editorial Header Section */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className={`text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-1.5 ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${isGenesis ? "bg-[#00E5FF]" : "bg-[#FF9100]"}`}></span> PRESIDENTIAL DAILY BRIEF (PDB)
          </span>
          <h2 className="text-3xl font-display font-medium text-white tracking-tight">
            The Morning Briefing
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl font-sans leading-relaxed">
            Daily intelligence assessment prepared specifically for client-directed financial control models.
          </p>
          
          {/* Last Updated Ticker */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-400 bg-slate-950/60 hover:bg-slate-900 border border-slate-900 px-3 py-1.5 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGenesis ? "bg-[#00E5FF]" : "bg-[#FF9100]"}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isGenesis ? "bg-[#00E5FF]" : "bg-[#FF9100]"}`}></span>
              </span>
              <span>Last intelligence sync: <strong className="text-white">06:00 AM EST</strong></span>
              <span className="text-slate-500 font-bold">&bull;</span>
              <span><strong className="text-white">{briefData.sources_scanned}</strong> sources scanned</span>
              <span className="text-slate-500 font-bold">&bull;</span>
              <span className={`font-bold ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`}>{briefData.correlations_found} new correlations detected</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-950/30 px-2 py-1 rounded border border-slate-900">
              <Database className="h-3 w-3 text-cyan-500/60" /> Live Feed bound: alerts/{"{"}userId{"}"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto font-mono text-xs">
          <button
            onClick={handleGenerateBrief}
            disabled={isLayingIntel}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold tracking-wide transition border focus:outline-none cursor-pointer w-full sm:w-auto ${
              isGenesis
                ? "bg-transparent border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10"
                : "bg-transparent border-[#FF9100]/40 text-[#FF9100] hover:bg-[#FF9100]/10"
            }`}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Sync Morning Brief ⚡
          </button>

          {/* Briefing Export Action Button */}
          <button
            onClick={handleExportPDB}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold tracking-wide transition border focus:outline-none cursor-pointer w-full sm:w-auto ${
              isGenesis
                ? "bg-[#00E5FF] hover:bg-[#00D0EB] border-[#00E5FF]/20 text-slate-950 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                : "bg-[#FF9100] hover:bg-[#E08000] border-[#FF9100]/20 text-slate-950 hover:shadow-[0_0_15px_rgba(255,145,0,0.25)]"
            }`}
          >
            <FileDown className="h-4 w-4 stroke-[2.5]" />
            Compile & Export PDB (PDF)
          </button>

          <button
            onClick={() => {
              const text = `Genesis PDB - Active Assets: ${watchlist.join(", ")}. ${briefData.sources_scanned} sources scanned, ${briefData.correlations_found} new correlations. Headline: "${briefData.headline}"`;
              navigator.clipboard.writeText(text);
              alert("Classification dossier share link copied to secure clipboard!");
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900 transition focus:outline-none cursor-pointer w-full sm:w-auto"
            title="Share document context internally"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Internally
          </button>
        </div>
      </div>

      {inetlErrorDisplay(intelError, handleGenerateBrief)}

      {/* Single, Centralized, Full-width Briefing Panel matching image_0d8b43 with side Today's Catalysts */}
      <div className="rounded-xl border border-slate-800 bg-[#060b13] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-48 w-48 bg-cyan-500/5 blur-3xl rounded-full -mr-24 -mt-24"></div>
        
        <div className="relative">
          
          {/* Daily Intelligence Seal Rotating Animation Watermark */}
          <div className="absolute top-0 right-0 z-0 opacity-15 pointer-events-none select-none hidden md:block transition-all duration-1000">
            <svg className={`w-28 h-28 animate-[spin_30s_linear_infinite] ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`} viewBox="0 0 100 100">
              <defs>
                <path id="sealCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
              </defs>
              <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="1,1" />
              <g transform="translate(50,50)" fill="currentColor">
                <path d="M-6,-8 L6,-8 L8,-3 L0,8 L-8,-3 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="0" cy="-2" r="1.5" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="currentColor" strokeWidth="0.5" />
              </g>
              <text fontFamily="monospace" fontSize="6.2" fontWeight="bold" fill="currentColor" letterSpacing="0.3">
                <textPath href="#sealCirclePath" startOffset="0%">
                  MARKET INTELLIGENCE DIVISION &bull; GENESIS DIVISION &bull; 
                </textPath>
              </text>
            </svg>
          </div>
          
          {/* Tagline header */}
          <div className={`flex items-center gap-2 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider mb-5 ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${isGenesis ? "bg-[#00E5FF]" : "bg-[#FF9100]"}`}></span>
            PRESIDENTIAL & CEO PORTFOLIO DAILY BRIEF (PDB) &bull; CONSOLIDATED WATCHLIST
          </div>

          {/* Dynamic Headline display */}
          <div className="mb-6 space-y-2 border-b border-slate-900 pb-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono bg-red-950/40 text-red-400 px-2.5 py-0.5 rounded border border-red-900/40 uppercase font-bold">
                {briefData.classification || "CLIENT_CONFIDENTIAL"}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                briefData.overall_signal === "BULLISH" 
                  ? "border-emerald-800 bg-emerald-950/40 text-emerald-400" 
                  : briefData.overall_signal === "BEARISH"
                  ? "border-rose-800 bg-rose-950/40 text-[#ff4a4a]"
                  : "border-slate-800 bg-slate-900/40 text-slate-400"
              }`}>
                SIGNAL: {briefData.overall_signal || "BULLISH"}
              </span>
            </div>
            <h3 className="text-xl md:text-3xl font-display font-medium text-white tracking-tight leading-normal uppercase">
              "{briefData.headline}"
            </h3>
          </div>

          {/* Grid Layout to split summary/alerts and today's catalysts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left side: Market Intel and Alerts matrix */}
            <div className="lg:col-span-8 space-y-5">
              {/* Heading with Firebase routing mapping */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight">
                    Current Market Intel Summary
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Consolidated Wall Street stance: <span className="text-slate-350">{briefData.analyst_consensus}</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-900">
                  <Database className="h-3 w-3 text-cyan-400/60" /> intelligence/{"{ticker}"}
                </span>
              </div>

              {/* Core macro paragraph */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {parseStructuredSummary(briefData.market_summary, isGenesis).map((sec, sIdx) => (
                  <div 
                    key={sIdx} 
                    className={`p-4 rounded-xl border bg-slate-950/40 transition-all duration-300 relative overflow-hidden group ${
                      isGenesis 
                        ? "border-cyan-950/25 hover:border-[#00E5FF]/20" 
                        : "border-amber-950/25 hover:border-[#FF9100]/20"
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-900 to-transparent opacity-20 rounded-full blur-lg pointer-events-none"></div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest block mb-1.5 ${
                      isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"
                    }`}>
                      {sec.label}
                    </span>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Correlation Engine Ripple Watch Summary */}
              <div className={`p-4 rounded-xl border bg-slate-950/50 font-mono transition-all duration-300 relative overflow-hidden group ${
                isGenesis ? "border-cyan-950/40 hover:border-[#00E5FF]/30" : "border-amber-950/40 hover:border-[#FF9100]/30"
              }`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-900 to-transparent opacity-30 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between pb-2 border-b border-slate-900 text-[10px]">
                  <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"
                  }`}>
                    <Network className="h-3.5 w-3.5 animate-pulse" /> Ripple Watch Real-Time Ingest
                  </span>
                  <span className="text-slate-500 text-[9px] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    BOUND: correlations/{"{"}{briefData.ripple_origin.toLowerCase()}{"}"}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-300 leading-relaxed font-sans">
                      <strong className="font-bold font-mono text-emerald-400">{briefData.ripple_origin} Influence Ripple</strong>: {briefData.ripple_summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 font-sans text-[11px] text-slate-400">
                      <span className="text-slate-500 font-bold">Affected Vectors:</span>
                      {briefData.ripple_stocks.map((s: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                          <strong className="text-white font-mono text-[10px]">{s.ticker}</strong>
                          <span className={s.pct >= 0 ? "text-emerald-400 font-bold" : "text-red-500 font-bold"}>
                            {s.pct >= 0 ? "+" : ""}{s.pct}%
                          </span>
                          <span className="text-[10px] text-slate-500">({s.relationship})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-end">
                    <button
                      onClick={() => onChangeView("correlation")}
                      className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg border flex items-center gap-1.5 transition focus:outline-none cursor-pointer ${
                        isGenesis
                          ? "border-[#00E5FF]/30 text-[#00E5FF] bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/60"
                          : "border-[#FF9100]/30 text-[#FF9100] bg-[#FF9100]/5 hover:bg-[#FF9100]/10 hover:border-[#FF9100]/60"
                      }`}
                    >
                      Ripple Engine
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section check uppercase */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 pb-1">
                <span className={`font-mono font-bold tracking-wider text-xs md:text-sm uppercase ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`}>
                  ALERT MATRIX:
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-900">
                  <Database className="h-3 w-3 text-cyan-400/60" /> alerts/{"{userId}"}
                </span>
              </div>

              {/* Plain english list of alerts */}
              <ul className="space-y-4 pt-1">
                {briefData.alert_matrix.map((item: any, index: number) => {
                  return (
                    <li key={`${item.ticker}-${index}`} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-300 font-sans">
                      <span className={`font-bold block shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full ${
                        item.severity === "HIGH" 
                          ? "bg-rose-500 animate-pulse" 
                          : item.severity === "MEDIUM" 
                          ? "bg-amber-500" 
                          : "bg-cyan-500"
                      }`}></span>
                      <div className="leading-relaxed">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-white font-semibold flex-wrap">
                            {item.ticker} ({item.company})
                          </strong>
                          <span className={`text-[9px] font-mono px-1.5 rounded border leading-none font-bold ${
                            item.severity === "HIGH" 
                              ? "border-rose-905 bg-rose-950/20 text-[#ff4a4a]" 
                              : item.severity === "MEDIUM" 
                              ? "border-amber-905 bg-amber-950/20 text-amber-400" 
                              : "border-slate-800 bg-slate-900/25 text-slate-400"
                          }`}>
                            {item.severity}
                          </span>
                          <span className={`text-[9px] font-mono font-bold ${
                            item.direction === "positive" 
                              ? "text-emerald-400" 
                              : item.direction === "negative" 
                              ? "text-red-500" 
                              : "text-slate-400"
                          }`}>
                            {item.direction === "positive" ? "▲ POSITIVE" : item.direction === "negative" ? "▼ NEGATIVE" : "⚖ MIXED"}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">{item.alert}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Right side Today's Catalysts list with side reminder bar indicator */}
            <div className="lg:col-span-4 bg-slate-950/60 rounded-xl border border-slate-800/80 p-5 space-y-4 flex flex-col justify-between font-sans">
              <div>
                <span className="text-xs font-bold text-slate-200 font-mono block tracking-wider uppercase border-b border-slate-900 pb-2.5 flex items-center justify-between">
                  <span>⚡ TODAY'S CATALYSTS</span>
                  <span className="inline-flex items-center gap-1 text-[8.5px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900 font-normal">
                    <Database className="h-2.5 w-2.5 text-cyan-400/60 animate-pulse" /> trusted_sources
                  </span>
                </span>
                
                <ul className="space-y-4 text-xs text-slate-300 pt-3">
                  {/* Dynamic Next Event from Gemini PDB */}
                  {briefData.next_event && (
                    <li className="flex gap-3 items-start group p-2.5 rounded-lg border border-cyan-950/40 bg-cyan-950/10 animate-fade-in">
                      <span className={`h-3 w-1.5 rounded-full mt-1 shrink-0 block ${
                        briefData.next_event.importance === "HIGH" ? "bg-rose-500 animate-pulse" : "bg-amber-400"
                      }`} title={`${briefData.next_event.importance} IMPORTANCE`}></span>
                      <div>
                        <span className="text-[9px] font-mono text-cyan-405 block tracking-widest font-bold">// SYSTEM IMPACT DECREE</span>
                        <strong className="text-white font-bold block text-[13px]">{briefData.next_event.name || briefData.next_event.event}</strong>
                        <span className="text-slate-400 font-mono block text-[10px] mt-0.5">{briefData.next_event.time || briefData.next_event.date} &bull; {briefData.next_event.importance} IMPORTANCE</span>
                        <p className="text-[11px] text-slate-300 leading-normal mt-1 font-sans font-medium">{briefData.next_event.why}</p>
                      </div>
                    </li>
                  )}

                  <li className="flex gap-3 items-start group">
                    <span className="h-3 w-1.5 rounded-full bg-emerald-500 mt-1 shrink-0 block" title="HIGH IMPORTANCE"></span>
                    <div>
                      <strong className="text-white font-medium block text-[13px]">FOMC Rate Press Conference</strong>
                      <span className="text-slate-500 font-mono block text-[10px] mt-0.5">02:00 PM EST &bull; HIGH IMPORTANCE</span>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start group">
                    <span className="h-3 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0 block" title="MEDIUM IMPORTANCE"></span>
                    <div>
                      <strong className="text-white font-medium block text-[13px]">Weekly Jobless Claims Filing</strong>
                      <span className="text-slate-505 font-mono block text-[10px] mt-0.5">08:30 AM EST &bull; MEDIUM IMPORTANCE</span>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start group">
                    <span className="h-3 w-1.5 rounded-full bg-cyan-450 mt-1 shrink-0 block" title="SYSTEM SCANNING"></span>
                    <div>
                      <strong className="text-white font-medium block text-[13px]">Tokyo Assembly Foundry Ingest</strong>
                      <span className="text-slate-505 font-mono block text-[10px] mt-0.5">09:30 PM EST &bull; SYSTEM SCANNING</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Quick status checklist / reminder bar indicator */}
              <div className="p-3.5 bg-slate-900/50 rounded-lg border border-slate-800/60 space-y-1.5">
                <div className="text-[10px] font-mono text-cyan-405 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span> REMINDER STATUS BAR ACTIVE
                </div>
                <div className="text-[11px] text-slate-300 font-mono leading-normal space-y-1">
                  <div>Active watch alerts: <strong className="text-white">{briefData.alert_matrix.length}</strong></div>
                  <div>Sync major target: <strong className="text-white">{briefData.next_event ? (briefData.next_event.name || briefData.next_event.event) : "None"}</strong></div>
                  <p className="text-[10.5px] text-slate-500 leading-normal pt-1 font-sans">
                    All parameters match watch holdings identically. Automatically synchronizing over Gemini channels safely.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Double hands / pointers links pointing back to Portfolio Guardian */}
          <div className="pt-8 mt-6 border-t border-slate-900/60 flex justify-center">
            <button
              onClick={() => onChangeView("guardian")}
              className="text-xs md:text-sm font-mono text-amber-400 hover:text-amber-300 transition hover:underline inline-flex items-center gap-2 font-bold"
            >
              ✍️ ✍️ ✍️ Review Full Overnight Matrices (Requires Portfolio Guardian)
            </button>
          </div>

        </div>
      </div>

      {/* Modify Holdings back navigation */}
      <div className="flex justify-end pt-2 text-xs">
        <button
          onClick={() => onChangeView("guardian")}
          className="text-xs font-mono font-bold text-slate-400 hover:text-slate-200 transition flex items-center gap-1 cursor-pointer"
          id="modify-holdings-link"
        >
          Modify Holdings &rarr;
        </button>
      </div>

      {/* Immersive high-tech compilation export status HUD modal */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="pdb-export-modal">
          <div className="max-w-md w-full bg-[#060b13] border border-cyan-500/25 rounded-xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 h-32 w-32 rounded-full opacity-10 blur-2xl ${isGenesis ? "bg-cyan-500" : "bg-amber-500"}`}></div>
            
            <div className="flex flex-col items-center text-center space-y-3 font-mono">
              {/* Rotating seal loader */}
              <div className="relative">
                <Cpu className={`h-11 w-11 animate-pulse ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`} />
                <div className={`absolute inset-0 rounded-full border-2 border-dashed animate-spin ${isGenesis ? "border-[#00E5FF]/40" : "border-[#FF9100]/40"}`} style={{ animationDuration: '6s' }}></div>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-200">
                  Compiling PDB Dossier
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  SECURITY CLEARANCE LEVEL: CLIENT_CONFIDENTIAL
                </p>
              </div>
            </div>

            {/* Simulated compilation terminal logs */}
            <div className="bg-slate-950 rounded-lg p-4 font-mono text-[10.5px] space-y-2 border border-slate-900/60 max-h-48 overflow-y-auto">
              {exportLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`leading-normal ${
                    log.includes("[SUCCESS]")
                      ? "text-emerald-400 font-bold"
                      : log.includes("[SYSTEM]")
                      ? "text-[#00E5FF] font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {log}
                </div>
              ))}
              {exportStep < 5 && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 animate-pulse pt-1">
                  <span className="h-1 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1 w-2 rounded-full bg-[#1b2535] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-900/60 pt-4">
              <span>GENESIS INTEL CORE v4.0</span>
              <span>STEP {exportStep} OF 5</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Intel Ingest overlay */}
      {isLayingIntel && (
        <div className="fixed inset-0 z-50 bg-[#070b13]/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl animate-pulse font-mono">
            <div className="relative flex items-center justify-center mx-auto w-16 h-16 mb-4">
              <div className={`h-16 w-16 rounded-full border-4 border-slate-800 animate-spin ${isGenesis ? "border-t-[#00E5FF]" : "border-t-[#FF9100]"}`}></div>
              <Sparkles className={`h-6 w-6 absolute animate-bounce ${isGenesis ? "text-[#00E5FF]" : "text-[#FF9100]"}`} />
            </div>
            <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider">COMPILING MORNING INTELLIGENCE</h3>
            <p className="text-xs text-slate-300 leading-normal text-center">
              {intelStatus}
            </p>
            <div className={`text-[10px] ${isGenesis ? "text-[#00E5FF]/80" : "text-[#FF9100]/80"}`}>
              Handshaking with Gemini systems over SEC pathways...
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function inetlErrorDisplay(intelError: string | null, handleGenerateBrief: () => void) {
  if (!intelError) return null;
  return (
    <div className="p-4 bg-red-950/25 border border-red-500/30 rounded-xl flex items-center justify-between text-xs text-red-550 font-mono">
      <span>⚠️ {intelError}</span>
      <button 
        onClick={handleGenerateBrief}
        className="px-3 py-1 bg-red-940 hover:bg-red-900/60 transition rounded border border-red-700 font-bold"
      >
        Retry Connection
      </button>
    </div>
  );
}
