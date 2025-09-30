from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()


def transcribe_media(path: str, response_format: str = "text") -> str:
    """
    Transcribe an audio or video file using gpt-4o-mini-transcribe.

    Parameters:
        path : str
            Path to an audio or video file
        response_format : str
            - "text" returns plain text

    Returns:
        str : the transcript text
    """
    p = Path(path)
    if not p.exists() or not p.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    with p.open("rb") as f:
        resp = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe", file=f, response_format=response_format
        )

    if isinstance(resp, str):
        return resp
    return getattr(resp, "text", str(resp))


if __name__ == "__main__":
    print(
        transcribe_media(
            "test-media-files/New MIT study says most AI projects are doomed....mp3"
        )
    )
