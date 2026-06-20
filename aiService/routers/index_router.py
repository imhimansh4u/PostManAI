from fastapi import APIRouter
from models.schemas import IndexRepoRequest,IndexRepoResponse
from services.chunker import chunk_files
from services.embedder import embed_query
from services.pinecone_services import upsert_vectors

router = APIRouter()

@router.post("/ai/index-repo")
async def index_repo(request: IndexRepoRequest):
    item = request.model_dump()  # Converts pydantics to python Dict
    # Now Chunking of data
    all_chunks = chunk_files(item["files"])
    # Now Embedding of the data and Preparing it to pass to the PineCone for storage
    vectors = []
    for index,chunk in enumerate(all_chunks):
        embedding = embed_query(chunk["text"])
        vectors.append({
            "id" : f"{request.projectId}_{chunk["metadata"]["file_path"]}_{index}",
            "values" : embedding,
            "metadata": {
                "text" : chunk["text"],
                "file_path" : chunk["metadata"]["file_path"]
            }
        })
    # Now passing those Vectors to upsert in Pinecone 
    await upsert_vectors(request.projectId,vectors)
    return IndexRepoResponse(
        endpointCount=len(vectors),
        indexedFiles=list({chunk["metadata"]["file_path"] for chunk in all_chunks})
    )
        

    
    


    