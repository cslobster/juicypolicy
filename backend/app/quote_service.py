import json
import re
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


def convert_quote_text_to_json(text_result: str) -> dict:
    """Use Gemini to convert scraped quote text to structured JSON."""
    if not client:
        return {"error": "Gemini API key not configured", "raw_text": text_result}

    try:
        raw_plan_indicators = len(
            re.findall(r'(Bronze|Silver|Gold|Platinum)\s+(HMO|PPO|EPO)', text_result, re.IGNORECASE)
        )
        print(f"Estimated {raw_plan_indicators} plans in raw text")

        prompt = f"""You are a precise data extraction assistant. Extract ALL health insurance plans from the text below.

IMPORTANT: The text contains approximately {raw_plan_indicators if raw_plan_indicators > 0 else 'multiple'} insurance plans. You MUST extract EVERY SINGLE plan. Do not skip any plans.

CRITICAL REQUIREMENTS:
1. Extract ALL plans - do not stop early or skip any plans
2. Return ONLY valid JSON - no markdown, no explanations, no extra text
3. Use the EXACT schema structure shown below
4. All numeric fields must be numbers (not strings)
5. All text fields must be strings
6. If a field is missing, use null for numbers or empty string for text
7. Each unique plan name with unique carrier should be a separate entry

Required JSON Schema:
{{
  "plans": [
    {{
      "plan_name": "Full plan name as shown",
      "carrier": "Insurance carrier name (Blue Shield, Kaiser, Health Net, etc)",
      "plan_type": "Bronze, Silver, Gold, or Platinum",
      "network_type": "HMO, PPO, or EPO",
      "monthly_premium": 0.00,
      "deductible": 0,
      "max_out_of_pocket": 0,
      "primary_care_copay": "$0 or description",
      "specialist_copay": "$0 or description",
      "emergency_room": "$0 or description",
      "generic_drugs": "$0 or description",
      "features": ["feature1", "feature2", "feature3"]
    }}
  ],
  "total_plans_found": 0
}}

Field Extraction Rules:
- plan_name: Extract full plan name including metal tier and carrier
- carrier: Extract carrier name (Blue Shield of CA, Kaiser Permanente, Health Net, Oscar, etc)
- plan_type: Must be one of: "Bronze", "Silver", "Gold", "Platinum"
- network_type: Must be one of: "HMO", "PPO", "EPO"
- monthly_premium: Extract monthly cost as decimal number (e.g., 450.50)
- deductible: Extract annual deductible as integer (e.g., 6000)
- max_out_of_pocket: Extract max out of pocket as integer (e.g., 8500)
- primary_care_copay: Extract copay with $ sign (e.g., "$25", "No charge after deductible")
- specialist_copay: Extract specialist visit copay
- emergency_room: Extract ER copay or cost
- generic_drugs: Extract generic prescription cost
- features: Array of key benefits, advantages, or special features (3-5 items)
- total_plans_found: The total count of plans you extracted (for verification)

Input text to parse (extract ALL plans from this):

{text_result}

Remember: Return ONLY the JSON object with ALL plans."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        result_text = response.text.strip()

        if result_text.startswith("```"):
            lines = result_text.split("\n")
            result_text = "\n".join(lines[1:-1]) if len(lines) > 2 else result_text
            if result_text.startswith("json"):
                result_text = result_text[4:].strip()

        parsed_json = json.loads(result_text)

        if "plans" not in parsed_json:
            raise ValueError("Response missing 'plans' array")

        for plan in parsed_json["plans"]:
            required_fields = ["plan_name", "carrier", "plan_type", "network_type",
                               "monthly_premium", "deductible", "max_out_of_pocket"]
            for field in required_fields:
                if field not in plan:
                    plan[field] = None if field in ["monthly_premium", "deductible", "max_out_of_pocket"] else ""

            if plan.get("monthly_premium") and isinstance(plan["monthly_premium"], str):
                try:
                    plan["monthly_premium"] = float(plan["monthly_premium"].replace("$", "").replace(",", ""))
                except ValueError:
                    plan["monthly_premium"] = 0.0

            for field in ["deductible", "max_out_of_pocket"]:
                if plan.get(field) and isinstance(plan[field], str):
                    try:
                        plan[field] = int(plan[field].replace("$", "").replace(",", ""))
                    except ValueError:
                        plan[field] = 0

        plan_count = len(parsed_json["plans"])
        print(f"Successfully parsed {plan_count} plans")

        return parsed_json

    except Exception as e:
        print(f"Error converting quote text to JSON: {e}")
        import traceback
        print(traceback.format_exc())
        return {
            "error": str(e),
            "plans": [],
            "raw_text": text_result[:5000] + "..." if len(text_result) > 5000 else text_result,
        }
