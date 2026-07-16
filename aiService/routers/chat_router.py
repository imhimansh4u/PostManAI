from fastapi import APIRouter, HTTPException
from models.schemas import ChatStartRequest, ChatStartResponse, ChatMessageRequest, ChatMessageResponse
from services import gemini_service_for_chat

router = APIRouter()


@router.post("/chat/start", response_model=ChatStartResponse)
async def start(req: ChatStartRequest):
    try:
        used_code = await gemini_service_for_chat.start_chat(req.context, req.project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start chat: {e}")

    return ChatStartResponse(
        test_run_id=req.context.test_run_id,
        ready=True,
        used_code_context=used_code,
    )


@router.post("/chat/message", response_model=ChatMessageResponse)
def message(req: ChatMessageRequest):
    try:
        reply =  gemini_service_for_chat.send_message(req.test_run_id, req.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI reply: {e}")

    return ChatMessageResponse(reply=reply, test_run_id=req.test_run_id)

