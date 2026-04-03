from sqlalchemy import Column, Integer, String, Boolean, DateTime
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
