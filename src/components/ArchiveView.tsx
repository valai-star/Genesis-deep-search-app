import { useState } from "react";
import { StockDossier, ModePreference, NewsEvent } from "../types";
import {
  Folder,
  FolderOpen,
  FileText,
  Calendar,
  Layers,
  Users,
  Activity,
  GitPullRequest,
  BookOpen,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface ArchiveViewProps {
  mode: ModePreference;
  archiveData: { [ticker: string]: StockDossier };
  onTranslateItem: (ticker: string, itemId: string) => void;
  onInterpretSection: (sectionName: string, data: any) => Promise<string>;
}

export default function ArchiveView({
  mode,
  archiveData,
  onTranslateItem,
  onInterpretSection,
}: ArchiveViewProps) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    Object.keys(archiveData).length > 0 ? Object.keys(archiveData)[0] : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("newsEvents");
  const [sectionInterpretations, setSectionInterpretations] = useState<{ [key: string]: string }>({});
  const [interpreting, setInterpreting] = useState<string | null>(null);

  const getCategoryCount = (ticker: string, category: string): number => {
    const dossier = archiveData[ticker];
    if (!dossier) return 0;
    
    switch (category) {
      case "newsEvents": return dossier.compartments.newsEvents?.length || 0;
      case "upcomingCalendar": return dossier.compartments.upcomingCalendar?.length || 0;
      case "socialPolitical": return dossier.compartments.socialPolitical?.length || 0;
      case "rippleMap": return dossier.compartments.rippleMap?.length || 0;
      default: return 1; // single object metrics like financials/overview
    }
  };

  const handleTranslateInArchive = (ticker: string, itemId: string) => {
    onTranslateItem(ticker, itemId);
  };

  const handleInterpretInArchive = async (category: string, data: any) => {
    setInterpreting(category);
    try {
      const resp = await onInterpretSection(category, data);
      setSectionInterpretations((prev) => ({
        ...prev,
        [`${selectedTicker}_${category}`]: resp,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setInterpreting(null);
    }
  };

  return (
    <div className="space-y-6" id="genesis-intelligence-archive-panel">
      {/* Overview Block */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
        <h2 className="text-xl font-display font-bold text-white tracking-wide">
          Intelligence Archive (Everything Filed, Nothing Lost)
        </h2>
        <p className="text-xs text-slate-400">
          Every piece of content Genesis detects, processes, or filters is archived for permanent reference. 
          Use this panel to audit previous briefings, read historic news pieces, and translate complex filings.
        </p>
      </div>

      {Object.keys(archiveData).length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 text-xs">
          Your Intelligence Archive is empty. Perform a Deep Research Scan on a stock to automatically populate its files here.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Tickers & Folder Nodes (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block pl-1">
              Active Stock Folders
            </span>
            <div className="space-y-2">
              {Object.keys(archiveData).map((ticker) => {
                const isActive = selectedTicker === ticker;
                return (
                  <button
                    key={ticker}
                    onClick={() => {
                      setSelectedTicker(ticker);
                      setSectionInterpretations({}); // clear temporary evaluations
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isActive
                        ? "border-purple-500 bg-purple-950/20 text-purple-300"
                        : "border-slate-800 bg-slate-950/40 hover:bg-slate-900 hover:text-white text-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono font-bold text-sm">
                      {isActive ? <FolderOpen className="h-4 w-4 text-purple-400" /> : <Folder className="h-4 w-4 text-slate-600" />}
                      <span>{ticker} Intelligence Folders</span>
                    </div>
                    <span className="text-[10px] bg-slate-900 border border-slate-805 border-slate-800 px-2 py-0.5 rounded text-slate-400">
                      SEC Active
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTicker && (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 font-mono text-xs">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                  Compartment Folders for {selectedTicker}
                </span>
                
                <div className="space-y-1">
                  {[
                    { key: "newsEvents", label: "News & Events", count: getCategoryCount(selectedTicker, "newsEvents") },
                    { key: "earningsFinancials", label: "Earnings & Balance", count: 1 },
                    { key: "upcomingCalendar", label: "Calendar Events", count: getCategoryCount(selectedTicker, "upcomingCalendar") },
                    { key: "analystActivity", label: "Analyst Reports", count: 1 },
                    { key: "socialPolitical", label: "Social & Political", count: getCategoryCount(selectedTicker, "socialPolitical") },
                    { key: "rippleMap", label: "Related Company Signals", count: getCategoryCount(selectedTicker, "rippleMap") },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`w-full text-left p-2 rounded text-xs px-2.5 transition flex items-center justify-between ${
                        selectedCategory === cat.key
                          ? "bg-purple-950/55 text-purple-200 font-bold border-l-2 border-purple-500"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>📁 {cat.label}</span>
                      <span className="text-[10px] text-slate-600">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Folder Contents (8 cols) */}
          <div className="lg:col-span-8">
            {selectedTicker && archiveData[selectedTicker] ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/70 space-y-6">
                
                {/* Folder Header */}
                <div className="flex flex-col sm:flex-row items-baseline justify-between border-b border-slate-800 pb-3 gap-2">
                  <div>
                    <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                      <span className="text-purple-400">📁</span>
                      <span>{selectedTicker} &bull; {selectedCategory.toUpperCase()}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Historically cataloged assets. Click segment interpretation or toggle plain-English translations immediately.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const activeDossier = archiveData[selectedTicker!]!;
                      const categoryData = activeDossier.compartments[selectedCategory as keyof typeof activeDossier.compartments];
                      handleInterpretInArchive(selectedCategory, categoryData);
                    }}
                    disabled={interpreting !== null}
                    className="px-2.5 py-1 text-[11px] bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-300 font-mono rounded flex items-center gap-1 transition"
                  >
                    {interpreting === selectedCategory ? (
                      <span className="animate-spin inline-block mr-1">&#x21BB;</span>
                    ) : (
                      <span>&#x2724;</span>
                    )}
                    Interpret Section &rarr;
                  </button>
                </div>

                {/* Local Interpretation Block */}
                {sectionInterpretations[`${selectedTicker}_${selectedCategory}`] && (
                  <div className="p-4 rounded-lg bg-purple-950/15 border border-purple-800/80 text-purple-300 text-xs font-mono space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold block">// ARCHIVED GENESIS EVALUATION SUMMARY</span>
                    <p>{sectionInterpretations[`${selectedTicker}_${selectedCategory}`]}</p>
                    <button
                      onClick={() => {
                        setSectionInterpretations((prev) => {
                          const copy = { ...prev };
                          delete copy[`${selectedTicker}_${selectedCategory}`];
                          return copy;
                        });
                      }}
                      className="text-purple-500 hover:text-purple-300 underline font-normal mt-1 block"
                    >
                      Clear Evaluation
                    </button>
                  </div>
                )}

                {/* Render corresponding category details */}
                <div className="space-y-4">
                  {/* Category: News and events with individual Translate Toggle */}
                  {selectedCategory === "newsEvents" && (
                    <div className="space-y-4 font-mono text-xs">
                      {archiveData[selectedTicker].compartments.newsEvents?.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg border border-slate-800 bg-slate-900/20 space-y-3">
                          <div className="flex justify-between items-center text-[10px] border-b border-slate-800/60 pb-1.5">
                            <span className="text-purple-300 font-bold">{item.category}</span>
                            <span className="text-slate-500">{item.date}</span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-100 font-sans tracking-wide">
                            {item.headline}
                          </h4>

                          <div className="p-2 bg-slate-950 rounded text-slate-400 text-[11px] leading-relaxed">
                            {item.isTranslated ? item.translatedContent : item.originalContent}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                            <span className="text-[9px] text-slate-500">Source: {item.source}</span>
                            <button
                              onClick={() => handleTranslateInArchive(selectedTicker!, item.id)}
                              className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 hover:bg-purple-900 border border-purple-800 font-bold text-[9px] transition"
                            >
                              {item.isTranslated ? "Show original jargon" : "Translate → Plain English"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: Balance Earnings financials */}
                  {selectedCategory === "earningsFinancials" && (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="p-4 bg-slate-900/30 rounded border border-slate-800 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">EPS BEAT</span>
                            <span className="text-white font-bold">{archiveData[selectedTicker].compartments.earningsFinancials?.eps}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">REVENUE DELIVERED</span>
                            <span className="text-white font-bold">{archiveData[selectedTicker].compartments.earningsFinancials?.revenue}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">PROFIT MARGIN</span>
                            <span className="text-white font-bold">{archiveData[selectedTicker].compartments.earningsFinancials?.margin}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">FORWARD OUTLOOK</span>
                            <span className="text-emerald-400 font-bold">{archiveData[selectedTicker].compartments.earningsFinancials?.guidance}</span>
                          </div>
                        </div>
                        <p className="text-slate-300 border-t border-slate-900 pt-3 leading-normal font-sans">
                          {archiveData[selectedTicker].compartments.earningsFinancials?.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Category: Upcoming Calendar */}
                  {selectedCategory === "upcomingCalendar" && (
                    <div className="space-y-3 font-mono text-xs">
                      {archiveData[selectedTicker].compartments.upcomingCalendar?.map((evt, eIdx) => (
                        <div key={eIdx} className="p-3 bg-slate-900/20 rounded-lg border border-slate-800 flex justify-between items-center gap-3">
                          <div className="space-y-0.5">
                            <span className="text-slate-200 font-bold font-sans">{evt.event}</span>
                            <p className="text-slate-400 text-[11px] leading-normal">{evt.explanation}</p>
                          </div>
                          <span className="text-purple-300 font-bold shrink-0">{evt.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: Analyst ratings */}
                  {selectedCategory === "analystActivity" && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-4 bg-slate-900/30 rounded border border-slate-800 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500">CONSENSUS RATINGS</span>
                          <span className="text-purple-300 font-bold">{archiveData[selectedTicker].compartments.analystActivity?.consensus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">EST PRICE SPREAD</span>
                          <span className="text-purple-300 font-bold">{archiveData[selectedTicker].compartments.analystActivity?.targetPrice}</span>
                        </div>
                        <ul className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-2 rounded border border-slate-900/40">
                          {archiveData[selectedTicker].compartments.analystActivity?.recentChanges.map((change, cIdx) => (
                            <li key={cIdx}>&bull; {change}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Category: Social/Political and sentiment */}
                  {selectedCategory === "socialPolitical" && (
                    <div className="space-y-3 font-mono text-xs">
                      {archiveData[selectedTicker].compartments.socialPolitical?.map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/20 rounded border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-1">
                            <span className="text-purple-300 font-bold">{item.platform} ({item.author})</span>
                            <span className="text-slate-500">{item.timestamp}</span>
                          </div>
                          <p className="text-slate-300 italic">&ldquo;{item.content}&rdquo;</p>
                          <span className="text-[9px] block text-right text-rose-300">POTENTIAL IMPACT: {item.impact}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: Correlation ripple map relationships */}
                  {selectedCategory === "rippleMap" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs animate-fade-in">
                      {archiveData[selectedTicker].compartments.rippleMap?.map((node) => (
                        <div key={node.ticker} className="p-4 rounded-lg border border-slate-800 bg-slate-900/25 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-bold text-purple-300">{node.ticker} ({node.name})</span>
                            <span className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">{node.impactType}</span>
                          </div>
                          <p className="text-slate-400 leading-normal text-[11px]">{node.why}</p>
                          <div className="flex justify-between text-[10px] border-t border-slate-900 pt-1.5 mt-1">
                            <span className="text-slate-500">Sector Correlation</span>
                            <span className="text-white">{node.performance}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            ) : null}
          </div>

        </div>
      )}
    </div>
  );
}
