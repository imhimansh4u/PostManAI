from pinecone import Pinecone
from dotenv import load_dotenv
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
    return results.matches


async def delete_vectors(projectId: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: index.delete(delete_all=True, namespace=projectId)
    )