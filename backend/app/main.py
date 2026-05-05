import os
import json
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

import re

from . import models
from .schemas import QuoteRequest, QuoteCreateResponse, QuoteStatusResponse
from .database import engine, get_db
from .quote_service import convert_quote_text_to_json
from .healthsherpa_service import (
    fetch_health_quotes,
    get_county_fips,
    HealthSherpaError,
)
from .agent_auth import (
    hash_password,
    verify_password,
    issue_token,
    require_agent,
    get_current_agent,
    RESERVED_USERNAMES,
    USERNAME_PATTERN,
)

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


# --- HealthSherpa-backed synchronous quote ---

class HealthSherpaQuoteRequest(BaseModel):
    name: Optional[str] = "Primary"
    sex: Optional[str] = None  # "Male" | "Female"
    age: int
    zip: str
    income: Optional[str] = None
    household_size: int = 1
    ages_list: Optional[List[int]] = None
    uses_tobacco: bool = False
    plan_year: int = 2026
    agent_username: Optional[str] = None


@app.post("/api/quote_v2", response_model=QuoteStatusResponse)
def create_quote_v2(req: HealthSherpaQuoteRequest, db: Session = Depends(get_db)):
    """Create + fulfill a health quote synchronously via HealthSherpa One API."""
    customer_data = req.model_dump()
    agent_id: Optional[int] = None
    if req.agent_username:
        slug = req.agent_username.strip().lower()
        from sqlalchemy import func as _func
        agent = (
            db.query(models.Agent)
            .filter(_func.btrim(models.Agent.username) == slug)
            .first()
        )
        if agent:
            agent_id = agent.id

    db_quote = models.Quote(
        customer_data=customer_data,
        quote_status="scraping",
        status_message="Calling HealthSherpa...",
        has_quote=False,
        agent_id=agent_id,
    )
    db.add(db_quote)
    db.commit()
    db.refresh(db_quote)

    try:
        county = get_county_fips(req.zip)
        if not county:
            raise HealthSherpaError(f"No county found for ZIP {req.zip}")

        income_val: Optional[float] = None
        if req.income:
            cleaned = req.income.replace("$", "").replace(",", "").strip()
            if cleaned:
                try:
                    income_val = float(cleaned)
                except ValueError:
                    income_val = None

        gender = None
        if req.sex:
            s = req.sex.lower()
            if s.startswith("m"):
                gender = "male"
            elif s.startswith("f"):
                gender = "female"

        result = fetch_health_quotes(
            zip_code=req.zip,
            fips_code=county["fips_code"],
            state=county.get("state"),
            age=req.age,
            gender=gender,
            annual_income=income_val,
            household_size=req.household_size,
            additional_ages=req.ages_list or [],
            uses_tobacco=req.uses_tobacco,
            plan_year=req.plan_year,
        )

        db_quote.quote_data = {
            "plans": result["plans"],
            "county": county,
            "source": "healthsherpa",
            "raw_count": result["raw_count"],
        }
        db_quote.quote_status = "quoted"
        db_quote.has_quote = True
        db_quote.status_message = f"Done! Found {len(result['plans'])} plans."
    except HealthSherpaError as e:
        db_quote.quote_data = {"status": "error", "error": str(e)}
        db_quote.quote_status = "error"
        db_quote.has_quote = False
        db_quote.status_message = f"HealthSherpa error: {str(e)[:120]}"
        print(f"[Quote {db_quote.quote_id}] HealthSherpa error: {e}")
    except Exception as e:
        db_quote.quote_data = {"status": "error", "error": str(e)}
        db_quote.quote_status = "error"
        db_quote.has_quote = False
        db_quote.status_message = f"Error: {str(e)[:120]}"
        print(f"[Quote {db_quote.quote_id}] Unexpected error: {e}")

    db.commit()
    db.refresh(db_quote)
    return db_quote


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


# --- Agent auth + profile ---


DEFAULT_AGENT_PASSWORD = "test12345"


class AgentRegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: Optional[str] = None
    wechat_id: Optional[str] = None
    telephone: Optional[str] = None


class AgentLoginRequest(BaseModel):
    username: str  # username OR email
    password: str


class AgentProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    wechat_id: Optional[str] = None
    telephone: Optional[str] = None
    wechat_qr: Optional[str] = None  # data URL or empty string to clear


MAX_QR_BYTES = 800_000  # ~600 KB after base64 overhead


def _agent_to_dict(agent: models.Agent) -> dict:
    return {
        "id": agent.id,
        "username": agent.username,
        "email": agent.email,
        "full_name": agent.full_name,
        "wechat_id": agent.wechat_id,
        "telephone": agent.telephone,
        "wechat_qr": agent.wechat_qr,
    }


