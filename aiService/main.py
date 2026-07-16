from fastapi import FastAPI,Request,HTTPException
from routers.index_router import router as index_router
from routers.delete_Indexed_files_router import router as delete_Indexed_files_router
from routers.generate_router import router as generate_router
from fastapi.middleware.cors import CORSMiddleware
from routers.chat_router import router as chat_router

from dotenv import load_dotenv
import os
load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[BACKEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.middleware("http")
# async def verify_internal_key(request : Request,call_next):
#     if request.url.path == "/health":
#         return await call_next(request)
#     # Only for now testing ,(Baad me yaad se remove this)
#     if request.url.path == "/docs":
#         return await call_next(request)
#     key = request.headers.get("x-internal-key")
#     if key != os.getenv("INTERNAL_API_KEY"):
#         raise HTTPException(status_code=403,detail="Unauthorized")
#     return await call_next(request)

@app.get("/")
def home():
    return {"message" : "Hello World"}

@app.get("/health")
def health_check():
    return {
        "status" : "healthy"
    }

app.include_router(index_router)
app.include_router(generate_router)
app.include_router(delete_Indexed_files_router)
app.include_router(chat_router)
