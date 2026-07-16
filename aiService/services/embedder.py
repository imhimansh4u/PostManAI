from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os
import asyncio
load_dotenv()

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",task_type="retrieval_document",output_dimensionality=768)
query_embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",task_type="retrieval_query",output_dimensionality=768)

async def embed_query(text:str)->list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda : embeddings.embed_query(text))

async def embed_search_query(text:str)->list:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda : query_embeddings.embed_query(text))
