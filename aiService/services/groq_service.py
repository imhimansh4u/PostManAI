from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

GENERATE_TEST_PROMPT = """
You are an expert QA Automation Engineer specialized in backend API testing, security vulnerabilities, and edge-case detection. Your task is to analyze the provided codebase context and generate precise, comprehensive integration/functional test cases based on the user's request.

### DATABASE & CODE CONTEXT
{code_context}

### USER TESTING REQUIREMENT
{user_intent}

### INSTRUCTIONS & VALIDATION RULES
1. Analyze the context routes to find the exact HTTP Method and Path.
2. The exact Route is often build by looking into two different Files usually , one in the routes folder
 and other the place where route is Registered , Build the Route Carefully.
2. Identify required headers, query parameters, path parameters, and body fields.
3. Generate multiple test scenarios covering:
   - Happy Path
   - Bad Request
   - Auth/Security
   - Boundary Conditions

### OUTPUT RULES
- Respond with a raw JSON array only.
- Do not include markdown, code fences, or backticks.
- Do not add any explanation before or after the JSON array.
- Return only the JSON array and nothing else.

### OUTPUT FORMAT
[
  {{
    "testName": "string",
    "description": "string",
    "request": {{
      "method": "string",
      "url": "string",
      "headers": {{}},
      "queryParams": {{}},
      "body": {{}}
    }},
    "expectedResponse": {{
      "status": 200,
      "bodyStructure": {{}}
    }}
  }}
]

### SOME OHTER POINTS TO BE NOTICED 
- If, The Description doesn't seems to be something which is related to test case generation , then also Respond in a
  valid json format only , stating that This AI tool is only for Test-Case Generation
- If you cant find a valid path always give a extra note , that you are unable to find the exact path , and ensure user to check the path
- In all types of Responses , you have to respond in json format Only.
- If description tries to Communicate on other Topics , response in json format Ploitely that you cant do that task in the description field
"""

llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    temperature=0,
    max_tokens=None,
    timeout=30,
    max_retries=2,
    groq_api_key=groq_api_key
)


def _extract_json_payload(raw_text: str):
    text = raw_text.strip()
    text = re.sub(r"```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        patterns = [r"\[[\s\S]*\]", r"\{[\s\S]*\}"]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    continue

        raise ValueError(
            "AI response was not valid JSON. Please provide a prompt related to API test generation."
        )


async def generate_test(description: str, context_chunks: list) -> list:
    # Extract text from each Pinecone match and join into one context
    code_context = ""
    for chunk in context_chunks:
        code_context += chunk.content + "\n\n"  #It is Because PineCone returns are not plain dict,they are PineCone Objects,which contains properties like metadata

    # Format the prompt with actual values
    prompt = GENERATE_TEST_PROMPT.format(
        code_context=code_context,
        user_intent=description
    )

    # Send to Groq
    response = await llm.ainvoke(prompt)

    # Normalize response content
    content = response.content
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="ignore")
    elif content is None:
        content = ""

    payload = _extract_json_payload(content)

    if not isinstance(payload, list):
        raise ValueError(
            "AI response must be a JSON array of test cases."
        )

    return payload