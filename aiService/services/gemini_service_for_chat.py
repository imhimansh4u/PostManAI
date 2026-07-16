from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import SystemMessage
from models.schemas import TestRunContext,RetrievedCodeChunk
from services import pinecone_services
from services import embedder


from dotenv import load_dotenv
import os
import json

load_dotenv()

gemini_api_key= os.getenv("GOOGLE_API_KEY")


_session_store: dict[str, InMemoryChatMessageHistory] = {}

#  Just One task , store the session id if new one session starts
def get_session_history(session_id : str) -> InMemoryChatMessageHistory:   # Have a Plan to Move Towards Redis in Future
    if session_id not in _session_store:
        _session_store[session_id] = InMemoryChatMessageHistory()
    return _session_store[session_id]

print("KEY LOADED:", bool(os.getenv("GOOGLE_API_KEY")))

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

#  Will Prepare the Prompt with human Input and Message History
prompt  = ChatPromptTemplate.from_messages([
    MessagesPlaceholder("history"),
    ("human","{input}"),
])

chain = prompt | llm   # creating a chain , firstly pass to prompt and then llm

chat_chain = RunnableWithMessageHistory(
    chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="history",
)


async def retrieve_code_context(context: TestRunContext, project_id: str) -> list[RetrievedCodeChunk]:
    """Best-effort retrieval — returns [] if nothing relevant found or repo not indexed."""
    query = f"{context.request_snapshot.method} {context.request_snapshot.url} handler"

    try:
        query_vector = embedder.embed_search_query(query)          # STEP 1: text -> embedding
        results = await pinecone_services.search_vectors(         # STEP 2: search with the embedding
            projectId=project_id,
            query_vector=query_vector,
        )
        return results
    except Exception as e:
        print(f"[retrieve_code_context] failed: {e}")
        import traceback; traceback.print_exc()
        return []


def build_context_prompt(context: TestRunContext, chunks: list[RetrievedCodeChunk]) -> str:
    """Build a rich system prompt that gives the chat model the full debugging context."""
    request_snapshot = context.request_snapshot

    context_summary = {
        "test_run_id": context.test_run_id,
        "test_id": context.test_id,
        "test_name": context.test_name or "Untitled test",
        "status": context.status,
        "expected_status": context.expected_status,
        "actual_status": context.actual_status,
        "actual_body": context.actual_body,
        "response_time_ms": context.response_time,
        "is_regression": context.is_regression,
        "error_message": context.error_message,
        "assertion_results": [
            {
                "assertion": item.assertion,
                "passed": item.passed,
                "actual": item.actual,
                "error": item.error,
            }
            for item in context.assertion_results
        ],
    }

    request_payload = {
        "method": request_snapshot.method,
        "url": request_snapshot.url,
        "headers": request_snapshot.headers or {},
        "body": request_snapshot.body,
    }

    if chunks:
        code_context_blocks = []
        for index, chunk in enumerate(chunks, start=1):
            code_context_blocks.append(
                f"[Chunk {index}] file: {chunk.file_path}\n"
                f"score: {chunk.score:.3f}\n"
                f"{chunk.content.strip()}"
            )
        code_context_text = "\n\n".join(code_context_blocks)
    else:
        code_context_text = (
            "No relevant code context was retrieved from the indexed repository. "
            "Rely on the request/response evidence and explain likely causes conservatively."
        )
    return f"""You are an expert API debugging and QA assistant for PostmanAI. Your role is to help investigate why an API test failed, explain the likely root cause, and suggest precise next steps. Use the provided request, response, assertions, and retrieved repository context to form your answer.

=== TEST CONTEXT ===
{json.dumps(context_summary, indent=2, ensure_ascii=False)}

=== REQUEST SNAPSHOT ===
{json.dumps(request_payload, indent=2, ensure_ascii=False)}

=== RETRIEVED CODE CONTEXT ===
{code_context_text}

=== INSTRUCTIONS ===
1. Think like a senior backend engineer and QA specialist.
2. Focus on the most likely cause of the failure using the evidence provided.
3. If the repository context is relevant, reference likely files, handlers, validation logic, auth checks, serialization behavior, or route handling.
4. If the code context is weak or absent, say so clearly and rely on the request/response evidence.
5. Be precise and practical. Prefer concrete explanations over vague guesses.
6. When suggesting fixes, keep them actionable and specific.
7. If the user asks a follow-up question, answer it directly and stay grounded in the supplied context.
8. Do not invent behavior that is not supported by the evidence.

=== RESPONSE STYLE ===
- Be concise but helpful.
- Use bullet points for findings, likely causes, and recommended fixes.
- Clearly distinguish between what is confirmed and what is a likely hypothesis.
- If the issue is ambiguous, mention the uncertainty briefly instead of overclaiming.
"""

async def start_chat(context: TestRunContext,project_id:str) -> bool:
    history = get_session_history(context.test_run_id)
    chunks = await retrieve_code_context(context,project_id)
    system_prompt = build_context_prompt(context,chunks)
    history.add_message(SystemMessage(content=system_prompt))
    return len(chunks)>0

def send_message(test_run_id:str , message:str)->str:
    response = chat_chain.invoke(
        {"input":message},
        config={"configurable":{"session_id":test_run_id}},
    )
    return response.content




