import os
import json
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

from . import models
from .schemas import QuoteRequest, QuoteCreateResponse, QuoteStatusResponse
from .database import engine, get_db
from .quote_service import convert_quote_text_to_json

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

WORKER_AUTH_TOKEN = os.getenv("WORKER_AUTH_TOKEN", "juicypolicy_worker_token_2026")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JuicyPolicy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_worker_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing worker token")
    token = authorization.split(" ", 1)[1]
    if token != WORKER_AUTH_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid worker token")
    return token


@app.get("/")
def root():
    return {"message": "JuicyPolicy API is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/quote", response_model=QuoteCreateResponse)
def create_quote(request: QuoteRequest, db: Session = Depends(get_db)):
    """Create a new quote request and trigger worker if on Modal."""
    customer_data = request.model_dump()
    db_quote = models.Quote(
        customer_data=customer_data,
        quote_status="pending",
        status_message="Queued for processing...",
        has_quote=False,
    )
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)

    # Trigger Modal worker if running on Modal
    try:
        from modal_app import scrape_quote_task

        ages = [customer_data.get("age")]
        if customer_data.get("ages_list"):
            ages.extend(customer_data["ages_list"])
        income_raw = customer_data.get("income", "0")
        income_cleaned = income_raw.replace("$", "").replace(",", "").strip()
        try:
            income = str(int(float(income_cleaned)))
        except (ValueError, TypeError):
            income = "50000"

        scrape_quote_task.spawn(
            quote_id=db_quote.quote_id,
            zip_code=customer_data.get("zip", ""),
            income=income,
            ages=ages,
        )
        print(f"[Quote {db_quote.quote_id}] Modal worker triggered")
    except ImportError:
        print(f"[Quote {db_quote.quote_id}] Running locally, waiting for worker")

    return db_quote


@app.get("/api/quote/{quote_id}", response_model=QuoteStatusResponse)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    """Get quote status and data."""
    quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


# --- Worker endpoints ---

@app.get("/api/quotes/next-pending")
def get_next_pending(db: Session = Depends(get_db), token: str = Depends(verify_worker_token)):
    """Get the next pending quote for the worker to process."""
    quote = (
        db.query(models.Quote)
        .filter(models.Quote.quote_status == "pending")
        .order_by(models.Quote.created_at.asc())
        .first()
    )
    if quote is None:
        raise HTTPException(status_code=404, detail="No pending quotes")

    customer_data = quote.customer_data
    ages = [customer_data.get("age")]
    if customer_data.get("ages_list"):
        ages.extend(customer_data["ages_list"])

    income_raw = customer_data.get("income", "0")
    income_cleaned = income_raw.replace("$", "").replace(",", "").strip()
    try:
        income = str(int(float(income_cleaned)))
    except (ValueError, TypeError):
        income = "50000"

    return {
        "quote_id": quote.quote_id,
        "zip_code": customer_data.get("zip", ""),
        "income": income,
        "ages": ages,
    }


@app.post("/api/quotes/{quote_id}/status")
def update_quote_status(
    quote_id: int,
    body: dict,
    db: Session = Depends(get_db),
    token: str = Depends(verify_worker_token),
):
    """Worker reports progress updates."""
    quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")

    if "quote_status" in body:
        quote.quote_status = body["quote_status"]
    if "status_message" in body:
        quote.status_message = body["status_message"]

    db.commit()
    return {"ok": True}


@app.post("/api/quotes/{quote_id}/result")
def submit_quote_result(
    quote_id: int,
    result: dict,
    db: Session = Depends(get_db),
    token: str = Depends(verify_worker_token),
):
    """Submit scraping result from the worker."""
    quote = db.query(models.Quote).filter(models.Quote.quote_id == quote_id).first()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")

    if isinstance(result, dict) and result.get("status") == "error":
        quote.quote_data = result
        quote.has_quote = False
        quote.quote_status = "error"
        quote.status_message = f"Error: {result.get('error', 'Unknown error')[:150]}"
        print(f"[Quote {quote_id}] Error: {result.get('error')}")
    else:
        text_result = result.get("results", "")
        if text_result:
            quote.quote_status = "converting"
            quote.status_message = "Parsing plan data with AI..."
            db.commit()

            print(f"[Quote {quote_id}] Converting scraped text to JSON with Gemini...")
            structured_data = convert_quote_text_to_json(text_result)
            structured_data["_raw_text"] = text_result
            quote.quote_data = structured_data
            plan_count = len(structured_data.get("plans", []))
            quote.status_message = f"Done! Found {plan_count} plans."
            print(f"[Quote {quote_id}] Parsed {plan_count} plans")
        else:
            quote.quote_data = result
            quote.status_message = "Done."

        quote.has_quote = True
        quote.quote_status = "quoted"

    db.commit()
    db.refresh(quote)
    return {"message": "Result submitted", "quote_id": quote.quote_id, "quote_status": quote.quote_status}


