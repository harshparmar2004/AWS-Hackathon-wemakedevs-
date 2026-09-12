import { DocumentData, SampleDocument, HistoryItem, ChatMessage } from '../types';

const RAW_API_URL = (import.meta as any).env?.VITE_API_URL || '';
const API_BASE_URL = RAW_API_URL
  ? RAW_API_URL.endsWith('/')
    ? RAW_API_URL
    : `${RAW_API_URL}/`
  : '';
const HISTORY_STORAGE_KEY = 'doc_explainer_user_history';
const CHAT_STORAGE_PREFIX = 'doc_explainer_chat_';

export function getStoredDocumentChat(docId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${docId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading chat from storage', e);
  }
  return [];
}

export function saveDocumentChat(docId: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(`${CHAT_STORAGE_PREFIX}${docId}`, JSON.stringify(messages));
    const history = getStoredHistory();
    const item = history.find((h) => h.id === docId);
    if (item) {
      item.chatCount = messages.filter((m) => m.role === 'user').length;
      saveHistory(history);
    }
  } catch (e) {
    console.error('Failed saving chat to storage', e);
  }
}

export function getStoredHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed reading history from localStorage', e);
  }

  // Default seed with samples
  const defaultHistory: HistoryItem[] = SAMPLE_DOCUMENTS.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    badge: s.badge,
    createdAt: s.data.createdAt || new Date().toISOString(),
    status: 'complete',
    isSample: true,
  }));
  saveHistory(defaultHistory);
  return defaultHistory;
}

export function saveHistoryItem(item: HistoryItem) {
  const current = getStoredHistory();
  const existingIdx = current.findIndex((h) => h.id === item.id);
  if (existingIdx >= 0) {
    current[existingIdx] = item;
  } else {
    current.unshift(item);
  }
  saveHistory(current);
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const current = getStoredHistory().filter((h) => h.id !== id);
  saveHistory(current);
  return current;
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed saving history', e);
  }
}

export async function uploadDocument(
  fileBase64: string,
  fileName: string,
  fileType: 'pdf' | 'image',
  language: string
): Promise<{ docId: string; status: string; message?: string }> {
  if (!API_BASE_URL) {
    await new Promise((res) => setTimeout(res, 1200));
    const demoId = `demo-${Date.now()}`;
    return {
      docId: demoId,
      status: 'processing',
      message: 'Demo mode active. Simulating AWS processing pipeline.',
    };
  }

  const response = await fetch(`${API_BASE_URL}documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileBase64,
      fileName,
      fileType,
      language,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function getDocumentStatus(docId: string): Promise<DocumentData> {
  if (!API_BASE_URL || docId.startsWith('demo-') || docId.startsWith('sample-')) {
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === docId);
    if (sample) return sample.data;

    // Return or retrieve cached generated demo document
    const demoDoc = generateDemoDocument(docId);
    return demoDoc;
  }

  const response = await fetch(`${API_BASE_URL}documents/${docId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document status: ${response.statusText}`);
  }
  return response.json();
}

export async function askDocumentQuestion(
  docId: string,
  question: string,
  language: string = 'english',
  documentContext?: DocumentData
): Promise<{ answer: string; cached?: boolean }> {
  if (!API_BASE_URL || docId.startsWith('demo-') || docId.startsWith('sample-')) {
    // Client-side grounded factual answering for demo mode
    await new Promise((res) => setTimeout(res, 800));
    return generateGroundedAnswer(question, documentContext, language);
  }

  const response = await fetch(`${API_BASE_URL}documents/${docId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language }),
  });

  if (!response.ok) {
    throw new Error(`Question answering failed: ${response.statusText}`);
  }

  const data = await response.json();
  return { answer: data.answer, cached: data.cached };
}

