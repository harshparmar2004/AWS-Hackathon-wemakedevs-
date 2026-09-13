import React from 'react';
import {
  Upload,
  Layers,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sliders,
  Scale,
  Compass,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { HistoryItem } from '../types';

export type ActiveView = 'overview' | 'upload' | 'forge' | 'key-points' | 'chat' | 'simulator' | 'negotiation' | 'history';

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
    <aside className="w-64 bg-sand-100/95 backdrop-blur-md border-r border-sand-300/80 flex flex-col h-screen fixed left-0 top-0 select-none z-20 transition-all">
      {/* Sleek Aesthetic Brand Header */}
      <div
        onClick={() => onChangeView('overview')}
        className="p-4 sm:p-5 border-b border-sand-200/80 cursor-pointer hover:bg-sand-200/40 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-burnt to-burnt-dark flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm sm:text-[15px] font-extrabold text-sand-900 tracking-tight">DocExplainer</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-burnt-light text-burnt tracking-wide uppercase">
                AI
              </span>
            </div>
            <span className="text-[11px] text-ink-muted font-medium block">
              Citizen Contract Shield
            </span>
          </div>
        </div>
      </div>

      {/* Primary Ingestion Action */}
      <div className="p-3 border-b border-sand-200/80">
        <button
          onClick={onNewUpload}
          className={`w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-xs ${
            currentView === 'upload'
              ? 'bg-burnt text-white ring-2 ring-burnt/30'
              : 'bg-burnt hover:bg-burnt-hover text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>+ Ingest Document</span>
        </button>
      </div>

      {/* Core Categorized Navigation */}
      <div className="p-3 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* SECTION 1: DISCOVER */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2 py-0.5">
            Discover
          </div>

          {/* 1. Overview & Impact Hub */}
          <button
            onClick={() => onChangeView('overview')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'overview'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Compass className={`w-4 h-4 ${currentView === 'overview' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Overview & Hub</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'overview' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
              }`}
            >
              Showcase
            </span>
          </button>

          {/* 2. Document Ingestion */}
          <button
            onClick={() => onChangeView('upload')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'upload'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Upload className={`w-4 h-4 ${currentView === 'upload' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Document Upload</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'upload' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
              }`}
            >
              Upload
            </span>
          </button>
        </div>

        {/* SECTION 2: DOCUMENT INTELLIGENCE */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2 py-0.5">
            Analysis (Active Doc)
          </div>

          {/* 3. Risk & Key Points */}
          <button
            onClick={() => onChangeView('key-points')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'key-points'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className={`w-4 h-4 ${currentView === 'key-points' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Risk & Key Points</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'key-points' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
              }`}
            >
              Health
            </span>
          </button>

          {/* 4. AI Clause Q&A */}
          <button
            onClick={() => onChangeView('chat')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'chat'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <MessageSquare className={`w-4 h-4 ${currentView === 'chat' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Clause Q&A Chat</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'chat' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
              }`}
            >
              Grounded
            </span>
          </button>

          {/* 5. What-If Simulator Studio */}
          <button
            onClick={() => onChangeView('simulator')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'simulator'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Sliders className={`w-4 h-4 ${currentView === 'simulator' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>What-If Simulator</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'simulator' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
              }`}
            >
              Sliders
            </span>
          </button>
        </div>

        {/* SECTION 3: CITIZEN ADVOCACY */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2 py-0.5">
            Citizen Action
          </div>

          {/* 6. Legal Counter-Drafter Hub */}
          <button
            onClick={() => onChangeView('negotiation')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'negotiation'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Scale className={`w-4 h-4 ${currentView === 'negotiation' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Legal Dispute Drafter</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'negotiation' ? 'bg-burnt-light text-burnt' : 'bg-sand-200 text-sand-800'
              }`}
            >
              Drafter
            </span>
          </button>

          {/* 6b. Autonomous Document Forge & Action Dossier */}
          <button
            onClick={() => onChangeView('forge')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'forge'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <FileCheck className={`w-4 h-4 ${currentView === 'forge' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Document Forge</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                currentView === 'forge' ? 'bg-burnt text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              4 Dossiers
            </span>
          </button>

          {/* 7. Chat & Document History Screen */}
          <button
            onClick={() => onChangeView('history')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
              currentView === 'history'
                ? 'bg-white border border-sand-300/80 text-burnt font-bold shadow-xs'
                : 'text-sand-900 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Clock className={`w-4 h-4 ${currentView === 'history' ? 'text-burnt' : 'text-sand-800'}`} />
              <span>Chat History & Audits</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sand-200 text-sand-800">
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Actions & Architecture */}
      <div className="p-3 border-t border-sand-200/80 space-y-2 bg-sand-100">
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

        <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
          <span>AWS Cloud (us-east-1)</span>
          <span className="flex items-center text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Live Bedrock
          </span>
        </div>
      </div>
    </aside>
  );
};
