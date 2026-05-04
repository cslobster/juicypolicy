import os
import requests
from typing import List, Dict, Any, Optional


HS_BASE = os.getenv("HEALTHSHERPA_BASE_URL", "https://api.one.healthsherpa.com")
HS_API_KEY = os.getenv("HEALTHSHERPA_API_KEY", "")
HS_TIMEOUT = float(os.getenv("HEALTHSHERPA_TIMEOUT", "20"))


class HealthSherpaError(Exception):
    pass


def _headers() -> Dict[str, str]:
    if not HS_API_KEY:
        raise HealthSherpaError("HEALTHSHERPA_API_KEY is not set")
    return {"x-api-key": HS_API_KEY, "Accept": "application/json"}


def get_county_fips(zip_code: str) -> Optional[Dict[str, str]]:
    """Resolve a ZIP -> first matching county. Returns {fips_code, name, state} or None."""
    r = requests.get(
        f"{HS_BASE}/v1/reference/counties",
        params={"zip_code": zip_code},
        headers=_headers(),
        timeout=HS_TIMEOUT,
    )
    if r.status_code == 404:
        return None
    if not r.ok:
        raise HealthSherpaError(f"Counties API {r.status_code}: {r.text[:200]}")
    counties = r.json().get("counties", [])
    return counties[0] if counties else None


_METAL_DISPLAY = {
    "bronze": "Bronze",
    "expanded_bronze": "Bronze",
    "silver": "Silver",
    "gold": "Gold",
    "platinum": "Platinum",
    "catastrophic": "Catastrophic",
}


def _clean_carrier_name(name: str) -> str:
    """Shorten common verbose carrier names for display while keeping logo matches working."""
    if not name:
        return name
    replacements = [
        (" Foundation Health Plan, Inc.", " Permanente"),
        (", Inc.", ""),
        (" of California", ""),
        (" Life and Health Insurance Company", ""),
        (" Health Plan", ""),
    ]
    out = name
    for old, new in replacements:
        out = out.replace(old, new)
    return out.strip()


def _to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _to_int(v: Any) -> Optional[int]:
    f = _to_float(v)
    return int(f) if f is not None else None


def _normalize_plan(plan: Dict[str, Any]) -> Dict[str, Any]:
    """Map HealthSherpa PlanQuoteResult -> frontend HealthPlan shape."""
    pricing = plan.get("pricing") or {}
    details = plan.get("details") or {}
    issuer = plan.get("issuer") or {}
    documents = plan.get("documents") or {}

    net = _to_float(pricing.get("net_premium"))
    gross = _to_float(pricing.get("gross_premium"))
    monthly_premium = net if net is not None else gross

    metal_raw = details.get("metal_level") or ""
    plan_type = _METAL_DISPLAY.get(metal_raw, metal_raw.replace("_", " ").title() if metal_raw else "")

    network_raw = details.get("plan_type") or ""
    network_type = network_raw.upper() if network_raw else ""

    features: List[str] = []
    if details.get("hsa_eligible"):
        features.append("HSA Eligible")
    if details.get("is_standardized"):
        features.append("Standardized")
    if metal_raw == "expanded_bronze":
        features.append("Expanded Bronze")

    return {
        "plan_name": plan.get("name") or "",
        "carrier": _clean_carrier_name(issuer.get("name") or ""),
        "plan_type": plan_type,
        "network_type": network_type,
        "monthly_premium": monthly_premium,
        "gross_premium": gross,
        "deductible": _to_int(details.get("deductible_individual")),
        "deductible_family": _to_int(details.get("deductible_family")),
        "max_out_of_pocket": _to_int(details.get("moop_individual")),
        "max_out_of_pocket_family": _to_int(details.get("moop_family")),
        "primary_care_copay": details.get("primary_care_summary"),
        "specialist_copay": details.get("specialist_summary"),
        "urgent_care": details.get("urgent_care_summary"),
        "emergency_room": details.get("urgent_care_summary"),
        "generic_drugs": details.get("generic_rx_summary"),
        "hsa_eligible": bool(details.get("hsa_eligible")),
        "features": features,
        # extras the frontend doesn't read today but worth keeping for chat context
        "plan_id": plan.get("plan_id"),
        "issuer_id": issuer.get("issuer_id"),
        "sbc_url": documents.get("sbc_url"),
    }


def fetch_health_quotes(
    *,
    zip_code: str,
    fips_code: str,
    state: Optional[str],
    age: int,
    gender: Optional[str] = None,
    annual_income: Optional[float] = None,
    household_size: int = 1,
    additional_ages: Optional[List[int]] = None,
    uses_tobacco: bool = False,
    plan_year: int = 2026,
    page_size: int = 50,
) -> Dict[str, Any]:
    """Run a single ACA on-exchange medical quote against HealthSherpa.

    Returns {plans: [...], meta: {...}, raw_count: N} with plans pre-normalized to the
    frontend HealthPlan shape.
    """
    applicants: List[Dict[str, Any]] = [
        {
            "member_id": "primary",
            "age": age,
            "relationship": "primary",
            "uses_tobacco": uses_tobacco,
        }
    ]
    if gender in ("male", "female"):
        applicants[0]["gender"] = gender

    for idx, dep_age in enumerate(additional_ages or [], start=1):
        applicants.append({
            "member_id": f"member_{idx}",
            "age": dep_age,
            "relationship": "dependent" if dep_age < 26 else "spouse" if idx == 1 else "dependent",
            "uses_tobacco": uses_tobacco,
        })

    household: Dict[str, Any] = {
        "household_size": max(household_size, len(applicants)),
        "applicants": applicants,
    }
    if annual_income is not None:
        household["annual_income"] = annual_income

    body: Dict[str, Any] = {
        "context": {
            "product": "aca",
            "exchange": "on_exchange",
            "coverage_family": "medical",
            "coverage_type": "medical",
            "plan_year": plan_year,
        },
        "location": {
            "zip_code": zip_code,
            "fips_code": fips_code,
        },
        "household": household,
        "sort": {"field": "premium", "direction": "asc"},
        "page": {"number": 1, "size": page_size},
        "include": ["pricing", "details", "documents"],
    }
    if state:
        body["location"]["state"] = state

    headers = {**_headers(), "Content-Type": "application/json"}
    r = requests.post(f"{HS_BASE}/v1/quotes", json=body, headers=headers, timeout=HS_TIMEOUT)
    if not r.ok:
        raise HealthSherpaError(f"Quote API {r.status_code}: {r.text[:300]}")

    data = r.json()
    raw_plans = data.get("plans", []) or []
    normalized = [_normalize_plan(p) for p in raw_plans]

    return {
        "plans": normalized,
        "meta": data.get("meta", {}),
        "raw_count": len(raw_plans),
    }
