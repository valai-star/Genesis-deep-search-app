export enum ModePreference {
  EXPERT = "expert",
  GENESIS = "genesis",
}

export interface MarketOverview {
  price: number;
  changePercent: number;
  volume: string;
  range52Week: string;
  marketCap: string;
  technicalLevels: string;
}

export interface NewsEvent {
  id: string;
  category: "Product Launch" | "Earnings" | "Deal" | "Risk" | "Macro" | "Regulatory" | "Political" | "Supply Chain" | "Competitor";
  source: string;
  date: string;
  impact: "High" | "Medium" | "Low";
  headline: string;
  who: string;
  what: string;
  where: string;
  why: string;
  originalContent: string;
  translatedContent: string;
  isTranslated?: boolean;
}

export interface EarningsFinancials {
  revenue: string;
  eps: string;
  guidance: string;
  beatMiss: string;
  margin: string;
  summary: string;
}

export interface CalendarEvent {
  event: string;
  date: string;
  importance: string;
  explanation: string;
}

export interface AnalystActivity {
  consensus: string;
  targetPrice: string;
  recentChanges: string[];
  summary: string;
}

export interface SocialPoliticalSignal {
  platform: string;
  author: string;
  content: string;
  impact: "High" | "Medium" | "Low";
  timestamp: string;
}

export interface RippleConnection {
  ticker: string;
  name: string;
  relationship: string;
  impactType: "bullish" | "bearish" | "neutral";
  why: string;
  performance: string;
}

export interface Compartments {
  marketOverview: MarketOverview;
  newsEvents: NewsEvent[];
  earningsFinancials: EarningsFinancials;
  upcomingCalendar: CalendarEvent[];
  analystActivity: AnalystActivity;
  socialPolitical: SocialPoliticalSignal[];
  rippleMap: RippleConnection[];
}

export interface CausalStep {
  step: number;
  cause: string;
  effect: string;
}

export interface SectorImpact {
  sector: string;
  impact: "positive" | "negative" | "mixed";
  reasoning: string;
}

export interface RiskItem {
  risk: string;
  likelihood: "high" | "medium" | "low";
  severity: "high" | "medium" | "low";
  mitigant: string;
}

export interface ScenarioTree {
  scenario: string;
  probability: "high" | "medium" | "low";
  outcome: string;
}

export interface ReasoningLayer {
  causalChain: CausalStep[];
  sectorImpactMap: SectorImpact[];
  riskMatrix: RiskItem[];
  scenarioTree: ScenarioTree[];
}

export interface PipelineMeta {
  sourcesScanned: string[];
  nodesScanned: number;
  contaminationFlags: number;
  generatedAt: string;
}

export interface StockDossier {
  ticker: string;
  briefTitle: string;
  briefText: string;
  sourcesReviewedCount: number;
  compartments: Compartments;
  reasoningLayer?: ReasoningLayer;
  topSignals?: string[];
  pipelineMeta?: PipelineMeta;
}

export interface CommunitySignal {
  id: string;
  ticker: string;
  sourceUrl: string;
  textContribution: string;
  userObservation: string;
  authorEmail: string;
  timestamp: string;
  verified: boolean;
}

export interface PortfolioHolding {
  ticker: string;
  shares: number;
  avgCost: number;
}
