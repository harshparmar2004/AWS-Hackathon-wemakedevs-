import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  Copy,
  Check,
  Mail,
  Download,
  FileText,
  ArrowRight,
  Upload,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { DocumentData, RiskFlag } from '../types';
import { generateNegotiationDraft } from './NegotiationModal';

interface NegotiationViewProps {
  document: DocumentData | null;
  onSelectSample: (sampleId: string) => void;
  onNewUpload: () => void;
  onOpenForge?: () => void;
}

export const NegotiationView: React.FC<NegotiationViewProps> = ({
  document,
  onSelectSample,
  onNewUpload,
  onOpenForge,
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
    const content = `OFFICIAL STATUTORY DISPUTE & SETTLEMENT DEMAND
Reference Agreement: ${activeDoc.fileName || activeDoc.docType}
Contested Provision: ${draft.clause}
Date: ${new Date().toLocaleDateString()}

===================================================================
1. PREDATORY BURDEN IDENTIFIED:
${draft.predatorySummary}

2. STATUTORY LEGAL BASIS & JURISPRUDENTIAL SHIELD:
${draft.legalGrounding}

3. REASONABLE FAIR MARKET BENCHMARK:
${draft.marketBenchmark}

===================================================================
FORMAL DISPUTE NOTICE TEXT:
Subject: ${draft.emailSubject}

${draft.emailBody}

===================================================================
DocExplainer Legal Dispute System · Powered by Indian Jurisprudence Shield
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `Legal_Dispute_Draft_${selectedFlag.clause.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Command Banner */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-burnt text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-sand-900">
                Citizen Legal Dispute & Negotiation Hub
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Statutory Pushback Letters · Indian Contract Act (Sec 74) · Model Tenancy Act · RBI Fair Practices
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={onNewUpload}
            className="px-3.5 py-2 rounded-xl border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <Upload className="w-4 h-4 text-burnt" />
            <span>Upload New Agreement</span>
          </button>
          <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-burnt-light text-burnt border border-burnt/30">
            {flags.length} Predatory Clauses Contested
          </span>
        </div>
      </div>

      {/* 2. Main Multi-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Contested Clauses Selector */}
        <div className="lg:col-span-4 space-y-3.5">
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand-800 px-1 flex items-center justify-between">
            <span>Contested Asymmetric Clauses:</span>
            <span className="text-ink-muted text-xs font-normal">Select to Draft</span>
          </div>

          <div className="space-y-3">
            {flags.map((flag, idx) => {
              const isSelected = selectedFlag.clause === flag.clause;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedFlag(flag)}
                  className={`p-4 sm:p-4.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-white border-burnt ring-2 ring-burnt/25 shadow-sm'
                      : 'bg-white/80 border-sand-300/80 hover:border-burnt/40 hover:bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sand-900 text-xs sm:text-sm leading-snug">
                      {flag.clause}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 flex-shrink-0">
                      {flag.amount}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-sand-800 leading-relaxed">
                    {flag.why}
                  </p>

                  <div className="pt-2 border-t border-sand-200/80 flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className={isSelected ? 'text-burnt' : 'text-ink-muted'}>
                      {isSelected ? '✓ Active in Drafter' : 'Click to Draft Pushback'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-burnt' : 'text-ink-muted'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Domain Switcher */}
          <div className="p-4 bg-sand-50/80 rounded-2xl border border-sand-200 text-xs sm:text-sm text-ink-muted space-y-2.5">
            <div className="font-bold text-sand-900">Switch to other benchmark disputes:</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onSelectSample('sample-ecom-consumer')}
                className="text-left font-semibold text-burnt hover:underline flex items-center justify-between"
              >
                <span>📦 Electronics Replacement Refusal (CPA 2019)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectSample('sample-b2b-saas')}
                className="text-left font-semibold text-burnt hover:underline flex items-center justify-between"
              >
                <span>💻 SME SaaS 35% Price Escalation & SLA Breach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectSample('sample-loan-hdfc')}
                className="text-left font-semibold text-burnt hover:underline flex items-center justify-between"
              >
                <span>🏦 Personal Loan (12-Mo Foreclosure Lock-in)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Formal Legal Counter-Draft & Letterhead Preview */}
        <div className="lg:col-span-8 bg-white border border-sand-300/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-burnt">
                  Statutory Counter-Draft
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Ready to Dispatch
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-sand-900 mt-1">
                {selectedFlag.clause}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="px-3 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
                title="Download Official Notice (.txt)"
              >
                <Download className="w-4 h-4 text-sand-700" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                onClick={handleMailto}
                className="px-3 py-2 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
                title="Open in Email"
              >
                <Mail className="w-4 h-4 text-burnt" />
                <span className="hidden sm:inline">Email Client</span>
              </button>

              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
                  copied ? 'bg-emerald-600' : 'bg-burnt hover:bg-burnt-hover'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
              </button>
            </div>
          </div>

          {/* Statutory Shield & Benchmark Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Predatory Term */}
            <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4.5 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs sm:text-sm uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4" />
                <span>Asymmetric Liability Flagged:</span>
              </div>
              <p className="text-sand-900 text-xs sm:text-sm font-medium leading-relaxed">
                {draft.predatorySummary}
              </p>
            </div>

            {/* Statutory Protection */}
            <div className="bg-sand-50/90 border border-sand-200/90 rounded-2xl p-4.5 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-burnt font-bold text-xs sm:text-sm uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>Statutory Legal Shield:</span>
              </div>
              <p className="text-sand-900 text-xs sm:text-sm leading-relaxed font-medium">
                {draft.legalGrounding}
              </p>
            </div>
          </div>

          {/* Formal Legal Correspondence Letterhead Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sand-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-burnt" />
                <span>Formal Citizen Demand & Rectification Notice:</span>
              </span>
              <span className="text-xs text-ink-muted font-semibold">
                Formatted for Certified Post / Formal Email
              </span>
            </div>

            <div className="bg-sand-50/90 border-2 border-sand-300/80 rounded-2xl p-6 sm:p-7 space-y-4 font-mono text-xs sm:text-sm text-sand-900 whitespace-pre-wrap leading-relaxed select-text shadow-2xs">
              <div className="pb-3 border-b border-sand-300 text-sand-800 space-y-1 font-sans">
                <div className="text-xs font-bold uppercase tracking-wider text-burnt">
                  FORMAL DISPUTE NOTICE LETTERHEAD
                </div>
                <div className="font-bold text-sand-900 text-sm sm:text-base">
                  Subject: {draft.emailSubject}
                </div>
                <div className="text-xs text-ink-muted">
                  Agreement Reference: {activeDoc.fileName || activeDoc.docType}
                </div>
              </div>

              <div className="pt-2 font-mono text-sand-900 leading-loose">
                {draft.emailBody}
              </div>

              <div className="pt-4 border-t border-sand-300 text-xs text-ink-muted font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>DocExplainer Citizen Legal Protection ID: DX-LEG-{Date.now().toString().slice(-6)}</span>
                <span className="text-emerald-700 font-bold">15-Day Statutory Cure Period Stipulated</span>
              </div>
            </div>
          </div>

          {/* CTA: Go to 4-Doc Forge */}
          {onOpenForge && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>Need an entire 4-Document Action Dossier?</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Generate the full Statutory Notice, Executive Settlement Offer, Contract Addendum, and Consumer Court Petition together.
                </p>
              </div>
              <button
                onClick={onOpenForge}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto flex-shrink-0"
              >
                <span>Launch Document Forge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
