from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from pathlib import Path
from typing import List, Tuple, Dict, Any
import shutil
import uuid
import logging
from google.cloud import firestore
from .utils import transcribe_media
from .utils import process_file as convert_file

app = FastAPI()

# Logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s"
    )

# Resolve uploads directory at project root (one level up from src)
_BASE_DIR = Path(__file__).resolve().parent.parent
_UPLOADS_DIR = _BASE_DIR / "uploads"
_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
_PROCESSING_DIR = _UPLOADS_DIR / "processing"
_PROCESSED_DIR = _UPLOADS_DIR / "processed"
_PROCESSING_DIR.mkdir(parents=True, exist_ok=True)
_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

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


# Initialize Firestore client once at startup
db = firestore.Client()


def _truncate(text: str, limit: int = 2000) -> str:
    if not isinstance(text, str):
        return ""
    return text[:limit]


def _move_to_processed(src_path: Path, process_id: str, index: int) -> str:
    ext = src_path.suffix
    new_name = f"{process_id}-{index}{ext}"
    dst_path = _PROCESSED_DIR / new_name
    shutil.move(str(src_path), str(dst_path))
    return new_name


def _update_status(
    db: firestore.Client, process_id: str, file_name: str, status: str
) -> None:
    doc_ref = db.collection("processes").document(process_id)
    doc_ref.set({"status": {"file": file_name, "status": status}}, merge=True)


def _update_tuple_with_new_name(
    db: firestore.Client, process_id: str, old_name: str, new_name: str
) -> None:
    doc_ref = db.collection("processes").document(process_id)
    snapshot = doc_ref.get()
    data = snapshot.to_dict() or {}
    files: List[Dict[str, Any]] = data.get("files", [])
    updated: List[Dict[str, Any]] = []
    for item in files:
        if isinstance(item, dict) and item.get("old_name") == old_name:
            updated.append({"old_name": item.get("old_name"), "new_name": new_name})
        else:
            updated.append(item)
    doc_ref.update({"files": updated})


def _process_files_background(
    process_id: str, saved_paths: List[Tuple[str, Path, str]]
) -> None:
    logger.info(
        "Background processing started",
        extra={"process_id": process_id, "file_count": len(saved_paths)},
    )
    for idx, (original_name, path, ext) in enumerate(saved_paths, start=1):
        try:
            logger.info(
                f"Analyzing file {original_name}",
                extra={"process_id": process_id, "file": original_name, "index": idx},
            )
            _update_status(db, process_id, original_name, "Analyzing the file")
            if ext in MEDIA_EXTENSIONS:
                text = transcribe_media(str(path))
            else:
                text = convert_file(str(path))

            _ = _truncate(text, 2000)

            new_name = _move_to_processed(path, process_id, idx)
            _update_tuple_with_new_name(db, process_id, original_name, new_name)
            logger.info(
                f"File {original_name} processed and moved to {new_name}",
                extra={
                    "process_id": process_id,
                    "old_name": original_name,
                    "new_name": new_name,
                    "index": idx,
                },
            )
        except Exception:
            # Continue with next file on error
            logger.exception(
                f"Error processing file {original_name}",
                extra={"process_id": process_id, "file": original_name, "index": idx},
            )
            continue
    logger.info(
        f"Background processing completed {process_id}",
        extra={"process_id": process_id},
    )


@app.get("/health")
def health():
    return {"health": "ok"}


@app.post("/upload")
async def upload(
    background_tasks: BackgroundTasks, files: list[UploadFile] = File(..., max_items=10)
):
    process_id = uuid.uuid4().hex
    logger.info(
        f"Upload received; starting process {process_id}",
        extra={"process_id": process_id, "num_files": len(files)},
    )
    saved: List[Tuple[str, Path, str]] = []

    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")
        ext = Path(file.filename).suffix.lower().lstrip(".")
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, detail=f"File type not allowed: .{ext}"
            )

        data = await file.read()
        destination_path = _PROCESSING_DIR / file.filename
        with open(destination_path, "wb") as out_file:
            out_file.write(data)
        saved.append((file.filename, destination_path, ext))
        logger.info(
            f"Saved file {file.filename} to processing directory",
            extra={"process_id": process_id, "file": file.filename},
        )

    files_field: List[Dict[str, str]] = [
        {"old_name": name, "new_name": ""} for name, _, _ in saved
    ]
    db.collection("processes").document(process_id).set(
        {
            "id": process_id,
            "files": files_field,
            "status": {"file": "None", "status": "processing"},
        }
    )
    logger.info(
        f"Firestore process document created {process_id}",
        extra={"process_id": process_id},
    )

    background_tasks.add_task(_process_files_background, process_id, saved)
    logger.info(
        f"Background task scheduled {process_id}", extra={"process_id": process_id}
    )

    return {"message": "saved!", "process_id": process_id}


# TODO: Implement cerebras file renaming
# TODO: Add a route to get the status of a process
# TODO: Add a route to get all processes
# TODO: Add a route to get all files (processed and processing)