# --- Chat endpoint ---

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    quote_id: int
    message: str
    history: List[ChatMessage] = []
    selected_plan: Optional[dict] = None


@app.post("/api/chat")
def chat_with_quote(request: ChatRequest, db: Session = Depends(get_db)):
    """Chat about quote results using Gemini with plan data as context."""
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    quote = db.query(models.Quote).filter(models.Quote.quote_id == request.quote_id).first()
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")

    # Build plan context
    plans = quote.quote_data.get("plans", []) if quote.quote_data else []
    customer = quote.customer_data or {}

    plans_summary = []
    for p in plans:
        plans_summary.append(
            f"- {p.get('plan_name','')}: {p.get('carrier','')}, {p.get('plan_type','')} {p.get('network_type','')}, "
            f"月保费${p.get('monthly_premium',0)}, 免赔额${p.get('deductible',0)}, "
            f"最高自付${p.get('max_out_of_pocket',0)}, 门诊{p.get('primary_care_copay','N/A')}, "
            f"专科{p.get('specialist_copay','N/A')}, 急诊{p.get('emergency_room','N/A')}, "
            f"处方药{p.get('generic_drugs','N/A')}"
        )

    # Build selected plan context
    selected_context = ""
    if request.selected_plan:
        sp = request.selected_plan
        selected_context = f"""

客户当前正在查看的计划（请优先围绕这个计划回答问题）:
- 计划名称: {sp.get('plan_name','')}
- 保险公司: {sp.get('carrier','')}
- 等级: {sp.get('plan_type','')} | 网络: {sp.get('network_type','')}
- 月保费: ${sp.get('monthly_premium',0)}
- 免赔额: ${sp.get('deductible',0)}
- 最高自付: ${sp.get('max_out_of_pocket',0)}
- 门诊费: {sp.get('primary_care_copay','N/A')}
- 专科: {sp.get('specialist_copay','N/A')}
- 急诊: {sp.get('emergency_room','N/A')}
- 处方药: {sp.get('generic_drugs','N/A')}
"""

    system_prompt = f"""你是鲜橙保险的智能顾问，专门帮助客户理解和选择健康保险计划。请用中文回答。

客户信息:
- 邮编: {customer.get('zip','')}
- 年收入: ${customer.get('income','')}
- 性别: {customer.get('sex','')}
- 年龄: {customer.get('age','')}
- 家庭人数: {customer.get('household_size','')}

以下是从 Covered California 获取的 {len(plans)} 个保险计划:
{chr(10).join(plans_summary)}
{selected_context}
请根据以上信息回答客户的问题。要求：
1. 先简短复述客户的问题
2. 回答3-5句话，包含关键数字，简洁不啰嗦
3. 用纯文本写段落，不要用任何特殊符号或格式
4. 如果客户选中了某个计划，围绕该计划回答
5. 语气亲切专业"""

    # Build conversation
    contents = [{"role": "user", "parts": [{"text": system_prompt + "\n\n请回复: 好的，我已了解您的保险方案信息，请问有什么可以帮您？"}]}]
    contents.append({"role": "model", "parts": [{"text": "好的，我已了解您的保险方案信息，请问有什么可以帮您？"}]})

    for msg in request.history:
        role = "user" if msg.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg.content}]})

    contents.append({"role": "user", "parts": [{"text": request.message}]})

    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
    )

    import re
    reply = response.text
    # Strip all markdown formatting
    reply = re.sub(r'\*\*(.+?)\*\*', r'\1', reply)  # **bold**
    reply = re.sub(r'\*(.+?)\*', r'\1', reply)       # *italic*
    reply = re.sub(r'^[\s]*[-*]\s+', '', reply, flags=re.MULTILINE)  # bullet lists
    reply = re.sub(r'^#+\s+', '', reply, flags=re.MULTILINE)  # headers
    reply = re.sub(r'\n{3,}', '\n\n', reply)  # excessive newlines

    # Find which plans are mentioned in the reply
    mentioned_plans = []
    for p in plans:
        name = p.get("plan_name", "")
        if name and name.lower() in reply.lower():
            mentioned_plans.append(name)

    return {"reply": reply, "mentioned_plans": mentioned_plans}