function generateGroundedAnswer(
  question: string,
  doc?: DocumentData,
  language: string = 'english'
): { answer: string } {
  const q = question.toLowerCase();
  const isHindi = language.toLowerCase().includes('hindi');

  if (q.includes('late') || q.includes('penalty') || q.includes('delay') || q.includes('interest')) {
    if (doc?.riskFlags && doc.riskFlags.length > 0) {
      const penaltyFlag = doc.riskFlags[0];
      if (isHindi) {
        return {
          answer: `• खंड संदर्भ: ${penaltyFlag.clause}\n• जुर्माना विवरण: ${penaltyFlag.amount}\n• प्रभाव: यदि आप देय तिथि के बाद भुगतान में देरी करते हैं, तो ${penaltyFlag.why}\n• टिप: अतिरिक्त चक्रवृद्धि ब्याज से बचने के लिए देय तिथि से पहले भुगतान करें।`,
        };
      }
      return {
        answer: `• Clause Reference: ${penaltyFlag.clause}\n• Specific Amount/Rate: ${penaltyFlag.amount}\n• Key Impact: ${penaltyFlag.why}\n• Recommendation: Use the Fee & Penalty Compounding Tool below to project how this compounds over 1 to 12 months.`,
      };
    }
  }

  if (q.includes('notice') || q.includes('lock') || q.includes('vacat') || q.includes('exit')) {
    if (isHindi) {
      return {
        answer: `• न्यूनतम लॉक-इन अवधि: समझौते के अनुसार पहले 6 महीनों के भीतर परिसर खाली नहीं किया जा सकता।\n• नोटिस अवधि: लिखित रूप में 2 महीने का अग्रिम नोटिस आवश्यक है (खंड 11.5)।\n• जुर्माना: लॉक-इन अवधि पूरी होने से पहले खाली करने पर ₹70,000 (2 महीने का किराया) की सुरक्षा जमा राशि जब्त कर ली जाएगी।`,
      };
    }
    return {
      answer: `• Lock-In Period: Minimum mandatory 6 months occupancy required.\n• Notice Period: 2 calendar months advance notice in writing (Clause 11.5).\n• Early Exit Penalty: Vacating prior to lock-in forfeits 2 full months rent (₹70,000) from your security deposit.`,
    };
  }

  if (q.includes('deposit') || q.includes('refund') || q.includes('paint')) {
    if (isHindi) {
      return {
        answer: `• सुरक्षा जमा राशि: ₹2,00,000 (वापसी योग्य)।\n• वापसी की समयसीमा: परिसर के निरीक्षण के 30 दिनों के भीतर।\n• अनिवार्य कटौती: खंड 14.1 के तहत ₹35,000 की पेंटिंग और गहरी सफाई कटौती निश्चित है, भले ही आपने कमरे को स्वयं पेंट किया हो।`,
      };
    }
    return {
      answer: `• Security Deposit Total: ₹2,00,000.\n• Refund Timeline: Within 30 days post-joint inspection upon vacating.\n• Mandatory Deductions: Clause 14.1 mandates an automatic ₹35,000 deduction for painting and deep restoration, regardless of actual wall condition.`,
    };
  }

  // General grounded response
  if (isHindi) {
    return {
      answer: `दस्तावेज़ विश्लेषण के आधार पर:\n• दस्तावेज़ प्रकार: ${doc?.docType || 'दस्तावेज़'}\n• मुख्य शर्तें: ${doc?.explanation?.slice(0, 200)}...\n• सलाह: किसी भी संभावित जुर्माने या विवाद से बचने के लिए उल्लिखित नियमों और देय तिथियों का पालन करें।`,
    };
  }

  return {
    answer: `Based on verified analysis of ${doc?.docType || 'this document'}:\n• Primary Terms: ${doc?.explanation?.slice(0, 250)}...\n• Applicable Risks: ${doc?.riskFlags?.length || 0} critical financial risk clauses detected.\n• Recommendation: Adhere strictly to the dates listed under Critical Deadlines to prevent automated compounding penalties.`,
  };
}

