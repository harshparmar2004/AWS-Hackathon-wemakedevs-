import React from 'react';
import { AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { RiskFlag } from '../types';

interface RiskFlagsListProps {
  riskFlags: RiskFlag[];
  translatedFlags?: RiskFlag[];
  showTranslated: boolean;
  onSimulateInCalculator?: (flag: RiskFlag) => void;
}

export const RiskFlagsList: React.FC<RiskFlagsListProps> = ({
  riskFlags,
  translatedFlags,
  showTranslated,
  onSimulateInCalculator,
}) => {
  const flagsToDisplay =
    showTranslated && translatedFlags && translatedFlags.length > 0
      ? translatedFlags
      : riskFlags;

  if (!flagsToDisplay || flagsToDisplay.length === 0) {
    return (
      <div className="bg-sand-50 border border-sand-200 rounded-xl p-6 text-center text-xs text-ink-muted">
        No critical risk flags detected in this document.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {flagsToDisplay.map((flag, idx) => (
          <div
            key={idx}
            className="bg-white border border-sand-300/80 hover:border-burnt/50 rounded-xl p-4 sm:p-5 transition-all space-y-2.5 shadow-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-700 flex-shrink-0" />
                <span>{flag.clause}</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-800 border border-red-200/80">
                <DollarSign className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span>{flag.amount}</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-sand-850 leading-relaxed font-normal">
              {flag.why}
            </p>

            {onSimulateInCalculator && (
              <div className="pt-2 border-t border-sand-100 flex justify-end">
                <button
                  onClick={() => onSimulateInCalculator(flag)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-burnt hover:text-burnt-hover transition-colors"
                >
                  <span>Project compounding liability in Fee Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
