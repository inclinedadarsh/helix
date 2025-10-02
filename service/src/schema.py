from typing import List
from pydantic import BaseModel


class ProcessUrlRequest(BaseModel):
    urls: List[str]
