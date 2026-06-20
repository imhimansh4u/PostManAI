from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os
load_dotenv()

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",task_type="retrieval_document",output_dimensionality=768)
query_embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",task_type="retrieval_query",output_dimensionality=768)

def embed_query(text:str)->list:
    query_res = embeddings.embed_query(text)
    return query_res

def embed_search_query(text:str)->list:
    return query_embeddings.embed_query(text)
