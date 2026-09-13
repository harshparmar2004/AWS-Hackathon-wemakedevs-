import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Mail,
  ShieldAlert,
  Scale,
  Sparkles,
  FileText,
  Download,
} from 'lucide-react';
import { DocumentData, RiskFlag, NegotiationDraft } from '../types';

interface NegotiationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  riskFlag?: RiskFlag | null;
  flag?: RiskFlag | null;
  document: DocumentData;
  isHindi?: boolean;
}

export function generateNegotiationDraft(
  flag: RiskFlag,
  doc: DocumentData
): NegotiationDraft {
  const isLoan = doc.docId?.includes('loan') || doc.docType?.toLowerCase().includes('loan');
  const isPower = doc.docId?.includes('power') || doc.docType?.toLowerCase().includes('utility');
  const docName = doc.fileName || doc.docType || 'Agreement';

  if (isLoan) {
    return {
      clause: flag.clause,
      predatorySummary: `High default penalty (${flag.amount}) and restrictive prepayment lock-in terms that shift financial risk disproportionately onto the borrower.`,
      legalGrounding: `RBI Circular DBOD.No.Dir.BC.107/13.03.00/2011-12 & Fair Practices Code prohibit predatory foreclosure charges on individual loans. Under Section 2(46) of the Consumer Protection Act 2019, unilateral termination and excessive penal interest qualify as unfair contract terms.`,
      marketBenchmark: `Standard banking benchmark: Maximum 2% p.a. simple penal interest on overdue installments with a 15-day grace period, and zero foreclosure penalty post 6 months.`,
      emailSubject: `Request for Reconsideration: ${flag.clause} in Loan Sanction (${docName})`,
      emailBody: `Dear Branch Manager / Loan Operations Team,

I refer to the Sanction Letter / Loan Agreement for ${docName}.

Upon reviewing the schedule, ${flag.clause} specifies:
"${flag.amount}"

I would like to respectfully request an amendment to this clause prior to signing / drawdown:
1. Regulatory Context: As per the RBI Master Directions on Fair Practices Code and Consumer Protection regulations, excessive penal interest and restrictive prepayment locks impose an undue burden on retail borrowers.
2. Proposed Fair Amendment: We request amending the penal interest to standard 2% simple interest on overdue EMI amounts with a 10-day grace period, and reducing the prepayment lock-in period to 6 months.

I look forward to executing this agreement with these mutually balanced terms.

Sincerely,
[Your Full Name]
[Contact Number / Application ID]`,
    };
  }

  if (isPower) {
    return {
      clause: flag.clause,
      predatorySummary: `Immediate disconnection timeline and compounding delayed payment surcharge (${flag.amount}) that compound billing disputes.`,
      legalGrounding: `Section 56(1) of the Electricity Act, 2003 mandates that a minimum of 15 clear days' written notice must be served specifically before disconnecting supply, and disputed amounts under Section 56(2) cannot trigger disconnection pending review.`,
      marketBenchmark: `Standard State Regulatory Commission norm: 1.25% to 1.5% monthly simple interest surcharge on unpaid balance, with provisional payment options pending meter dispute resolution.`,
      emailSubject: `Notice of Dispute & Request for Verification: ${flag.clause} (${docName})`,
      emailBody: `To,
The Assistant Executive Engineer / Consumer Grievance Redressal Cell,
${docName}

Subject: Request for Verification and Surcharge Waiver under Section 56 of Electricity Act 2003

Dear Sir / Madam,

With reference to the current utility bill / demand notice for consumer account, ${flag.clause} indicates:
"${flag.amount}"

Kindly note the following:
1. Under Section 56(1) of the Electricity Act 2003, statutory 15 days written notice is required prior to any disconnection action.
2. We request a provisional reconciliation of the fuel adjustment (FAC) and peak-demand surcharges before compounding delayed payment interest is levied.

We are ready to clear the undisputed base consumption charges immediately and request that no disconnection be initiated pending this reconciliation.

Thank you.

Yours faithfully,
[Consumer Name / Account ID]
[Registered Service Address]`,
    };
  }

  // Default: Residential Rental & Tenancy Agreements
  return {
    clause: flag.clause,
    predatorySummary: `Unilateral compounding penalty (${flag.amount}) or non-negotiable security deposit deductions that conflict with fair wear-and-tear principles.`,
    legalGrounding: `Model Tenancy Act, 2021 (Chapters II & IV) limits residential security deposits to a maximum of 2 months' rent and protects tenants against arbitrary painting/refurbishment deductions without itemized bills. Section 74 of the Indian Contract Act, 1872 further stipulates that penalty stipulations must be genuine pre-estimates of damage.`,
    marketBenchmark: `Standard metropolitan tenancy benchmark: 7-day grace period for rent, maximum 1% monthly simple interest for genuine delays, and security deposit deductions strictly backed by physical joint inspection and actual repair invoices.`,
    emailSubject: `Proposed Amendment to ${flag.clause} — Tenancy Agreement (${docName})`,
    emailBody: `Dear Landlord / Property Owner,

I hope this email finds you well.

I am very excited about leasing the premises under ${docName}. While reviewing the draft agreement, I noticed ${flag.clause} which stipulates:
"${flag.amount}"

I would like to respectfully propose a minor amendment to keep the terms fair and mutually protective:
1. Legal / Tenancy Standards: Under the Model Tenancy Act principles and standard tenancy practices, late rent is typically subject to a 7-day grace period, followed by nominal simple interest, rather than compounding penalties. Similarly, security deposit refunds should account for normal fair wear-and-tear with deductions supported by actual receipts.
2. Proposed Revision: 
   - A 7-day grace period from the due date before any late fee applies.
   - Any late payment fee capped at a flat ₹500 or standard simple interest.
   - Security deposit deductions to be finalized based on our joint vacating inspection with itemized receipts.

I am keen to finalize the agreement and move forward smoothly once this revision is incorporated.

Best regards,
[Tenant Name]
[Contact Number]`,
  };
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  isOpen = true,
  onClose,
  riskFlag,
  flag,
  document: docData,
  isHindi = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const activeFlag = riskFlag || flag;

  if (!isOpen || !activeFlag) return null;

  const draft = generateNegotiationDraft(activeFlag, docData);

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
    const content = `NEGOTIATION & DISPUTE DRAFT REPORT\nDocument: ${docData.fileName || docData.docType}\nClause: ${draft.clause}\n\nPREDATORY TERM:\n${draft.predatorySummary}\n\nLEGAL & REGULATORY GROUNDING:\n${draft.legalGrounding}\n\nMARKET BENCHMARK:\n${draft.marketBenchmark}\n\n---------------------------------------------\nSUBJECT:\n${draft.emailSubject}\n\nBODY:\n${draft.emailBody}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `Negotiation_Draft_${activeFlag.clause.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sand-900/60 backdrop-blur-xs">
      <div className="bg-white border border-sand-300 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-sand-200 flex items-center justify-between bg-sand-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-burnt text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-sand-900 leading-tight">
                {isHindi ? 'कानूनी प्रति-प्रस्ताव व वार्तालाप पत्र' : 'Autonomous Negotiation & Dispute Shield'}
              </h2>
              <p className="text-[11px] text-ink-muted">
                {draft.clause} · Grounded in Consumer & Tenancy Protection Acts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-sand-900 hover:bg-sand-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Predatory Clause & Why it hurts */}
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-red-800 font-bold text-xs uppercase tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Predatory Term Identified:</span>
            </div>
            <p className="text-sand-900 font-medium leading-relaxed">
              {activeFlag.amount} — {draft.predatorySummary}
            </p>
          </div>

          {/* Legal / Regulatory Grounding */}
          <div className="bg-sand-50/90 border border-sand-200/90 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-burnt font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Statutory Legal Grounds:</span>
            </div>
            <p className="text-sand-900 leading-relaxed font-normal">
              {draft.legalGrounding}
            </p>
            <div className="pt-1 text-[11px] text-ink-muted">
              <span className="font-semibold text-sand-850">Fair Market Benchmark:</span> {draft.marketBenchmark}
            </div>
          </div>

          {/* Draft Email Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sand-900 text-xs flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-burnt" />
                <span>Ready-to-Send Counter-Offer Email:</span>
              </span>
              <span className="text-[10px] text-ink-muted font-medium">Polite · Professional · Legally Cited</span>
            </div>

            <div className="bg-sand-50/70 border border-sand-300 rounded-xl p-3.5 space-y-2 font-mono text-[11px] sm:text-xs text-sand-900 whitespace-pre-wrap leading-relaxed select-text">
              <div className="text-ink-muted pb-1 border-b border-sand-200">
                <span className="font-bold text-sand-800">Subject:</span> {draft.emailSubject}
              </div>
              <div className="pt-1">{draft.emailBody}</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-sand-200 bg-sand-50/90 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[11px] text-ink-muted">
            💡 Protects your rights before signing.
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={handleMailto}
              className="px-3 py-1.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-burnt" />
              <span>Open in Email</span>
            </button>

            <button
              onClick={handleCopy}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
                copied ? 'bg-emerald-600' : 'bg-burnt hover:bg-burnt-hover'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
