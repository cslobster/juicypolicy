from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class QuoteRequest(BaseModel):
    name: str
    sex: str
    age: int
    zip: str
    income: str
    household_size: int
    ages_list: Optional[List[int]] = None


class QuoteCreateResponse(BaseModel):
    quote_id: int
    quote_status: str
    status_message: Optional[str] = None

    class Config:
        from_attributes = True


class QuoteStatusResponse(BaseModel):
    quote_id: int
    customer_data: dict
    quote_data: Optional[dict] = None
    quote_status: str
    status_message: Optional[str] = None
    has_quote: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
