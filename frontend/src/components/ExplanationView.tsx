import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Languages,
  Check,
  Tag,
  Copy,
  Printer,
  ShieldAlert,
  MessageSquare,
  Calculator,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DocumentData } from '../types';
import { RiskFlagsList } from './RiskFlagsList';
import { CalculatorTool } from './CalculatorTool';
import { DocumentChat } from './DocumentChat';

interface ExplanationViewProps {
  document: DocumentData;
}

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  document,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'calculator'>('overview');
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

  // Determine risk level based on risk flags
  const riskCount = document.riskFlags?.length || 0;
  const isHighRisk = riskCount >= 2;
  const isModerateRisk = riskCount === 1;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner / Document Title Card */}
      <div className="bg-sand-50 border border-sand-300 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-burnt text-white">
              <Tag className="w-3 h-3 mr-1" />
              {document.docType || 'Document'}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-ink-muted bg-sand-200 px-2.5 py-0.5 rounded">
              <FileText className="w-3 h-3 mr-1" />
              {document.fileName || 'Uploaded Document'}
            </span>

            {/* Dynamic Risk Meter Badge */}
            {isHighRisk ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                <Flame className="w-3.5 h-3.5 mr-1 text-red-600" />
                HIGH RISK ({riskCount} Trap Clauses)
              </span>
            ) : isModerateRisk ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                MODERATE RISK (1 Penalty Clause)
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                STANDARD TERMS
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold tracking-tight text-sand-900">
            Document Analysis & Risk Assessment
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {document.translatedExplanation && (
            <button
              onClick={() => setShowTranslated(!showTranslated)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                showTranslated
                  ? 'bg-burnt text-white border-burnt'
                  : 'bg-white text-sand-900 border-sand-300 hover:border-burnt'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>
                {showTranslated
                  ? `Viewing in ${document.language || 'Local Language'}`
                  : 'Switch to Local Language'}
              </span>
            </button>
          )}

          <button
            onClick={handleCopySummary}
            className="p-2 rounded-md border border-sand-300 bg-white hover:bg-sand-100 text-ink-muted text-xs transition-colors"
            title="Copy plain language summary"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-md border border-sand-300 bg-white hover:bg-sand-100 text-ink-muted text-xs transition-colors"
            title="Print or Save Report as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-sand-300 pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'overview'
              ? 'border-burnt text-burnt bg-white'
              : 'border-transparent text-ink-muted hover:text-sand-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Overview & Risk Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'chat'
              ? 'border-burnt text-burnt bg-white'
              : 'border-transparent text-ink-muted hover:text-sand-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-burnt" />
          <span>Ask AI Assistant (Point-Wise Q&A)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-burnt-light text-burnt font-bold">
            Interactive
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'calculator'
              ? 'border-burnt text-burnt bg-white'
              : 'border-transparent text-ink-muted hover:text-sand-900'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Agentic Fee Calculator</span>
        </button>
      </div>

      {/* Tab 1: Overview & Risk Analysis */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Plain Language Summary Card */}
          <div className="bg-white border border-sand-300 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sand-200">
              <h3 className="text-sm font-bold text-sand-900 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-burnt"></span>
                <span>Plain-Language Summary (Zero Jargon)</span>
              </h3>
              <span className="text-[11px] text-ink-muted">
                Bedrock Claude 3.5 Multimodal Extraction
              </span>
            </div>

            <p className="text-sm text-sand-900 leading-relaxed font-normal whitespace-pre-line">
              {explanationText || 'No summary available.'}
            </p>

            {/* Key Dates Timeline Pills */}
            {document.keyDates && document.keyDates.length > 0 && (
              <div className="pt-4 border-t border-sand-200 space-y-2">
                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Critical Dates & Deadlines
                </div>
                <div className="flex flex-wrap gap-2">
                  {document.keyDates.map((d, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded bg-sand-100 text-sand-900 border border-sand-300 text-xs font-medium"
                    >
                      <Calendar className="w-3 h-3 mr-1.5 text-burnt" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Structured Risk Flags Section */}
          <RiskFlagsList
            riskFlags={document.riskFlags || []}
            translatedFlags={document.translatedRiskFlags}
            showTranslated={showTranslated}
            onSimulateInCalculator={() => setActiveTab('calculator')}
          />

          {/* Quick Calculator Preview in Overview */}
          <CalculatorTool
            initialProjections={document.projections}
            translatedNarrative={document.translatedProjectionNarrative}
            showTranslated={showTranslated}
          />
        </div>
      )}

      {/* Tab 2: Document Q&A / Chat */}
      {activeTab === 'chat' && (
        <DocumentChat
          document={document}
          activeLanguage={document.language || 'english'}
        />
      )}

      {/* Tab 3: Dedicated Calculator Tool */}
      {activeTab === 'calculator' && (
        <div className="space-y-4">
          <CalculatorTool
            initialProjections={document.projections}
            translatedNarrative={document.translatedProjectionNarrative}
            showTranslated={showTranslated}
          />
        </div>
      )}
    </div>
  );
};