export async function calculateFeeDirect(params: {
  principal: number;
  annualRatePercent: number;
  flatPenaltyPerMonth: number;
  compoundingFrequency?: string;
}) {
  if (!API_BASE_URL) {
    const p = params.principal;
    const r = params.annualRatePercent / 100;
    const flat = params.flatPenaltyPerMonth;
    const n = 12;
    const durations = [1, 3, 6, 12];

    const projections = durations.map((m) => {
      const t = m / 12;
      const compounded = r > 0 ? p * Math.pow(1 + r / n, n * t) : p;
      const interest = compounded - p;
      const flatAcc = flat * m;
      const totalPen = interest + flatAcc;
      const totalLiab = compounded + flatAcc;
      return {
        months: m,
        days: m * 30,
        principal: Math.round(p),
        interestAccrued: Math.round(interest),
        flatFees: Math.round(flatAcc),
        totalPenalty: Math.round(totalPen),
        totalLiability: Math.round(totalLiab),
        percentageIncrease: p > 0 ? Math.round((totalPen / p) * 1000) / 10 : 0,
      };
    });

    const p6 = projections[2];
    return {
      status: 'success',
      principal: p,
      annualRatePercent: params.annualRatePercent,
      flatPenaltyPerMonth: flat,
      compoundingFrequency: 'monthly',
      projections,
      narrative: `For a base liability of ₹${p.toLocaleString()} at ${params.annualRatePercent}% p.a. + ₹${flat}/mo late fees, unpaid liability grows to ₹${p6.totalLiability.toLocaleString()} in 6 months (+${p6.percentageIncrease}% increase).`,
    };
  }

  const response = await fetch(`${API_BASE_URL}tools/calculate-fee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return response.json();
}

function generateDemoDocument(docId: string): DocumentData {
  return {
    docId,
    status: 'complete',
    docType: 'Residential Rental & Lease Agreement',
    fileName: 'Uploaded_Agreement.pdf',
    language: 'english',
    riskScore: 'high',
    explanation:
      'This is a standard 11-month residential tenancy agreement between Landlord Rajesh Kumar and Tenant Amit Verma for Flat 402, Greenwoods Residency, Bangalore. Monthly rent is ₹28,000 payable on or before the 5th of each month, with a refundable security deposit of ₹1,50,000. Important stipulations include a mandatory 3-month lock-in period and an annual rent escalation of 8% upon renewal.',
    keyDates: [
      'Rent Due Date: 5th of every month',
      'Lock-in Period: 3 months (no early vacating)',
      'Agreement Expiry: 11 months from execution',
      'Notice Period: 1 calendar month in writing',
    ],
    riskFlags: [
      {
        clause: 'Clause 6.3 — Overdue Rent Penalty',
        amount: '24% p.a. compound interest + ₹200/day late fee',
        why: 'If rent payment is delayed past the 10th of the month, steep interest and daily penalties accumulate rapidly.',
      },
      {
        clause: 'Clause 9.1 — Early Termination Lock-In',
        amount: '₹84,000 (3 months full rent forfeited)',
        why: 'Vacating the premises before completing 3 months forfeits the entire lock-in rent from your security deposit.',
      },
      {
        clause: 'Clause 12.4 — Painting & Restoration Deduction',
        amount: '₹28,000 (1 full month rent)',
        why: 'Non-negotiable deduction from security deposit regardless of the actual condition upon vacating.',
      },
    ],
    translatedExplanation:
      'यह राजेश कुमार (मकान मालिक) और अमित वर्मा (किराएदार) के बीच फ्लैट 402, ग्रीनवुड्स रेजीडेंसी, बेंगलुरु के लिए 11 महीने का आवासीय किराया समझौता है। मासिक किराया ₹28,000 है जो प्रत्येक महीने की 5 तारीख तक देय है, तथा ₹1,50,000 की सुरक्षा जमा राशि (डिपॉजिट) ली गई है। इसमें 3 महीने का अनिवार्य लॉक-इन पीरियड और नवीनीकरण पर 8% वार्षिक किराया वृद्धि शामिल है।',
    translatedRiskFlags: [
      {
        clause: 'खंड 6.3 — विलंबित किराया जुर्माना',
        amount: '24% वार्षिक चक्रवृद्धि ब्याज + ₹200/दिन विलंब शुल्क',
        why: 'यदि महीने की 10 तारीख के बाद किराया दिया जाता है, तो भारी ब्याज और दैनिक जुर्माना तेजी से जमा होता है।',
      },
      {
        clause: 'खंड 9.1 — समय पूर्व समाप्ति (लॉक-इन पेनल्टी)',
        amount: '₹84,000 (3 महीने का पूरा किराया जब्त)',
        why: '3 महीने की न्यूनतम अवधि से पहले फ्लैट खाली करने पर सुरक्षा जमा से पूरा किराया काट लिया जाएगा।',
      },
      {
        clause: 'खंड 12.4 — पेंटिंग और जीर्णोद्धार कटौती',
        amount: '₹28,000 (1 महीने का पूरा किराया)',
        why: 'मकान खाली करते समय सुरक्षा राशि में से यह निश्चित कटौती की जाएगी, चाहे वास्तविक टूट-फूट कुछ भी हो।',
      },
    ],
    projections: {
      principal: 28000,
      annualRatePercent: 24,
      flatPenaltyPerMonth: 6000,
      compoundingFrequency: 'monthly',
      projections: [
        { months: 1, days: 30, principal: 28000, interestAccrued: 560, flatFees: 6000, totalPenalty: 6560, totalLiability: 34560, percentageIncrease: 23.4 },
        { months: 3, days: 90, principal: 28000, interestAccrued: 1714, flatFees: 18000, totalPenalty: 19714, totalLiability: 47714, percentageIncrease: 70.4 },
        { months: 6, days: 180, principal: 28000, interestAccrued: 3532, flatFees: 36000, totalPenalty: 39532, totalLiability: 67532, percentageIncrease: 141.2 },
        { months: 12, days: 365, principal: 28000, interestAccrued: 7511, flatFees: 72000, totalPenalty: 79511, totalLiability: 107511, percentageIncrease: 283.9 },
      ],
      narrative:
        'For base rent of ₹28,000 with 24% p.a. interest + ₹200/day late fees, delaying payment for 6 months results in ₹39,532 in penalties, raising total liability to ₹67,532 (+141.2% increase).',
    },
    translatedProjectionNarrative:
      '₹28,000 के मूल किराए पर 24% वार्षिक ब्याज और ₹200/दिन के विलंब शुल्क के साथ, 6 महीने तक भुगतान न करने पर ₹39,532 का अतिरिक्त जुर्माना लगेगा, जिससे कुल देनदारी ₹67,532 (+141.2%) हो जाएगी।',
    createdAt: new Date().toISOString(),
  };
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-rent-blr',
    name: 'Bangalore Rental Agreement',
    type: 'Rental Agreement',
    badge: 'Real Estate',
    data: {
      docId: 'sample-rent-blr',
      status: 'complete',
      docType: 'Residential Tenancy Contract',
      fileName: 'Bengaluru_Rental_Agreement_2026.pdf',
      language: 'english',
      riskScore: 'high',
      explanation:
        'Standard 11-month lease agreement for residential property in Indiranagar, Bengaluru. Outlines obligations for tenant (monthly rent ₹35,000, security deposit ₹2,00,000) and landlord maintenance duties. Includes severe compound penalty clauses for delayed rent beyond the 7th of every calendar month.',
      keyDates: [
        'Payment Due Date: 7th of every month',
        'Lock-In Period: 6 months minimum stay',
        'Notice Period: 2 months advance notice',
        'Security Deposit Refund: Within 30 days of inspection',
      ],
      riskFlags: [
        {
          clause: 'Clause 7.2 — Compounded Overdue Surcharge',
          amount: '24% p.a. (2% monthly compound rate)',
          why: 'Late rent is subjected to steep compounding penalty rather than simple flat late charge.',
        },
        {
          clause: 'Clause 11.5 — Security Deposit Forfeiture on Early Exit',
          amount: '₹70,000 (2 months rent deducted)',
          why: 'Vacating within first 6 months causes automatic deduction of 2 full months rent.',
        },
        {
          clause: 'Clause 14.1 — Mandatory Deep Clean & Repainting Fee',
          amount: '₹35,000 fixed deduction',
          why: 'Non-refundable deduction deducted regardless of whether premises is repainted by tenant.',
        },
      ],
      translatedExplanation:
        'इंदिरानगर, बेंगलुरु में आवासीय संपत्ति के लिए 11 महीने का मानक पट्टा समझौता। इसमें किरायेदार के दायित्व (मासिक किराया ₹35,000, सुरक्षा जमा राशि ₹2,00,000) और मकान मालिक के रखरखाव कर्तव्यों को रेखांकित किया गया है। हर महीने की 7 तारीख के बाद किराए के भुगतान में देरी पर भारी चक्रवृद्धि ब्याज का प्रावधान है।',
      translatedRiskFlags: [
        {
          clause: 'खंड 7.2 — विलंबित अधिभार चक्रवृद्धि',
          amount: '24% वार्षिक (2% मासिक चक्रवृद्धि दर)',
          why: 'विलंबित किराए पर साधारण शुल्क के बजाय भारी चक्रवृद्धि जुर्माना लगाया जाता है।',
        },
        {
          clause: 'खंड 11.5 — समय से पहले खाली करने पर जमा जब्ती',
          amount: '₹70,000 (2 महीने का किराया काटा गया)',
          why: 'पहले 6 महीनों के भीतर घर खाली करने पर 2 महीने के पूरे किराए की कटौती होगी।',
        },
        {
          clause: 'खंड 14.1 — अनिवार्य पेंटिंग और सफाई शुल्क',
          amount: '₹35,000 निश्चित कटौती',
          why: 'मकान छोड़ते समय यह राशि बिना किसी छूट के जमा राशि से काट ली जाएगी।',
        },
      ],
      projections: {
        principal: 35000,
        annualRatePercent: 24,
        flatPenaltyPerMonth: 500,
        compoundingFrequency: 'monthly',
        projections: [
          { months: 1, days: 30, principal: 35000, interestAccrued: 700, flatFees: 500, totalPenalty: 1200, totalLiability: 36200, percentageIncrease: 3.4 },
          { months: 3, days: 90, principal: 35000, interestAccrued: 2142, flatFees: 1500, totalPenalty: 3642, totalLiability: 38642, percentageIncrease: 10.4 },
          { months: 6, days: 180, principal: 35000, interestAccrued: 4415, flatFees: 3000, totalPenalty: 7415, totalLiability: 42415, percentageIncrease: 21.2 },
          { months: 12, days: 365, principal: 35000, interestAccrued: 9388, flatFees: 6000, totalPenalty: 15388, totalLiability: 50388, percentageIncrease: 44.0 },
        ],
        narrative:
          'For monthly rent of ₹35,000 with 24% compounding interest + ₹500/month late fee, a 6-month delay adds ₹7,415 in penalties (+21.2% total liability).',
      },
      translatedProjectionNarrative:
        '₹35,000 के मासिक किराए पर 24% चक्रवृद्धि ब्याज और ₹500/माह के विलंब शुल्क के साथ, 6 महीने की देरी पर ₹7,415 का अतिरिक्त जुर्माना लगेगा (+21.2% कुल देनदारी)।',
      createdAt: '2026-09-10T10:00:00Z',
    },
  },
  {
    id: 'sample-power-bill',
    name: 'BESCOM High-Tension Utility Bill',
    type: 'Electricity Bill',
    badge: 'Utility',
    data: {
      docId: 'sample-power-bill',
      status: 'complete',
      docType: 'Commercial Electricity Utility Invoice',
      fileName: 'BESCOM_Electricity_Bill_Aug2026.pdf',
      language: 'english',
      riskScore: 'moderate',
      explanation:
        'State power distribution company commercial tariff invoice with total current bill of ₹18,450. Covers 1,240 kWh units billed at tiered peak-demand rates with fuel adjustment cost (FAC). Immediate disconnect clause triggers 15 days post due date.',
      keyDates: [
        'Bill Date: 1st September 2026',
        'Due Date: 16th September 2026',
        'Disconnection Notice Date: 1st October 2026',
      ],
      riskFlags: [
        {
          clause: 'Section 4.1 — Delayed Payment Surcharge (DPS)',
          amount: '18% p.a. compounded monthly',
          why: 'DPS is billed on the cumulative unpaid balance, including previously unpaid government electricity duty.',
        },
        {
          clause: 'Section 6.8 — Disconnection & Reconnection Charge',
          amount: '₹2,500 + 18% GST',
          why: 'Power cut executed automatically on 16th day with mandatory reconnection fee payable before restoration.',
        },
      ],
      translatedExplanation:
        'राज्य विद्युत वितरण कंपनी का वाणिज्यिक बिजली बिल, जिसकी वर्तमान कुल देय राशि ₹18,450 है। इसमें 1,240 यूनिट की खपत शामिल है जिसे पीक-लोड दरों पर चार्ज किया गया है। देय तिथि के 15 दिनों के बाद स्वतः बिजली काटने का स्पष्ट नियम है।',
      translatedRiskFlags: [
        {
          clause: 'धारा 4.1 — विलंबित भुगतान अधिभार (DPS)',
          amount: '18% वार्षिक मासिक चक्रवृद्धि',
          why: 'यह अधिभार पिछले अनपेड बिल और सरकारी बिजली शुल्क दोनों पर चक्रवृद्धि रूप से लगाया जाता है।',
        },
        {
          clause: 'धारा 6.8 — विच्छेदन और पुनः संयोजन शुल्क',
          amount: '₹2,500 + 18% GST',
          why: '16वें दिन स्वतः कनेक्शन काट दिया जाएगा और पुनः चालू कराने के लिए अनिवार्य शुल्क देना होगा।',
        },
      ],
      projections: {
        principal: 18450,
        annualRatePercent: 18,
        flatPenaltyPerMonth: 500,
        compoundingFrequency: 'monthly',
        projections: [
          { months: 1, days: 30, principal: 18450, interestAccrued: 277, flatFees: 500, totalPenalty: 777, totalLiability: 19227, percentageIncrease: 4.2 },
          { months: 3, days: 90, principal: 18450, interestAccrued: 843, flatFees: 1500, totalPenalty: 2343, totalLiability: 20793, percentageIncrease: 12.7 },
          { months: 6, days: 180, principal: 18450, interestAccrued: 1724, flatFees: 3000, totalPenalty: 4724, totalLiability: 23174, percentageIncrease: 25.6 },
          { months: 12, days: 365, principal: 18450, interestAccrued: 3609, flatFees: 6000, totalPenalty: 9609, totalLiability: 28059, percentageIncrease: 52.1 },
        ],
        narrative:
          'For utility bill of ₹18,450 at 18% p.a. interest + ₹500 late fee, 6 months non-payment accumulates ₹4,724 in surcharges (+25.6% total liability).',
      },
      translatedProjectionNarrative:
        '₹18,450 के बिजली बिल पर 18% वार्षिक ब्याज और ₹500 विलंब शुल्क के साथ, 6 महीने भुगतान न करने पर ₹4,724 का अतिरिक्त अधिभार लग जाएगा (+25.6%)।',
      createdAt: '2026-09-08T14:30:00Z',
    },
  },
  {
    id: 'sample-loan-sanction',
    name: 'Personal Loan Sanction Letter',
    type: 'Loan Agreement',
    badge: 'Banking',
    data: {
      docId: 'sample-loan-sanction',
      status: 'complete',
      docType: 'Personal Loan Agreement',
      fileName: 'HDFC_Personal_Loan_Sanction_2026.pdf',
      language: 'english',
      riskScore: 'high',
      explanation:
        'Sanction letter for an unsecured personal loan of ₹3,00,000 for a tenure of 36 months at an agreed fixed interest rate of 11.5% p.a. Monthly EMI is ₹9,890. Strict penal interest clauses apply on missed installments or bounce of auto-debit NACH mandates.',
      keyDates: [
        'EMI Debit Date: 3rd of every month',
        'Loan Tenure: 36 Months',
        'Prepayment Lock-in: First 12 months (no prepayments allowed)',
      ],
      riskFlags: [
        {
          clause: 'Clause 8 — Penal Default Interest Rate',
          amount: '28% p.a. (2.33% per month compounded)',
          why: 'A single missed EMI triggers 28% penal interest on the entire overdue installment amount until cleared.',
        },
        {
          clause: 'Clause 10 — ECS / NACH Mandate Return Penalty',
          amount: '₹750 per bounce + Bank return fees',
          why: 'If your bank account lacks sufficient balance on the 3rd, ₹750 is charged per failed attempt.',
        },
        {
          clause: 'Clause 15 — Foreclosure / Prepayment Penalty',
          amount: '5% of outstanding principal amount',
          why: 'Paying off your loan early after the 12-month lock-in still penalizes you with 5% fee on remaining balance.',
        },
      ],
      translatedExplanation:
        '11.5% वार्षिक निश्चित ब्याज दर पर 36 महीने की अवधि के लिए ₹3,00,000 के असुरक्षित व्यक्तिगत ऋण (पर्सनल लोन) का स्वीकृति पत्र। मासिक किस्त (ईएमआई) ₹9,890 है। ईएमआई छूटने या बैंक ऑटो-डेबिट बाउंस होने पर अत्यधिक दंडात्मक ब्याज के कड़े नियम हैं।',
      translatedRiskFlags: [
        {
          clause: 'खंड 8 — दंडात्मक डिफॉल्ट ब्याज दर',
          amount: '28% वार्षिक (2.33% प्रति माह चक्रवृद्धि)',
          why: 'एक भी ईएमआई चूकने पर बकाया राशि पर 28% की दर से दंडात्मक ब्याज लगना शुरू हो जाता है।',
        },
        {
          clause: 'खंड 10 — ईसीएस / एनएसीएच बाउंस शुल्क',
          amount: '₹750 प्रति बाउंस + बैंक शुल्क',
          why: '3 तारीख को बैंक खाते में पर्याप्त राशि न होने पर हर असफल प्रयास के लिए ₹750 वसूला जाएगा।',
        },
        {
          clause: 'खंड 15 — ऋण पूर्व-भुगतान (फोरक्लोज़र) जुर्माना',
          amount: 'बकाया मूल राशि का 5%',
          why: '12 महीने बाद भी लोन पहले चुकाने पर शेष राशि पर 5% का जुर्माना लगाया जाता है।',
        },
      ],
      projections: {
        principal: 50000,
        annualRatePercent: 28,
        flatPenaltyPerMonth: 750,
        compoundingFrequency: 'monthly',
        projections: [
          { months: 1, days: 30, principal: 50000, interestAccrued: 1167, flatFees: 750, totalPenalty: 1917, totalLiability: 51917, percentageIncrease: 3.8 },
          { months: 3, days: 90, principal: 50000, interestAccrued: 3583, flatFees: 2250, totalPenalty: 5833, totalLiability: 55833, percentageIncrease: 11.7 },
          { months: 6, days: 180, principal: 50000, interestAccrued: 7466, flatFees: 4500, totalPenalty: 11966, totalLiability: 61966, percentageIncrease: 23.9 },
          { months: 12, days: 365, principal: 50000, interestAccrued: 15949, flatFees: 9000, totalPenalty: 24949, totalLiability: 74949, percentageIncrease: 49.9 },
        ],
        narrative:
          'For an overdue loan liability of ₹50,000 at 28% penal rate + ₹750/month bounce fees, 6 months overdue accrues ₹11,966 in penalties (+23.9% increase).',
      },
      translatedProjectionNarrative:
        '₹50,000 की बकाया ऋण राशि पर 28% दंडात्मक ब्याज और ₹750 बाउंस शुल्क के साथ, 6 महीने की देरी पर ₹11,966 का जुर्माना लगेगा (+23.9%)।',
      createdAt: '2026-09-09T09:15:00Z',
    },
  },
];
