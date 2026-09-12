import React from 'react';
import {
  FileText,
  Upload,
  Layers,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { HistoryItem } from '../types';

export type ActiveView = 'upload' | 'key-points' | 'chat' | 'history';

interface SidebarProps {
  currentView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  activeDocId: string | null;
  history: HistoryItem[];
  onSelectDocument: (id: string) => void;
  onNewUpload: () => void;
  onDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
  onOpenArchitecture: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  history,
  onNewUpload,
  onOpenArchitecture,
}) => {
  return (
    <aside className="w-64 bg-sand-100/90 backdrop-blur-md border-r border-sand-300/80 flex flex-col h-screen fixed left-0 top-0 select-none z-20 transition-all">
      {/* Sleek Aesthetic Brand Header */}
      <div className="p-5 border-b border-sand-200/80">
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-burnt to-burnt-dark flex items-center justify-center text-white shadow-xs">
            <FileText className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm sm:text-[15px] font-bold text-sand-900 tracking-tight">DocExplainer</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-burnt-light text-burnt tracking-wide">
                AI
              </span>
            </div>
            <span className="text-xs text-ink-muted font-medium block">
              AWS Document Agent
            </span>
          </div>
        </div>
      </div>

      {/* Primary Upload Action */}
      <div className="p-3.5 border-b border-sand-200/80">
        <button
          onClick={onNewUpload}
          className={`w-full flex items-center justify-center space-x-2 px-3.5 py-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-xs ${
            currentView === 'upload'
              ? 'bg-burnt text-white ring-2 ring-burnt/30'
              : 'bg-burnt hover:bg-burnt-hover text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Core Feature Navigation */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80 px-2.5 py-1">
          Navigation
        </div>

        {/* 1. Key Points & Summary */}
        <button
          onClick={() => onChangeView('key-points')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
            currentView === 'key-points'
              ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
              : 'text-sand-900 hover:bg-white/60 hover:text-sand-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Sparkles className={`w-4 h-4 ${currentView === 'key-points' ? 'text-burnt' : 'text-sand-800'}`} />
            <span>Key Points & Summary</span>
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
              currentView === 'key-points' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
            }`}
          >
            Points
          </span>
        </button>

        {/* 2. Ask AI Assistant */}
        <button
          onClick={() => onChangeView('chat')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
            currentView === 'chat'
              ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
              : 'text-sand-900 hover:bg-white/60 hover:text-sand-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <MessageSquare className={`w-4 h-4 ${currentView === 'chat' ? 'text-burnt' : 'text-sand-800'}`} />
            <span>AI Assistant Q&A</span>
          </div>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
              currentView === 'chat' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
            }`}
          >
            Chat
          </span>
        </button>

        {/* 3. Chat & Document History Screen */}
        <button
          onClick={() => onChangeView('history')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all ${
            currentView === 'history'
              ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
              : 'text-sand-900 hover:bg-white/60 hover:text-sand-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Clock className={`w-4 h-4 ${currentView === 'history' ? 'text-burnt' : 'text-sand-800'}`} />
            <span>Chat History</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-sand-200 text-sand-800">
            {history.length}
          </span>
        </button>

        {/* Info card on where documents live */}
        <div className="pt-4 px-1">
          <div className="bg-sand-200/60 border border-sand-300/60 rounded-xl p-3 text-xs text-ink-muted space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-sand-900 text-xs sm:text-[13px]">
              <Sparkles className="w-3.5 h-3.5 text-burnt" />
              <span>Document Archives</span>
            </div>
            <p className="leading-snug">
              All documents, summaries, and saved Q&A chats are archived in <strong>Chat History</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions & Architecture */}
      <div className="p-3.5 border-t border-sand-200/80 space-y-2.5 bg-sand-100">
        <button
          onClick={onOpenArchitecture}
          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-sand-300/70 bg-white hover:border-burnt/50 text-xs text-sand-900 font-semibold transition-all shadow-2xs"
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-burnt" />
            <span>Step Functions Flow</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
        </button>

        <div className="flex items-center justify-between text-xs text-ink-muted px-1">
          <span>AWS Serverless</span>
          <span className="flex items-center text-emerald-700 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Live Bedrock
          </span>
        </div>
      </div>
    </aside>
  );
};
