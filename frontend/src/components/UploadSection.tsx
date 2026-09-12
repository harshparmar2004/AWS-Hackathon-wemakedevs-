import React, { useState, useRef } from 'react';
import {
  FileUp,
  Languages,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  Cloud,
  Cpu,
  FileText,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../services/api';

interface UploadSectionProps {
  onUploadStart: (
    fileBase64: string,
    fileName: string,
    fileType: 'pdf' | 'image',
    language: string
  ) => void;
  onSelectSample?: (sampleId: string) => void;
  isProcessing: boolean;
  processingStatusText?: string;
}

const INDIAN_LANGUAGES = [
  { id: 'english', name: 'English (Default)', script: 'English' },
  { id: 'hindi', name: 'Hindi (हिंदी)', script: 'हिंदी' },
  { id: 'tamil', name: 'Tamil (தமிழ்)', script: 'தமிழ்' },
  { id: 'telugu', name: 'Telugu (తెలుగు)', script: 'తెలుగు' },
  { id: 'marathi', name: 'Marathi (मराठी)', script: 'मराठी' },
  { id: 'gujarati', name: 'Gujarati (ગુજરાતી)', script: 'ગુજરાતી' },
  { id: 'bengali', name: 'Bengali (বাংলা)', script: 'বাংলা' },
  { id: 'kannada', name: 'Kannada (ಕನ್ನಡ)', script: 'ಕನ್ನಡ' },
  { id: 'malayalam', name: 'Malayalam (മലയാളം)', script: 'മലയാളം' },
  { id: 'punjabi', name: 'Punjabi (ਪੰਜਾਬੀ)', script: 'ਪੰਜਾਬੀ' },
  { id: 'odia', name: 'Odia (ଓଡ଼ିଆ)', script: 'ଓଡ଼ିଆ' },
];

export const UploadSection: React.FC<UploadSectionProps> = ({
  onUploadStart,
  onSelectSample,
  isProcessing,
  processingStatusText,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Please upload a valid image (PNG, JPG, WEBP) or PDF document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size must be under 10MB.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const fileType = selectedFile.type === 'application/pdf' ? 'pdf' : 'image';
      onUploadStart(base64, selectedFile.name, fileType, selectedLanguage);
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto py-4 sm:py-6 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-2.5 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-burnt-light text-burnt border border-burnt/20">
          <Sparkles className="w-4 h-4 text-burnt" />
          <span>AI Document Explainer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-sand-900 leading-tight">
          Upload Any Document to Explain
        </h1>
        <p className="text-sm sm:text-[15px] text-ink-muted leading-relaxed font-normal">
          Upload rental agreements, electricity bills, or loan documents. Get plain-language points, penalty warnings, and ask instant questions in your preferred language.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white border border-sand-300/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        {/* Live AWS Serverless MVP Pipeline Flow */}
        <div className="bg-sand-50 border border-sand-200/90 rounded-xl p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-sand-900">
                AWS Production Pipeline
              </span>
            </div>
            <span className="text-[11px] font-bold text-burnt bg-burnt-light px-2.5 py-0.5 rounded-full border border-burnt/20">
              Live Claude 3.5 Sonnet
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-sand-200 text-sand-800 shadow-2xs">
              <Cloud className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px] text-sand-900 leading-tight">1. Ingestion</p>
                <p className="text-[10px] text-ink-muted leading-tight truncate">Amazon S3 (AES-256)</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-sand-200 text-sand-800 shadow-2xs">
              <Cpu className="w-4 h-4 text-burnt flex-shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px] text-sand-900 leading-tight">2. Clause Extraction</p>
                <p className="text-[10px] text-ink-muted leading-tight truncate">Bedrock Claude Sonnet</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-sand-200 text-sand-800 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="truncate">
                <p className="font-bold text-[11px] text-sand-900 leading-tight">3. Point-wise Q&A</p>
                <p className="text-[10px] text-ink-muted leading-tight truncate">10 Indian Languages</p>
              </div>
            </div>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-7 sm:p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-burnt bg-burnt-light/50 ring-4 ring-burnt/20 scale-[1.005]'
              : 'border-sand-300 hover:border-burnt/80 bg-gradient-to-b from-sand-50/70 to-sand-100/40 hover:bg-burnt-light/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-burnt-light border border-burnt/20 flex items-center justify-center text-burnt shadow-xs">
              <FileUp className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="text-base sm:text-lg font-bold text-sand-900">
                Drop your document here, or click to browse
              </p>
              <p className="text-xs sm:text-sm text-ink-muted">
                Supports PDF contracts, utility bills, or smartphone camera photos (PNG, JPG, WEBP up to 10MB)
              </p>
            </div>

            {/* Document Type suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-sand-700 bg-sand-200/80 px-2.5 py-1 rounded-md">
                📄 Rental Agreements
              </span>
              <span className="text-[11px] font-semibold text-sand-700 bg-sand-200/80 px-2.5 py-1 rounded-md">
                ⚡ Electricity & Utility Bills
              </span>
              <span className="text-[11px] font-semibold text-sand-700 bg-sand-200/80 px-2.5 py-1 rounded-md">
                🏦 Loan Sanctions
              </span>
              <span className="text-[11px] font-semibold text-sand-700 bg-sand-200/80 px-2.5 py-1 rounded-md">
                📑 Insurance Policies
              </span>
            </div>
          </div>
        </div>

        {/* Selected File Card */}
        {selectedFile && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-sand-50 to-emerald-50/50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center space-x-3.5">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-14 h-14 object-cover rounded-xl border border-emerald-300 shadow-2xs flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
              )}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sand-900 text-sm sm:text-base truncate">
                    {selectedFile.name}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-200/70 text-emerald-900 uppercase">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Document verified & ready for AWS Bedrock AI Extraction</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:self-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold text-sand-800 bg-white border border-sand-300 hover:border-sand-400 rounded-lg transition-colors cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center space-x-2.5 text-xs sm:text-sm text-red-700 bg-red-50 p-3.5 rounded-xl border border-red-200">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Clean Language Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-4 border-t border-sand-200">
          <div className="flex items-center space-x-2.5">
            <Languages className="w-4.5 h-4.5 text-burnt flex-shrink-0" />
            <div>
              <label className="text-xs sm:text-sm font-bold text-sand-900 block">
                Explanation & Q&A Language:
              </label>
              <p className="text-[11px] text-ink-muted">
                Claude 3.5 Sonnet will explain all clauses and respond in this language
              </p>
            </div>
          </div>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-sand-50 border-2 border-sand-300 rounded-xl px-3.5 py-2 text-sand-900 focus:outline-none focus:border-burnt cursor-pointer"
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button & Thicker Trust Badge */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-sand-200">
          {/* Thicker Security Trust Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 font-bold text-xs sm:text-sm shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div className="leading-tight">
              <span className="font-extrabold tracking-tight block">
                Encrypted Amazon S3 Storage with Auto-Deletion
              </span>
            </div>
          </div>

          {/* Enhanced "Explain Document with AI" Action Button */}
          {selectedFile ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-gradient-to-r from-burnt via-[#c2410c] to-burnt-hover text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer ring-2 ring-burnt/30 ring-offset-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{processingStatusText || 'Analyzing with AWS AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                  <span>Explain Document with AI</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-burnt/10 hover:bg-burnt/15 text-burnt border-2 border-dashed border-burnt/40 hover:border-burnt transition-all cursor-pointer shadow-2xs"
            >
              <FileUp className="w-5 h-5 text-burnt" />
              <span>Choose Document to Explain</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick-Test with Ready Sample Documents Section */}
      {onSelectSample && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand-900">
              Or Try a Sample Document (1-Click)
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-sand-200 text-sand-800 rounded-md">
              Instant Demo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <div
                key={sample.id}
                className="bg-white border border-sand-300/80 hover:border-burnt rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between space-y-3.5 transition-all group cursor-pointer shadow-xs"
                onClick={() => onSelectSample(sample.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-sand-100 text-sand-700 border border-sand-200">
                      {sample.badge}
                    </span>
                    <span className="text-xs font-semibold text-burnt">
                      {sample.data.riskFlags?.length || 0} Key Points
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-sand-900 group-hover:text-burnt transition-colors leading-snug">
                    {sample.name}
                  </h3>
                  <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                    {sample.data.explanation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSample(sample.id);
                  }}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sand-100 hover:bg-burnt hover:text-white text-sand-900 border border-sand-200 hover:border-burnt transition-all"
                >
                  <span>Open Sample & Ask AI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
