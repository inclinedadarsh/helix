from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path

app = FastAPI()

# Resolve uploads directory at project root (one level up from src)
_BASE_DIR = Path(__file__).resolve().parent.parent
_UPLOADS_DIR = _BASE_DIR / "uploads"
_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
_MEDIA_DIR = _UPLOADS_DIR / "media"
_FILES_DIR = _UPLOADS_DIR / "files"
_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
_FILES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "pdf",
    "docx",
    "txt",
    "pptx",
    "xlsx",
    "csv",
    "doc",
    "md",
    "mp4",
    "mp3",
}
MEDIA_EXTENSIONS = {"mp4", "mp3"}


@app.get("/health")
def health():
    return {"health": "ok"}


@app.post("/upload")
async def upload(files: list[UploadFile] = File(..., max_items=10)):
    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")
        ext = Path(file.filename).suffix.lower().lstrip(".")
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, detail=f"File type not allowed: .{ext}"
            )

        target_dir = _MEDIA_DIR if ext in MEDIA_EXTENSIONS else _FILES_DIR
        data = await file.read()
        destination_path = target_dir / file.filename
        with open(destination_path, "wb") as out_file:
            out_file.write(data)
    return {"message": "saved!"}
