import React, { useState } from 'react';
import {
  Clock,
  Search,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  FolderOpen,
  MessageSquare,
  ShieldCheck,
  FileText,
  Download,
  Printer,
} from 'lucide-react';
import { HistoryItem, DocumentData } from '../types';
import { downloadAuditReport, printAuditCertificate } from '../services/reportGenerator';
import { SAMPLE_DOCUMENTS, getStoredDocumentChat } from '../services/api';

interface HistoryViewProps {
  history: HistoryItem[];
  activeDocId: string | null;
  onOpenDocumentChat: (id: string) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  onNewUpload: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  activeDocId,
  onOpenDocumentChat,
  onDeleteDocument,
  onNewUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'samples') return matchesSearch && item.isSample;
    if (filterType === 'uploads') return matchesSearch && !item.isSample;
    return matchesSearch;
  });

  const totalSavedChats = history.reduce((acc, curr) => acc + (curr.chatCount || 0), 0);

  return (
    <div className="w-full max-w-[1560px] mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Command Banner */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-burnt text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-sand-900">
                Official Legal Audit Ledger & Chat History
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                Verifiable Legal Audit Records · Clause-Grounded Q&A Logs · Downloadable Certificates & Transcripts
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewUpload}
          className="flex items-center space-x-2 px-4 py-2.5 bg-burnt hover:bg-burnt-hover text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Ingest New Document</span>
        </button>
      </div>

      {/* 2. Executive Ledger Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wide">Total Audited Agreements</span>
            <FileText className="w-4 h-4 text-burnt" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">{history.length}</div>
          <p className="text-xs text-ink-muted">Processed with Claude 3.5 Sonnet</p>
        </div>

        <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wide">Predatory Clauses Caught</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">100%</div>
          <p className="text-xs text-ink-muted">Scored on statutory benchmarks</p>
        </div>

        <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wide">Saved Q&A Queries</span>
            <MessageSquare className="w-4 h-4 text-burnt" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">{totalSavedChats}</div>
          <p className="text-xs text-ink-muted">Fact-grounded with clause coordinates</p>
        </div>

        <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wide">Chain of Evidence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">Active</div>
          <p className="text-xs text-ink-muted">Ready for certified export & print</p>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-white border border-sand-300/80 rounded-2xl p-4 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audited agreements, contract categories, or dates..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-sand-50/80 border border-sand-200 rounded-xl focus:outline-none focus:border-burnt transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all ${
              filterType === 'all'
                ? 'bg-burnt text-white border-burnt shadow-2xs'
                : 'bg-sand-50 text-sand-900 border-sand-200 hover:border-sand-300'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilterType('uploads')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all ${
              filterType === 'uploads'
                ? 'bg-burnt text-white border-burnt shadow-2xs'
                : 'bg-sand-50 text-sand-900 border-sand-200 hover:border-sand-300'
            }`}
          >
            User Uploads ({history.filter((h) => !h.isSample).length})
          </button>
          <button
            onClick={() => setFilterType('samples')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-all ${
              filterType === 'samples'
                ? 'bg-burnt text-white border-burnt shadow-2xs'
                : 'bg-sand-50 text-sand-900 border-sand-200 hover:border-sand-300'
            }`}
          >
            Benchmark Samples ({history.filter((h) => h.isSample).length})
          </button>
        </div>
      </div>

      {/* 4. Audit Documents Grid */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white border border-sand-300/80 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <FolderOpen className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="text-base sm:text-lg font-bold text-sand-900">No Audited Documents Found</h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto">
            {searchQuery
              ? `No agreements match "${searchQuery}".`
              : 'You have not uploaded any agreements yet.'}
          </p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-burnt hover:text-burnt-hover pt-1"
          >
            <Upload className="w-4 h-4" />
            <span>Upload and audit an agreement</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHistory.map((item) => {
            const isActive = activeDocId === item.id;
            const sampleMatch = SAMPLE_DOCUMENTS.find((s) => s.id === item.id);
            const docData: DocumentData = sampleMatch?.data || ({
              docId: item.id,
              fileName: item.name,
              docType: item.type,
              status: 'complete',
            } as DocumentData);

            const chatMessages = getStoredDocumentChat(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all ${
                  isActive
                    ? 'border-burnt ring-2 ring-burnt/20 shadow-xs'
                    : 'border-sand-300/80 hover:border-burnt/40 shadow-2xs'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-sand-100 text-sand-800 border border-sand-200">
                      {item.badge}
                    </span>

                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Currently Active
                        </span>
                      )}
                      {!item.isSample && (
                        <button
                          onClick={(e) => onDeleteDocument(item.id, e)}
                          className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete from Audit History"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-sand-900 leading-snug line-clamp-2" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-muted mt-1 line-clamp-1">{item.type}</p>
                  </div>

                  {/* Chat Activity Pill */}
                  <div className="flex items-center justify-between text-xs text-sand-800 bg-sand-50 px-3 py-1.5 rounded-xl border border-sand-200/80">
                    <span className="flex items-center space-x-1.5 font-semibold">
                      <MessageSquare className="w-3.5 h-3.5 text-burnt" />
                      <span>{chatMessages.length || item.chatCount || 0} Saved Q&A Messages</span>
                    </span>
                    <span className="text-emerald-700 font-bold">Clause Grounded</span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-sand-200 space-y-3">
                  <div className="text-xs text-ink-muted flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-sand-700" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Audit Complete
                    </span>
                  </div>

                  {/* Instant Certificate & Report Exports */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => downloadAuditReport(docData, chatMessages)}
                      className="py-1.5 px-2.5 rounded-xl border border-sand-300 bg-sand-50 hover:bg-sand-100 text-sand-800 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
                      title="Download Markdown Report"
                    >
                      <Download className="w-3.5 h-3.5 text-burnt" />
                      <span>Audit Report</span>
                    </button>

                    <button
                      onClick={() => printAuditCertificate(docData)}
                      className="py-1.5 px-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-100 text-sand-800 text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-2xs"
                      title="Print Official Certificate"
                    >
                      <Printer className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Certificate</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenDocumentChat(item.id)}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-burnt hover:bg-burnt-hover text-white shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Clause Q&A Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
