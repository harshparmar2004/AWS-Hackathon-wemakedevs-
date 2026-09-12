# 📄 Doc-Explainer Agent
### AI-Powered AWS Document Understanding Assistant

> **Built for First Commit — AWS x WeMakeDevs (Bharat Builds Tour)**  
> **Track:** Ship It (Fully Deployed on AWS)  
> **Author:** Harsh Parmar  

---

## 🌟 The Problem & Product Vision
Citizens and small business owners routinely receive documents they don't fully understand — electricity utility bills, residential rental agreements, loan sanction letters, and insurance policy schedules — filled with dense legal and technical jargon. Critical traps get missed: **hidden compounding penalties, lock-in clauses, auto-renewal deadlines, and non-refundable deductions**.

**Doc-Explainer Agent** lets a user upload any document (image or PDF) and delivers:
1. **Plain-Language Summary (Zero Jargon):** What the document is and what it requires.
2. **Structured Risk-Flags:** Exact clause numbers, concrete financial liability/deadlines, and a one-line reason it matters.
3. **Regional Indian Language Translation:** Native translation into Hindi, Tamil, Telugu, Marathi, Gujarati, Bengali, etc.
4. **Agentic Tool-Use (The Compound Fee Calculator):** Deterministic mathematical projection of what overdue penalties compound into over 1, 3, 6, and 12 months — calculated via an AWS Lambda tool, eliminating LLM arithmetic hallucinations.

---

## 🏗️ Architecture & AWS Service Selection

```text
                                  [ User Browser ]
                                         │
                                         ▼
                      [ AWS Amplify Hosting ] (React 18 + Vite)
                                         │
                                         │ HTTPS REST API
                                         ▼
                      [ Amazon API Gateway ] (/documents)
                                         │
                     ┌───────────────────┴───────────────────┐
             (POST /documents)                       (GET /documents/{id})
                     ▼                                       ▼
           [ Upload Lambda (Py 3.12) ]              [ Status Lambda (Py 3.12) ]
                     │                                       │
            ┌────────┴────────┐                              │
            ▼                 ▼                              ▼
      [ Amazon S3 ]   [ AWS Step Functions ]       [ Amazon DynamoDB ]
       (Raw Files)           │                     (Pay-per-request NoSQL)
                             │                               ▲
      ┌──────────────────────┴──────────────────────┐        │
      ▼                                             ▼        │
1. Extract (Bedrock Claude 3.5 Vision)              4. Translate (Bedrock)
      ▼                                             ▼
2. Analyze Risk Flags (Structured JSON)       5. Agentic Fee Calculator Tool
      ▼                                             ▼
3. Persist State & Structured Results ──────────────┴────────┘
```

### Why These AWS Services?

| AWS Service | Architectural Role | Why This and Not an Alternative? |
| :--- | :--- | :--- |
| **Amazon Bedrock (Claude 3.5 Sonnet / Haiku Vision)** | Foundation AI Model | Multimodal vision directly ingests document images/PDFs in one reasoning step. **Eliminates separate OCR/Textract pipelines**, reducing complexity and preserving layout context. Low temperature (0.0) ensures consistent results. |
| **AWS Step Functions** | Workflow Orchestration | Defines the multi-stage pipeline (`Extract` → `Classify` → `Risk-Flag` → `Translate` → `Fee-Calculate`) as a visual, observable state machine rather than an opaque, monolithic Lambda function. |
| **Bedrock Agent Action Group (Fee Calculator)** | Agentic Tool Layer | LLMs are notorious for arithmetic hallucinations on compounding interest. This dedicated Lambda tool performs deterministic compounding math: $A = P(1 + r/n)^{nt} + \text{fees}$, guaranteeing 100% mathematical accuracy. |
| **AWS Lambda (Python 3.12)** | Serverless Compute | Event-driven compute with zero idle cost. Python 3.12 runtime enables rapid local testing, inspectable code, and official `boto3` SDK integration. |
| **Amazon DynamoDB** | Serverless Database | On-demand (pay-per-request) NoSQL table storing extraction results, risk flags, translations, and timestamps. Sub-millisecond latency for status polling. |
| **Amazon S3** | Object Storage | Secure, encrypted bucket with lifecycle rules for raw document storage. |
| **Amazon API Gateway** | Managed REST API | Provides throttled, managed HTTPS routes (`POST /documents`, `GET /documents/{docId}`, `POST /tools/calculate-fee`) with integrated CORS. |
| **AWS CDK v2 (TypeScript)** | Infrastructure as Code | Defines 100% of AWS resources in code. Deployable with a single command (`cdk deploy`), ensuring absolute reproducibility. |
| **AWS Amplify Hosting** | Frontend Delivery | Connects to Git repository for automated CI/CD builds and global CDN distribution with custom domain and SSL. |

---

## 📂 Monorepo Structure

