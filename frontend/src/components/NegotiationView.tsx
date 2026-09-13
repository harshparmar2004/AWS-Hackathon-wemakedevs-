import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Mail,
  Download,
  FileText,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { DocumentData, RiskFlag } from '../types';
import { generateNegotiationDraft } from './NegotiationModal';

interface NegotiationViewProps {
  document: DocumentData | null;
  onSelectSample: (sampleId: string) => void;
  onNewUpload: () => void;
}

export const NegotiationView: React.FC<NegotiationViewProps> = ({
  document,
  onSelectSample,
  onNewUpload,
}) => {
  const flags: RiskFlag[] =
    document?.riskFlags && document.riskFlags.length > 0
      ? document.riskFlags
      : [
          {
            clause: 'Clause 7.2 (Compounded Overdue Surcharge)',
            amount: '24% p.a. + ₹500/mo flat late fee',
            why: 'Rent is compounded monthly if delayed past the 7th. Surcharge accrues interest on interest.',
          },
          {
            clause: 'Clause 11.4 (Early Exit Lock-In Penalty)',
            amount: '100% Security Deposit Forfeiture (₹1,50,000)',
            why: 'Vacating within the 10-month lock-in results in full forfeiture of the 6-month deposit.',
          },
          {
            clause: 'Clause 14.1 (Mandatory Painting Deduction)',
            amount: '₹25,000 non-negotiable flat deduction',
            why: 'Fixed non-refundable painting cost deducted from deposit regardless of move-in condition.',
          },
        ];

  const [selectedFlag, setSelectedFlag] = useState<RiskFlag>(flags[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const activeDoc = document || ({
    docId: 'sample-rent-blr',
    fileName: 'Bangalore_Residential_Lease_Agreement.pdf',
    docType: 'Residential Tenancy Agreement',
  } as DocumentData);

  const draft = generateNegotiationDraft(selectedFlag, activeDoc);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${draft.emailSubject}\n\n${draft.emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMailto = () => {
    const subject = encodeURIComponent(draft.emailSubject);
    const body = encodeURIComponent(draft.emailBody);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownload = () => {
    const content = `NEGOTIATION & DISPUTE DRAFT REPORT\nDocument: ${activeDoc.fileName || activeDoc.docType}\nClause: ${draft.clause}\n\nPREDATORY TERM:\n${draft.predatorySummary}\n\nLEGAL & REGULATORY GROUNDING:\n${draft.legalGrounding}\n\nMARKET BENCHMARK:\n${draft.marketBenchmark}\n\n---------------------------------------------\nSUBJECT:\n${draft.emailSubject}\n\nBODY:\n${draft.emailBody}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `Negotiation_Draft_${selectedFlag.clause.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-burnt text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-sand-900">
              Autonomous Citizen Legal Counter-Drafter Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            Do not sign predatory terms blindly. Generate legally grounded pushback letters citing Section 74 of the Indian Contract Act, the Model Tenancy Act 2021, and RBI fair practice codes.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={onNewUpload}
            className="px-3 py-1.5 rounded-lg border border-sand-300 bg-sand-100 hover:bg-sand-200 text-sand-800 text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-burnt" />
            <span>Upload New Document</span>
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-burnt-light text-burnt">
            {flags.length} Predatory Clauses Flagged
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Flagged Clauses List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-sand-800 px-1">
            Identified Asymmetric Clauses:
          </div>

          <div className="space-y-2.5">
            {flags.map((flag, idx) => {
              const isSelected = selectedFlag.clause === flag.clause;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedFlag(flag)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-white border-burnt ring-2 ring-burnt/20 shadow-xs'
                      : 'bg-white/80 border-sand-300/80 hover:border-burnt/40 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sand-900 text-xs sm:text-[13px]">
                      {flag.clause}
                    </span>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-sand-200 text-sand-800">
                      {flag.amount}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {flag.why}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-xs font-bold">
                    <span className={isSelected ? 'text-burnt' : 'text-ink-muted'}>
                      {isSelected ? 'Currently Drafting' : 'Click to Draft Counter-Notice'}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-burnt' : 'text-ink-muted'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prompt to try another contract */}
          <div className="pt-3 px-1 text-xs text-ink-muted space-y-2">
            <span>Want to test other document domains?</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onSelectSample('sample-loan-hdfc')}
                className="text-[11px] font-bold text-burnt hover:underline"
              >
                🏦 HDFC Loan (Foreclosure Penalties) →
              </button>
              <button
                onClick={() => onSelectSample('sample-power-bescom')}
                className="text-[11px] font-bold text-burnt hover:underline"
              >
                ⚡ BESCOM Bill (Delayed Surcharge) →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Legal Negotiation Dossier */}
        <div className="lg:col-span-7 bg-white border border-sand-300/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-burnt">
                Legal Counter-Proposal
              </span>
              <h2 className="text-base sm:text-lg font-bold text-sand-900 mt-0.5">
                {selectedFlag.clause}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs font-semibold transition-colors flex items-center space-x-1 shadow-2xs"
                title="Download Draft (.txt)"
              >
                <Download className="w-3.5 h-3.5 text-sand-700" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                onClick={handleMailto}
                className="p-2 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs font-semibold transition-colors flex items-center space-x-1 shadow-2xs"
                title="Open in Email"
              >
                <Mail className="w-3.5 h-3.5 text-burnt" />
                <span className="hidden sm:inline">Email</span>
              </button>

              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
                  copied ? 'bg-emerald-600' : 'bg-burnt hover:bg-burnt-hover'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Letter'}</span>
              </button>
            </div>
          </div>

          {/* Predatory Term Card */}
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center space-x-1.5 text-red-800 font-bold text-xs uppercase tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Predatory Term Detected:</span>
            </div>
            <p className="text-sand-900 text-xs font-medium leading-relaxed">
              {draft.predatorySummary}
            </p>
          </div>

          {/* Statutory Grounds Card */}
          <div className="bg-sand-50/90 border border-sand-200/90 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-1.5 text-burnt font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Statutory Legal Shield:</span>
            </div>
            <p className="text-sand-900 text-xs leading-relaxed">
              {draft.legalGrounding}
            </p>
            <div className="pt-1 text-[11px] text-ink-muted border-t border-sand-200">
              <span className="font-bold text-sand-800">Fair Market Benchmark:</span> {draft.marketBenchmark}
            </div>
          </div>

          {/* Ready-to-Send Email Letter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sand-900 text-xs flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-burnt" />
                <span>Ready-to-Send Counter-Offer Notice:</span>
              </span>
              <span className="text-[11px] text-ink-muted font-medium">Polite · Professional · Legally Cited</span>
            </div>

            <div className="bg-sand-50/80 border border-sand-300 rounded-2xl p-4 space-y-2 font-mono text-xs text-sand-900 whitespace-pre-wrap leading-relaxed select-text shadow-2xs">
              <div className="text-ink-muted pb-1.5 border-b border-sand-200">
                <span className="font-bold text-sand-800">Subject:</span> {draft.emailSubject}
              </div>
              <div className="pt-1">{draft.emailBody}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
