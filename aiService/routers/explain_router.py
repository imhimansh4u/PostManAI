from fastapi import APIRouter
from models.schemas import ExplainErrorRequest,ExplainErrorResponse

from services.gemini_service import explain_error
from fastapi import HTTPException

router = APIRouter()
@router.post("/ai/explain-error")
async def explain_test_route(request :ExplainErrorRequest):
    final_res = await explain_error(request.endPoint,request.expectedStatus,request.actualStatus,request.responseBody,request.assertionsFailed)
    return ExplainErrorResponse(
        explanation = final_res["explanation"],
        suggestedFix = final_res["suggestedFix"],
        shortExplanation = final_res["shortExplanation"]
    )


