from sqlalchemy import Column, Integer, String, Boolean, DateTime, LargeBinary, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from .database import Base


class Quote(Base):
    __tablename__ = "jp_quotes"

    quote_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_data = Column(JSONB, nullable=False)
    quote_data = Column(JSONB, nullable=True)
    quote_status = Column(String(20), default="pending")  # pending, scraping, converting, quoted, error
    status_message = Column(String(200), default="Waiting for worker...")
    has_quote = Column(Boolean, default=False)
    agent_id = Column(Integer, ForeignKey("jp_agents.id"), nullable=True, index=True)
    enrollment_data = Column(JSONB, nullable=True)
    enrollment_status = Column(String(20), nullable=True)  # null, "submitted", "contacted"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Agent(Base):
    __tablename__ = "jp_agents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=False)
    hashed_password = Column(LargeBinary, nullable=False)
    salt = Column(LargeBinary, nullable=False)
    wechat_id = Column(String(80), nullable=True)
    telephone = Column(String(40), nullable=True)
    wechat_qr = Column(String, nullable=True)  # data URL (base64) of WeChat QR image
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Enrollment(Base):
    __tablename__ = "jp_enrollments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quote_id = Column(Integer, ForeignKey("jp_quotes.quote_id"), nullable=True, index=True)
    agent_id = Column(Integer, ForeignKey("jp_agents.id"), nullable=True, index=True)

    # Personal info
    first_name = Column(String(80), nullable=True)
    middle_name = Column(String(80), nullable=True)
    last_name = Column(String(80), nullable=True)
    dob = Column(String(20), nullable=True)
    gender = Column(String(40), nullable=True)
    marital_status = Column(String(40), nullable=True)
    ssn = Column(String(20), nullable=True)

    # Contact
    phone = Column(String(40), nullable=True)
    email = Column(String(255), nullable=True)
    preferred_lang = Column(String(20), nullable=True)

    # Residence
    address = Column(String(255), nullable=True)
    apt = Column(String(40), nullable=True)
    city = Column(String(80), nullable=True)
    state = Column(String(8), nullable=True)
    zip_code = Column(String(20), nullable=True)

    # Mailing (only filled when different from residence)
    mailing_same = Column(Boolean, default=True)
    mail_address = Column(String(255), nullable=True)
    mail_apt = Column(String(40), nullable=True)
    mail_city = Column(String(80), nullable=True)
    mail_state = Column(String(8), nullable=True)
    mail_zip = Column(String(20), nullable=True)

    # Tax / Income
    tax_status = Column(String(40), nullable=True)
    annual_income = Column(String(40), nullable=True)
    income_type = Column(String(40), nullable=True)
    qualifying_event = Column(String(80), nullable=True)

    # Plan snapshot
    plan_id = Column(String(50), nullable=True)
    plan_name = Column(String(255), nullable=True)
    plan_carrier = Column(String(255), nullable=True)
    plan_type = Column(String(40), nullable=True)
    network_type = Column(String(40), nullable=True)
    monthly_premium = Column(Numeric(10, 2), nullable=True)
    deductible = Column(Integer, nullable=True)
    max_out_of_pocket = Column(Integer, nullable=True)

    status = Column(String(20), default="submitted")  # submitted, contacted, enrolled, cancelled

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
