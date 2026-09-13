import React, { useState } from 'react';
import { Sliders, Sparkles } from 'lucide-react';
import { DocumentData } from '../types';
import { ScenarioSimulator } from './ScenarioSimulator';

interface ScenarioSimulatorViewProps {
  document: DocumentData | null;
  onSelectSample: (sampleId: string) => void;
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({
  document,
  onSelectSample,
}) => {
  const [activeEngineTab, setActiveEngineTab] = useState<'lease' | 'loan' | 'power'>(() => {
    if (document?.docId?.includes('loan')) return 'loan';
    if (document?.docId?.includes('power')) return 'power';
    return 'lease';
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-burnt text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-sand-900">
              Interactive "What-If" Scenario Simulator Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Simulate real-world financial consequences before signing or delaying payments. Slide below to see exact compounding penalties, foreclosure lock-ins, and tiered energy slabs.
          </p>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="flex items-center p-1 bg-sand-100 rounded-xl border border-sand-200 text-xs font-semibold self-start sm:self-auto flex-wrap gap-1">
          <button
            onClick={() => setActiveEngineTab('lease')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeEngineTab === 'lease'
                ? 'bg-white text-burnt font-bold shadow-2xs'
                : 'text-ink-muted hover:text-sand-900'
            }`}
          >
            🏠 Lease Delay
          </button>
          <button
            onClick={() => setActiveEngineTab('loan')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeEngineTab === 'loan'
                ? 'bg-white text-burnt font-bold shadow-2xs'
                : 'text-ink-muted hover:text-sand-900'
            }`}
          >
            🏦 Loan Foreclosure
          </button>
          <button
            onClick={() => setActiveEngineTab('power')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeEngineTab === 'power'
                ? 'bg-white text-burnt font-bold shadow-2xs'
                : 'text-ink-muted hover:text-sand-900'
            }`}
          >
            ⚡ Power Tariff
          </button>
        </div>
      </div>

      {/* Simulator Sandbox Container */}
      <div className="bg-white border border-sand-300/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-sand-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-burnt" />
            <span className="font-bold text-sand-900 text-sm sm:text-base">
              {activeEngineTab === 'lease' && 'Residential Lease Compounding Delay Simulator'}
              {activeEngineTab === 'loan' && 'Loan Prepayment & Milestone Foreclosure Calculator'}
              {activeEngineTab === 'power' && 'Telescopic Utility Slab & Demand Surcharge Simulator'}
            </span>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
            Deterministic Math
          </span>
        </div>

        {/* Render Scenario Simulator Component with chosen engine data */}
        <ScenarioSimulator
          document={
            activeEngineTab === 'loan'
              ? ({ docId: 'sample-loan-hdfc', docType: 'Bank Loan Sanction' } as any)
              : activeEngineTab === 'power'
              ? ({ docId: 'sample-power-bescom', docType: 'Commercial Power Bill' } as any)
              : ({ docId: 'sample-rent-blr', docType: 'Residential Lease' } as any)
          }
          projections={
            activeEngineTab === 'loan'
              ? ({
                  engine: 'loan_emi_foreclosure',
                  principal: 300000,
                  annualInterestRatePercent: 11.5,
                  tenureMonths: 36,
                  foreclosureChargePercent: 5.0,
                  lockInPeriodMonths: 12,
                } as any)
              : activeEngineTab === 'power'
              ? ({
                  engine: 'tiered_power_tariff',
                  unitsKwh: 1240,
                  sanctionedLoadKw: 5,
                  fixedCharge: 550,
                  fuelAdjustmentCharge: 682,
                  electricityDuty: 925.25,
                  totalNetBill: 11887.75,
                } as any)
              : ({
                  engine: 'compound_penalty',
                  principal: 35000,
                  annualRatePercent: 24,
                  flatPenaltyPerMonth: 500,
                } as any)
          }
          isHindi={false}
        />
      </div>

      {/* Quick Benchmark Contract Launcher */}
      <div className="bg-sand-50/80 border border-sand-200/90 rounded-2xl p-5 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Need a benchmark document for this simulation?
        </span>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setActiveEngineTab('lease');
              onSelectSample('sample-rent-blr');
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-sand-300 text-xs font-semibold text-sand-800 hover:border-burnt hover:text-burnt transition-colors shadow-2xs"
          >
            Load Bangalore Lease (24% Compounding)
          </button>
          <button
            onClick={() => {
              setActiveEngineTab('loan');
              onSelectSample('sample-loan-hdfc');
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-sand-300 text-xs font-semibold text-sand-800 hover:border-burnt hover:text-burnt transition-colors shadow-2xs"
          >
            Load HDFC Personal Loan (12-Mo Lock-in)
          </button>
          <button
            onClick={() => {
              setActiveEngineTab('power');
              onSelectSample('sample-power-bescom');
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-sand-300 text-xs font-semibold text-sand-800 hover:border-burnt hover:text-burnt transition-colors shadow-2xs"
          >
            Load BESCOM Tariff (Telescopic Slabs)
          </button>
        </div>
      </div>
    </div>
  );
};
