import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Printer,
  Brain,
  MessageSquare,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { DocumentData, ChatMessage, AdaptiveCaseMemory, ForgedDocument, ForgedDocType } from '../types';
import { generateLegalDossier, extractCaseMemoryFromChat } from '../services/adaptiveMemory';

interface DocumentForgeViewProps {
  document: DocumentData | null;
  chatMessages: ChatMessage[];
  onOpenChat: () => void;
  onSelectSample: (sampleId: string) => void;
}

export const DocumentForgeView: React.FC<DocumentForgeViewProps> = ({
  document,
  chatMessages,
  onOpenChat,
  onSelectSample,
}) => {
  const activeDoc = document || ({
    docId: 'sample-rent-blr',
    fileName: 'Bangalore_Residential_Lease_Agreement.pdf',
    docType: 'Residential Tenancy Agreement',
    riskFlags: [
      {
        clause: 'Clause 7.2 (Compounded Overdue Surcharge)',
        amount: '24% p.a. + ₹500/mo flat late fee',
        why: 'Late rent is compounded monthly past the 7th.',
      },
    ],
  } as DocumentData);

  // Extract ongoing user constraints, offers, and grievances from chat
  const caseMemory: AdaptiveCaseMemory = extractCaseMemoryFromChat(chatMessages);

  // Generate the 4-document dossier dynamically incorporating the case memory
  const dossier = generateLegalDossier(activeDoc, caseMemory);

  const [activeTab, setActiveTab] = useState<ForgedDocType>('statutory_notice');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-place editable state for all documents
  const [editableContents, setEditableContents] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    dossier.documents.forEach((d) => {
      map[d.id] = d.content;
    });
    return map;
  });

  const currentDoc = dossier.documents.find((d) => d.type === activeTab) || dossier.documents[0];
  const currentContent = editableContents[currentDoc.id] || currentDoc.content;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownload = (docItem: ForgedDocument, extension: 'md' | 'txt') => {
    const text = editableContents[docItem.id] || docItem.content;
    const blob = new Blob([text], { type: extension === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `DocExplainer_${docItem.type}_${activeDoc.docId}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllDossier = () => {
    const fullText = `# 🛡️ DOCEXPLAINER AUTONOMOUS LEGAL ACTION DOSSIER
**Document:** ${activeDoc.fileName || activeDoc.docType}
**Case Reference:** DX-${activeDoc.docId.toUpperCase()}
**Generated:** ${dossier.generatedAt}
${caseMemory.userProposedOffer ? `**Citizen-Stipulated Offer:** ${caseMemory.userProposedOffer}\n` : ''}${caseMemory.factualGrievance ? `**Factual Grievance:** ${caseMemory.factualGrievance}\n` : ''}${caseMemory.settlementTerms ? `**Settlement Preference:** ${caseMemory.settlementTerms}\n` : ''}
========================================================================

` + dossier.documents.map((d, idx) => `
## ${idx + 1}. ${d.title.toUpperCase()}
*Statutory Basis: ${d.statutoryBasis}*
*Recipient: ${d.recipientRole}*

${editableContents[d.id] || d.content}

------------------------------------------------------------------------
`).join('\n');

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `DocExplainer_Full_Legal_Dossier_${activeDoc.docId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-burnt text-white flex items-center justify-center shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-sand-900 leading-tight">
                Autonomous Legal Document Forge & Action Dossier
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">
                Executable Legal Instruments · Real-Time Chat Learning · Multi-Domain Protection
              </p>
            </div>
          </div>
        </div>

        {/* Adaptive Case Memory Indicator & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {caseMemory.refinementsCount > 0 ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm flex items-center space-x-2.5 shadow-2xs">
              <Brain className="w-4.5 h-4.5 text-emerald-700 animate-pulse flex-shrink-0" />
              <div>
                <span className="font-bold block">
                  ✨ Learned from Chat ({caseMemory.refinementsCount} Custom Points)
                </span>
                <span className="text-xs text-emerald-800 font-medium">
                  {caseMemory.userProposedOffer ? `Stipulated Offer: ${caseMemory.userProposedOffer}` : ''}
                  {caseMemory.settlementTerms ? ` · ${caseMemory.settlementTerms.slice(0, 32)}...` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpenChat}
              className="px-3.5 py-2 rounded-xl bg-sand-100 hover:bg-sand-200 border border-sand-200 text-ink-muted hover:text-sand-900 text-xs sm:text-sm flex items-center space-x-2 cursor-pointer transition-colors"
              title="Chat with the AI assistant to automatically personalize your offer and grievance facts in these documents"
            >
              <MessageSquare className="w-4 h-4 text-burnt" />
              <span>Chat to personalize these docs →</span>
            </div>
          )}

          <button
            onClick={handleDownloadAllDossier}
            className="px-4 py-2 bg-burnt hover:bg-burnt-hover text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download All 4 Dossiers</span>
          </button>
        </div>
      </div>

      {/* 2. DOCUMENT TABS SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dossier.documents.map((d) => {
          const isSelected = activeTab === d.type;
          return (
            <button
              key={d.id}
              onClick={() => setActiveTab(d.type)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-white border-burnt ring-2 ring-burnt/25 shadow-sm'
                  : 'bg-white/80 border-sand-300/80 hover:border-burnt/40 hover:bg-white shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-burnt text-white' : 'bg-sand-200 text-sand-800'
                  }`}
                >
                  {d.badge}
                </span>
                {d.lastUpdatedFromChat && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Refined from chat" />
                )}
              </div>
              <div className="font-bold text-xs sm:text-sm text-sand-900 leading-snug">
                {d.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE DOCUMENT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Metadata & Strategy Panel (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-sand-300/80 rounded-2xl p-6 space-y-4 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-burnt">
                Legal Strategic Framework
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-sand-900 mt-1">
                {currentDoc.title}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">
                {currentDoc.summary}
              </p>
            </div>

            <div className="space-y-3.5 pt-3 border-t border-sand-200 text-xs sm:text-sm">
              <div>
                <span className="font-bold text-sand-800 block uppercase tracking-wide text-xs">
                  Statutory Grounds:
                </span>
                <span className="text-sand-900 leading-relaxed font-semibold">
                  {currentDoc.statutoryBasis}
                </span>
              </div>

              <div>
                <span className="font-bold text-sand-800 block uppercase tracking-wide text-xs">
                  Intended Counterparty / Forum:
                </span>
                <span className="text-sand-900 font-medium">
                  {currentDoc.recipientRole}
                </span>
              </div>

              <div>
                <span className="font-bold text-sand-800 block uppercase tracking-wide text-xs">
                  Service Protocol:
                </span>
                <span className="text-ink-muted">
                  Serve via Speed Post A.D. and official email with timestamped delivery acknowledgement.
                </span>
              </div>
            </div>

            {/* Document Action Buttons */}
            <div className="pt-4 border-t border-sand-200 space-y-2.5">
              <button
                onClick={() => handleCopy(currentDoc.id, currentContent)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-xs ${
                  copiedId === currentDoc.id ? 'bg-emerald-600 text-white' : 'bg-burnt text-white hover:bg-burnt-hover'
                }`}
              >
                {copiedId === currentDoc.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === currentDoc.id ? 'Copied to Clipboard!' : 'Copy Formatted Draft'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDownload(currentDoc, 'md')}
                  className="py-2 px-3 rounded-xl border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-sand-700" />
                  <span>Markdown (.md)</span>
                </button>

                <button
                  onClick={() => handleDownload(currentDoc, 'txt')}
                  className="py-2 px-3 rounded-xl border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-sand-700" />
                  <span>Text (.txt)</span>
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="w-full py-2 px-3 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Printer className="w-4 h-4 text-ink-muted" />
                <span>Print Official Copy (PDF)</span>
              </button>
            </div>
          </div>

          {/* Quick Domain Switcher */}
          <div className="bg-sand-50/80 border border-sand-200/90 rounded-2xl p-5 space-y-2.5 text-xs sm:text-sm">
            <span className="font-bold text-sand-900 block">Switch Legal Domain:</span>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => onSelectSample('sample-ecom-consumer')}
                className="text-left text-burnt font-semibold hover:underline flex items-center justify-between"
              >
                <span>🛒 E-Commerce Replacement Dispute</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectSample('sample-b2b-saas')}
                className="text-left text-burnt font-semibold hover:underline flex items-center justify-between"
              >
                <span>🏢 SME B2B Software Escalation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectSample('sample-loan-hdfc')}
                className="text-left text-burnt font-semibold hover:underline flex items-center justify-between"
              >
                <span>🏦 HDFC Bank Loan Foreclosure</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onSelectSample('sample-power-bescom')}
                className="text-left text-burnt font-semibold hover:underline flex items-center justify-between"
              >
                <span>⚡ BESCOM Tariff Surcharge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Authentic Legal Parchment Canvas (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-[#FCFBF7] border-2 border-sand-400/90 rounded-3xl p-6 sm:p-9 shadow-md space-y-5">
          {/* Authentic Legal Header Seal */}
          <div className="border-b-2 border-sand-400 pb-4 text-center space-y-1.5 select-none">
            <div className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-burnt">
              ★ REPUBLIC OF INDIA · CITIZEN LEGAL PROTECTION RECORD ★
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-sand-900 tracking-wide uppercase">
              {currentDoc.title}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ink-muted">
              <span>CASE ID: DX-{activeDoc.docId.toUpperCase()}</span>
              <span>•</span>
              <span>STATUTE: {currentDoc.statutoryBasis}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">15-DAY MANDATORY NOTICE</span>
            </div>
          </div>

          {/* Editable Legal Parchment Canvas */}
          <div className="relative">
            <textarea
              value={currentContent}
              onChange={(e) => {
                const val = e.target.value;
                setEditableContents((prev) => ({ ...prev, [currentDoc.id]: val }));
              }}
              rows={23}
              className="w-full bg-white border border-sand-300 rounded-2xl p-6 sm:p-7 text-xs sm:text-sm font-mono text-sand-900 leading-relaxed focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt transition-all shadow-inner"
              placeholder="Legal document text..."
            />
          </div>

          {/* Execution Signatory Blocks */}
          <div className="pt-4 border-t-2 border-dashed border-sand-300 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm font-serif">
            <div className="p-4 bg-white/70 border border-sand-300 rounded-xl space-y-2">
              <div className="font-bold text-sand-900 uppercase">First Party / Aggrieved Citizen:</div>
              <div className="h-10 border-b border-sand-400" />
              <div className="text-xs text-ink-muted">Signature & Date: {new Date().toLocaleDateString()}</div>
            </div>
            <div className="p-4 bg-white/70 border border-sand-300 rounded-xl space-y-2">
              <div className="font-bold text-sand-900 uppercase">Opposite Party / Respondent:</div>
              <div className="h-10 border-b border-sand-400" />
              <div className="text-xs text-ink-muted">Receipt Acknowledged by Representative</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-ink-muted pt-2 gap-1 font-sans">
            <span>💡 You can edit all clauses directly above before copying, printing, or downloading.</span>
            <span className="font-semibold text-sand-800">DocExplainer Verifiable Record</span>
          </div>
        </div>
      </div>
    </div>
  );
};
