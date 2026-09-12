"""
Stage 4 in AWS Step Functions & Agentic Tool: Multi-Engine Mathematical Execution Tool.
Performs deterministic mathematical projections without LLM hallucinations.
Supports 4 specialized calculation engines:
1. Compounding Penalty Engine (Rental leases, delayed invoices)
2. Loan EMI & Early Foreclosure Engine (Bank loans, sanction letters)
3. Tiered Utility Tariff Slab Engine (Electricity & power bills)
4. Custom Stepped Formula Synthesizer (Arbitrary document formulas)
"""
from typing import Any, Dict, List, Optional
import json
import math

def calculate_penalty_projection(
    principal: float,
    annual_rate_percent: float = 0.0,
    flat_penalty_per_month: float = 0.0,
    compounding_frequency: str = "monthly",
    durations_months: Optional[List[int]] = None
) -> Dict[str, Any]:
    """Engine 1: Compounding Penalty Engine for Leases & Invoices"""
    if durations_months is None:
        durations_months = [1, 3, 6, 12]

    principal = max(0.0, float(principal))
    annual_rate = max(0.0, float(annual_rate_percent)) / 100.0
    flat_fee = max(0.0, float(flat_penalty_per_month))

    comp_freq_lower = compounding_frequency.lower()
    if "daily" in comp_freq_lower:
        n = 365
    elif "quarterly" in comp_freq_lower:
        n = 4
    elif "annual" in comp_freq_lower or "yearly" in comp_freq_lower:
        n = 1
    else:
        n = 12  # monthly default

    projections = []
    for m in durations_months:
        t_years = m / 12.0
        if annual_rate > 0:
            compounded_amount = principal * math.pow(1.0 + (annual_rate / n), n * t_years)
            interest_accrued = compounded_amount - principal
        else:
            compounded_amount = principal
            interest_accrued = 0.0

        accumulated_flat_fees = flat_fee * m
        total_liability = compounded_amount + accumulated_flat_fees
        total_penalty = interest_accrued + accumulated_flat_fees

        projections.append({
            "months": m,
            "days": m * 30,
            "principal": round(principal, 2),
            "interestAccrued": round(interest_accrued, 2),
            "flatFees": round(accumulated_flat_fees, 2),
            "totalPenalty": round(total_penalty, 2),
            "totalLiability": round(total_liability, 2),
            "percentageIncrease": round((total_penalty / principal * 100.0), 1) if principal > 0 else 0.0
        })

    summary_6m = next((p for p in projections if p["months"] == 6), projections[-1])
    narrative = (
        f"For a base liability of ₹{principal:,.2f} at {annual_rate_percent}% p.a. interest "
        f"and ₹{flat_fee:,.2f}/month late penalty, if left unpaid for {summary_6m['months']} months, "
        f"you will incur ₹{summary_6m['totalPenalty']:,.2f} in penalties, bringing total liability to ₹{summary_6m['totalLiability']:,.2f} "
        f"(+{summary_6m['percentageIncrease']}% increase)."
    )

    return {
        "engine": "compound_penalty",
        "status": "success",
        "principal": principal,
        "annualRatePercent": annual_rate_percent,
        "flatPenaltyPerMonth": flat_fee,
        "compoundingFrequency": compounding_frequency,
        "projections": projections,
        "narrative": narrative
    }

