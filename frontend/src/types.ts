export interface RiskFlag {
  clause: string;
  amount: string;
  why: string;
}

export interface ProjectionItem {
  months: number;
  days: number;
  principal: number;
  interestAccrued: number;
  flatFees: number;
  totalPenalty: number;
  totalLiability: number;
  percentageIncrease: number;
}

export interface ProjectionData {
  status?: string;
  principal: number;
  annualRatePercent: number;
  flatPenaltyPerMonth: number;
  compoundingFrequency: string;
  projections: ProjectionItem[];
  narrative: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cached?: boolean;
}

export interface DocumentData {
  docId: string;
  status: 'processing' | 'complete' | 'failed';
  docType?: string;
  fileName?: string;
  fileType?: string;
  language?: string;
  rawExtraction?: string;
  explanation?: string;
  keyDates?: string[];
  riskFlags?: RiskFlag[];
  riskScore?: 'high' | 'moderate' | 'low';
  translatedExplanation?: string;
  translatedRiskFlags?: RiskFlag[];
  translatedProjectionNarrative?: string;
  projections?: ProjectionData;
  createdAt?: string;
  updatedAt?: string;
  errorMessage?: string;
  chatHistory?: ChatMessage[];
}

export interface SampleDocument {
  id: string;
  name: string;
  type: string;
  badge: string;
  data: DocumentData;
}

export interface HistoryItem {
  id: string;
  name: string;
  type: string;
  badge: string;
  createdAt: string;
  status: 'complete' | 'processing';
  isSample?: boolean;
  chatCount?: number;
}