```text
doc-explainer-agent/
├── backend/                      # Python 3.12 Lambda Functions (pip / requirements.txt)
│   ├── handlers/
│   │   ├── upload.py             # POST /documents: S3 storage + Step Functions trigger
│   │   ├── get_document.py       # GET /documents/{docId}: DynamoDB fetch
│   │   ├── extract_vision.py     # Bedrock Claude multimodal vision extraction
│   │   ├── risk_explainer.py     # Structured extraction of {clause, amount, why}
│   │   ├── translator.py         # Regional Indian language translation
│   │   ├── fee_calculator.py     # Deterministic compound interest tool
│   │   └── pipeline_orchestrator.py # Step Functions unified pipeline handler
│   ├── tests/
│   │   └── test_calculator.py    # Python unit tests for fee calculation
│   └── requirements.txt
│
├── frontend/                     # React 18 + TypeScript + Vite + Tailwind (npm)
│   ├── src/
│   │   ├── components/           # Sidebar, UploadSection, RiskFlagsList, CalculatorTool, etc.
│   │   ├── services/api.ts       # API Gateway client & realistic sample documents
│   │   ├── types.ts              # Contract interfaces
│   │   ├── App.tsx
│   │   └── index.css             # Sand/beige (#F7F4EE) & burnt orange (#D97B3F) theme
│   ├── package.json
│   └── vite.config.ts
│
├── infra/                        # AWS CDK in TypeScript (npm)
│   ├── bin/app.ts                # CDK application entry point
│   ├── lib/doc-explainer-stack.ts# S3, DynamoDB, Bedrock IAM, Lambdas, Step Functions, API Gateway
│   ├── cdk.json
│   └── package.json
│
├── README.md
└── .gitignore
```

> **Ecosystem Isolation:** `/frontend` and `/infra` run on `npm`. `/backend` runs on `pip`. The package ecosystems are strictly separated.

---

## 🚀 Quickstart & Local Testing

### 1. Run Backend Unit Tests
Verify the deterministic compounding calculator locally:
```bash
python backend/tests/test_calculator.py
```
*Expected Output:*
```text
....
----------------------------------------------------------------------
Ran 4 tests in 0.001s
OK
```

### 2. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.  
- Click any of the **Instant Sample Docs** in the sidebar (e.g. *Bangalore Rental Agreement*, *BESCOM Utility Bill*, *Personal Loan Letter*) to test without waiting for cloud deployment.
- Try toggling between **English** and **Hindi (हिंदी)**.
- Adjust sliders in the **Agentic Fee & Penalty Compounding Tool** to see real-time recalculations.

---

## ☁️ AWS Cloud Deployment (CDK)

### Step 0: Prerequisites
1. Configure AWS CLI with your IAM credentials:
   ```bash
   aws configure
   ```
2. Request model access for Anthropic Claude 3.5 Sonnet / Claude 3 Haiku in the **Amazon Bedrock Console** (`AWS Console` → `Amazon Bedrock` → `Model access` → `Request access`).

### Step 1: Deploy Infrastructure
```bash
cd infra
npm install
npx cdk bootstrap
npx cdk deploy
```
CDK will provision:
- S3 Bucket: `doc-explainer-uploads-xxxx`
- DynamoDB Table: `DocExplainerTable`
- 4 Python 3.12 Lambda Functions
- AWS Step Functions State Machine: `DocExplainerProcessingPipeline`
- Amazon API Gateway REST API

Upon completion, CDK outputs the public API Gateway URL:
```text
Outputs:
DocExplainerStack.ApiGatewayEndpoint = https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### Step 2: Deploy Frontend on AWS Amplify
1. Push this repository to GitHub.
2. In AWS Console, navigate to **AWS Amplify Hosting**.
3. Choose **Host web app** → connect your GitHub repository.
4. Set App root to `frontend`.
5. Under Build Settings, add environment variable:
   - `VITE_API_URL` = `<Your API Gateway Endpoint>` (e.g. `https://xxxx.execute-api.us-east-1.amazonaws.com/prod/`)
6. Click **Save and Deploy**. Your live URL will be active in ~2 minutes!

---

## 🏆 Demo Video & Submission Walkthrough
When recording your 2-3 minute submission video:
1. **Show the Problem:** Mention how rental contracts or utility bills conceal aggressive compounding penalties.
2. **Show Bedrock Vision Extraction:** Highlight that we send the raw image directly to Bedrock Claude vision without a brittle OCR step.
3. **Show the Step Functions Diagram:** Navigate to the AWS Step Functions console and show the visual state machine graph executing live.
4. **Show the Agentic Calculator Tool:** Point out that the AI invoked a dedicated arithmetic tool to compute exact compound interest over 6 months instead of hallucinating math.
5. **Show Regional Indian Language Support:** Switch to Hindi or Tamil to highlight accessibility for Bharat users.
6. **Highlight 100% Serverless:** Note that idle cost is $0.00.

---

## 📄 License
MIT License. Built for the First Commit Bharat Builds Hackathon.
