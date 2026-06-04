from pydantic import BaseModel, Field
from typing import Optional


class Conversation(BaseModel):
    id: str
    user_id: str
    message_count: int = 0
    is_active: bool = True

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Mensagem do usuário para o agente Shello.",
        json_schema_extra={"example": "Preciso criar uma tarefa para revisar o relatório"},
    )
    conversation_id: Optional[str] = None


class TaskSuggestion(BaseModel):
    title: str
    due_date: None = None


class ChatResponse(BaseModel):
    response: str
    mode: str
    blocked: bool = False
    conversation_id: str
    message_count: int
    suggest_task: Optional[TaskSuggestion] = None
