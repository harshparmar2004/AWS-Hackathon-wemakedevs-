import React, { useState } from 'react';
import {
  Clock,
  Search,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  FolderOpen,
  MessageSquare
} from 'lucide-react';
import { HistoryItem } from '../types';

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

  return (
    <div className="w-full max-w-[1560px] mx-auto space-y-6 pb-12">
      {/* Sleek Top Banner */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-burnt text-white flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-sand-900">
                Chat & Document History
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted">
                All document audits and saved AI conversations are stored here.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNewUpload}
          className="flex items-center space-x-2 px-4 py-2.5 bg-burnt hover:bg-burnt-hover text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Sleek Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 bg-white border border-sand-300/80 rounded-2xl p-4 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved documents or chats..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-sand-50/80 border border-sand-200 rounded-xl focus:outline-none focus:border-burnt transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 text-xs sm:text-[13px] font-semibold rounded-xl border transition-all ${
              filterType === 'all'
                ? 'bg-burnt text-white border-burnt shadow-2xs'
                : 'bg-sand-50 text-sand-900 border-sand-200 hover:border-sand-300'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilterType('uploads')}
            className={`px-3.5 py-2 text-xs sm:text-[13px] font-semibold rounded-xl border transition-all ${
              filterType === 'uploads'
                ? 'bg-burnt text-white border-burnt shadow-2xs'
                : 'bg-sand-50 text-sand-900 border-sand-200 hover:border-sand-300'
            }`}
          >
            Uploads ({history.filter((h) => !h.isSample).length})
          </button>
          <button
            onClick={() => setFilterType('samples')}
            className={`px-3.5 py-2 text-xs sm:text-[13px] font-semibold rounded-xl border transition-all ${
              filterType === 'samples'
                ? 'bg-burnt text-white border-burnt shadow-2xs'
                : 'bg-sand-50 text-sand-900 border-sand-200 hover:border-sand-300'
            }`}
          >
            Samples ({history.filter((h) => h.isSample).length})
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white border border-sand-300/80 rounded-2xl p-12 text-center space-y-3.5 shadow-xs">
          <FolderOpen className="w-12 h-12 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-sand-900">No Documents Found</h3>
          <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto">
            {searchQuery
              ? `No results matching "${searchQuery}".`
              : 'You have not uploaded any documents yet.'}
          </p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-burnt hover:text-burnt-hover pt-1"
          >
            <Upload className="w-4 h-4" />
            <span>Upload your first document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredHistory.map((item) => {
            const isActive = activeDocId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 transition-all ${
                  isActive
                    ? 'border-burnt ring-1 ring-burnt/30 shadow-xs'
                    : 'border-sand-300/80 hover:border-burnt/50 shadow-2xs'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-sand-100 text-sand-800 border border-sand-200">
                      {item.badge}
                    </span>

                    <div className="flex items-center space-x-2">
                      {isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Active
                        </span>
                      )}
                      {!item.isSample && (
                        <button
                          onClick={(e) => onDeleteDocument(item.id, e)}
                          className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-sand-900 leading-snug line-clamp-1" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">{item.type}</p>
                  </div>

                  {/* Chat Activity Pill */}
                  <div className="inline-flex items-center space-x-2 text-xs font-medium text-sand-800 bg-sand-50 px-3 py-1.5 rounded-lg border border-sand-200/80">
                    <MessageSquare className="w-3.5 h-3.5 text-burnt flex-shrink-0" />
                    <span>
                      {item.chatCount && item.chatCount > 0
                        ? `${item.chatCount} Q&A messages saved`
                        : 'Ready for AI Q&A'}
                    </span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-sand-100 space-y-3">
                  <div className="text-xs text-ink-muted flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-sand-800" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-emerald-700">Audit Complete</span>
                  </div>

                  <button
                    onClick={() => onOpenDocumentChat(item.id)}
                    className="w-full inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-burnt hover:bg-burnt-hover text-white shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Document & AI Chat</span>
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
