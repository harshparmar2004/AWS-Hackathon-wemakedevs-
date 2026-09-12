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
  engine?: 'compound_penalty';
  status?: string;
  principal: number;
  annualRatePercent: number;
  flatPenaltyPerMonth: number;
  compoundingFrequency: string;
  projections: ProjectionItem[];
  narrative: string;
}

export interface LoanMilestone {
  month: number;
  isLockInActive: boolean;
  remainingPrincipal: number;
  foreclosureFee: number;
  gstOnFee: number;
  totalForeclosureCost: number;
  totalToCloseLoan: number;
  effectivePenaltyPct: number;
}

export interface LoanCalculationData {
  engine: 'loan_emi_foreclosure';
  status?: string;
  principal: number;
  annualInterestRatePercent: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  foreclosureChargePercent: number;
  lockInPeriodMonths: number;
  missedEmiPenalRatePercent: number;
  penalInterestPerMissedEmi: number;
  milestones: LoanMilestone[];
  narrative: string;
}

export interface TariffSlabItem {
  label: string;
  units: number;
  ratePerUnit: number;
  charge: number;
}

export interface TariffCalculationData {
  engine: 'tiered_power_tariff';
  status?: string;
  unitsKwh: number;
  sanctionedLoadKw: number;
  slabBreakdown: TariffSlabItem[];
  energyCharge: number;
  fixedCharge: number;
  fuelAdjustmentCharge: number;
  peakSurcharge: number;
  electricityDuty: number;
  dutyPercent: number;
  totalNetBill: number;
  averageCostPerUnit: number;
  narrative: string;
}

export interface CustomMilestone {
  day: number;
  ruleApplied: string;
  flatFee: number;
  percentagePenalty: number;
  totalPenalty: number;
  totalLiability: number;
  effectivePenaltyPct: number;
}

export interface CustomFormulaData {
  engine: 'custom_formula';
  status?: string;
  formulaName: string;
  formulaDescription: string;
  baseAmount: number;
  projections: CustomMilestone[];
  narrative: string;
}

export type UnifiedCalculationData =
  | ProjectionData
  | LoanCalculationData
  | TariffCalculationData
  | CustomFormulaData;

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
  projections?: UnifiedCalculationData | any;
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
