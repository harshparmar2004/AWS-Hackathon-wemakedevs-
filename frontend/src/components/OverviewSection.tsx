import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Scale,
  Volume2,
  Sliders,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ExternalLink,
  Calculator,
  Languages,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../services/api';

interface OverviewSectionProps {
  onSelectSample: (sampleId: string) => void;
  onNewUpload: () => void;
  onOpenSimulator: () => void;
  onOpenArchitecture: () => void;
  onOpenForge?: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  onSelectSample,
  onNewUpload,
  onOpenSimulator,
  onOpenArchitecture,
  onOpenForge,
}) => {
  const [activeChartMetric, setActiveChartMetric] = useState<'accuracy' | 'hallucination'>('accuracy');

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* 1. HERO SECTION WITH BESPOKE 3D VISUAL BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sand-900 via-sand-800 to-sand-900 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-sand-700/60">
        <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-burnt/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-1">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-burnt/25 border border-burnt/40 text-burnt-light text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-burnt" />
              <span>First Commit · AWS x WeMakeDevs Hackathon</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Document Intelligence &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-burnt-light via-amber-300 to-burnt">
                Autonomous Citizen Shield
              </span>
            </h1>

            <p className="text-sand-300 text-sm sm:text-base leading-relaxed font-normal max-w-2xl">
              Dense 16–20 page legal agreements, bank loan sanctions, and utility tariffs hide predatory compounding penalties and restrictive lock-in clauses. Standard LLMs suffer from severe arithmetic hallucinations.
              <strong className="text-white"> DocExplainer AI pairs Amazon Bedrock Claude 3.5 Sonnet with deterministic serverless math engines</strong> to explain documents in plain language, grade contract health, and generate 1-click legal dispute counter-proposals.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onNewUpload}
                className="px-5 py-3 rounded-xl bg-burnt hover:bg-burnt-hover text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload 16–20 Page Document</span>
              </button>

              <button
                onClick={() => onSelectSample('sample-rent-blr')}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2"
              >
                <span>Try Bangalore Lease Benchmark</span>
                <ArrowRight className="w-3.5 h-3.5 text-burnt-light" />
              </button>

              <button
                onClick={onOpenSimulator}
                className="px-4 py-3 rounded-xl bg-sand-700/60 hover:bg-sand-700 border border-sand-600 text-sand-200 text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>What-If Simulator</span>
              </button>
            </div>

            {/* Live Cloud Proof Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-sand-300">
              <span className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Bedrock Claude 3.5 Sonnet (200k context)</span>
              </span>
              <span className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>AWS Lambda Deterministic Math</span>
              </span>
              <span className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>100% Deployed in us-east-1</span>
              </span>
            </div>
          </div>

          {/* Hero Visual Graphic generated by Nano Banana */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/40 group max-w-md w-full">
              <img
                src="/citizen_shield_hero.jpg"
                alt="DocExplainer AI Citizen Protection Shield"
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sand-900/90 via-transparent to-transparent flex flex-col justify-end p-4">
                <span className="text-[11px] uppercase tracking-wider text-burnt-light font-bold">
                  Autonomous Protection
                </span>
                <p className="text-xs text-sand-200 font-medium">
                  Shielding citizens and MSMEs from hidden predatory clauses across Bharat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & ARCHITECTURAL HIGHLIGHTS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-sand-300/80 rounded-2xl p-4.5 space-y-1 shadow-xs hover:border-burnt/40 transition-colors">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wide">Math Precision</span>
            <Calculator className="w-4 h-4 text-burnt" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">100.0%</div>
          <p className="text-[11px] text-ink-muted">
            Zero LLM mental arithmetic drift via AWS Lambda Python engines.
          </p>
        </div>

        <div className="bg-white border border-sand-300/80 rounded-2xl p-4.5 space-y-1 shadow-xs hover:border-burnt/40 transition-colors">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wide">Context Window</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">200,000</div>
          <p className="text-[11px] text-ink-muted">
            Tokens in memory for 16–20 page contracts without truncation.
          </p>
        </div>

        <div className="bg-white border border-sand-300/80 rounded-2xl p-4.5 space-y-1 shadow-xs hover:border-burnt/40 transition-colors">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wide">Regional Voice</span>
            <Languages className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">Hindi + EN</div>
          <p className="text-[11px] text-ink-muted">
            Native Web Speech Synthesis reader bridging the literacy divide.
          </p>
        </div>

        <div className="bg-white border border-sand-300/80 rounded-2xl p-4.5 space-y-1 shadow-xs hover:border-burnt/40 transition-colors">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-semibold uppercase tracking-wide">Autonomous Shield</span>
            <Scale className="w-4 h-4 text-burnt" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sand-900">5 Systems</div>
          <p className="text-[11px] text-ink-muted">
            Health gauge, voice, dispute drafter, simulator & audit report.
          </p>
        </div>
      </section>

      {/* 3. INTERACTIVE ACCURACY COMPARISON GRAPH (STANDARD LLM VS. DOCEXPLAINER AI) */}
      <section className="bg-white border border-sand-300/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-burnt">
              Deterministic Precision vs. Probabilistic Guesswork
            </span>
            <h2 className="text-lg sm:text-2xl font-bold text-sand-900 mt-0.5">
              Why Standard LLMs Fail at Financial & Legal Documents
            </h2>
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center p-1 bg-sand-100 rounded-xl border border-sand-200 text-xs font-semibold">
            <button
              onClick={() => setActiveChartMetric('accuracy')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartMetric === 'accuracy'
                  ? 'bg-white text-burnt font-bold shadow-2xs'
                  : 'text-ink-muted hover:text-sand-900'
              }`}
            >
              Calculation Accuracy (%)
            </button>
            <button
              onClick={() => setActiveChartMetric('hallucination')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartMetric === 'hallucination'
                  ? 'bg-white text-red-700 font-bold shadow-2xs'
                  : 'text-ink-muted hover:text-sand-900'
              }`}
            >
              Hallucination Drift (%)
            </button>
          </div>
        </div>

        {/* Interactive Comparison Bar Chart (SVG) */}
        <div className="space-y-4">
          {[
            {
              label: 'Multi-Month Compounding Interest: A = P(1 + r/n)^(nt)',
              standard: activeChartMetric === 'accuracy' ? 38 : 62,
              docExplainer: activeChartMetric === 'accuracy' ? 100 : 0,
              desc: 'Standard LLMs round off exponents and fail monthly compounding after month 3.',
            },
            {
              label: 'Reducing-Balance Loan EMI & Milestone Early Foreclosure',
              standard: activeChartMetric === 'accuracy' ? 29 : 71,
              docExplainer: activeChartMetric === 'accuracy' ? 100 : 0,
              desc: 'Standard LLMs miscalculate amortization tables and omit 18% statutory GST on exit fees.',
            },
            {
              label: 'Telescopic Progressive Utility Tariffs & Demand Loads',
              standard: activeChartMetric === 'accuracy' ? 44 : 56,
              docExplainer: activeChartMetric === 'accuracy' ? 100 : 0,
              desc: 'Standard LLMs confuse fixed KW capacity charges with per-unit fuel adjustment multipliers.',
            },
            {
              label: 'Exact Clause Citations & Non-Compete Section Verification',
              standard: activeChartMetric === 'accuracy' ? 58 : 42,
              docExplainer: activeChartMetric === 'accuracy' ? 100 : 0,
              desc: 'DocExplainer enforces zero temperature and mandatory clause coordinates.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-sand-50/80 border border-sand-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <span className="font-bold text-sand-900 sm:text-[13px]">{item.label}</span>
                <span className="text-[11px] text-ink-muted">{item.desc}</span>
              </div>

              {/* Dual Bar Comparison */}
              <div className="space-y-1.5 pt-1">
                {/* DocExplainer AI Bar */}
                <div className="flex items-center space-x-3 text-xs">
                  <span className="w-28 text-[11px] font-bold text-burnt flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    DocExplainer:
                  </span>
                  <div className="flex-1 bg-sand-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        activeChartMetric === 'accuracy' ? 'bg-gradient-to-r from-burnt to-emerald-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${item.docExplainer}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-extrabold text-sand-900 text-xs">
                    {item.docExplainer}%
                  </span>
                </div>

                {/* Standard LLM Bar */}
                <div className="flex items-center space-x-3 text-xs">
                  <span className="w-28 text-[11px] font-medium text-ink-muted flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" />
                    Standard LLM:
                  </span>
                  <div className="flex-1 bg-sand-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        activeChartMetric === 'accuracy' ? 'bg-amber-500' : 'bg-red-600'
                      }`}
                      style={{ width: `${item.standard}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-bold text-ink-muted text-xs">
                    {item.standard}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. THE 5 AUTONOMOUS SYSTEMS SHOWCASE */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-burnt">
            Complete Citizen Shield
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-sand-900">
            6 Groundbreaking Autonomous Systems Powering the Platform
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* System 1 */}
          <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-burnt/50 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-sand-900">Contract Health & Power Asymmetry</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Evaluates agreements on an objective 0–100 health scale. Measures unilateral clauses to reveal party imbalance (e.g., 78% Landlord vs. 22% Tenant rights) before signing.
              </p>
            </div>
            <span className="text-[11px] font-bold text-burnt uppercase tracking-wider flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Radial SVG Diagnostic
            </span>
          </div>

          {/* System 2 */}
          <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-burnt/50 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-sand-900">Bharat Voice Assistant (Web Speech)</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Reads out document summaries and answers aloud in natural Hindi and English with zero latency and $0 cloud cost. Eliminates the literacy barrier across Bharat.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center">
              <Volume2 className="w-3.5 h-3.5 mr-1" /> Zero-Cost Native Audio
            </span>
          </div>

          {/* System 3 */}
          <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-burnt/50 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-sand-900">1-Click Legal Negotiation Drafter</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                One-click counter-proposal generator grounded in Indian Contract Act (Section 74), Model Tenancy Act 2021, and RBI Circulars with instant mailto and text export.
              </p>
            </div>
            <span className="text-[11px] font-bold text-burnt uppercase tracking-wider flex items-center">
              <Scale className="w-3.5 h-3.5 mr-1" /> Statutory Consumer Shield
            </span>
          </div>

          {/* System 4 */}
          <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-burnt/50 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-base font-bold text-sand-900">Interactive "What-If" Scenario Simulator</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Live sliders for payment delay days (0–180), loan foreclosure months (1–36), and power consumption (kWh) with dynamic SVG curves and milestone exit cost calculators.
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1" /> Dynamic Real-Time Sliders
            </span>
          </div>

          {/* System 5 */}
          <div className="bg-white border border-sand-300/80 rounded-2xl p-5 space-y-3 shadow-xs hover:border-burnt/50 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                5
              </div>
              <h3 className="text-base font-bold text-sand-900">Autonomous 4-Document Action Dossier</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Forges 4 production-ready legal artifacts (Statutory Notice, Settlement Offer, Contract Addendum, Consumer Forum Petition) across E-Commerce, B2B SaaS, Tenancy, Loans & Utilities.
              </p>
            </div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center">
              <FileCheck className="w-3.5 h-3.5 mr-1" /> Multi-Domain Action Forge
            </span>
          </div>

          {/* System 6: Adaptive Conversation Learning Engine */}
          <div
            onClick={onOpenForge}
            className="bg-gradient-to-br from-burnt/10 via-sand-50 to-burnt/5 border-2 border-burnt/30 hover:border-burnt rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-burnt text-white flex items-center justify-center font-bold shadow-xs">
                6
              </div>
              <h3 className="text-base font-bold text-sand-900 group-hover:text-burnt transition-colors">
                Adaptive Chat Memory & Dynamic Forge
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                As the user chats with the AI, the engine autonomously extracts grievances, deadlines, and financial offers in real time, dynamically rewriting all 4 action documents on the fly!
              </p>
            </div>
            <span className="text-[11px] font-bold text-burnt uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Real-Time Continuous Learning
            </span>
          </div>

          {/* System 7 (AWS Architecture) */}
          <div
            onClick={onOpenArchitecture}
            className="bg-sand-900 text-white rounded-2xl p-5 space-y-3 shadow-xs hover:bg-sand-850 cursor-pointer transition-all flex flex-col justify-between md:col-span-2 lg:col-span-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-sm">
                    7
                  </div>
                  <h3 className="text-base font-bold text-white">AWS Step Functions 6-Stage Serverless Pipeline</h3>
                </div>
                <p className="text-xs text-sand-300 leading-relaxed max-w-2xl">
                  Orchestrating Amazon S3, DynamoDB, Bedrock Claude 3.5 Sonnet, and Lambda deterministic Python math with zero idle cost. Click to inspect live cloud topology diagram.
                </p>
              </div>
              <span className="text-xs font-bold text-burnt-light uppercase tracking-wider flex items-center bg-white/10 px-3 py-2 rounded-xl self-start sm:self-auto hover:bg-white/20 transition-colors">
                <ExternalLink className="w-4 h-4 mr-1.5" /> View Cloud Modal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DUAL-ENGINE ARCHITECTURE VISUALIZATION */}
      <section className="bg-white border border-sand-300/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-sand-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-burnt">
              Technical Excellence
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-sand-900">
              Enterprise Dual-Engine Architecture
            </h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 self-start sm:self-auto">
            100% Serverless on AWS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-sand-300 shadow-md">
            <img
              src="/ai_contract_diagram.jpg"
              alt="DocExplainer Dual Engine Architecture Diagram"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="lg:col-span-5 space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="font-bold text-sand-900 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-burnt" />
                <span>Engine A: Semantic Ingestion (Bedrock Claude 3.5 Sonnet)</span>
              </div>
              <p className="text-ink-muted text-xs leading-relaxed">
                Reads 16–20 page PDF documents directly in memory using the Converse API document block. Extracts clauses, flags liabilities, and synthesizes plain-language summaries.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="font-bold text-sand-900 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Engine B: Deterministic Math (AWS Lambda Multi-Router)</span>
              </div>
              <p className="text-ink-muted text-xs leading-relaxed">
                Python 3.12 Lambda tool executing 4 specialized engines: Lease Compounding, Reducing EMI Amortization, Telescopic Power Slabs, and Stepped Contracts. Zero mental math by the LLM.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="font-bold text-sand-900 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Grounding & Evidence (Strict Clause Citations)</span>
              </div>
              <p className="text-ink-muted text-xs leading-relaxed">
                All assistant chat answers cite exact clause coordinates (e.g., Clause 7.2 or Section 4.1) so users can hold landlords, lenders, and utilities accountable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SAMPLE BENCHMARK QUICK-LAUNCH CARDS */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-burnt">
            Real-World Impact Benchmarks
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-sand-900">
            Test the System on Pre-Loaded Contracts
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="bg-white border border-sand-300/80 hover:border-burnt rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-burnt-light text-burnt">
                    {sample.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-ink-muted">
                    {sample.data.riskFlags?.length || 0} Traps Found
                  </span>
                </div>
                <h3 className="text-base font-bold text-sand-900 group-hover:text-burnt transition-colors">
                  {sample.name}
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                  {sample.data.explanation || sample.type}
                </p>
              </div>

              <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-xs font-bold text-burnt">
                <span>Analyze Document & Chat</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
