import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
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
  Cloud,
  CloudUpload,
  Paperclip,
} from 'lucide-react';
import { DocumentData, ChatMessage } from '../types';
import { askDocumentQuestion, getStoredDocumentChat, saveDocumentChat } from '../services/api';
import { VoiceAssistant } from './VoiceAssistant';
import { downloadAuditReport, exportChatTranscript, printAuditCertificate } from '../services/reportGenerator';

interface DocumentChatProps {
  document: DocumentData | null;
  activeLanguage: string;
  onOpenForge?: () => void;
  onUploadStart?: (
    fileBase64: string,
    fileName: string,
    fileType: 'pdf' | 'image',
    language: string
  ) => void;
  isProcessing?: boolean;
  processingStatusText?: string;
}

function getDefaultMessagesForDoc(doc?: DocumentData | null): ChatMessage[] {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!doc) {
    return [
      {
        id: 'welcome-empty',
        role: 'assistant',
        text: `☁️ Welcome to the AI Document Cloud!\n\nUpload any PDF contract, lease, loan sanction, or tariff bill directly here to begin your clause-grounded legal analysis.`,
        timestamp: now,
      },
    ];
  }

  const isRental = doc.docId?.includes('rent');
  const isPower = doc.docId?.includes('power') || doc.docId?.includes('bescom');
  const isLoan = doc.docId?.includes('loan') || doc.docId?.includes('hdfc');
  const isEcom = doc.docId?.includes('ecom') || doc.docType?.toLowerCase().includes('commerce') || doc.docType?.toLowerCase().includes('consumer');
  const isSaas = doc.docId?.includes('saas') || doc.docType?.toLowerCase().includes('saas') || doc.docType?.toLowerCase().includes('software');

  if (isEcom) {
    return [
      {
        id: 'sample-ecom-init',
        role: 'assistant',
        text: `☁️ AI Consumer Protection Cloud active for **${doc.fileName || doc.docType}**.\n\nAsk any question regarding Consumer Protection Act (CPA 2019) mandates, manufacturer DOA liabilities, or refund enforcement.`,
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
        text: `☁️ AI B2B Software Cloud active for **${doc.fileName || doc.docType}**.\n\nAsk about SLA uptime service credits, unilateral fee hikes, IP ownership, or material breach termination.`,
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
        text: `• **SLA Breach:** Clause 14.1 guarantees 99.9% monthly uptime. Operating at 96.2% constitutes a **Material Breach** and triggers a 25% SLA Service Credit.\n• **Unilateral Price Escalation:** Clause 8.2 (35% automatic renewal increase) constitutes an unconscionable contract modification without written mutual addendum.\n• **Termination Right:** Under Clause 9.3, you may serve a 30-day Cure Notice. If unrectified, contract terminates with **Zero Acceleration Penalty** and mandatory 7-day data export.`,
        timestamp: now,
      },
    ];
  }

  if (isRental) {
    return [
      {
        id: 'sample-q1-bot-init',
        role: 'assistant',
        text: `☁️ AI Contract Cloud initialized for **${doc.fileName || doc.docType}**.\n\nI will answer point-wise with exact clause citations grounded strictly in this agreement.`,
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
        text: `☁️ AI Utility Tariff Cloud active for **${doc.fileName || doc.docType}**.\n\nAsk about tiered slabs, fixed charges, fuel adjustment (FAC), or disconnection notice timelines.`,
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
        text: `☁️ AI Loan Contract Cloud active for **${doc.fileName || doc.docType}**.\n\nAsk about EMI calculations, penal interest, or prepayment foreclosure charges.`,
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
      text: `☁️ AI Cloud Assistant active for **${doc.fileName || doc.docType}**.\n\nAsk any question about penalties, lock-in terms, deadlines, or fees for point-wise answers with exact clause citations.`,
      timestamp: now,
    },
  ];
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  document,
  activeLanguage,
  onOpenForge,
  onUploadStart,
  isProcessing = false,
  processingStatusText,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (document) {
      const saved = getStoredDocumentChat(document.docId);
      if (saved && saved.length > 0) return saved;
    }
    return getDefaultMessagesForDoc(document);
  });

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatLanguage, setChatLanguage] = useState<string>(activeLanguage || 'english');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isProcessing]);

  // Sync when document changes
  useEffect(() => {
    if (document) {
      const saved = getStoredDocumentChat(document.docId);
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        const defaults = getDefaultMessagesForDoc(document);
        setMessages(defaults);
        saveDocumentChat(document.docId, defaults);
      }
    } else {
      setMessages(getDefaultMessagesForDoc(null));
    }
  }, [document?.docId]);

  const handleFileSelection = (file: File) => {
    if (!onUploadStart) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload a valid image or PDF document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
      onUploadStart(base64, file.name, fileType, chatLanguage);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

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
    if (document) {
      saveDocumentChat(document.docId, updatedWithUser);
    }
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await askDocumentQuestion(
        document?.docId || 'cloud-doc',
        q,
        chatLanguage,
        document || undefined
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
      if (document) {
        saveDocumentChat(document.docId, finalMessages);
      }
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Error getting answer: ${e.message || 'Unable to reach assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalMessages = [...updatedWithUser, errorMsg];
      setMessages(finalMessages);
      if (document) {
        saveDocumentChat(document.docId, finalMessages);
      }
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
        text: `☁️ Cloud chat reset. Ask any question about **${document?.fileName || document?.docType || 'your document'}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(resetMsgs);
    if (document) {
      saveDocumentChat(document.docId, resetMsgs);
    }
  };

  const isHindi = chatLanguage === 'hindi';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full max-w-[1560px] mx-auto h-full flex flex-col min-h-0 relative cloud-glass-canvas rounded-3xl p-3 sm:p-4 animate-in fade-in duration-200 overflow-hidden"
    >
      {/* Hidden File Input for Direct In-Chat Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
          }
        }}
        accept="application/pdf,image/*"
        className="hidden"
      />

      {/* Drag & Drop Cloud Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-sky-500/15 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-400 rounded-3xl animate-in fade-in duration-150">
          <div className="bg-white/90 p-6 rounded-3xl shadow-xl border border-sky-200 text-center space-y-2.5 max-w-md">
            <CloudUpload className="w-12 h-12 text-sky-500 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-sand-900">Drop Document Into Cloud</h3>
            <p className="text-xs text-ink-muted">
              Release file to instantly ingest to Amazon S3 & Bedrock Claude
            </p>
          </div>
        </div>
      )}

      {/* 1. Sleek Cloud Header Bar (Compact & High Information Density) */}
      <div className="bg-white/85 backdrop-blur-md border border-sky-100 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Cloud className="w-4.5 h-4.5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold text-sand-900 leading-tight">
                {document?.fileName || document?.docType || 'AI Document Cloud'}
              </h1>
              {document?.docType && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wide">
                  {document.docType.split(' ')[0]}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-ink-muted">
              AWS Bedrock Claude 3.5 Sonnet · Direct Document Cloud Ingestion
            </p>
          </div>
        </div>

        {/* Action Controls & Direct Cloud Upload Button */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Direct Cloud Upload Button */}
          {onUploadStart && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-2xs transition-all"
              title="Upload any PDF or image document directly from here"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setChatLanguage(isHindi ? 'english' : 'hindi')}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-sand-300/80 bg-white hover:border-burnt text-sand-900 transition-all shadow-2xs"
          >
            <Languages className="w-3.5 h-3.5 text-burnt" />
            <span>{isHindi ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Audit Report Export */}
          {document && (
            <button
              onClick={() => downloadAuditReport(document, messages)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-sand-300/80 bg-white hover:bg-burnt-light/50 hover:border-burnt text-sand-900 transition-all shadow-2xs"
              title="Download Verified Audit Report (.md)"
            >
              <Download className="w-3.5 h-3.5 text-burnt" />
              <span className="hidden md:inline">Report</span>
            </button>
          )}

          {/* Print Certificate */}
          {document && (
            <button
              onClick={() => printAuditCertificate(document)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-sand-300/80 bg-white hover:bg-sand-100 text-sand-800 transition-all shadow-2xs"
              title="Print Legal Audit Certificate (PDF)"
            >
              <Printer className="w-3.5 h-3.5 text-ink-muted" />
              <span className="hidden lg:inline">Certificate</span>
            </button>
          )}

          {/* Forge 4 Dossiers */}
          {onOpenForge && document && (
            <button
              onClick={onOpenForge}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-burnt text-white hover:bg-burnt-hover transition-all shadow-2xs"
              title="Open Autonomous Document Forge (4 Legal Documents)"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Forge Dossier</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl border border-sand-300/80 bg-white hover:bg-sand-100 text-ink-muted transition-colors shadow-2xs"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Cloud Grounding Status Bar */}
      <div className="px-3.5 py-1.5 my-2 bg-white/70 backdrop-blur-sm border border-sky-100/80 rounded-xl text-xs text-sky-950 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 font-semibold text-sky-900">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <span>Strict Clause-Grounded AI</span>
          </span>
          {onOpenForge && (
            <button
              onClick={onOpenForge}
              className="inline-flex items-center space-x-1 text-[11px] font-bold text-burnt bg-burnt-light/80 hover:bg-burnt-light px-2 py-0.5 rounded border border-burnt/30 transition-colors shadow-2xs"
            >
              <FileCheck className="w-3 h-3 text-burnt" />
              <span>⚡ Live Memory Active</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-3 text-xs text-ink-muted">
          {document && (
            <button
              onClick={() => exportChatTranscript(document.docId || 'document', messages)}
              className="text-sky-800 hover:text-sky-950 font-semibold flex items-center space-x-1 transition-colors px-1.5 py-0.5 rounded hover:bg-sky-100/50"
              title="Export conversation history (.txt)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export Chat</span>
            </button>
          )}
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {messages.length} msgs
          </span>
        </div>
      </div>

      {/* Cloud Processing Banner (When uploading document) */}
      {isProcessing && (
        <div className="my-2 p-3 bg-white/90 border border-sky-200 rounded-2xl flex items-center space-x-3 shadow-xs flex-shrink-0">
          <Loader2 className="w-5 h-5 text-sky-500 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-bold text-sand-900">Ingesting Document into AWS Bedrock Cloud...</div>
            <div className="text-[11px] text-sky-700 font-medium">{processingStatusText || 'Stage 1/6: S3 storage & Claude clause extraction'}</div>
          </div>
        </div>
      )}

      {/* 3. Extended Length Cloud Messages Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 py-3 space-y-3">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Cloud className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-burnt to-burnt-hover text-white rounded-tr-xs shadow-xs'
                    : 'cloud-bubble-bot text-sand-900 rounded-tl-xs space-y-1.5'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>
                <div
                  className={`flex items-center justify-between pt-1 text-[11px] ${
                    isUser ? 'text-burnt-light/80' : 'text-ink-muted'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {!isUser && (
                    <div className="flex items-center space-x-1.5 ml-3">
                      <VoiceAssistant
                        textToSpeak={m.text}
                        language={isHindi ? 'hindi' : 'english'}
                      />
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="hover:text-sand-900 p-1 rounded hover:bg-sand-200/50 transition-colors"
                        title="Copy message text"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-sand-200 text-sand-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-sky-800 p-2.5 bg-white/90 border border-sky-200 rounded-2xl w-fit shadow-2xs">
            <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
            <span>Formulating verified point-wise answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Floating Cloud Input Bar with Direct Document Attachment */}
      <div className="pt-2 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-white/95 backdrop-blur-md border border-sky-200/90 rounded-2xl p-2 shadow-sm flex items-center space-x-2"
        >
          {/* Direct File Attachment Button */}
          {onUploadStart && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
              title="Upload new document directly into this chat"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={
              document
                ? `Ask any question about penalties, lock-in terms, deadlines, or fees in ${document.fileName || document.docType}...`
                : 'Drop or upload a document to begin chatting...'
            }
            className="flex-1 text-xs sm:text-sm bg-transparent border-0 focus:outline-none focus:ring-0 px-2 text-sand-900 placeholder:text-ink-muted/70"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading || isProcessing}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
              !inputQuestion.trim() || isLoading || isProcessing
                ? 'bg-sand-300 cursor-not-allowed'
                : 'bg-burnt hover:bg-burnt-hover'
            }`}
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
