from sqlalchemy import Column, Integer, String, Boolean, DateTime, LargeBinary, ForeignKey
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
