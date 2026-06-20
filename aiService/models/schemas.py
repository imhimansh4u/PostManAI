from pydantic import BaseModel
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
