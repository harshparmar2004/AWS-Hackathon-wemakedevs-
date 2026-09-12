import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Languages,
  Check,
  Tag,
  Copy,
  Printer,
  Flame,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Calculator,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { DocumentData } from '../types';
import { RiskFlagsList } from './RiskFlagsList';

interface AnalysisViewProps {
  document: DocumentData;
  onNavigateToChat: () => void;
  onNavigateToCalculator: () => void;
  onOpenArchitecture: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  document,
  onNavigateToChat,
  onNavigateToCalculator,
  onOpenArchitecture,
}) => {
  const [showTranslated, setShowTranslated] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const explanationText =
    showTranslated && document.translatedExplanation
      ? document.translatedExplanation
      : document.explanation;

  const handleCopySummary = () => {
    if (explanationText) {
      navigator.clipboard.writeText(explanationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const riskCount = document.riskFlags?.length || 0;
  const isHighRisk = riskCount >= 2;
  const isModerateRisk = riskCount === 1;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Sleek Document Header Card */}
      <div className="bg-white border border-sand-300/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-burnt text-white uppercase tracking-wider">
              <Tag className="w-3 h-3 mr-1" />
              {document.docType || 'Document'}
            </span>
            <span className="inline-flex items-center text-[11px] font-medium text-ink-muted bg-sand-100 px-2.5 py-0.5 rounded border border-sand-200">
              <FileText className="w-3 h-3 mr-1 text-sand-800" />
              {document.fileName || 'Uploaded Document'}
            </span>

            {/* Compact Risk Badge */}
            {isHighRisk ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                <Flame className="w-3 h-3 mr-1 text-red-600" />
                HIGH RISK ({riskCount} Trap Clauses Detected)
              </span>
            ) : isModerateRisk ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                MODERATE RISK (1 Penalty Clause Detected)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                STANDARD VERIFIED TERMS
              </span>
            )}
          </div>

          {/* Compact Actions */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto flex-shrink-0">
            {document.translatedExplanation && (
              <button
                onClick={() => setShowTranslated(!showTranslated)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  showTranslated
                    ? 'bg-burnt text-white border-burnt shadow-2xs'
                    : 'bg-sand-50 text-sand-900 border-sand-300 hover:border-burnt'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>
                  {showTranslated
                    ? `Viewing in ${document.language || 'Regional'}`
                    : 'Switch to Regional'}
                </span>
              </button>
            )}

            <button
              onClick={handleCopySummary}
              className="p-1.5 rounded-lg border border-sand-300 bg-sand-50 hover:bg-white text-ink-muted text-xs transition-colors"
              title="Copy summary"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-sand-300 bg-sand-50 hover:bg-white text-ink-muted text-xs transition-colors"
              title="Print report"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-sand-900">
            Overall Document Analysis & Legal Risk Audit
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Zero-OCR multimodal extraction verified by Amazon Bedrock Claude 3.5 Sonnet.
          </p>
        </div>
      </div>

      {/* Sleek Aesthetic Hero Banner: "Ask AI Assistant Q&A" */}
      <div className="bg-gradient-to-r from-burnt-light/70 via-white to-sand-50 border border-burnt/30 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-burnt text-white">
            <Sparkles className="w-3 h-3" />
            <span>Interactive Point-Wise Q&A</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-sand-900">
            Have questions about clauses, penalties, or deadlines?
          </h2>
          <p className="text-xs text-sand-800">
            Ask our AI Assistant for instant, point-wise answers citing exact clauses from this document.
          </p>
        </div>

        <button
          onClick={onNavigateToChat}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-burnt hover:bg-burnt-hover text-white text-xs font-bold rounded-lg transition-all shadow-xs flex-shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask AI Assistant Q&A</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compact Step Functions Flow Indicator */}
      <div className="bg-white border border-sand-300/80 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-bold text-sand-900 text-[11px] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-burnt" />
            <span>AWS Step Functions Pipeline (Execution Complete)</span>
          </div>
          <button
            onClick={onOpenArchitecture}
            className="text-[11px] font-bold text-burnt hover:underline flex items-center space-x-1"
          >
            <span>Architecture Graph</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-sand-50 border border-sand-200 rounded-lg p-2">
            <div className="font-bold text-sand-900 text-[11px]">1. S3 Ingest</div>
            <div className="text-[10px] text-ink-muted">Encrypted</div>
          </div>
          <div className="bg-sand-50 border border-sand-200 rounded-lg p-2">
            <div className="font-bold text-sand-900 text-[11px]">2. Claude Vision</div>
            <div className="text-[10px] text-ink-muted">Multimodal</div>
          </div>
          <div className="bg-sand-50 border border-sand-200 rounded-lg p-2">
            <div className="font-bold text-sand-900 text-[11px]">3. Risk Flags</div>
            <div className="text-[10px] text-ink-muted">Structured</div>
          </div>
          <div className="bg-sand-50 border border-sand-200 rounded-lg p-2">
            <div className="font-bold text-sand-900 text-[11px]">4. Translation</div>
            <div className="text-[10px] text-ink-muted">Regional</div>
          </div>
          <div className="bg-burnt-light border border-burnt/30 rounded-lg p-2">
            <div className="font-bold text-burnt-dark text-[11px]">5. Fee Tool</div>
            <div className="text-[10px] text-burnt">Deterministic</div>
          </div>
        </div>
      </div>

      {/* Plain Language Summary Card */}
      <div className="bg-white border border-sand-300/80 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-sand-200/80">
          <h3 className="text-sm font-bold text-sand-900 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-burnt"></span>
            <span>Plain-Language Summary (Zero Jargon)</span>
          </h3>
          <span className="text-[11px] text-ink-muted font-medium hidden sm:inline">
            Bedrock Claude 3.5 Multimodal Extraction · temp=0.0
          </span>
        </div>

        <p className="text-xs sm:text-sm text-sand-850 leading-relaxed font-normal whitespace-pre-line">
          {explanationText || 'No summary available.'}
        </p>

        {/* Critical Dates & Deadlines */}
        {document.keyDates && document.keyDates.length > 0 && (
          <div className="pt-4 border-t border-sand-200/80 space-y-2.5">
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              Critical Dates & Deadlines
            </div>
            <div className="flex flex-wrap gap-2">
              {document.keyDates.map((d, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-lg bg-sand-50 text-sand-900 border border-sand-200 text-xs font-medium"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-burnt" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Structured Risk-Flags List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-sand-900 tracking-tight">
            Structured Risk-Flags & Penalty Clauses
          </h3>
          <button
            onClick={onNavigateToCalculator}
            className="text-xs font-bold text-burnt hover:underline flex items-center space-x-1"
          >
            <Calculator className="w-3.5 h-3.5 mr-1" />
            <span>Open Compounding Fee Tool</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <RiskFlagsList
          riskFlags={document.riskFlags || []}
          translatedFlags={document.translatedRiskFlags}
          showTranslated={showTranslated}
          onSimulateInCalculator={onNavigateToCalculator}
        />
      </div>

      {/* Sleek Bottom Bar */}
      <div className="p-4 bg-white border border-sand-300/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="text-xs text-ink-muted">
          <span className="font-bold text-sand-900">Next Step:</span> Ask questions in AI Chat or project compounding penalties.
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToChat}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-burnt hover:bg-burnt-hover text-white text-xs font-bold rounded-lg transition-all shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI Assistant Q&A</span>
          </button>
          <button
            onClick={onNavigateToCalculator}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-sand-50 hover:bg-sand-100 text-sand-900 border border-sand-300 text-xs font-semibold rounded-lg transition-all"
          >
            <Calculator className="w-3.5 h-3.5 text-burnt" />
            <span>Fee Tool</span>
          </button>
        </div>
      </div>
    </div>
  );
};
