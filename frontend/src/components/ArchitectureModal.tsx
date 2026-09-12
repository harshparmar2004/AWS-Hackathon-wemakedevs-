import React from 'react';
import { X, Layers, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const awsServices = [
    {
      name: 'Amazon Bedrock',
      role: 'Multimodal Vision & Language Core',
      detail:
        'Uses Anthropic Claude 3.5 Sonnet / Haiku vision to directly understand raw document images and PDFs without a fragile separate OCR step. Low temperature (0.0) ensures consistent, deterministic results.',
    },
    {
      name: 'AWS Step Functions',
      role: 'Pipeline State Machine Orchestrator',
      detail:
        'Coordinates the multi-stage pipeline: Extract → Classify → Structure Risk-Flags → Translate → Compute Fee Projections. Provides visual workflow execution graph for judges.',
    },
    {
      name: 'AWS Lambda (Python 3.12)',
      role: 'Serverless Compute Handlers',
      detail:
        'Pure serverless event-driven compute with boto3. Handlers written in clean Python 3.12 for easy inspection, testing, and modification.',
    },
    {
      name: 'Bedrock Agent Action Group (Fee Calculator)',
      role: 'Agentic Tool Layer',
      detail:
        'Equips the agent with a deterministic compound math tool. Eliminates LLM arithmetic errors and produces exact ₹ projections for overdue penalties.',
    },
    {
      name: 'Amazon DynamoDB',
      role: 'Serverless NoSQL Storage',
      detail:
        'Stores structured risk-flags, translations, calculation projections, and document status keyed by docId. Fast, pay-per-request billing.',
    },
    {
      name: 'Amazon S3',
      role: 'Raw Document Object Store',
      detail:
        'Stores original PDFs and images with encrypted storage and lifecycle management.',
    },
    {
      name: 'Amazon API Gateway',
      role: 'REST API Endpoint with CORS',
      detail:
        'Exposes POST /documents and GET /documents/{docId} with throttled, managed HTTPS routes.',
    },
    {
      name: 'AWS CDK (TypeScript)',
      role: 'Infrastructure-as-Code (IaC)',
      detail:
        '100% reproducible stack definition. Provisions S3, DynamoDB, IAM roles, Lambdas, and Step Functions in a single automated deployment.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-sand-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-sand-100 border border-sand-300 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-none">
        {/* Modal Header */}
        <div className="sticky top-0 bg-sand-100 p-5 border-b border-sand-300 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-burnt text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-sand-900">
                AWS Architecture & State Machine
              </h3>
              <p className="text-xs text-ink-muted">
                First Commit — AWS x WeMakeDevs · Ship It Track
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-sand-200 text-ink-muted hover:text-sand-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step Functions State Machine Visualizer */}
          <div className="bg-white border border-sand-300 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sand-900 uppercase tracking-wider">
                Step Functions State Machine Execution Flow
              </h4>
              <span className="text-[11px] font-semibold text-burnt">Visualized Pipeline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="bg-sand-50 border border-sand-300 rounded-md p-3 flex flex-col items-center justify-center space-y-1">
                <span className="font-bold text-sand-900">1. S3 Ingestion</span>
                <span className="text-[10px] text-ink-muted">Raw image/PDF upload</span>
              </div>
              <div className="bg-sand-50 border border-sand-300 rounded-md p-3 flex flex-col items-center justify-center space-y-1">
                <span className="font-bold text-sand-900">2. Vision Extract</span>
                <span className="text-[10px] text-ink-muted">Bedrock Claude Vision</span>
              </div>
              <div className="bg-sand-50 border border-sand-300 rounded-md p-3 flex flex-col items-center justify-center space-y-1">
                <span className="font-bold text-sand-900">3. Risk Flagging</span>
                <span className="text-[10px] text-ink-muted">Clause & amount parse</span>
              </div>
              <div className="bg-sand-50 border border-sand-300 rounded-md p-3 flex flex-col items-center justify-center space-y-1">
                <span className="font-bold text-sand-900">4. Translation</span>
                <span className="text-[10px] text-ink-muted">Regional Indian languages</span>
              </div>
              <div className="bg-burnt-light border border-burnt/30 rounded-md p-3 flex flex-col items-center justify-center space-y-1">
                <span className="font-bold text-burnt-dark">5. Fee Calculator</span>
                <span className="text-[10px] text-burnt">Deterministic Tool</span>
              </div>
            </div>
          </div>

          {/* AWS Services Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-sand-900 uppercase tracking-wider">
              AWS Services Utilized & Selection Rationales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {awsServices.map((svc, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-sand-300 rounded-lg p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sand-900">{svc.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sand-100 text-ink-muted font-medium border border-sand-200">
                      {svc.role}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">{svc.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon Demo Pitch Guidance */}
          <div className="p-4 bg-sand-200/70 border border-sand-300 rounded-lg text-xs space-y-2">
            <h5 className="font-bold text-sand-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Key Points for Your 2-3 Minute Judge Demo</span>
            </h5>
            <ul className="list-disc pl-5 space-y-1 text-ink-muted">
              <li>
                <strong>No Separate OCR Bottleneck:</strong> Explain that Bedrock Claude multimodal vision reads the document layout and text in one unified reasoning step.
              </li>
              <li>
                <strong>Agentic Tool-Use:</strong> Highlight that while LLMs hallucinate complex compound interest arithmetic, our Bedrock Agent invokes a deterministic Lambda calculator to guarantee 100% accurate financial projections.
              </li>
              <li>
                <strong>Indian Language Inclusion:</strong> Demonstrate instant switching to Hindi, Tamil, Telugu, etc., making legal agreements accessible to every citizen.
              </li>
              <li>
                <strong>100% Serverless & Zero Idle Cost:</strong> Show that the entire stack (S3, DynamoDB, Lambdas, Step Functions, Bedrock) incurs zero cost when not in use.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