@app.post("/api/agents/register")
def agent_register(req: AgentRegisterRequest, db: Session = Depends(get_db)):
    username = req.username.strip().lower()
    if not re.match(USERNAME_PATTERN, username):
        raise HTTPException(status_code=400, detail="用户名只能包含字母、数字、下划线，长度3-40")
    if username in RESERVED_USERNAMES:
        raise HTTPException(status_code=400, detail="该用户名已被保留")
    email = req.email.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="邮箱格式无效")
    password = req.password or DEFAULT_AGENT_PASSWORD
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="密码至少需要 8 个字符")
    if not req.full_name.strip():
        raise HTTPException(status_code=400, detail="姓名不能为空")

    existing = (
        db.query(models.Agent)
        .filter((models.Agent.username == username) | (models.Agent.email == email))
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="用户名或邮箱已被注册")

    digest, salt = hash_password(password)
    agent = models.Agent(
        username=username,
        email=email,
        full_name=req.full_name.strip(),
        hashed_password=digest,
        salt=salt,
        wechat_id=(req.wechat_id or "").strip() or None,
        telephone=(req.telephone or "").strip() or None,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    return {"agent": _agent_to_dict(agent), "token": issue_token(agent.id)}


@app.post("/api/agents/login")
def agent_login(req: AgentLoginRequest, db: Session = Depends(get_db)):
    identifier = req.username.strip().lower()
    agent = (
        db.query(models.Agent)
        .filter((models.Agent.username == identifier) | (models.Agent.email == identifier))
        .first()
    )
    if agent is None or not verify_password(req.password, bytes(agent.salt), bytes(agent.hashed_password)):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    return {"agent": _agent_to_dict(agent), "token": issue_token(agent.id)}


@app.get("/api/agents/me")
def agent_me(agent_id: int = Depends(require_agent), db: Session = Depends(get_db)):
    agent = get_current_agent(db, agent_id)
    return _agent_to_dict(agent)


@app.patch("/api/agents/me")
def agent_update_me(
    req: AgentProfileUpdateRequest,
    agent_id: int = Depends(require_agent),
    db: Session = Depends(get_db),
):
    agent = get_current_agent(db, agent_id)
    if req.full_name is not None:
        if not req.full_name.strip():
            raise HTTPException(status_code=400, detail="姓名不能为空")
        agent.full_name = req.full_name.strip()
    if req.email is not None:
        new_email = req.email.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", new_email):
            raise HTTPException(status_code=400, detail="邮箱格式无效")
        if new_email != agent.email:
            taken = db.query(models.Agent).filter(
                models.Agent.email == new_email,
                models.Agent.id != agent.id,
            ).first()
            if taken:
                raise HTTPException(status_code=409, detail="该邮箱已被注册")
            agent.email = new_email
    if req.wechat_id is not None:
        agent.wechat_id = req.wechat_id.strip() or None
    if req.telephone is not None:
        agent.telephone = req.telephone.strip() or None
    if req.wechat_qr is not None:
        v = req.wechat_qr.strip()
        if not v:
            agent.wechat_qr = None
        else:
            if not v.startswith("data:image/"):
                raise HTTPException(status_code=400, detail="二维码必须是图片（data URL）")
            if len(v) > MAX_QR_BYTES:
                raise HTTPException(status_code=413, detail="二维码图片过大，请上传小于 600KB 的图片")
            agent.wechat_qr = v
    db.commit()
    db.refresh(agent)
    return _agent_to_dict(agent)


@app.get("/api/agents/me/quotes")
def agent_quotes(agent_id: int = Depends(require_agent), db: Session = Depends(get_db)):
    """Quotes submitted via this agent's per-agent URL."""
    quotes = (
        db.query(models.Quote)
        .filter(models.Quote.agent_id == agent_id)
        .order_by(models.Quote.created_at.desc())
        .limit(500)
        .all()
    )
    out = []
    for q in quotes:
        cd = q.customer_data or {}
        plans = (q.quote_data or {}).get("plans", []) if q.has_quote else []
        prices = [p.get("monthly_premium") for p in plans if isinstance(p.get("monthly_premium"), (int, float))]
        out.append({
            "quote_id": q.quote_id,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "status": q.quote_status,
            "zip": cd.get("zip"),
            "age": cd.get("age"),
            "sex": cd.get("sex"),
            "income": cd.get("income"),
            "household_size": cd.get("household_size"),
            "ages_list": cd.get("ages_list") or [],
            "plan_count": len(plans),
            "min_premium": min(prices) if prices else None,
        })
    return {"quotes": out}


@app.get("/api/agents/{username}")
def agent_public_profile(username: str, db: Session = Depends(get_db)):
    """Public lookup for the per-agent quote-page header."""
    from sqlalchemy import func
    uname = username.strip().lower()
    agent = (
        db.query(models.Agent)
        .filter(func.btrim(models.Agent.username) == uname)
        .first()
    )
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {
        "username": agent.username,
        "full_name": agent.full_name,
        "email": agent.email,
        "wechat_id": agent.wechat_id,
        "telephone": agent.telephone,
        "wechat_qr": agent.wechat_qr,
    }
