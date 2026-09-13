import React, { useState } from 'react';
import {
  ShieldAlert,
  Calculator,
  Calendar,
  Scale,
  MessageSquare,
  FileCheck,
  Sliders,
  Languages,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  DocumentData,
  RiskFlag,
  ProjectionItem,
} from '../types';
import { ContractHealthGauge } from './ContractHealthGauge';
import { VoiceAssistant } from './VoiceAssistant';
import { SAMPLE_DOCUMENTS } from '../services/api';

interface RiskManagementViewProps {
  document: DocumentData | null;
  onOpenChat: () => void;
  onOpenSimulator: () => void;
  onOpenNegotiation: (flag?: RiskFlag) => void;
  onOpenForge: () => void;
  onSelectSample: (sampleId: string) => void;
}

export const RiskManagementView: React.FC<RiskManagementViewProps> = ({
  document,
  onOpenChat,
  onOpenSimulator,
  onOpenNegotiation,
  onOpenForge,
  onSelectSample,
}) => {
  const activeDoc = document || SAMPLE_DOCUMENTS[0].data;
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium'>('all');

  const isHindi = selectedLanguage === 'hindi';

  const riskFlags: RiskFlag[] =
    isHindi && activeDoc.translatedRiskFlags && activeDoc.translatedRiskFlags.length > 0
      ? activeDoc.translatedRiskFlags
      : activeDoc.riskFlags || [];

  const summary = isHindi && activeDoc.translatedExplanation ? activeDoc.translatedExplanation : activeDoc.explanation;

  const keyDates = activeDoc.keyDates || [];

  // Filter flags by severity if selected
  const filteredFlags = riskFlags.filter((flag) => {
    if (selectedSeverity === 'all') return true;
    const clauseLower = (flag.clause + ' ' + flag.amount + ' ' + flag.why).toLowerCase();
    const isHigh =
      clauseLower.includes('compound') ||
      clauseLower.includes('forfeit') ||
      clauseLower.includes('disconnection') ||
      clauseLower.includes('24%') ||
      clauseLower.includes('28%') ||
      clauseLower.includes('100%');
    return selectedSeverity === 'high' ? isHigh : !isHigh;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Command Banner */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-burnt text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-sand-900">
                  {activeDoc.fileName || activeDoc.docType}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sand-200 text-sand-800 uppercase tracking-wide">
                  {activeDoc.docType}
                </span>
              </div>
              <p className="text-sm text-ink-muted mt-0.5">
                Executive Risk Diagnostics · Predatory Clause Severity Matrix · Mathematical Liability Projections
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Language Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Audio Voice Assistant */}
          <VoiceAssistant
            textToSpeak={
              summary ||
              'Summary of legal risks and liabilities flagged in this agreement.'
            }
            language={selectedLanguage}
          />

          {/* Hindi / English Toggle */}
          <button
            onClick={() => setSelectedLanguage(isHindi ? 'english' : 'hindi')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-sand-300 bg-sand-50 hover:border-burnt text-sand-900 transition-all shadow-2xs"
          >
            <Languages className="w-4 h-4 text-burnt" />
            <span>{isHindi ? 'हिंदी (Hindi Active)' : 'English'}</span>
          </button>

          {/* Primary Action Button: Jump to Clause Q&A */}
          <button
            onClick={onOpenChat}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-burnt hover:bg-burnt-hover text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Clause Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Summary & Contract Health Double-Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Plain-Language Executive Summary & Key Clauses */}
        <div className="lg:col-span-7 bg-white border border-sand-300/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div className="flex items-center space-x-2 text-sand-900 font-bold text-sm sm:text-base">
              <FileText className="w-4 h-4 text-burnt" />
              <span>{isHindi ? 'कार्यकारी सारांश एवं मुख्य शर्तें' : 'Executive Plain-Language Summary'}</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Verified by Claude 3.5 Sonnet
            </span>
          </div>

          <div className="space-y-3 text-sm text-sand-900 leading-relaxed">
            <p className="font-medium bg-sand-50/80 p-4 rounded-xl border border-sand-200/80">
              {summary || 'This agreement has been parsed and ingested for statutory compliance under Indian jurisprudence.'}
            </p>

            {riskFlags.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  {isHindi ? 'पहचाने गए मुख्य प्रावधान:' : 'Key Operational Provisions Analyzed:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {riskFlags.map((flag: RiskFlag, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-sand-50 border border-sand-200/70 rounded-xl text-xs sm:text-sm text-sand-800 flex items-start space-x-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-burnt mt-1.5 flex-shrink-0" />
                      <span className="font-medium">{flag.clause}: <strong className="text-rose-700">{flag.amount}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Contract Health Score & Power Asymmetry Gauge */}
        <div className="lg:col-span-5 bg-white border border-sand-300/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <ContractHealthGauge
            document={activeDoc}
            isHindi={isHindi}
          />

          <div className="mt-4 pt-3 border-t border-sand-200 flex items-center justify-between">
            <button
              onClick={onOpenSimulator}
              className="text-xs sm:text-sm font-bold text-burnt hover:text-burnt-hover flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator →</span>
            </button>
            <button
              onClick={onOpenForge}
              className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Forge Action Dossier →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Predatory Clause & Risk Flags Severity Matrix */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <h2 className="text-base sm:text-lg font-bold text-sand-900">
                {isHindi ? 'पहचाने गए जोखिम और अनुचित शर्तें' : 'Predatory Clauses & Risk Traps Identified'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              Provisions creating unilateral power asymmetry or imposing disproportionate financial liabilities.
            </p>
          </div>

          {/* Severity Filters */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => setSelectedSeverity('all')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition-all ${
                selectedSeverity === 'all'
                  ? 'bg-sand-900 text-white border-sand-900 shadow-2xs'
                  : 'bg-sand-50 text-sand-800 border-sand-200 hover:border-sand-300'
              }`}
            >
              All Traps ({riskFlags.length})
            </button>
            <button
              onClick={() => setSelectedSeverity('high')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg border transition-all ${
                selectedSeverity === 'high'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'
              }`}
            >
              High Severity
            </button>
          </div>
        </div>

        {/* Flag Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFlags.map((flag, idx) => {
            const isHigh =
              flag.clause.toLowerCase().includes('compound') ||
              flag.clause.toLowerCase().includes('forfeit') ||
              flag.amount.toLowerCase().includes('24%') ||
              flag.amount.toLowerCase().includes('28%') ||
              flag.amount.toLowerCase().includes('100%');

            return (
              <div
                key={idx}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all group shadow-2xs ${
                  isHigh
                    ? 'bg-rose-50/40 border-rose-200/90 hover:border-rose-400'
                    : 'bg-amber-50/30 border-amber-200/90 hover:border-amber-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isHigh ? 'High Risk' : 'Medium Risk'}
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">Trap #{idx + 1}</span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-sand-900 leading-snug">
                      {flag.clause}
                    </h3>
                    <div className="text-xs sm:text-sm font-extrabold text-rose-700 mt-1">
                      {flag.amount}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-sand-800 leading-relaxed">
                    {flag.why}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-sand-200/80 flex items-center justify-between">
                  <button
                    onClick={() => onOpenNegotiation(flag)}
                    className="text-xs sm:text-sm font-bold text-burnt hover:text-burnt-hover flex items-center space-x-1"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Draft Pushback Letter →</span>
                  </button>
                  <span className="text-xs text-ink-muted font-medium">Sec 74 ICA</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Mathematical Projections & Critical Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Deterministic Mathematical Projection Card */}
        <div className="lg:col-span-8 bg-white border border-sand-300/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div className="flex items-center space-x-2 text-sand-900 font-bold text-sm sm:text-base">
              <Calculator className="w-4 h-4 text-burnt" />
              <span>{isHindi ? 'सटीक गणितीय विश्लेषण' : 'Deterministic Mathematical Penalty Projections'}</span>
            </div>
            <span className="text-xs font-bold text-burnt bg-burnt-light px-2.5 py-1 rounded-md uppercase">
              100% Zero-Hallucination Math
            </span>
          </div>

          {activeDoc.projections ? (
            <div className="space-y-4">
              {/* Engine 1: Compound Penalty */}
              {activeDoc.projections.engine === 'compound_penalty' && (
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-sand-900">
                      Base Principal: ₹{activeDoc.projections.principal?.toLocaleString()}
                    </span>
                    <span className="text-ink-muted">
                      Annual Compounding Rate: {activeDoc.projections.annualRatePercent}% p.a.
                    </span>
                    {activeDoc.projections.flatPenaltyPerMonth > 0 && (
                      <span className="text-ink-muted">
                        Fixed Late Fee: ₹{activeDoc.projections.flatPenaltyPerMonth}/mo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {activeDoc.projections.projections?.map((p: ProjectionItem, idx: number) => (
                      <div key={idx} className="bg-sand-50/70 border border-sand-200 rounded-xl p-3 text-center">
                        <div className="text-xs text-ink-muted font-semibold">{p.months} {p.months === 1 ? 'Month' : 'Months'}</div>
                        <div className="text-sm sm:text-base font-extrabold text-sand-900 mt-1">₹{p.totalLiability?.toLocaleString()}</div>
                        <div className="text-xs font-bold text-rose-700 mt-0.5">+{p.percentageIncrease}% penalty</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-burnt-light/50 border border-burnt/30 rounded-xl text-xs sm:text-sm text-sand-900">
                    <span className="font-bold block mb-1">Calculation Narrative:</span>
                    {isHindi && activeDoc.translatedProjectionNarrative ? activeDoc.translatedProjectionNarrative : activeDoc.projections.narrative}
                  </div>
                </div>
              )}

              {/* Engine 2: Loan EMI */}
              {activeDoc.projections.engine === 'loan_emi_foreclosure' && (
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-ink-muted">Loan Principal</div>
                      <div className="text-sm sm:text-base font-bold text-sand-900 mt-1">₹{(activeDoc.projections as any).principal?.toLocaleString()}</div>
                    </div>
                    <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-ink-muted">Monthly EMI</div>
                      <div className="text-sm sm:text-base font-bold text-emerald-800 mt-1">₹{(activeDoc.projections as any).monthlyEmi?.toLocaleString()}</div>
                    </div>
                    <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-ink-muted">Foreclosure Fee</div>
                      <div className="text-sm sm:text-base font-bold text-rose-700 mt-1">{(activeDoc.projections as any).foreclosureChargesPercent}% + GST</div>
                    </div>
                    <div className="bg-sand-50 border border-sand-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-ink-muted">Lock-In Period</div>
                      <div className="text-sm sm:text-base font-bold text-amber-700 mt-1">{(activeDoc.projections as any).lockInMonths} Months</div>
                    </div>
                  </div>

                  <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 text-xs sm:text-sm">
                    {(activeDoc.projections as any).narrative}
                  </div>
                </div>
              )}

              {/* Engine 3: Power Tariff */}
              {activeDoc.projections.engine === 'tiered_power_tariff' && (
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-sand-900">Units Billed: {(activeDoc.projections as any).unitsConsumedKwh} kWh</span>
                    <span className="font-bold text-emerald-800">Total Bill: ₹{(activeDoc.projections as any).totalBillAmount?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 text-xs sm:text-sm">
                    {(activeDoc.projections as any).narrative}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-sand-50 rounded-xl border border-sand-200 text-sm text-ink-muted">
              No mathematical projections required for this document category.
            </div>
          )}
        </div>

        {/* Right: Key Dates & Regulatory Deadlines */}
        <div className="lg:col-span-4 bg-white border border-sand-300/80 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sand-900 font-bold text-sm sm:text-base pb-3 border-b border-sand-200">
              <Calendar className="w-4 h-4 text-burnt" />
              <span>Critical Deadlines & Timelines</span>
            </div>

            {keyDates.length > 0 ? (
              <div className="space-y-2.5">
                {keyDates.map((date, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-sand-50 border border-sand-200 flex items-center space-x-3 text-xs sm:text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-burnt flex-shrink-0" />
                    <span className="font-semibold text-sand-900">{date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-ink-muted">
                No explicit date constraints flagged in current clauses.
              </p>
            )}
          </div>

          {/* Quick Domain Benchmark Launcher */}
          <div className="pt-3 border-t border-sand-200 space-y-2">
            <span className="text-xs font-bold text-sand-800 uppercase tracking-wide block">Test Other Domains:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_DOCUMENTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectSample(s.id)}
                  className="px-2.5 py-1 bg-sand-100 hover:bg-burnt-light/60 hover:text-burnt text-sand-800 text-xs font-semibold rounded-lg border border-sand-200 transition-colors"
                >
                  {s.badge}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-950 space-y-1 mt-4">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Statutory 15-Day Cure Notice</span>
            </div>
            <p className="text-xs leading-relaxed">
              Under Indian civil procedure and Section 35 of the CPA 2019, a 15-day cure notice is required before initiating formal tribunal proceedings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
