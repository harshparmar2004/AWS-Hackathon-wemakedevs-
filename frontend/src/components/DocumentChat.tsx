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
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { DocumentData, ChatMessage } from '../types';
import { askDocumentQuestion, getStoredDocumentChat, saveDocumentChat } from '../services/api';

interface DocumentChatProps {
  document: DocumentData;
  activeLanguage: string;
  initialTab?: 'points' | 'chat';
}

const DEFAULT_SUGGESTIONS = [
  'What happens if I delay payment by 15 days?',
  'What is the notice period and lock-in clause?',
  'What non-refundable deductions are taken from my deposit?',
  'Can the owner or company increase rates without notice?',
  'What are the termination conditions?',
];

function getDefaultMessagesForDoc(doc: DocumentData): ChatMessage[] {
  const isRental = doc.docId?.includes('rent');
  const isPower = doc.docId?.includes('power') || doc.docId?.includes('bescom');
  const isLoan = doc.docId?.includes('loan') || doc.docId?.includes('hdfc');

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
  initialTab = 'points',
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
  const [showKeyPoints, setShowKeyPoints] = useState<boolean>(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'points' | 'chat'>(initialTab);
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

  // Sync mobile tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveMobileTab(initialTab);
      if (initialTab === 'points') {
        setShowKeyPoints(true);
      }
    }
  }, [initialTab]);

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
  const explanationText =
    isHindi && document.translatedExplanation
      ? document.translatedExplanation
      : document.explanation;

  const currentRiskFlags =
    isHindi && document.translatedRiskFlags && document.translatedRiskFlags.length > 0
      ? document.translatedRiskFlags
      : document.riskFlags || [];

  return (
    <div className="w-full max-w-[1560px] mx-auto h-full flex flex-col space-y-2.5 min-h-0">
      {/* Top Banner with Document Info & Controls (Compact & Shifted Upward) */}
      <div className="bg-white border border-sand-300/80 rounded-xl px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-burnt text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold text-sand-900 leading-tight">
                {document.fileName || document.docType}
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-sand-200 text-sand-800 uppercase tracking-wide">
                {document.docType?.split(' ')[0] || 'Doc'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5">
              AI Document Assistant · Key Points & Point-Wise Q&A
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Mobile Screen Tab Toggle */}
          <div className="flex lg:hidden items-center p-0.5 bg-sand-100 rounded-lg border border-sand-200">
            <button
              onClick={() => setActiveMobileTab('points')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeMobileTab === 'points'
                  ? 'bg-white text-burnt shadow-2xs font-bold'
                  : 'text-ink-muted hover:text-sand-900'
              }`}
            >
              Key Points
            </button>
            <button
              onClick={() => setActiveMobileTab('chat')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeMobileTab === 'chat'
                  ? 'bg-white text-burnt shadow-2xs font-bold'
                  : 'text-ink-muted hover:text-sand-900'
              }`}
            >
              Chat ({messages.length})
            </button>
          </div>

          {/* Desktop Toggle Key Points Section */}
          <button
            onClick={() => setShowKeyPoints(!showKeyPoints)}
            className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-sand-200 bg-sand-50 hover:bg-sand-100 text-sand-800 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-burnt" />
            <span>{showKeyPoints ? 'Hide Key Points' : 'Show Key Points'}</span>
            {showKeyPoints ? (
              <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setChatLanguage(isHindi ? 'english' : 'hindi')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-sand-200 bg-sand-50 hover:border-burnt text-sand-900 transition-all shadow-2xs"
          >
            <Languages className="w-3.5 h-3.5 text-burnt" />
            <span>{isHindi ? 'Hindi (हिंदी)' : 'English'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg border border-sand-200 bg-sand-50 hover:bg-sand-100 text-ink-muted text-xs transition-colors shadow-2xs"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Fills remaining height with zero page scrolling) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1 min-h-0">
        {/* LEFT SIDE OF THE FEATURE: Dedicated Key Points & Summary Section */}
        {showKeyPoints && (
          <div
            className={`lg:col-span-5 h-full min-h-0 flex flex-col ${
              activeMobileTab === 'chat' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="bg-white border border-sand-300/80 rounded-xl p-4 sm:p-4.5 space-y-3.5 shadow-xs h-full min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between pb-2.5 border-b border-sand-200 sticky top-0 bg-white z-5">
                <div className="flex items-center space-x-2 text-sand-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-burnt" />
                  <span>Key Points & Summary</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-burnt-light text-burnt">
                  {currentRiskFlags.length} Risk Points
                </span>
              </div>

              {/* Plain Language Summary */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-sand-800">
                  {isHindi ? 'दस्तावेज़ का सरल सारांश:' : 'Plain-Language Summary:'}
                </div>
                <div className="bg-sand-50/80 border border-sand-200/80 rounded-lg p-3 text-xs sm:text-sm text-sand-900 leading-relaxed font-normal">
                  {explanationText || 'Extracting document highlights...'}
                </div>
              </div>

              {/* Key Clauses & Penalty Points */}
              {currentRiskFlags.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-sand-800 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-burnt" />
                    <span>
                      {isHindi ? 'महत्वपूर्ण पेनल्टी व शर्तें:' : 'Important Penalty & Lock-in Clauses:'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentRiskFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="bg-sand-50/90 border border-sand-200/90 rounded-lg p-3 text-xs space-y-1 hover:border-burnt/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-burnt text-xs uppercase tracking-wide">
                            {flag.clause}
                          </span>
                          <span className="font-semibold text-sand-900 text-xs px-2 py-0.5 rounded bg-sand-200/80">
                            {flag.amount}
                          </span>
                        </div>
                        <p className="text-ink-muted text-xs leading-relaxed">
                          {flag.why}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Dates (if available) */}
              {document.keyDates && document.keyDates.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-bold text-sand-800">Important Dates:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {document.keyDates.map((date, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-medium bg-sand-100 text-sand-800 border border-sand-200 px-2.5 py-0.5 rounded-md"
                      >
                        📅 {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 text-xs text-ink-muted border-t border-sand-100 flex items-center space-x-1">
                <span>💡 Ask the AI assistant on the right about any clause.</span>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT SIDE OF THE FEATURE: Interactive Q&A Chat & Chat History */}
        <div
          className={`${
            showKeyPoints ? 'lg:col-span-7' : 'lg:col-span-12'
          } h-full min-h-0 flex flex-col ${activeMobileTab === 'points' ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="bg-white border border-sand-300/80 rounded-xl overflow-hidden flex flex-col h-full min-h-0 shadow-xs">
            {/* Grounding Info Bar */}
            <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 text-xs text-emerald-900 flex items-center justify-between flex-shrink-0">
              <span className="flex items-center space-x-2 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Fact-grounded responses citing clauses from this document</span>
              </span>
              <span className="text-xs text-ink-muted flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {messages.length} messages
              </span>
            </div>

            {/* Quick-Ask Suggestion Chips */}
            <div className="px-3.5 py-1.5 bg-sand-50/70 border-b border-sand-200/80 overflow-x-auto flex items-center space-x-2 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-burnt" />
                Suggested:
              </span>
              {DEFAULT_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  disabled={isLoading}
                  className="text-xs font-medium bg-white hover:bg-burnt-light/50 border border-sand-200 hover:border-burnt text-sand-800 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0 shadow-2xs"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Messages Feed (Chat History for this document) */}
            <div className="flex-1 min-h-0 p-3.5 sm:p-4 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isUser = m.role === 'user';

                return (
                  <div
                    key={m.id}
                    className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-burnt text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-burnt text-white font-normal rounded-tr-xs shadow-xs'
                          : 'bg-sand-50/90 border border-sand-200/80 text-sand-900 rounded-tl-xs space-y-1.5 shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-line font-normal leading-relaxed">
                        {m.text}
                      </div>
                      <div
                        className={`flex items-center justify-between pt-1 text-xs ${
                          isUser ? 'text-burnt-light/80' : 'text-ink-muted'
                        }`}
                      >
                        <span>{m.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="hover:text-sand-900 ml-2 p-1 rounded hover:bg-sand-200/60 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded-lg bg-sand-200 text-sand-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-ink-muted p-2.5 bg-sand-50 border border-sand-200 rounded-xl w-fit shadow-2xs">
                  <Loader2 className="w-4 h-4 text-burnt animate-spin" />
                  <span>Analyzing clauses and formulating point-wise response...</span>
                </div>
              )}

              {/* Anchor to auto-scroll when new messages arrive */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar - ALWAYS PINNED AND VISIBLE IN VIEWPORT */}
            <div className="p-2.5 sm:p-3 bg-sand-50/90 border-t border-sand-200 flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ask a question about penalties, lock-in period, rent increase, or refund rules..."
                  className="flex-1 text-xs sm:text-sm bg-white border border-sand-300 rounded-lg px-3.5 py-2 sm:py-2.5 focus:outline-none focus:border-burnt focus:ring-1 focus:ring-burnt"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isLoading}
                  className={`p-2.5 sm:p-3 rounded-lg text-white transition-all flex items-center justify-center shadow-xs ${
                    !inputQuestion.trim() || isLoading
                      ? 'bg-sand-300 cursor-not-allowed'
                      : 'bg-burnt hover:bg-burnt-hover'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
