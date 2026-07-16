from pinecone import Pinecone
from dotenv import load_dotenv
from models.schemas import RetrievedCodeChunk
import asyncio
import os

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)


async def upsert_vectors(projectId: str, vectors: list):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: index.upsert(vectors=vectors, namespace=projectId)
    )


#---------------------------------------------------------------------Study Notes----------------------------------------------------------------------------------------
# Pinecone's client is synchronous — it blocks the thread until the network call returns.
#  If you called it directly inside an async def route without the executor, 
# that blocking call would freeze FastAPI's entire event loop for its duration,
#  meaning every other concurrent request to your AI service — not just this one — 
# stalls until Pinecone responds. run_in_executor pushes the blocking call onto a separate thread pool,
#  so the event loop stays free to handle other requests while this one waits.

async def search_vectors(projectId: str, query_vector: list, top_k: int = 5):
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(
        None,
        lambda: index.query(
            vector=query_vector,
            top_k=top_k,
            namespace=projectId,
            include_metadata=True
        )
    )

    chunks = []
    for match in results.matches:
        metadata = match.metadata or {}
        chunks.append(RetrievedCodeChunk(
            file_path=metadata.get("file_path", "unknown"),
            score=match.score,
            content=metadata.get("text", ""),
        ))
    return chunks


async def delete_vectors(projectId: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: index.delete(delete_all=True, namespace=projectId)
    )






#-------------------------------IMPORTANT CONCEPTS--------------------------------------

"""
------------------------------What normalization actually means (the concept, not the code)---------------------------------------

Every embedding vector has two properties: a direction (which way it points in that 768-dimensional space) and a magnitude
 (how long the vector is). Cosine similarity is specifically designed to measure only the angle between two vectors —
   how similarly they point — while ignoring their length entirely. That's the whole appeal of cosine similarity for text:
a short sentence and a long paragraph about the same topic can point in a very similar direction even if their raw 
vector lengths differ wildly.
"Normalizing" a vector means rescaling it so its length becomes exactly 1, while keeping its direction unchanged —
literally vector / magnitude_of_vector. Once every vector has length 1, comparing them by dot product and comparing them by 
cosine similarity become mathematically identical, which is why some systems normalize once upfront and then use the cheaper
 dot-product math everywhere after.
"""