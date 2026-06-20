from fastapi import APIRouter
from models.schemas import DeleteIndexRequest,DeleteIndexResponse
from services.pinecone_services import delete_vectors


router = APIRouter()
@router.delete("/ai/delete-index")
async def delete_indexed_files(request : DeleteIndexRequest):
    projectId = request.projectId
    await delete_vectors(projectId)
    return DeleteIndexResponse(message="Indexed files deleted Successfully")
