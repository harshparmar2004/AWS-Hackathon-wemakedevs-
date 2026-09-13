import { DocumentData, ChatMessage, AdaptiveCaseMemory, LegalDossier, ForgedDocument } from '../types';

/**
 * Intelligent client-side Case Memory Extractor
 * Scans user messages to dynamically extract constraints, offers, and factual details.
 */
export function extractCaseMemoryFromChat(
  messages: ChatMessage[],
  previousMemory?: AdaptiveCaseMemory
): AdaptiveCaseMemory {
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.text);
  if (userMessages.length === 0) {
    return (
      previousMemory || {
        refinementsCount: 0,
        extractedKeywords: [],
      }
    );
  }

  const allUserText = userMessages.join(' ');
  const lower = allUserText.toLowerCase();

  // 1. Extract Proposed Offer / Financial Willingness
  let userProposedOffer: string | undefined = undefined;
  const rupeeMatch = allUserText.match(/(?:₹|rs\.?|inr)\s?([0-9,]+)/i) ||
                     allUserText.match(/pay\s+([0-9,]+)/i) ||
                     allUserText.match(/offer\s+([0-9,]+)/i);
  if (rupeeMatch) {
    userProposedOffer = `₹${rupeeMatch[1]}`;
  } else if (lower.includes('half') || lower.includes('50%')) {
    userProposedOffer = '50% upfront settlement';
  }

  // 2. Extract Specific Factual Grievance Details
  let factualGrievance: string | undefined = undefined;
  if (lower.includes('defect') || lower.includes('damage') || lower.includes('broken')) {
    factualGrievance = 'Product delivered in defective/damaged condition with prompt notice given.';
  } else if (lower.includes('water') || lower.includes('leak') || lower.includes('repair')) {
    factualGrievance = 'Premises suffered unaddressed maintenance/repair issues causing tenant hardship.';
  } else if (lower.includes('disconnect') || lower.includes('notice')) {
    factualGrievance = 'Disconnection notice period issued was shorter than statutory requirement.';
  } else if (lower.includes('job') || lower.includes('medical') || lower.includes('emergency')) {
    factualGrievance = 'Delay was caused by documented bona-fide financial hardship/medical emergency.';
  }

  // 3. Extract Settlement Terms
  let settlementTerms: string | undefined = undefined;
  if (lower.includes('waive') || lower.includes('waiver') || lower.includes('zero percent') || lower.includes('0%')) {
    settlementTerms = 'Full waiver of compounding penal interest with immediate clearance of principal.';
  } else if (lower.includes('instalment') || lower.includes('installment') || lower.includes('split')) {
    settlementTerms = 'Structured repayment in 2 to 3 equal monthly installments without surcharge.';
  } else if (lower.includes('refund') || lower.includes('replace')) {
    settlementTerms = 'Immediate unconditional refund or replacement within 7 working days.';
  }

  // 4. Extract Keywords
  const extractedKeywords: string[] = [];
  ['waiver', 'refund', 'replacement', 'deposit', 'foreclosure', 'notice', 'defect', 'penalty', 'interest', 'settlement'].forEach(
    (kw) => {
      if (lower.includes(kw)) extractedKeywords.push(kw);
    }
  );

  let refinementsCount = 0;
  if (userProposedOffer) refinementsCount++;
  if (factualGrievance) refinementsCount++;
  if (settlementTerms) refinementsCount++;

  return {
    userProposedOffer: userProposedOffer || previousMemory?.userProposedOffer,
    factualGrievance: factualGrievance || previousMemory?.factualGrievance,
    settlementTerms: settlementTerms || previousMemory?.settlementTerms,
    refinementsCount: Math.max(refinementsCount, previousMemory?.refinementsCount || 0),
    extractedKeywords: Array.from(new Set([...(previousMemory?.extractedKeywords || []), ...extractedKeywords])),
  };
}

/**
 * Detects domain from document properties
 */
export function detectDocumentDomain(
  doc: DocumentData
): 'tenancy' | 'loan' | 'power_tariff' | 'ecom_consumer' | 'b2b_saas' {
  const text = `${doc.docId} ${doc.fileName || ''} ${doc.docType || ''} ${doc.explanation || ''}`.toLowerCase();
  const engine = doc.projections?.engine;

  if (text.includes('ecom') || text.includes('amazon') || text.includes('flipkart') || text.includes('consumer grievance') || text.includes('invoice')) {
    return 'ecom_consumer';
  }
  if (text.includes('saas') || text.includes('vendor') || text.includes('master services') || text.includes('b2b') || text.includes('commercial agreement')) {
    return 'b2b_saas';
  }
  if (engine === 'loan_emi_foreclosure' || text.includes('loan') || text.includes('sanction') || text.includes('hdfc')) {
    return 'loan';
  }
  if (engine === 'tiered_power_tariff' || text.includes('power') || text.includes('bescom') || text.includes('electricity') || text.includes('utility')) {
    return 'power_tariff';
  }
  return 'tenancy';
}

