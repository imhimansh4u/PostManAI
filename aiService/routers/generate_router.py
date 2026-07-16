from fastapi import APIRouter
from models.schemas import GenerateTestRequest
from services.groq_service import generate_test
from services.embedder import embed_search_query
from services.pinecone_services import search_vectors
from fastapi import HTTPException
import traceback

router = APIRouter()


@router.post("/ai/generate-test")
async def generate_test_route(request: GenerateTestRequest):
    embedded_human_query =  await embed_search_query(request.description)
    search_res = await search_vectors(request.projectId, embedded_human_query)

    if not search_res:
        raise HTTPException(
            status_code=404,
            detail="No indexed files found for this project. Please sync your repository first.",
        )

    try:
        finalTests = await generate_test(request.description, search_res)
        return finalTests
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        traceback.print_exc()   # log the real error to terminal
        raise HTTPException(
            status_code=502,
            detail="AI test generation failed. Please try a prompt related to API testing.",
        ) from exc
   