def calculate_loan_emi_and_foreclosure(
    principal: float,
    annual_interest_rate_percent: float,
    tenure_months: int,
    foreclosure_charge_percent: float = 4.0,
    lock_in_months: int = 12,
    missed_emi_penal_rate_percent: float = 28.0,
    gst_percent: float = 18.0
) -> Dict[str, Any]:
    """Engine 2: Loan EMI Amortization & Early Foreclosure Engine"""
    principal = max(1.0, float(principal))
    tenure_months = max(1, int(tenure_months))
    annual_rate = max(0.0001, float(annual_interest_rate_percent))
    r = annual_rate / (12.0 * 100.0)

    # Standard reducing balance EMI formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
    pow_factor = math.pow(1.0 + r, tenure_months)
    monthly_emi = (principal * r * pow_factor) / (pow_factor - 1.0)
    total_payment = monthly_emi * tenure_months
    total_interest = total_payment - principal

    # Pre-compute outstanding balances and foreclosure penalties at key milestones
    milestone_months = [m for m in [6, 12, 24, 36, 48, 60] if m < tenure_months]
    if not milestone_months:
        milestone_months = [max(1, tenure_months // 2)]

    milestone_projections = []
    for m in milestone_months:
        # Outstanding principal at month m: P_m = P * ((1+r)^n - (1+r)^m) / ((1+r)^n - 1)
        remaining_balance = principal * (math.pow(1.0 + r, tenure_months) - math.pow(1.0 + r, m)) / (pow_factor - 1.0)
        remaining_balance = max(0.0, remaining_balance)

        is_in_lockin = m < lock_in_months
        raw_fee = (remaining_balance * (foreclosure_charge_percent / 100.0)) if not is_in_lockin else 0.0
        gst_on_fee = raw_fee * (gst_percent / 100.0)
        total_foreclosure_cost = raw_fee + gst_on_fee
        total_to_close = remaining_balance + total_foreclosure_cost

        milestone_projections.append({
            "month": m,
            "isLockInActive": is_in_lockin,
            "remainingPrincipal": round(remaining_balance, 2),
            "foreclosureFee": round(raw_fee, 2),
            "gstOnFee": round(gst_on_fee, 2),
            "totalForeclosureCost": round(total_foreclosure_cost, 2),
            "totalToCloseLoan": round(total_to_close, 2),
            "effectivePenaltyPct": round((total_foreclosure_cost / remaining_balance * 100.0), 2) if remaining_balance > 0 else 0.0
        })

    # One missed EMI penalty
    monthly_penal_rate = (missed_emi_penal_rate_percent / 100.0) / 12.0
    penal_interest_per_missed_emi = monthly_emi * monthly_penal_rate

    narrative = (
        f"Loan of ₹{principal:,.2f} at {annual_rate:.2f}% p.a. over {tenure_months} months has a fixed monthly EMI of "
        f"₹{monthly_emi:,.2f}. Total interest over the tenure is ₹{total_interest:,.2f}. "
        f"Early foreclosure carries a {foreclosure_charge_percent}% penalty + {gst_percent}% GST (Lock-in: {lock_in_months} months). "
        f"Missed EMIs attract {missed_emi_penal_rate_percent}% p.a. penal interest (₹{penal_interest_per_missed_emi:,.2f}/month)."
    )

    return {
        "engine": "loan_emi_foreclosure",
        "status": "success",
        "principal": principal,
        "annualInterestRatePercent": annual_rate,
        "tenureMonths": tenure_months,
        "monthlyEmi": round(monthly_emi, 2),
        "totalPayment": round(total_payment, 2),
        "totalInterest": round(total_interest, 2),
        "foreclosureChargePercent": foreclosure_charge_percent,
        "lockInPeriodMonths": lock_in_months,
        "missedEmiPenalRatePercent": missed_emi_penal_rate_percent,
        "penalInterestPerMissedEmi": round(penal_interest_per_missed_emi, 2),
        "milestones": milestone_projections,
        "narrative": narrative
    }

def calculate_tiered_power_tariff(
    units_kwh: float,
    slabs: Optional[List[Dict[str, Any]]] = None,
    fixed_charge_per_kw: float = 110.0,
    sanctioned_load_kw: float = 4.0,
    fuel_adjustment_per_kwh: float = 0.45,
    electricity_duty_percent: float = 9.0,
    peak_units_kwh: float = 0.0,
    peak_surcharge_percent: float = 20.0
) -> Dict[str, Any]:
    """Engine 3: Tiered Electricity & Utility Tariff Slab Engine"""
    units_kwh = max(0.0, float(units_kwh))
    fixed_charge_per_kw = max(0.0, float(fixed_charge_per_kw))
    sanctioned_load_kw = max(0.5, float(sanctioned_load_kw))
    fuel_rate = max(0.0, float(fuel_adjustment_per_kwh))
    duty_pct = max(0.0, float(electricity_duty_percent))

    # Standard Indian utility telescopic slab structure (e.g. BESCOM LT-2)
    if not slabs:
        slabs = [
            {"limit": 50, "rate": 4.15, "label": "0 - 50 units (Lifeline)"},
            {"limit": 50, "rate": 5.60, "label": "51 - 100 units"},
            {"limit": 100, "rate": 7.15, "label": "101 - 200 units"},
            {"limit": 999999, "rate": 8.20, "label": "> 200 units (High Usage)"}
        ]

    remaining_units = units_kwh
    slab_breakdown = []
    total_energy_charge = 0.0

    for slab in slabs:
        if remaining_units <= 0:
            break
        limit = slab.get("limit", 999999)
        rate = slab.get("rate", 5.0)
        label = slab.get("label", "Slab")

        units_in_slab = min(remaining_units, limit)
        charge = units_in_slab * rate
        total_energy_charge += charge
        remaining_units -= units_in_slab

        slab_breakdown.append({
            "label": label,
            "units": round(units_in_slab, 1),
            "ratePerUnit": rate,
            "charge": round(charge, 2)
        })

    # Fixed load charge
    total_fixed_charge = sanctioned_load_kw * fixed_charge_per_kw
    # Fuel Adjustment Charge (FAC)
    total_fac = units_kwh * fuel_rate
    # Peak-hour Time-of-Day (ToD) surcharge
    peak_surcharge = peak_units_kwh * (slabs[-1]["rate"] * (peak_surcharge_percent / 100.0))
    # Electricity duty (applied on energy charge + fixed charge)
    taxable_amount = total_energy_charge + total_fixed_charge
    total_duty = taxable_amount * (duty_pct / 100.0)

    net_bill_amount = total_energy_charge + total_fixed_charge + total_fac + peak_surcharge + total_duty

    narrative = (
        f"For consumption of {units_kwh:,.1f} kWh, Energy Charge is ₹{total_energy_charge:,.2f} across {len(slab_breakdown)} telescopic slabs. "
        f"Fixed capacity charge is ₹{total_fixed_charge:,.2f} ({sanctioned_load_kw} kW @ ₹{fixed_charge_per_kw}/kW). "
        f"Fuel Adjustment Charge (FAC) is ₹{total_fac:,.2f} and State Electricity Duty ({duty_pct}%) is ₹{total_duty:,.2f}, "
        f"resulting in a Net Total Bill of ₹{net_bill_amount:,.2f}."
    )

    return {
        "engine": "tiered_power_tariff",
        "status": "success",
        "unitsKwh": units_kwh,
        "sanctionedLoadKw": sanctioned_load_kw,
        "slabBreakdown": slab_breakdown,
        "energyCharge": round(total_energy_charge, 2),
        "fixedCharge": round(total_fixed_charge, 2),
        "fuelAdjustmentCharge": round(total_fac, 2),
        "peakSurcharge": round(peak_surcharge, 2),
        "electricityDuty": round(total_duty, 2),
        "dutyPercent": duty_pct,
        "totalNetBill": round(net_bill_amount, 2),
        "averageCostPerUnit": round(net_bill_amount / units_kwh, 2) if units_kwh > 0 else 0.0,
        "narrative": narrative
    }

def evaluate_custom_formula(
    formula_name: str,
    formula_description: str,
    base_amount: float,
    step_rules: Optional[List[Dict[str, Any]]] = None,
    milestone_days: Optional[List[int]] = None
) -> Dict[str, Any]:
    """Engine 4: Custom Stepped Formula Synthesizer for arbitrary PDF documents"""
    base_amount = max(0.0, float(base_amount))
    if milestone_days is None:
        milestone_days = [5, 15, 30, 60, 90]

    if not step_rules:
        # Default stepped delay structure if not specified
        step_rules = [
            {"maxDay": 3, "flatFee": 0.0, "dailyRatePct": 0.0, "label": "Grace Period (Day 1 - 3)"},
            {"maxDay": 15, "flatFee": 250.0, "dailyRatePct": 0.1, "label": "Tier 1 Delay (Day 4 - 15)"},
            {"maxDay": 30, "flatFee": 500.0, "dailyRatePct": 0.2, "label": "Tier 2 Delay (Day 16 - 30)"},
            {"maxDay": 9999, "flatFee": 1000.0, "dailyRatePct": 0.3, "label": "Tier 3 Critical Delay (Day 31+)"}
        ]

    projections = []
    for day in milestone_days:
        # Find matching rule
        active_rule = next((r for r in step_rules if day <= r.get("maxDay", 9999)), step_rules[-1])
        flat_fee = float(active_rule.get("flatFee", 0.0))
        daily_rate = float(active_rule.get("dailyRatePct", 0.0)) / 100.0

        daily_accrual = base_amount * daily_rate * day
        total_penalty = flat_fee + daily_accrual
        total_liability = base_amount + total_penalty

        projections.append({
            "day": day,
            "ruleApplied": active_rule.get("label", "Standard"),
            "flatFee": round(flat_fee, 2),
            "percentagePenalty": round(daily_accrual, 2),
            "totalPenalty": round(total_penalty, 2),
            "totalLiability": round(total_liability, 2),
            "effectivePenaltyPct": round((total_penalty / base_amount * 100.0), 1) if base_amount > 0 else 0.0
        })

    summary_30d = next((p for p in projections if p["day"] == 30), projections[-1])
    narrative = (
        f"Under '{formula_name}' ({formula_description}), a base amount of ₹{base_amount:,.2f} "
        f"delayed by {summary_30d['day']} days accumulates ₹{summary_30d['totalPenalty']:,.2f} in deterministic penalties, "
        f"bringing total liability to ₹{summary_30d['totalLiability']:,.2f} (+{summary_30d['effectivePenaltyPct']}%)."
    )

    return {
        "engine": "custom_formula",
        "status": "success",
        "formulaName": formula_name,
        "formulaDescription": formula_description,
        "baseAmount": base_amount,
        "projections": projections,
        "narrative": narrative
    }

def unified_math_router(params: Dict[str, Any]) -> Dict[str, Any]:
    """Inspects calculationType or keys to invoke the exact deterministic engine"""
    calc_type = params.get("calculationType", "").lower()

    # Route 1: Loan EMI & Foreclosure
    if calc_type in ["loan", "loan_emi", "loan_emi_foreclosure"] or "tenureMonths" in params or "monthlyEmi" in params:
        return calculate_loan_emi_and_foreclosure(
            principal=float(params.get("principal", params.get("loanAmount", 500000.0))),
            annual_interest_rate_percent=float(params.get("annualInterestRatePercent", params.get("rate", 10.5))),
            tenure_months=int(params.get("tenureMonths", params.get("tenure", 60))),
            foreclosure_charge_percent=float(params.get("foreclosureChargePercent", 4.0)),
            lock_in_months=int(params.get("lockInPeriodMonths", params.get("lockInMonths", 12))),
            missed_emi_penal_rate_percent=float(params.get("missedEmiPenalRatePercent", 28.0)),
            gst_percent=float(params.get("gstPercent", 18.0))
        )

    # Route 2: Tiered Power & Utility Tariff Slabs
    if calc_type in ["power", "tariff", "electricity", "tiered_power_tariff"] or "unitsKwh" in params or "slabs" in params:
        return calculate_tiered_power_tariff(
            units_kwh=float(params.get("unitsKwh", params.get("units", 280.0))),
            slabs=params.get("slabs"),
            fixed_charge_per_kw=float(params.get("fixedChargePerKw", 110.0)),
            sanctioned_load_kw=float(params.get("sanctionedLoadKw", 4.0)),
            fuel_adjustment_per_kwh=float(params.get("fuelAdjustmentPerKwh", 0.45)),
            electricity_duty_percent=float(params.get("electricityDutyPercent", 9.0)),
            peak_units_kwh=float(params.get("peakUnitsKwh", 0.0)),
            peak_surcharge_percent=float(params.get("peakSurchargePercent", 20.0))
        )

    # Route 3: Custom Stepped Formula
    if calc_type in ["custom", "custom_formula"] or "stepRules" in params:
        return evaluate_custom_formula(
            formula_name=str(params.get("formulaName", "Custom Contract Penalty")),
            formula_description=str(params.get("formulaDescription", "Stepped delay surcharge")),
            base_amount=float(params.get("baseAmount", params.get("principal", 15000.0))),
            step_rules=params.get("stepRules"),
            milestone_days=params.get("milestoneDays")
        )

    # Route 4: Default Compounding Penalty Engine (Leases & Invoices)
    return calculate_penalty_projection(
        principal=float(params.get("principal", params.get("amount", 35000.0))),
        annual_rate_percent=float(params.get("annualRatePercent", params.get("rate", 24.0))),
        flat_penalty_per_month=float(params.get("flatPenaltyPerMonth", params.get("flatFee", 500.0))),
        compounding_frequency=str(params.get("compoundingFrequency", "monthly"))
    )

def lambda_handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    print("Stage 4 - Multi-Engine Math Calculator executing with event keys:", list(event.keys()))

    # Case 1: Step Functions Stage 4 execution
    if "docId" in event:
        fin = event.get("financialParameters", {})
        # If no explicit calculationType is set, infer from docType
        doc_type = event.get("docType", "").lower()
        if "calculationType" not in fin:
            if "loan" in doc_type:
                fin["calculationType"] = "loan_emi_foreclosure"
            elif "power" in doc_type or "electric" in doc_type or "bescom" in doc_type or "utility" in doc_type:
                fin["calculationType"] = "tiered_power_tariff"
            else:
                fin["calculationType"] = "compound_fee"

        calc_result = unified_math_router(fin)
        event["projections"] = calc_result
        return event

    # Case 2: Bedrock Agent Action Group invocation
    is_bedrock_agent = "actionGroup" in event and "apiPath" in event
    params = {}
    if is_bedrock_agent:
        request_body = event.get("requestBody", {}).get("content", {}).get("application/json", {}).get("properties", [])
        if isinstance(request_body, list):
            for prop in request_body:
                params[prop.get("name")] = prop.get("value")
        elif isinstance(request_body, dict):
            params = request_body

        for p in event.get("parameters", []):
            params[p.get("name")] = p.get("value")
    else:
        if "body" in event:
            b = event["body"]
            params = json.loads(b) if isinstance(b, str) else b
        else:
            params = event

    result = unified_math_router(params)

    if is_bedrock_agent:
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": event.get("actionGroup"),
                "apiPath": event.get("apiPath"),
                "httpMethod": event.get("httpMethod", "POST"),
                "httpStatusCode": 200,
                "responseBody": {
                    "application/json": {
                        "body": json.dumps(result)
                    }
                }
            }
        }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key"
        },
        "body": json.dumps(result)
    }
