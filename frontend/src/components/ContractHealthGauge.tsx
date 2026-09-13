import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import { DocumentData, ContractHealthMetrics } from '../types';

interface ContractHealthGaugeProps {
  document: DocumentData;
  isHindi?: boolean;
}

export function computeContractHealth(doc: DocumentData): ContractHealthMetrics {
  const flagsCount = doc.riskFlags?.length || 0;
  const isLoan = doc.docId?.includes('loan') || doc.docType?.toLowerCase().includes('loan');
  const isPower = doc.docId?.includes('power') || doc.docType?.toLowerCase().includes('utility');

  let score = 95;
  let label: 'Critical Risk' | 'High Risk' | 'Moderate Risk' | 'Fair & Balanced' = 'Fair & Balanced';
  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let asymmetry = 55; // 55% institution / 45% consumer
  let partyA = 'Landlord';
  let partyB = 'Tenant';

  if (isLoan) {
    partyA = 'Lender / Bank';
    partyB = 'Borrower';
    asymmetry = 85;
  } else if (isPower) {
    partyA = 'Utility Board';
    partyB = 'Consumer';
    asymmetry = 80;
  } else {
    partyA = 'Landlord / Owner';
    partyB = 'Tenant / Resident';
    asymmetry = 82;
  }

  if (flagsCount >= 3) {
    score = Math.max(38, 55 - flagsCount * 5);
    label = 'Critical Risk';
    color = 'text-red-700 bg-red-50 border-red-200';
    asymmetry = Math.min(92, asymmetry + 8);
  } else if (flagsCount === 2) {
    score = 64;
    label = 'High Risk';
    color = 'text-amber-800 bg-amber-50 border-amber-200';
    asymmetry = 78;
  } else if (flagsCount === 1) {
    score = 78;
    label = 'Moderate Risk';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    asymmetry = 68;
  } else {
    score = 92;
    label = 'Fair & Balanced';
    color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    asymmetry = 52;
  }

  return {
    healthScore: score,
    ratingLabel: label,
    ratingColor: color,
    asymmetryScore: asymmetry,
    partyAName: partyA,
    partyBName: partyB,
    trapCount: flagsCount,
    unilateralClausesCount: Math.max(1, flagsCount),
  };
}

export const ContractHealthGauge: React.FC<ContractHealthGaugeProps> = ({ document, isHindi }) => {
  const metrics = computeContractHealth(document);

  // SVG circular gauge math (circumference = 2 * PI * r)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  // Use semi-circle or 75% circle arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * metrics.healthScore) / 100;

  const strokeColor =
    metrics.healthScore >= 75
      ? '#059669' // emerald-600
      : metrics.healthScore >= 55
      ? '#D97706' // amber-600
      : '#DC2626'; // red-600

  return (
    <div className="bg-sand-50/90 border border-sand-200/90 rounded-xl p-3.5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-sand-200/70">
        <div className="flex items-center space-x-1.5 text-sand-900 font-bold text-xs uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5 text-burnt" />
          <span>{isHindi ? 'अनुबंध स्वास्थ्य व शक्ति असंतुलन' : 'Contract Health & Power Balance'}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${metrics.ratingColor}`}>
          {isHindi
            ? metrics.ratingLabel === 'Critical Risk'
              ? 'अत्यधिक जोखिम'
              : metrics.ratingLabel === 'High Risk'
              ? 'उच्च जोखिम'
              : 'संतुलित अनुबंध'
            : metrics.ratingLabel}
        </span>
      </div>

      {/* Gauge and Score Stats */}
      <div className="flex items-center space-x-4">
        {/* Radial SVG Gauge */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#E5E0D8"
              strokeWidth="9"
              strokeDasharray={arcLength}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Progress Colored Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="9"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-extrabold text-sand-900 leading-none">
              {metrics.healthScore}
            </span>
            <span className="text-[9px] font-semibold text-ink-muted">/100</span>
          </div>
        </div>

        {/* Diagnostic Breakdown */}
        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-muted">
              {isHindi ? 'पहचाने गए वित्तीय जाल:' : 'Predatory Traps Detected:'}
            </span>
            <span className="font-bold text-red-700">
              {metrics.trapCount} {metrics.trapCount === 1 ? 'Clause' : 'Clauses'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-muted">
              {isHindi ? 'एकतरफा कानूनी शर्तें:' : 'One-Sided Legal Terms:'}
            </span>
            <span className="font-bold text-amber-800">
              {metrics.unilateralClausesCount} Identified
            </span>
          </div>

          <div className="text-[10px] text-ink-muted leading-tight pt-0.5">
            {metrics.healthScore < 60 ? (
              <span className="text-red-700 font-medium flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                Heavy risk clauses tilt heavily against the consumer.
              </span>
            ) : metrics.healthScore < 80 ? (
              <span className="text-amber-800 font-medium flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1 flex-shrink-0" />
                Moderate risk. Amendments recommended before signing.
              </span>
            ) : (
              <span className="text-emerald-700 font-medium flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                Contract aligns closely with fair standard terms.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Power Asymmetry Balance Meter */}
      <div className="space-y-1 pt-1 border-t border-sand-200/70">
        <div className="flex justify-between text-[10px] font-semibold text-sand-800">
          <span>
            {metrics.partyAName}: <span className="font-bold text-burnt">{metrics.asymmetryScore}%</span>
          </span>
          <span>
            {metrics.partyBName}:{' '}
            <span className="font-bold text-emerald-700">{100 - metrics.asymmetryScore}%</span>
          </span>
        </div>

        {/* Visual Progress Bar Split */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-emerald-200 flex shadow-2xs">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-burnt transition-all duration-700"
            style={{ width: `${metrics.asymmetryScore}%` }}
            title={`Rights favored toward ${metrics.partyAName}`}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${100 - metrics.asymmetryScore}%` }}
            title={`Protections for ${metrics.partyBName}`}
          />
        </div>

        <div className="flex justify-between text-[9px] text-ink-muted">
          <span>Instituted Rights Skew</span>
          <span>Citizen Protection</span>
        </div>
      </div>
    </div>
  );
};