/**
 * Generates the full 4-document legal action dossier, integrating user case memory
 */
export function generateLegalDossier(
  doc: DocumentData,
  memory: AdaptiveCaseMemory
): LegalDossier {
  const domain = detectDocumentDomain(doc);
  const docTitle = doc.fileName || doc.docType || 'Document Agreement';
  const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const primaryTrap = doc.riskFlags && doc.riskFlags[0]
    ? `${doc.riskFlags[0].clause} (${doc.riskFlags[0].amount})`
    : 'Unilateral Compounding Penalty Clause';

  const userOfferSnippet = memory.userProposedOffer
    ? `\n• User-Stipulated Offer: The citizen has proactively offered to tender ${memory.userProposedOffer} in full settlement.`
    : '';

  const userFactualSnippet = memory.factualGrievance
    ? `\n• Relevant Factual Note: ${memory.factualGrievance}`
    : '';

  const userSettlementSnippet = memory.settlementTerms
    ? `\n• Proposed Terms of Resolution: ${memory.settlementTerms}`
    : '';

  const memoryAdaptedBadge = memory.refinementsCount > 0;

  // --- DOCUMENT 1: STATUTORY LEGAL NOTICE ---
  let noticeStatute = 'Section 74 of the Indian Contract Act, 1872 & Section 2(46) of the Consumer Protection Act, 2019';
  let opponentRole = 'Opposite Party / Counterparty';
  let domainNoticeIntro = '';

  if (domain === 'tenancy') {
    noticeStatute = 'Section 74, Indian Contract Act 1872 read with Section 21, Model Tenancy Act 2021';
    opponentRole = 'Landlord / Property Management';
    domainNoticeIntro = `I am writing to issue formal notice regarding the residential tenancy agreement for ${docTitle}. Clause 7.2 imposes an illegal 24% p.a. compounding surcharge, violating Section 74 of the Indian Contract Act which restricts damages to reasonable liquidated figures, and the Model Tenancy Act which prohibits non-consensual compounding fees.`;
  } else if (domain === 'loan') {
    noticeStatute = 'RBI Fair Practices Code & Circular DBOD.No.Dir.BC.107/13.03.00/2011-12';
    opponentRole = 'Branch Manager / Credit Operations, Lending Institution';
    domainNoticeIntro = `This statutory notice concerns Sanction Letter ${docTitle}. The imposition of a 12-month foreclosure lock-in and a 5.0% exit charge directly violates Reserve Bank of India mandates prohibiting foreclosure penalties on floating-rate and individual term facilities.`;
  } else if (domain === 'power_tariff') {
    noticeStatute = 'Section 56, Electricity Act 2003 & State Electricity Regulatory Commission (SERC) Supply Code';
    opponentRole = 'Assistant Executive Engineer / Commercial Revenue Office, Electricity DISCOM';
    domainNoticeIntro = `This formal representation challenges the retrospective Delayed Payment Surcharge and disconnection notice on Account ${docTitle}. Section 56 of the Electricity Act 2003 mandates a minimum 15 clear days' written notice before supply disruption, and disallows compounding penalties on contested fuel adjustments.`;
  } else if (domain === 'ecom_consumer') {
    noticeStatute = 'Consumer Protection (E-Commerce) Rules, 2020 & Section 35, Consumer Protection Act 2019';
    opponentRole = 'Grievance Officer, E-Commerce Marketplace & Merchant';
    domainNoticeIntro = `I hereby serve formal notice regarding Order/Transaction ${docTitle}. The unilateral refusal to replace a defective product within the return window constitutes an Unfair Trade Practice under Section 2(47) and deficiency of service under Section 2(11) of the Consumer Protection Act 2019.`;
  } else {
    noticeStatute = 'Section 73 & 74, Indian Contract Act 1872 & Specific Relief Act 1963';
    opponentRole = 'Authorized Signatory / Enterprise Vendor';
    domainNoticeIntro = `Formal communication regarding Master Agreement ${docTitle}. The automatic price escalation and unilateral termination fees constitute unreasonable liquidated damages unenforceable under Indian contract jurisprudence.`;
  }

  const statutoryNotice: ForgedDocument = {
    id: 'doc-statutory-notice',
    type: 'statutory_notice',
    title: 'Statutory Legal Demand Notice',
    badge: memoryAdaptedBadge ? 'Refined via Chat' : 'Statutory Notice',
    summary: 'Formal pre-litigation demand notice giving counterparty 15 days to cure unfair terms.',
    statutoryBasis: noticeStatute,
    recipientRole: opponentRole,
    lastUpdatedFromChat: memoryAdaptedBadge,
    content: `LEGAL DEMAND NOTICE
(Under ${noticeStatute})

Date: ${now}
To: ${opponentRole}
Subject: Formal Demand for Rectification of Unfair Terms in ${docTitle}

Sir/Madam,

Under instructions and on behalf of my client / undersigned citizen, I hereby serve upon you this formal notice:

1. RECITALS & TRANSACTION:
${domainNoticeIntro}

2. PREDATORY CLAUSE CHALLENGED:
Specifically, your attention is drawn to ${primaryTrap}. This provision imposes an unconscionable, disproportionate, and unilateral financial burden.${userFactualSnippet}${userOfferSnippet}

3. STATUTORY INFIRMITIES:
Under ${noticeStatute}, contract clauses that stipulate penal or compounding damages without proof of actual damage are void and unenforceable as penalties. Furthermore, standard form contracts that extract unfair forfeiture qualify as Unfair Contract Terms.

4. DEMAND FOR RECTIFICATION (15-DAY CURE PERIOD):
You are hereby called upon to:
a) Recalculate all liabilities on a simple interest basis or substitute the challenged clause with standard fair market rates.${userSettlementSnippet}
b) Desist from initiating coercive action, disconnection, deposit forfeiture, or negative credit reporting during the pendency of this notice.

Take notice that failure to rectify these terms within 15 calendar days from receipt hereof will leave no alternative but to initiate proceedings before the competent Consumer Disputes Redressal Commission / Civil Forum, seeking statutory damages, interest, and litigation costs.

Yours faithfully,
[Citizen / Authorized Representative]
DocExplainer Autonomous Legal Dossier ID: DX-${doc.docId.toUpperCase().slice(0, 8)}`,
  };

  // --- DOCUMENT 2: EXECUTIVE SETTLEMENT & WAIVER PROPOSAL ---
  const settlementDoc: ForgedDocument = {
    id: 'doc-settlement-proposal',
    type: 'settlement_proposal',
    title: 'Executive Settlement & Penalty Waiver Proposal',
    badge: memoryAdaptedBadge ? 'Refined via Chat' : 'Settlement Offer',
    summary: 'Commercial compromise proposing realistic principal clearance with penalty waiver.',
    statutoryBasis: 'Alternative Dispute Resolution (ADR) under Section 89, Code of Civil Procedure',
    recipientRole: opponentRole,
    lastUpdatedFromChat: memoryAdaptedBadge,
    content: `WITHOUT PREJUDICE — PROPOSAL FOR FULL & FINAL SETTLEMENT

Date: ${now}
To: Management & Dispute Resolution Cell, ${opponentRole}
Reference: ${docTitle}
Subject: Amicable Settlement & Penalty Waiver Proposal

Dear Sir/Madam,

I write to propose an amicable, commercially practical resolution to the outstanding claims arising under ${docTitle}.

1. THE DISPUTE SUMMARY:
The current ledger reflects accumulated surcharges under ${primaryTrap}. As established under settled Indian jurisprudence, compounding interest on delayed payments constitutes penal damages rather than genuine pre-estimated losses.

2. PROPOSED SETTLEMENT TERMS:${memory.userProposedOffer ? `\n• Immediate Lump-Sum Tender: ${memory.userProposedOffer} payable within 5 working days of acceptance.` : '\n• Principal Discharge: The undersigned is prepared to discharge 100% of the legitimate underlying base amount.'}
• Waiver of Compounding Charges: 100% waiver of accrued compounding late fees, penalty charges, and administrative surcharges.${memory.settlementTerms ? `\n• Specific Relief: ${memory.settlementTerms}` : '\n• Mutual Release: Both parties shall execute a comprehensive mutual release with no residual liability.'}

3. BENEFITS OF IMMEDIATE RESOLUTION:
Acceptance of this proposal avoids contentious regulatory complaints before the Consumer Commission / Ombudsman, preserves business goodwill, and ensures immediate financial realization without legal overhead.

This offer remains valid for acceptance within 10 business days from the date hereof.

Sincerely,
[Citizen / Commercial Counterparty]`,
  };

  // --- DOCUMENT 3: CONTRACT CLAUSE ADDENDUM ---
  const addendumDoc: ForgedDocument = {
    id: 'doc-clause-addendum',
    type: 'clause_addendum',
    title: 'Bilateral Contract Amendment Addendum',
    badge: 'Binding Addendum',
    summary: 'Legally vetted replacement clause ready for mutual signature to replace unfair terms.',
    statutoryBasis: 'Section 62, Indian Contract Act 1872 (Novation and Amendment of Contract)',
    recipientRole: opponentRole,
    lastUpdatedFromChat: memoryAdaptedBadge,
    content: `AMENDMENT ADDENDUM TO ${docTitle.toUpperCase()}

This Addendum to ${docTitle} is executed on this ${now} between:
Party A (${opponentRole})
AND
Party B (Citizen / Consumer / Tenant)

WHEREAS:
A. The parties previously entered into the agreement dated [Original Date].
B. The parties have mutually agreed to amend and restate certain provisions to reflect fair market standards.

NOW IT IS HEREBY AGREED AS FOLLOWS:

1. AMENDMENT OF CHALLENGED PROVISION:
The clause stipulating "${primaryTrap}" is hereby DELETED in its entirety and REPLACED with the following text:

"Amended Clause:
In the event of any payment delay or operational variation, the liability shall be subject to simple interest not exceeding 1.5% per month, with a mandatory 10-day grace period. No compounding penalty, administrative fee, or automatic forfeiture shall apply. In case of early termination or prepayment, no exit fee shall be levied after completion of 6 months, and any security deposit shall be refunded within 15 calendar days."

2. CONTINUED VALIDITY:
All other terms and conditions of ${docTitle} shall remain in full force and effect. In the event of any conflict between the principal agreement and this Addendum, the terms of this Addendum shall prevail.

IN WITNESS WHEREOF, the parties hereto have signed this Addendum:

_______________________                    _______________________
Signature: Party A                          Signature: Party B
Name:                                       Name:
Date:                                       Date:`,
  };

  // --- DOCUMENT 4: CONSUMER COMPLAINT DOSSIER (NCH 1915 / e-Daakhil) ---
  const consumerComplaint: ForgedDocument = {
    id: 'doc-consumer-complaint',
    type: 'consumer_complaint',
    title: 'National Consumer Forum (NCH / e-Daakhil) Complaint',
    badge: 'e-Daakhil Ready',
    summary: 'Consumer Disputes Redressal Commission complaint format with statement of facts.',
    statutoryBasis: 'Section 35, Consumer Protection Act 2019 / National Consumer Helpline 1915',
    recipientRole: 'District Consumer Disputes Redressal Commission / NCH Portal',
    lastUpdatedFromChat: memoryAdaptedBadge,
    content: `BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION
(Complaint Under Section 35 of the Consumer Protection Act, 2019)

COMPLAINANT:
[Citizen / Consumer Name]
Address & Contact Details

VERSUS

OPPOSITE PARTY:
${opponentRole}
Address & Corporate Office

MEMORANDUM OF COMPLAINT

1. FACTS OF THE CASE:
1.1 The Complainant availed the services / entered into agreement ${docTitle} with the Opposite Party for valuable consideration.
1.2 The Opposite Party insisted upon standard form adhesion clauses without allowing negotiation, specifically inserting ${primaryTrap}.${userFactualSnippet}

2. UNFAIR CONTRACT & DEFICIENCY IN SERVICE:
2.1 Under Section 2(46) of the Consumer Protection Act 2019, terms imposing unreasonable penalty or unilateral lock-in qualify as Unfair Contract Terms.
2.2 The Opposite Party's actions cause grave mental agony, severe financial distress, and constitute gross Deficiency in Service under Section 2(11).${userOfferSnippet}

3. PRAYERS FOR RELIEF:
The Complainant respectfully prays that this Hon'ble Commission be pleased to:
a) Direct the Opposite Party to withdraw and cease enforcement of ${primaryTrap};
b) Direct the Opposite Party to accept fair settlement of ${memory.userProposedOffer || 'principal amount without penal surcharges'};
c) Award compensation of ₹25,000 towards harassment and litigation expenses.

VERIFICATION:
Verified at on this ${now} that the contents of paragraphs 1 to 3 are true and correct to my knowledge.

Complainant / Deponent`,
  };

  return {
    docId: doc.docId,
    docTitle,
    domain,
    memory,
    documents: [statutoryNotice, settlementDoc, addendumDoc, consumerComplaint],
    generatedAt: now,
  };
}
