import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  Languages,
  RotateCcw,
  ShieldCheck,
  Clock,
  Download,
  FileDown,
  Printer,
  FileCheck,
} from 'lucide-react';
import { DocumentData, ChatMessage } from '../types';
import { askDocumentQuestion, getStoredDocumentChat, saveDocumentChat } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';
import { downloadAuditReport, exportChatTranscript, printAuditCertificate } from '../services/reportGenerator';

interface DocumentChatProps {
  document: DocumentData;
  activeLanguage: string;
  onOpenForge?: () => void;
}

function getSuggestionsForDoc(doc: DocumentData): string[] {
  const engine = doc.projections?.engine;
  const isLoan = engine === 'loan_emi_foreclosure' || doc.docId?.includes('loan') || doc.docType?.toLowerCase().includes('loan');
  const isPower = engine === 'tiered_power_tariff' || doc.docId?.includes('power') || doc.docType?.toLowerCase().includes('electricity') || doc.docType?.toLowerCase().includes('utility');
  const isEcom = doc.docId?.includes('ecom') || doc.docType?.toLowerCase().includes('commerce') || doc.docType?.toLowerCase().includes('consumer') || doc.docType?.toLowerCase().includes('warranty');
  const isSaas = doc.docId?.includes('saas') || doc.docType?.toLowerCase().includes('saas') || doc.docType?.toLowerCase().includes('software') || doc.docType?.toLowerCase().includes('subscription');

  if (isEcom) {
    return [
      'Is the seller replacement policy valid under CPA 2019?',
      'Can the manufacturer disclaim warranty for DOA products?',
      'What is my statutory compensation claim including mental agony?',
      'What is the mandatory timeline for defect resolution?',
      'What statutory section applies to defective electronic goods?',
    ];
  }

  if (isSaas) {
    return [
      'What is my SLA uptime service credit entitlement?',
      'Is the unilateral 35% price hike legally enforceable?',
      'What happens to my confidential business data upon termination?',
      'Can I terminate immediately without paying remaining contract months?',
      'What is the maximum liability cap for platform outage?',
    ];
  }

  if (isLoan) {
    return [
      'What is my exact monthly EMI and total interest?',
      'Can I foreclose or prepay my loan early without penalty?',
      'What happens if I miss an EMI payment or NACH bounces?',
      'What is the lock-in period for prepayment?',
      'What is the total repayment amount over 36 months?',
    ];
  }

  if (isPower) {
    return [
      'How is my electricity bill calculated across tiered slabs?',
      'What is the fuel adjustment (FAC) and fixed demand charge?',
      'What is the exact disconnection notice and late fee surcharge?',
      'How much state electricity duty and peak surcharge is applied?',
      'What is the average cost per kWh unit on this bill?',
    ];
  }

  return [
    'What happens if I delay rent payment by 15 days?',
    'What is the notice period and lock-in clause?',
    'What non-refundable deductions are taken from my deposit?',
    'Can the owner increase rent without notice?',
    'What are the termination conditions?',
  ];
}

