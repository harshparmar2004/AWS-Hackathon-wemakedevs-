import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  Calendar,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { ProjectionData } from '../types';
import { calculateFeeDirect } from '../services/api';

interface CalculatorToolProps {
  initialProjections?: ProjectionData;
  translatedNarrative?: string;
  showTranslated?: boolean;
  onBackToAnalysis?: () => void;
}

export const CalculatorTool: React.FC<CalculatorToolProps> = ({
  initialProjections,
  translatedNarrative,
  showTranslated,
  onBackToAnalysis,
}) => {
  const [principal, setPrincipal] = useState<number>(initialProjections?.principal || 35000);
  const [annualRate, setAnnualRate] = useState<number>(initialProjections?.annualRatePercent || 24);
  const [flatFee, setFlatFee] = useState<number>(initialProjections?.flatPenaltyPerMonth || 500);
  const [frequency, setFrequency] = useState<string>(initialProjections?.compoundingFrequency || 'monthly');
  const [projectionsData, setProjectionsData] = useState<ProjectionData | null>(initialProjections || null);

  // Sync if initial projections change from parent
  useEffect(() => {
    if (initialProjections) {
      setPrincipal(initialProjections.principal);
      setAnnualRate(initialProjections.annualRatePercent);
      setFlatFee(initialProjections.flatPenaltyPerMonth);
      setFrequency(initialProjections.compoundingFrequency || 'monthly');
      setProjectionsData(initialProjections);
    }
  }, [initialProjections]);

  const runCalculation = async () => {
    try {
      const res = await calculateFeeDirect({
        principal,
        annualRatePercent: annualRate,
        flatPenaltyPerMonth: flatFee,
        compoundingFrequency: frequency,
      });
      setProjectionsData(res);
    } catch (e) {
      console.error('Calculation error', e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runCalculation();
    }, 200);
    return () => clearTimeout(timer);
  }, [principal, annualRate, flatFee, frequency]);

  const applyPreset = (p: number, r: number, f: number, freq: string) => {
    setPrincipal(p);
    setAnnualRate(r);
    setFlatFee(f);
    setFrequency(freq);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-sand-300/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            {onBackToAnalysis && (
              <button
                onClick={onBackToAnalysis}
                className="p-2 rounded-lg bg-sand-50 border border-sand-200 hover:bg-sand-100 text-ink-muted hover:text-sand-900 transition-colors"
                title="Back to Overall Analysis"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-lg bg-burnt text-white flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-sand-900">
                Agentic Fee & Penalty Compounding Tool
              </h1>
              <p className="text-xs text-ink-muted">
                AWS Bedrock Agent Action Group Tool · Deterministic Lambda Compound Math (A = P(1+r/n)^nt)
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero LLM Math Hallucination</span>
        </div>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="bg-white border border-sand-300/80 rounded-xl p-4 sm:p-5 space-y-2.5 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Quick Preset Scenarios:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset(35000, 24, 500, 'monthly')}
            className="px-3 py-1.5 rounded-lg bg-sand-50 hover:bg-burnt-light/60 border border-sand-200 hover:border-burnt text-xs font-medium text-sand-900 transition-colors"
          >
            🏠 Bangalore Rental Late Rent (₹35k @ 24% p.a. + ₹500/mo)
          </button>
          <button
            onClick={() => applyPreset(18450, 18, 500, 'monthly')}
            className="px-3 py-1.5 rounded-lg bg-sand-50 hover:bg-burnt-light/60 border border-sand-200 hover:border-burnt text-xs font-medium text-sand-900 transition-colors"
          >
            ⚡ Commercial Power Delayed Surcharge (₹18.4k @ 18% p.a.)
          </button>
          <button
            onClick={() => applyPreset(50000, 28, 750, 'monthly')}
            className="px-3 py-1.5 rounded-lg bg-sand-50 hover:bg-burnt-light/60 border border-sand-200 hover:border-burnt text-xs font-medium text-sand-900 transition-colors"
          >
            💳 Personal Loan Default Penal Interest (₹50k @ 28% p.a. + ₹750)
          </button>
        </div>
      </div>

      {/* Interactive Controls & Compounding Settings */}
      <div className="bg-white border border-sand-300/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-sand-900 pb-2 border-b border-sand-200">
          Financial Liability Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Principal */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-sand-900">
              Base Amount (Principal ₹)
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
              className="w-full text-xs sm:text-sm font-semibold bg-sand-50/70 border border-sand-300 rounded-lg px-3 py-2 focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt"
            />
          </div>

          {/* Annual Rate */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-sand-900">
              Annual Interest Rate (% p.a.)
            </label>
            <input
              type="number"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full text-xs sm:text-sm font-semibold bg-sand-50/70 border border-sand-300 rounded-lg px-3 py-2 focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt"
            />
          </div>

          {/* Flat Fee */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-sand-900">
              Monthly Late Fee (₹/mo)
            </label>
            <input
              type="number"
              value={flatFee}
              onChange={(e) => setFlatFee(Number(e.target.value))}
              className="w-full text-xs sm:text-sm font-semibold bg-sand-50/70 border border-sand-300 rounded-lg px-3 py-2 focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-sand-900">
              Compounding Interval
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold bg-sand-50/70 border border-sand-300 rounded-lg px-3 py-2 focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt"
            >
              <option value="monthly">Monthly Compounding</option>
              <option value="quarterly">Quarterly Compounding</option>
              <option value="annual">Annual Compounding</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projections Table & Results */}
      {projectionsData && projectionsData.projections && (
        <div className="space-y-4">
          <div className="bg-white border border-sand-300/80 rounded-xl p-4 sm:p-5 space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-2 text-burnt">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-sm font-bold text-sand-900">
                  Mathematical Liability Growth Analysis
                </h3>
              </div>
              <span className="text-xs font-semibold text-burnt">
                Base Principal: ₹{principal.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Calculated strictly using financial formula: A = P(1 + r/n)^(nt) + (flatFees × t)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {projectionsData.projections.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-sand-200 rounded-xl p-3.5 space-y-2 hover:border-burnt transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sand-900 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-burnt" />
                    {item.months} {item.months === 1 ? 'Month' : 'Months'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                    +{item.percentageIncrease}%
                  </span>
                </div>

                <div className="text-lg font-bold text-sand-900 pt-0.5">
                  ₹{item.totalLiability.toLocaleString()}
                </div>

                <div className="pt-2 border-t border-sand-100 text-xs space-y-0.5 text-ink-muted">
                  <div className="flex justify-between">
                    <span>Total Penalty:</span>
                    <span className="font-semibold text-red-700">
                      +₹{item.totalPenalty.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Interest Accrued:</span>
                    <span>₹{item.interestAccrued.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Flat Late Fees:</span>
                    <span>₹{item.flatFees.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Narrative Summary Card */}
          <div className="p-3.5 bg-burnt-light/50 border border-burnt/25 rounded-xl text-xs leading-relaxed space-y-1">
            <span className="font-bold text-burnt-dark block text-xs">
              Agent Tool Summary Proof:
            </span>
            <p className="text-sand-900 font-medium">
              {showTranslated && translatedNarrative
                ? translatedNarrative
                : projectionsData.narrative}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
