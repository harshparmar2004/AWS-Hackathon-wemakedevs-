import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Printer,
  Brain,
  MessageSquare,
  FileCheck,
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

  // Extract real-time case memory from chat conversation
  const caseMemory: AdaptiveCaseMemory = extractCaseMemoryFromChat(chatMessages);

  // Generate the full 4-document dossier adapting to document and chat memory
  const dossier = generateLegalDossier(activeDoc, caseMemory);

  const [activeTab, setActiveTab] = useState<ForgedDocType>('statutory_notice');
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      <div className="bg-white border border-sand-300/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-burnt text-white flex items-center justify-center shadow-xs">
              <FileCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-sand-900 leading-tight">
              Autonomous Document Forge & Action Dossier
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted">
            The agent automatically generates 4 complete, legally grounded, and ready-to-execute documents for any uploaded agreement.
          </p>
        </div>

        {/* Adaptive Case Memory Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start lg:self-auto">
          {caseMemory.refinementsCount > 0 ? (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2 shadow-2xs">
              <Brain className="w-4 h-4 text-emerald-600 animate-pulse flex-shrink-0" />
              <div>
                <span className="font-bold block">
                  ✨ Adapted via Chat ({caseMemory.refinementsCount} User Nuances)
                </span>
                <span className="text-[11px] text-emerald-700">
                  {caseMemory.userProposedOffer ? `Offer: ${caseMemory.userProposedOffer}` : ''}
                  {caseMemory.settlementTerms ? ` · ${caseMemory.settlementTerms.slice(0, 30)}...` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpenChat}
              className="px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 border border-sand-200 text-ink-muted hover:text-sand-900 text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Chat with the assistant to have your specific offer or dates reflected in these documents"
            >
              <MessageSquare className="w-3.5 h-3.5 text-burnt" />
              <span>Chat to personalize these docs →</span>
            </div>
          )}

          <button
            onClick={handleDownloadAllDossier}
            className="px-3.5 py-2 rounded-xl bg-burnt hover:bg-burnt-hover text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All 4 Docs</span>
          </button>
        </div>
      </div>

      {/* 2. DOCUMENT TABS SELECTOR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {dossier.documents.map((d) => {
          const isSelected = activeTab === d.type;
          return (
            <button
              key={d.id}
              onClick={() => setActiveTab(d.type)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1.5 ${
                isSelected
                  ? 'bg-white border-burnt ring-2 ring-burnt/20 shadow-xs'
                  : 'bg-white/75 border-sand-300/80 hover:border-burnt/40 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
                  }`}
                >
                  {d.badge}
                </span>
                {d.lastUpdatedFromChat && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Refined from chat" />
                )}
              </div>
              <div className="font-bold text-xs sm:text-[13px] text-sand-900 leading-snug line-clamp-2">
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
          <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-4 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-burnt">
                Legal Strategic Dossier
              </span>
              <h2 className="text-base font-bold text-sand-900 mt-0.5">
                {currentDoc.title}
              </h2>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                {currentDoc.summary}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-sand-200 text-xs">
              <div>
                <span className="font-bold text-sand-800 block text-[11px] uppercase tracking-wide">
                  Statutory Enforceability:
                </span>
                <span className="text-sand-900 leading-relaxed font-medium">
                  {currentDoc.statutoryBasis}
                </span>
              </div>

              <div>
                <span className="font-bold text-sand-800 block text-[11px] uppercase tracking-wide">
                  Intended Recipient:
                </span>
                <span className="text-sand-900 font-medium">
                  {currentDoc.recipientRole}
                </span>
              </div>

              <div>
                <span className="font-bold text-sand-800 block text-[11px] uppercase tracking-wide">
                  Recommended Dispatch:
                </span>
                <span className="text-ink-muted">
                  Serve via Registered Post A.D. and official support email with delivery tracking receipt.
                </span>
              </div>
            </div>

            {/* Document Action Buttons */}
            <div className="pt-3 border-t border-sand-200 space-y-2">
              <button
                onClick={() => handleCopy(currentDoc.id, currentContent)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs ${
                  copiedId === currentDoc.id ? 'bg-emerald-600 text-white' : 'bg-burnt text-white hover:bg-burnt-hover'
                }`}
              >
                {copiedId === currentDoc.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === currentDoc.id ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDownload(currentDoc, 'md')}
                  className="py-1.5 px-2.5 rounded-lg border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-sand-700" />
                  <span>Markdown</span>
                </button>

                <button
                  onClick={() => handleDownload(currentDoc, 'txt')}
                  className="py-1.5 px-2.5 rounded-lg border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-sand-700" />
                  <span>Text (.txt)</span>
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="w-full py-1.5 px-2.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-ink-muted" />
                <span>Print Official Copy (PDF)</span>
              </button>
            </div>
          </div>

          {/* Quick Domain Switcher */}
          <div className="bg-sand-50/80 border border-sand-200/90 rounded-2xl p-4 space-y-2 text-xs">
            <span className="font-bold text-sand-900 block">Switch Legal Domain Sample:</span>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => onSelectSample('sample-ecom-consumer')}
                className="text-left text-burnt font-semibold hover:underline"
              >
                🛒 E-Commerce Replacement Dispute →
              </button>
              <button
                onClick={() => onSelectSample('sample-b2b-saas')}
                className="text-left text-burnt font-semibold hover:underline"
              >
                🏢 SME B2B Software Escalation →
              </button>
              <button
                onClick={() => onSelectSample('sample-loan-hdfc')}
                className="text-left text-burnt font-semibold hover:underline"
              >
                🏦 HDFC Bank Loan Foreclosure →
              </button>
              <button
                onClick={() => onSelectSample('sample-power-bescom')}
                className="text-left text-burnt font-semibold hover:underline"
              >
                ⚡ BESCOM Tariff Surcharge →
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Document Editor / Paper Viewer (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-sand-300/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-burnt" />
              <span className="font-bold text-xs uppercase tracking-wider text-sand-800">
                Ready-to-Dispatch Executable Legal Draft
              </span>
            </div>
            <span className="text-[11px] text-ink-muted font-mono">
              {currentContent.length} characters
            </span>
          </div>

          {/* Editable Paper Canvas */}
          <div className="relative">
            <textarea
              value={currentContent}
              onChange={(e) => {
                const val = e.target.value;
                setEditableContents((prev) => ({ ...prev, [currentDoc.id]: val }));
              }}
              rows={22}
              className="w-full bg-sand-50/60 border border-sand-300 rounded-2xl p-5 text-xs sm:text-sm font-mono text-sand-900 leading-relaxed focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt transition-all shadow-inner"
              placeholder="Legal document text..."
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
            <span>💡 You can edit this text directly before copying or downloading.</span>
            <span className="font-semibold text-sand-800">Cites Indian Statutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
