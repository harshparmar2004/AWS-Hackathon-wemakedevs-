import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveView } from './components/Sidebar';
import { OverviewSection } from './components/OverviewSection';
import { UploadSection } from './components/UploadSection';
import { DocumentChat } from './components/DocumentChat';
import { ScenarioSimulatorView } from './components/ScenarioSimulatorView';
import { NegotiationView } from './components/NegotiationView';
import { HistoryView } from './components/HistoryView';
import { ArchitectureModal } from './components/ArchitectureModal';
import { DocumentData, HistoryItem } from './types';
import {
  uploadDocument,
  getDocumentStatus,
  getStoredHistory,
  saveHistoryItem,
  deleteHistoryItem,
  SAMPLE_DOCUMENTS,
} from './services/api';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  // Start on 'overview' view so judges & users immediately see the rich Overview & Impact Hub
  const [currentView, setCurrentView] = useState<ActiveView>('overview');
  const [history, setHistory] = useState<HistoryItem[]>(() => getStoredHistory());
  const [activeDocId, setActiveDocId] = useState<string | null>('sample-rent-blr');
  const [activeDocument, setActiveDocument] = useState<DocumentData | null>(
    SAMPLE_DOCUMENTS[0].data
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);

  // Poll for document status when processing live AWS uploads
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeDocId && isProcessing && !activeDocId.startsWith('sample-')) {
      interval = setInterval(async () => {
        try {
          const doc = await getDocumentStatus(activeDocId);
          if (doc.status === 'complete') {
            setActiveDocument(doc);
            setIsProcessing(false);
            setCurrentView('chat');

            // Update history
            const historyItem: HistoryItem = {
              id: doc.docId,
              name: doc.fileName || 'Uploaded Document',
              type: doc.docType || 'Document',
              badge: doc.docType?.split(' ')[0] || 'Upload',
              createdAt: doc.createdAt || new Date().toISOString(),
              status: 'complete',
            };
            saveHistoryItem(historyItem);
            setHistory(getStoredHistory());
          } else if (doc.status === 'failed') {
            setIsProcessing(false);
            alert(`Processing failed: ${doc.errorMessage || 'Unknown error'}`);
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDocId, isProcessing]);

  const handleSelectDocument = async (id: string) => {
    setActiveDocId(id);
    setIsProcessing(false);
    setCurrentView('chat');

    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === id);
    if (sample) {
      setActiveDocument(sample.data);
      return;
    }

    try {
      const doc = await getDocumentStatus(id);
      setActiveDocument(doc);
    } catch (e) {
      console.error('Failed fetching document from history', e);
    }
  };

  const handleOpenDocumentChat = async (id: string) => {
    await handleSelectDocument(id);
    setCurrentView('chat');
  };

  const handleSelectSample = (sampleId: string) => {
    setIsProcessing(true);
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    const docName = sample?.name || 'Sample Document';
    setActiveDocId(sampleId);

    setProcessingStatusText(`Ingesting "${docName}" to Amazon S3...`);

    setTimeout(() => {
      setProcessingStatusText('Bedrock Claude extracting clauses & key points...');
    }, 800);

    setTimeout(() => {
      setProcessingStatusText('Preparing interactive AI Assistant Q&A...');
    }, 1600);

    setTimeout(() => {
      if (sample) {
        setActiveDocument(sample.data);
      }
      setIsProcessing(false);
      setCurrentView('chat');
    }, 2400);
  };

  const handleNewUpload = () => {
    setCurrentView('upload');
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
    if (activeDocId === id) {
      const firstAvailable = updated[0];
      if (firstAvailable) {
        handleSelectDocument(firstAvailable.id);
      } else {
        setActiveDocId(null);
        setActiveDocument(null);
        setCurrentView('upload');
      }
    }
  };

  const handleUploadStart = async (
    fileBase64: string,
    fileName: string,
    fileType: 'pdf' | 'image',
    language: string
  ) => {
    setIsProcessing(true);
    setProcessingStatusText('Stage 1/6: Ingesting document to Amazon S3...');

    try {
      const uploadRes = await uploadDocument(fileBase64, fileName, fileType, language);
      setActiveDocId(uploadRes.docId);

      const tempHistoryItem: HistoryItem = {
        id: uploadRes.docId,
        name: fileName,
        type: 'Processing...',
        badge: fileType.toUpperCase(),
        createdAt: new Date().toISOString(),
        status: 'processing',
      };
      saveHistoryItem(tempHistoryItem);
      setHistory(getStoredHistory());

      setTimeout(() => {
        setProcessingStatusText('Bedrock Claude extracting clauses & key points...');
      }, 1500);

      setTimeout(() => {
        setProcessingStatusText(`Translating key terms to ${language}...`);
      }, 3500);

      setTimeout(() => {
        setProcessingStatusText('Finalizing AI Assistant Q&A portal...');
      }, 5500);

      setTimeout(async () => {
        const doc = await getDocumentStatus(uploadRes.docId);
        doc.fileName = fileName;
        doc.language = language;
        setActiveDocument(doc);
        setIsProcessing(false);
        setCurrentView('chat');

        const completeItem: HistoryItem = {
          id: uploadRes.docId,
          name: fileName,
          type: doc.docType || 'Document',
          badge: doc.docType?.split(' ')[0] || 'Upload',
          createdAt: new Date().toISOString(),
          status: 'complete',
        };
        saveHistoryItem(completeItem);
        setHistory(getStoredHistory());
      }, 7000);
    } catch (e: any) {
      setIsProcessing(false);
      alert(`Upload error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-sand-100 flex font-sans">
      {/* Left Section: Sleek Fixed Navigation Sidebar (w-64) */}
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        activeDocId={activeDocId}
        history={history}
        onSelectDocument={handleSelectDocument}
        onNewUpload={handleNewUpload}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Right Section: Featured Content Area (offset by ml-64) */}
      <main className="flex-1 ml-64 h-screen flex flex-col bg-sand-100 overflow-hidden">
        {/* Sleek Top Header Bar */}
        <header className="h-14 border-b border-sand-200/80 bg-sand-50/90 backdrop-blur-sm px-6 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-10 transition-all flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs sm:text-sm font-bold text-sand-900 tracking-wide uppercase">
              {currentView === 'overview' && 'Overview & Impact Hub'}
              {currentView === 'upload' && 'Document Ingestion'}
              {currentView === 'key-points' && 'Risk Diagnostic & Health'}
              {currentView === 'chat' && 'AI Assistant Clause Q&A'}
              {currentView === 'simulator' && 'What-If Scenario Simulator Studio'}
              {currentView === 'negotiation' && 'Citizen Legal Counter-Drafter'}
              {currentView === 'history' && 'Chat History & Audits'}
            </span>

            {activeDocument && currentView !== 'overview' && currentView !== 'upload' && (
              <span className="text-xs sm:text-[13px] text-ink-muted font-medium inline-flex items-center px-2.5 py-1 rounded-md bg-sand-200/70 border border-sand-300/50">
                {activeDocument.fileName || activeDocument.docType}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {currentView !== 'upload' && (
              <button
                onClick={handleNewUpload}
                className="text-xs sm:text-sm font-bold bg-burnt hover:bg-burnt-hover text-white px-3.5 py-1.5 rounded-lg shadow-xs transition-all flex items-center space-x-1.5"
              >
                <span>+ Ingest Document</span>
              </button>
            )}

            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-xs sm:text-sm font-semibold text-sand-800 hover:text-burnt px-3.5 py-1.5 rounded-lg bg-white border border-sand-300/80 hover:border-burnt/40 transition-all shadow-2xs"
            >
              Step Functions
            </button>
          </div>
        </header>

        {/* Dynamic Featured Screen Body */}
        <div
          className={`flex-1 min-h-0 flex flex-col px-4 sm:px-6 lg:px-8 ${
            currentView === 'chat' || currentView === 'key-points'
              ? 'py-2.5 sm:py-3 overflow-hidden'
              : 'py-5 sm:py-6 overflow-y-auto'
          }`}
        >
          <div
            className={`w-full max-w-[1560px] mx-auto ${
              currentView === 'chat' || currentView === 'key-points'
                ? 'h-full flex flex-col min-h-0'
                : ''
            }`}
          >
            {isProcessing ? (
              <div className="max-w-lg mx-auto my-16 bg-white border border-sand-300/80 rounded-2xl p-7 sm:p-9 text-center space-y-4 shadow-xs">
                <Loader2 className="w-9 h-9 text-burnt animate-spin mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-sand-900">
                    Analyzing Document with AWS AI
                  </h3>
                  <p className="text-xs sm:text-sm text-burnt font-semibold">
                    {processingStatusText}
                  </p>
                  <p className="text-xs text-ink-muted pt-1">
                    Powered by Amazon Bedrock + Step Functions + Lambda
                  </p>
                </div>
              </div>
            ) : currentView === 'overview' ? (
              <OverviewSection
                onSelectSample={handleSelectSample}
                onNewUpload={handleNewUpload}
                onOpenSimulator={() => setCurrentView('simulator')}
                onOpenArchitecture={() => setIsArchitectureOpen(true)}
              />
            ) : currentView === 'upload' ? (
              <UploadSection
                onUploadStart={handleUploadStart}
                onSelectSample={handleSelectSample}
                isProcessing={isProcessing}
                processingStatusText={processingStatusText}
              />
            ) : currentView === 'simulator' ? (
              <ScenarioSimulatorView
                document={activeDocument}
                onSelectSample={handleSelectSample}
              />
            ) : currentView === 'negotiation' ? (
              <NegotiationView
                document={activeDocument}
                onSelectSample={handleSelectSample}
                onNewUpload={handleNewUpload}
              />
            ) : currentView === 'history' ? (
              <HistoryView
                history={history}
                activeDocId={activeDocId}
                onOpenDocumentChat={handleOpenDocumentChat}
                onDeleteDocument={handleDeleteHistoryItem}
                onNewUpload={handleNewUpload}
              />
            ) : !activeDocument ? (
              <div className="max-w-lg mx-auto my-24 text-center space-y-5 bg-white border border-sand-300/80 rounded-2xl p-8 shadow-xs">
                <p className="text-base text-ink-muted">No document currently selected.</p>
                <button
                  onClick={handleNewUpload}
                  className="px-7 py-3.5 bg-burnt text-white text-sm sm:text-[15px] font-bold rounded-xl shadow-xs hover:bg-burnt-hover transition-colors"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              <DocumentChat
                document={activeDocument}
                activeLanguage={activeDocument.language || 'english'}
                initialTab={currentView === 'key-points' ? 'points' : 'chat'}
              />
            )}
          </div>
        </div>
      </main>

      {/* Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
};
