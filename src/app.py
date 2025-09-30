from fastapi import FastAPI, UploadFile, File
from pathlib import Path

app = FastAPI()

# Resolve uploads directory at project root (one level up from src)
_BASE_DIR = Path(__file__).resolve().parent.parent
_UPLOADS_DIR = _BASE_DIR / "uploads"
_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health():
    return {"health": "ok"}


@app.post("/upload")
async def upload(files: list[UploadFile] = File(..., max_items=10)):
    for file in files:
        data = await file.read()
        destination_path = _UPLOADS_DIR / file.filename
        with open(destination_path, "wb") as out_file:
            out_file.write(data)
    return {"message": "saved!"}
