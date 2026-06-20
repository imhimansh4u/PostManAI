from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

gemini_api_key= os.getenv("GOOGLE_API_KEY")

EXPLAIN_ERROR_PROMPT = """
You are an expert backend QA automation engineer and API diagnostics tool. Your task is to analyze an API test failure, pinpoint the exact root cause by diagnosing the runtime response payload, and return a clean, actionable diagnosis.

### TEST EXECUTION CONTEXT
- Endpoint (Route): {endPoint}
- Expected Status: {expectedStatus}
- Actual Status Received: {actualStatus}
- Response Body: {responseBody}
- Failed Assertions: {assertionsFailed}

### INSTRUCTIONS & DIAGNOSTIC RULES
1. Compare the Expected Status vs Actual Status and carefully inspect the Response Body error strings, stack traces, or custom messages returned by the server.
2. Isolate the exact nature of the failure (e.g., structural validation error, missing authentication headers, runtime database crash, or schema mismatch) purely from the runtime signature.
3. Formulate a highly precise explanation of what went wrong, actionable next steps or configurations the developer should apply, and a short summary.

### STRICT OUTPUT RULES
- Respond with a raw JSON object only.
- Do not include markdown code blocks, code fences, or backticks (e.g., do NOT use ```json ... ```).
- Do not add any conversational text, explanations, or prose before or after the JSON object.
- Return only the JSON object and nothing else so it can be parsed directly.

### OUTPUT FORMAT
{{
  "explanation": "Detailed, plain-English breakdown of why the test failed based on the status codes, response body details, and failed assertions.",
  "suggestedFix": "Concrete, step-by-step diagnostic modifications, network configurations, or request payload adjustments the developer should implement to resolve the failure.",
  "shortExplanation": "A highly condensed summary of the error strictly between 5 to 6 words long."
}}
"""


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,  
    max_tokens=None,
    timeout=None,
    max_retries=2,
    google_api_key=gemini_api_key
)

async def explain_error(endpoint, expectedStatus, actualStatus, responseBody, assertionsFailed) -> dict:
    prompt = EXPLAIN_ERROR_PROMPT.format(
        endPoint = endpoint,
        expectedStatus = expectedStatus,
        actualStatus = actualStatus,
        responseBody = responseBody,
        assertionsFailed = assertionsFailed,   
    )
    response = await llm.ainvoke(prompt)
    return json.loads(response.content)

