from pydantic import BaseModel,ConfigDict,Field
from pydantic.alias_generators import to_camel
from typing import List,Dict,Any,Optional

# Represent one file object inside the files array 
class FileItem(BaseModel):
    path : str
    content : str
    size:int

# The full request body for /ai/index-repo
class IndexRepoRequest(BaseModel):
    projectId : str
    repoFullName : str
    files : List[FileItem]

# The Response for /ai/index-repo
class IndexRepoResponse(BaseModel):
    endpointCount : int
    indexedFiles : List[str]


# Full request body for /ai/generate-test

class GenerateTestRequest(BaseModel):
    projectId : str
    description : str


# Full Response Body 
class GenerateTestResponse(BaseModel):
    method: str
    url: str
    headers: Dict[str, str]
    body: Dict
    expectedStatus: int
    assertions: List[str]


# Now for explaining the Error

class ExplainErrorRequest(BaseModel):
    endPoint : str
    expectedStatus : int
    actualStatus : int
    responseBody :   dict
    assertionsFailed: List[str]   

class ExplainErrorResponse(BaseModel):
    explanation : str
    suggestedFix : str
    shortExplanation : str

class DeleteIndexRequest(BaseModel):
    projectId: str

class DeleteIndexResponse(BaseModel):
    message : str


#  For all the Chat Required Things 
class CamelModel(BaseModel):
    """Base for any schema that receives JSON from the Node backend.
    Accepts camelCase keys (testId, expectedStatus, ...) natively."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RequestSnapshot(CamelModel):  # basic info about the Request
    method: str
    url: str
    headers: Dict[str, Any] = Field(default_factory=dict)
    body: Optional[Any] = None


class AssertionResult(CamelModel):
    assertion: str
    passed: bool
    actual: Optional[Any] = None
    error: Optional[Any] = None


class TestRunContext(CamelModel):
    test_run_id: str
    test_id: str
    project_id: str
    test_name: Optional[str] = None
    request_snapshot: RequestSnapshot
    status: str                            # "pass" ,"fail", "error"
    expected_status: int
    actual_status: Optional[int] = None
    actual_body: Optional[Any] = None
    response_time: Optional[int] = None
    assertion_results: List[AssertionResult] = Field(default_factory=list)
    error_message: Optional[str] = None
    is_regression: bool = False


class RetrievedCodeChunk(CamelModel):
    """One chunk pulled back from the vector DB during /chat/start."""
    file_path: str
    content: str
    score: float


#  /chat/start : called once, when the chat panel opens 

class ChatStartRequest(CamelModel):
    context: TestRunContext
    project_id: str


class ChatStartResponse(CamelModel):
    test_run_id: str
    ready: bool
    used_code_context: bool   # tells the frontend whether RAG kicked in or it fell back to context-only


# /chat/message : every follow-up turn 

class ChatMessageRequest(CamelModel): #context already lives in that session's history from /chat/start
    test_run_id: str
    message: str

class ChatMessageResponse(CamelModel):
    reply: str
    test_run_id: str


