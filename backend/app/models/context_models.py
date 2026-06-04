from pydantic import BaseModel, Field
from typing import Optional


class ContextFragment(BaseModel):
    id: Optional[str] = None
    user_id: str
    content: str
    category: str
    is_active: bool = False
    derived_from_diary_id: Optional[str] = None
    derived_from_conversation_id: Optional[str] = None

    model_config = {"from_attributes": True}