function getDefaultMessagesForDoc(doc: DocumentData): ChatMessage[] {
  const isRental = doc.docId?.includes('rent');
  const isPower = doc.docId?.includes('power') || doc.docId?.includes('bescom');
  const isLoan = doc.docId?.includes('loan') || doc.docId?.includes('hdfc');
  const isEcom = doc.docId?.includes('ecom') || doc.docType?.toLowerCase().includes('commerce') || doc.docType?.toLowerCase().includes('consumer');
  const isSaas = doc.docId?.includes('saas') || doc.docType?.toLowerCase().includes('saas') || doc.docType?.toLowerCase().includes('software');

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isEcom) {
    return [
      {
        id: 'sample-ecom-init',
        role: 'assistant',
        text: `Hello! I am your AI Consumer Rights Advocate for **${doc.fileName || doc.docType}**.\n\nAsk me about Consumer Protection Act (CPA 2019) mandates, manufacturer DOA warranty liabilities, or replacement refund enforcement.`,
        timestamp: now,
      },
      {
        id: 'sample-ecom-q1-user',
        role: 'user',
        text: 'The retailer is refusing replacement or refund citing Clause 11.2 7-day replacement window. Can they do this?',
        timestamp: now,
      },
      {
        id: 'sample-ecom-q1-bot',
        role: 'assistant',
        text: `• **Statutory Finding:** Clause 11.2 violates **Section 2(47) of the Consumer Protection Act, 2019 (Unfair Trade Practices)**.\n• **Manufacturer Liability:** Under **Section 84 (Product Liability)**, a manufacturer/seller is strictly liable for manufacturing defects rendering equipment non-functional upon delivery.\n• **Immediate Relief:** You are entitled to a **100% full refund of ₹84,999** or brand-new replacement within 48 hours, plus compensation for mental agony.\n• **Action Available:** You can immediately forge a formal Statutory Legal Notice or Consumer Forum Complaint in the Document Forge tab.`,
        timestamp: now,
      },
    ];
  }

  if (isSaas) {
    return [
      {
        id: 'sample-saas-init',
        role: 'assistant',
        text: `Hello! I am your AI B2B Software Contracts Counsel for **${doc.fileName || doc.docType}**.\n\nAsk me about SLA uptime service credits, unilateral fee hikes, IP ownership, or material breach termination.`,
        timestamp: now,
      },
      {
        id: 'sample-saas-q1-user',
        role: 'user',
        text: 'The vendor hiked subscription fees by 35% and suffered 96.2% uptime. Can we terminate without paying remaining contract months?',
        timestamp: now,
      },
      {
        id: 'sample-saas-q1-bot',
        role: 'assistant',
        text: `• **SLA Breach:** Clause 14.1 guarantees 99.9% monthly uptime. Operating at 96.2% constitutes a **Material Breach** and triggers a 25% SLA Service Credit.\n• **Unilateral Price Escalation:** Clause 8.2 (35% automatic renewal increase) constitutes an unconscionable contract modification without written mutual addendum.\n• **Termination Right:** Under Clause 9.3, you may serve a 30-day Cure Notice. If unrectified, contract terminates with **Zero Acceleration Penalty** and mandatory 7-day data export.\n• **Action Available:** A formal Contract Amendment Addendum and Settlement Offer are ready to be forged in the Document Forge tab.`,
        timestamp: now,
      },
    ];
  }

  if (isRental) {
    return [
      {
        id: 'sample-q1-bot-init',
        role: 'assistant',
        text: `Hello! I am your AI Assistant for **${doc.fileName || doc.docType}**.\n\nYou can ask me any point-wise question about penalties, lock-in terms, deadlines, or security deposits. I will answer strictly based on the clauses in this document.`,
        timestamp: now,
      },
      {
        id: 'sample-q1-user',
        role: 'user',
        text: 'What happens if my rent payment is delayed by 10 days?',
        timestamp: now,
      },
      {
        id: 'sample-q1-bot',
        role: 'assistant',
        text: `• **Clause Citation:** Clause 7.2 (Compounded Overdue Surcharge)\n• **Exact Penalty Rate:** 24% p.a. (2% monthly compounding interest) + ₹500 fixed administrative late fee\n• **Grace Period:** Rent is due by the 7th of each month. Any payment received on or after the 8th incurs the compounding late penalty immediately.\n• **Important Note:** Payments made after the 7th incur compounding interest on the total balance.`,
        timestamp: now,
      },
    ];
  }

  if (isPower) {
    return [
      {
        id: 'sample-q1-bot-init',
        role: 'assistant',
        text: `Hello! I am your AI Utility Tariff Assistant for **${doc.fileName || doc.docType}**.\n\nAsk me about peak-hour tariffs, power factor penalties, or disconnection notice timelines.`,
        timestamp: now,
      },
      {
        id: 'sample-q1-user',
        role: 'user',
        text: 'What is the exact disconnection notice and late fee surcharge?',
        timestamp: now,
      },
      {
        id: 'sample-q1-bot',
        role: 'assistant',
        text: `• **Clause Reference:** Section 4.1 (Delayed Payment Surcharge) & Section 6.8 (Disconnection Notice)\n• **Late Surcharge:** 18% p.a. compounded monthly on the total outstanding balance of ₹18,450\n• **Disconnection Notice:** If unpaid after 15 calendar days from the due date (16th Sept 2026), disconnection is initiated on 1st Oct 2026\n• **Reconnection Fee:** Mandatory ₹2,500 + 18% GST before power supply restoration.`,
        timestamp: now,
      },
    ];
  }

  if (isLoan) {
    return [
      {
        id: 'sample-q1-bot-init',
        role: 'assistant',
        text: `Hello! I am your AI Financial Contract Assistant for **${doc.fileName || doc.docType}**.\n\nAsk me about EMI defaults, penal interest, or prepayment foreclosure charges.`,
        timestamp: now,
      },
      {
        id: 'sample-q1-user',
        role: 'user',
        text: 'Can I foreclose or prepay my loan early without penalty?',
        timestamp: now,
      },
      {
        id: 'sample-q1-bot',
        role: 'assistant',
        text: `• **Clause Reference:** Clause 14.3 (Prepayment & Foreclosure Charges)\n• **Lock-in Period:** No prepayment or foreclosure is allowed within the first 12 months from disbursement\n• **Foreclosure Fee:** A mandatory 4% penalty + 18% GST is levied on the entire outstanding principal if closed early\n• **Default Penal Interest:** Clause 8.3 imposes 28% p.a. penal interest on missed EMIs.`,
        timestamp: now,
      },
    ];
  }

  return [
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your AI Assistant for **${doc.fileName || doc.docType}**.\n\nYou can ask me any question about penalties, lock-in terms, deadlines, or fees. I will give you a **point-wise answer with exact clause citations** grounded strictly in this document.`,
      timestamp: now,
    },
  ];
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  document,
  activeLanguage,
  onOpenForge,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = getStoredDocumentChat(document.docId);
    if (saved && saved.length > 0) return saved;
    return getDefaultMessagesForDoc(document);
  });

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatLanguage, setChatLanguage] = useState<string>(activeLanguage || 'english');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sync when document changes
  useEffect(() => {
    const saved = getStoredDocumentChat(document.docId);
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      const defaults = getDefaultMessagesForDoc(document);
      setMessages(defaults);
      saveDocumentChat(document.docId, defaults);
    }
  }, [document.docId]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    saveDocumentChat(document.docId, updatedWithUser);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await askDocumentQuestion(
        document.docId,
        q,
        chatLanguage,
        document
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: res.answer,
        cached: res.cached,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...updatedWithUser, botMsg];
      setMessages(finalMessages);
      saveDocumentChat(document.docId, finalMessages);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Error getting answer: ${e.message || 'Unable to reach assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMessages = [...updatedWithUser, errorMsg];
      setMessages(finalMessages);
      saveDocumentChat(document.docId, finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    const resetMsgs: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'assistant',
        text: `Chat reset. Ask any point-wise question about **${document.fileName || document.docType}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(resetMsgs);
    saveDocumentChat(document.docId, resetMsgs);
  };

  const isHindi = chatLanguage === 'hindi';

  return (
    <div className="w-full max-w-[1560px] mx-auto h-full flex flex-col space-y-3 min-h-0 animate-in fade-in duration-200">
      {/* 1. Header Command Banner (Full-Width, Clear Controls) */}
      <div className="bg-white border border-sand-300/80 rounded-2xl px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs flex-shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-burnt text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base sm:text-lg font-bold text-sand-900 leading-tight">
                {document.fileName || document.docType}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sand-200 text-sand-800 uppercase tracking-wide">
                {document.docType?.split(' ')[0] || 'Document'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
              Dedicated Clause-Grounded AI Assistant · Strict Citations & Zero Hallucination
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Language Switcher */}
          <button
            onClick={() => setChatLanguage(isHindi ? 'english' : 'hindi')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border border-sand-300 bg-sand-50 hover:border-burnt text-sand-900 transition-all shadow-2xs"
          >
            <Languages className="w-4 h-4 text-burnt" />
            <span>{isHindi ? 'हिंदी (Hindi)' : 'English'}</span>
          </button>

          {/* Download Verified Legal Audit Report */}
          <button
            onClick={() => downloadAuditReport(document, messages)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-sand-300 bg-sand-50 hover:bg-burnt-light/50 hover:border-burnt text-sand-900 transition-all shadow-2xs"
            title="Download Verified Legal Audit Report (.md)"
          >
            <Download className="w-4 h-4 text-burnt" />
            <span className="hidden md:inline">Audit Report</span>
          </button>

          {/* Print Audit Certificate */}
          <button
            onClick={() => printAuditCertificate(document)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 transition-all shadow-2xs"
            title="Print or Save Official Legal Audit Certificate (PDF)"
          >
            <Printer className="w-4 h-4 text-ink-muted" />
            <span className="hidden md:inline">Certificate</span>
          </button>

          {/* Autonomous Document Forge Action */}
          {onOpenForge && (
            <button
              onClick={onOpenForge}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-burnt text-white hover:bg-burnt-hover transition-all shadow-xs"
              title="Open Autonomous Document Forge & Action Dossier (4 Legal Documents)"
            >
              <FileCheck className="w-4 h-4" />
              <span>Forge Action Dossier</span>
            </button>
          )}

          {/* Reset Conversation */}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl border border-sand-300 bg-sand-50 hover:bg-sand-100 text-ink-muted transition-colors shadow-2xs"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Full-Width Dedicated Chat Box Workspace */}
      <div className="bg-white border border-sand-300/80 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 shadow-xs">
        {/* Grounding Info Bar */}
        <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 text-xs sm:text-sm text-emerald-950 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Strict Clause Citations (Bedrock Claude 3.5 Sonnet)</span>
            </span>
            {onOpenForge && (
              <button
                onClick={onOpenForge}
                className="inline-flex items-center space-x-1 text-xs font-bold text-burnt bg-burnt-light/80 hover:bg-burnt-light px-2.5 py-0.5 rounded-md border border-burnt/30 transition-colors shadow-2xs"
                title="Every conversation message automatically evolves your 4 Legal Action Dossiers in real time"
              >
                <FileCheck className="w-3.5 h-3.5 text-burnt" />
                <span>⚡ Real-Time Chat Memory Sync Active</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3 text-xs text-ink-muted font-medium">
            <button
              onClick={() => exportChatTranscript(document.docId || document.fileName || 'document', messages)}
              className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center space-x-1 transition-colors px-2 py-0.5 rounded hover:bg-emerald-100/60"
              title="Export complete conversation history (.txt)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Transcript</span>
            </button>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {messages.length} messages
            </span>
          </div>
        </div>

        {/* Quick-Ask Suggestion Chips */}
        <div className="px-4 py-2 bg-sand-50/80 border-b border-sand-200/80 overflow-x-auto flex items-center space-x-2 flex-shrink-0">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-muted flex items-center whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-burnt" />
            Quick Prompts:
          </span>
          {getSuggestionsForDoc(document).map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sug)}
              disabled={isLoading}
              className="text-xs sm:text-sm font-semibold bg-white hover:bg-burnt-light/60 border border-sand-300 hover:border-burnt text-sand-800 px-3 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0 shadow-2xs"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Messages Feed (Full-Width, Spacious & High Contrast) */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-burnt text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 sm:px-5 py-3 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-burnt text-white font-normal rounded-tr-xs shadow-xs'
                      : 'bg-sand-50/90 border border-sand-200/80 text-sand-900 rounded-tl-xs space-y-2 shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-line font-normal leading-relaxed">
                    {m.text}
                  </div>
                  <div
                    className={`flex items-center justify-between pt-1.5 text-xs sm:text-sm ${
                      isUser ? 'text-burnt-light/80' : 'text-ink-muted'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <div className="flex items-center space-x-2 ml-3">
                        <VoiceAssistant
                          textToSpeak={m.text}
                          language={isHindi ? 'hindi' : 'english'}
                        />
                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="hover:text-sand-900 p-1.5 rounded-lg hover:bg-sand-200/60 transition-colors"
                          title="Copy response to clipboard"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-sand-200 text-sand-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3 text-sm text-ink-muted p-3 bg-sand-50 border border-sand-200 rounded-2xl w-fit shadow-2xs">
              <Loader2 className="w-5 h-5 text-burnt animate-spin" />
              <span>Analyzing document clauses and grounding response...</span>
            </div>
          )}

          {/* Anchor to auto-scroll when new messages arrive */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar (Full Width, Spacious) */}
        <div className="p-3.5 sm:p-4 bg-sand-50/90 border-t border-sand-200 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2.5"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask any question about clauses, penalties, lock-in period, rent, refund rules, or counter-offers..."
              className="flex-1 text-sm sm:text-base bg-white border border-sand-300 rounded-xl px-4 py-2.5 sm:py-3 focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              className={`px-5 py-2.5 sm:py-3 rounded-xl text-white font-bold transition-all flex items-center space-x-2 shadow-xs ${
                !inputQuestion.trim() || isLoading
                  ? 'bg-sand-300 cursor-not-allowed'
                  : 'bg-burnt hover:bg-burnt-hover'
              }`}
            >
              <span>Ask</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
