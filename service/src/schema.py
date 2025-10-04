from typing import List, Literal
from pydantic import BaseModel


class ProcessUrlRequest(BaseModel):
    urls: List[str]


class DownloadFileRequest(BaseModel):
    file_name: str
    file_type: Literal["docs", "media"]


class SingleLinkUploadRequest(BaseModel):
    link: str
    username: str
