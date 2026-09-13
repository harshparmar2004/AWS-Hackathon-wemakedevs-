import React, { useState } from 'react';
import { Sliders, Lock, Unlock } from 'lucide-react';
import { UnifiedCalculationData, DocumentData } from '../types';

interface ScenarioSimulatorProps {
  document?: DocumentData;
  projections?: UnifiedCalculationData;
  isHindi?: boolean;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  document,
  projections,
  isHindi = false,
}) => {
  const engine = (projections as any)?.engine || 'compound_penalty';
  const isLoan = engine === 'loan_emi_foreclosure' || document?.docId?.includes('loan');
  const isPower = engine === 'tiered_power_tariff' || document?.docId?.includes('power');

  // State for Lease delay simulator
  const [delayDays, setDelayDays] = useState<number>(90);

  // State for Loan foreclosure simulator
  const [foreclosureMonth, setForeclosureMonth] = useState<number>(12);

  // State for Power consumption simulator
  const [simulatedUnits, setSimulatedUnits] = useState<number>(1240);

  // --- 1. LEASE CALCULATION ---
  const basePrincipal = (projections as any)?.principal || 35000;
  const annualRate = (projections as any)?.annualRatePercent || 24;
  const monthlyFlat = (projections as any)?.flatPenaltyPerMonth || 500;

  const simMonths = delayDays / 30;
  const simCompounded =
    annualRate > 0
      ? basePrincipal * Math.pow(1 + annualRate / 1200, simMonths)
      : basePrincipal;
  const simInterest = simCompounded - basePrincipal;
  const simFlatFees = (monthlyFlat / 30) * delayDays;
  const simTotalPenalty = simInterest + simFlatFees;
  const simTotalLiability = basePrincipal + simTotalPenalty;
  const simPctIncrease =
    basePrincipal > 0 ? (simTotalPenalty / basePrincipal) * 100 : 0;

  // --- 2. LOAN CALCULATION ---
  const loanPrincipal = (projections as any)?.principal || 300000;
  const loanRate = (projections as any)?.annualInterestRatePercent || 11.5;
  const loanTenure = (projections as any)?.tenureMonths || 36;
  const loanLockIn = (projections as any)?.lockInPeriodMonths || 12;
  const loanForeclosurePct = (projections as any)?.foreclosureChargePercent || 5.0;

  const r = loanRate / 1200;
  const powN = Math.pow(1 + r, loanTenure);
  const powM = Math.pow(1 + r, foreclosureMonth);
  const remainingPrincipal =
    foreclosureMonth >= loanTenure
      ? 0
      : (loanPrincipal * (powN - powM)) / (powN - 1);

  const isLockInActive = foreclosureMonth < loanLockIn;
  const rawForeclosureFee = isLockInActive ? 0 : (remainingPrincipal * loanForeclosurePct) / 100;
  const gstOnFee = rawForeclosureFee * 0.18;
  const totalForeclosureCost = rawForeclosureFee + gstOnFee;
  const totalToClose = remainingPrincipal + totalForeclosureCost;

  // --- 3. POWER CALCULATION ---
  const slabs = [
    { limit: 100, rate: 5.5, label: '0 - 100 kWh' },
    { limit: 100, rate: 7.5, label: '101 - 200 kWh' },
    { limit: 300, rate: 9.5, label: '201 - 500 kWh' },
    { limit: 99999, rate: 12.5, label: '> 500 kWh' },
  ];

  let remUnits = simulatedUnits;
  let simEnergyCharge = 0;
  const slabUsage: { label: string; units: number; rate: number; cost: number }[] = [];

  for (const slab of slabs) {
    if (remUnits <= 0) {
      slabUsage.push({ label: slab.label, units: 0, rate: slab.rate, cost: 0 });
      continue;
    }
    const usedInSlab = Math.min(remUnits, slab.limit);
    const cost = usedInSlab * slab.rate;
    simEnergyCharge += cost;
    slabUsage.push({ label: slab.label, units: usedInSlab, rate: slab.rate, cost });
    remUnits -= usedInSlab;
  }

  const simFixedCharge = 5 * 250; // 5 kW @ 250
  const simFac = simulatedUnits * 0.85;
  const simDuty = (simEnergyCharge + simFixedCharge) * 0.09;
  const simTotalBill = simEnergyCharge + simFixedCharge + simFac + simDuty;

  return (
    <div className="bg-sand-50/90 border border-sand-200/90 rounded-xl p-3.5 space-y-3.5 text-xs shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-sand-200/70">
        <div className="flex items-center space-x-1.5 text-sand-900 font-bold text-xs uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-burnt" />
          <span>{isHindi ? 'भविष्य तनाव-परीक्षण सिम्युलेटर' : 'Scenario Stress-Test Simulator'}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand-200 text-sand-800">
          Interactive What-If
        </span>
      </div>

      {/* RENDER CASE 1: LOAN FORECLOSURE SIMULATOR */}
      {isLoan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-sand-900 text-xs">
              Simulate Early Foreclosure at: <span className="font-bold text-burnt">Month {foreclosureMonth}</span>
            </label>
            <span className="text-[10px] text-ink-muted">Tenure: {loanTenure} Mos</span>
          </div>

          <input
            type="range"
            min={1}
            max={loanTenure}
            step={1}
            value={foreclosureMonth}
            onChange={(e) => setForeclosureMonth(Number(e.target.value))}
            className="w-full h-1.5 bg-sand-300 rounded-lg appearance-none cursor-pointer accent-burnt"
          />

          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>Month 1</span>
            <span className="text-amber-800 font-bold">Month 12 (Lock-in End)</span>
            <span>Month {loanTenure}</span>
          </div>

          {/* Result Card */}
          <div className="bg-white border border-sand-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-sand-100">
              <span className="text-xs font-semibold text-sand-800 flex items-center">
                {isLockInActive ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-700 mr-1" />
                    <span className="text-amber-800 font-bold">Lock-in Period Active</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    <span className="text-emerald-700 font-bold">Prepayment Permitted</span>
                  </>
                )}
              </span>
              <span className="text-xs font-bold text-sand-900">
                To Close: ₹{Math.round(totalToClose).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-ink-muted block">Remaining Principal:</span>
                <span className="font-bold text-sand-900">₹{Math.round(remainingPrincipal).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-ink-muted block">Foreclosure Fee + GST:</span>
                <span className={`font-bold ${isLockInActive ? 'text-amber-700' : 'text-red-700'}`}>
                  {isLockInActive ? 'Disallowed in Year 1' : `+₹${Math.round(totalForeclosureCost).toLocaleString()} (${loanForeclosurePct}% + 18%)`}
                </span>
              </div>
            </div>

            {/* Visual Ratio Bar */}
            <div className="pt-1.5 space-y-1">
              <div className="flex justify-between text-[10px] text-ink-muted">
                <span>Principal Balance: ₹{Math.round(remainingPrincipal).toLocaleString()}</span>
                <span>Penalty: ₹{Math.round(totalForeclosureCost).toLocaleString()}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-sand-200 flex">
                <div
                  className="h-full bg-burnt"
                  style={{
                    width: `${totalToClose > 0 ? (remainingPrincipal / totalToClose) * 100 : 100}%`,
                  }}
                />
                <div
                  className="h-full bg-red-600"
                  style={{
                    width: `${totalToClose > 0 ? (totalForeclosureCost / totalToClose) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER CASE 2: POWER CONSUMPTION SIMULATOR */}
      {isPower && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-sand-900 text-xs">
              Simulate Monthly Usage: <span className="font-bold text-amber-700">{simulatedUnits} kWh Units</span>
            </label>
            <span className="text-[10px] font-bold text-sand-900">Est. Bill: ₹{Math.round(simTotalBill).toLocaleString()}</span>
          </div>

          <input
            type="range"
            min={100}
            max={2500}
            step={50}
            value={simulatedUnits}
            onChange={(e) => setSimulatedUnits(Number(e.target.value))}
            className="w-full h-1.5 bg-sand-300 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />

          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>100 kWh (Low)</span>
            <span>1,000 kWh (Medium)</span>
            <span>2,500 kWh (Heavy Industrial)</span>
          </div>

          {/* Visual Slab Staircase Bar Chart */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-ink-muted uppercase">Telescopic Slab Staircase Impact:</span>
            <div className="space-y-1">
              {slabUsage.map((s, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-medium text-sand-800">{s.label} (@₹{s.rate})</span>
                    <span className="font-bold text-sand-900">
                      {s.units} kWh → ₹{Math.round(s.cost).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        idx === 0
                          ? 'bg-emerald-500'
                          : idx === 1
                          ? 'bg-amber-500'
                          : idx === 2
                          ? 'bg-orange-500'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${(s.units / (s.label.includes('>') ? 2000 : s.label.includes('300') ? 300 : 100)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER CASE 3: LEASE / INVOICE DELAY SIMULATOR (DEFAULT) */}
      {!isLoan && !isPower && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-sand-900 text-xs">
              Simulate Delay Duration: <span className="font-bold text-burnt">{delayDays} Days</span> ({Math.round(delayDays / 30)} Months)
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
              +{simPctIncrease.toFixed(1)}% Extra
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={180}
            step={5}
            value={delayDays}
            onChange={(e) => setDelayDays(Number(e.target.value))}
            className="w-full h-1.5 bg-sand-300 rounded-lg appearance-none cursor-pointer accent-burnt"
          />

          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>On-Time (0d)</span>
            <span>30 Days (1mo)</span>
            <span>90 Days (3mo)</span>
            <span>180 Days (6mo)</span>
          </div>

          {/* Dynamic Visual Stacked Bar Chart */}
          <div className="bg-white border border-sand-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-sand-100">
              <span className="text-xs font-bold text-sand-900">
                Total Liability at Day {delayDays}:
              </span>
              <span className="text-sm font-extrabold text-burnt">
                ₹{Math.round(simTotalLiability).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-ink-muted block">Base Rent / Principal:</span>
                <span className="font-bold text-sand-900">₹{basePrincipal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-ink-muted block">Penalty Accrued:</span>
                <span className="font-bold text-red-700">+₹{Math.round(simTotalPenalty).toLocaleString()}</span>
              </div>
            </div>

            {/* Stacked Growth Bar */}
            <div className="pt-1 space-y-1">
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-sand-200 flex">
                <div
                  className="h-full bg-sand-400"
                  style={{ width: `${(basePrincipal / simTotalLiability) * 100}%` }}
                  title="Base Amount"
                />
                <div
                  className="h-full bg-red-600 animate-pulse"
                  style={{ width: `${(simTotalPenalty / simTotalLiability) * 100}%` }}
                  title="Accrued Compounding Penalty"
                />
              </div>
              <div className="flex justify-between text-[9px] text-ink-muted">
                <span>Base (₹{basePrincipal.toLocaleString()})</span>
                <span className="text-red-700 font-bold">+Penalty (₹{Math.round(simTotalPenalty).toLocaleString()})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
