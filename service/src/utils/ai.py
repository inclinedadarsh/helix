from typing import List, Tuple
from cerebras.cloud.sdk import Cerebras
import os
from dotenv import load_dotenv, find_dotenv
import json

load_dotenv(find_dotenv())

json_format = """
{
    "name": "string",
    "summary": "string",
    "tags": ["string", "string", "string"]
}
"""


class AIHelper:
    def __init__(self):
        self.client = Cerebras(api_key=os.getenv("CEREBRAS_API_KEY"))

    def get_analyzed_file_data(self, content: str) -> Tuple[str, str, List[str]]:
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that is given a file and you need to generate a name and summary for the file. You are only allowed to reply with the specified json format. The json format is as follows: {json_format}. Don't include any other text or comments. Make sure that the name is very descriptive and only contains alphanumeric characters and underscores. Do not include extensions either. Make sure you include at least 3 tags for the files, however feel free to include more if the file is related to multiple topics.",
                },
                {"role": "user", "content": content},
            ],
            model="llama-4-scout-17b-16e-instruct",
        )
        response = json.loads(chat_completion.choices[0].message.content)
        return response["name"], response["summary"], response["tags"]
