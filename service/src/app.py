from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
import os
import json
import uuid
import logging
import glob
from .utils import FirestoreHelper, ProcessHelper
from .schema import ProcessUrlRequest, DownloadFileRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
db = FirestoreHelper()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # safer than ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Logger
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s"
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

    db.create_process_document(process_id, [file.filename for file in files])
    logger.info(
        f"Firestore process document created {process_id}",
        extra={"process_id": process_id},
    )

    process_helper = ProcessHelper(db)
    background_tasks.add_task(
        process_helper.process_files_background, process_id, files
    )
    logger.info(
        f"Background task scheduled {process_id}", extra={"process_id": process_id}
    )

    return {"message": "saved!", "process_id": process_id}


@app.post("/process-urls")
async def process_urls(background_tasks: BackgroundTasks, request: ProcessUrlRequest):
    process_id = uuid.uuid4().hex
    logger.info(
        f"URL list received; starting process {process_id}",
        extra={"process_id": process_id, "num_urls": len(request.urls)},
    )

    db.create_process_document(process_id, request.urls)
    logger.info(
        f"Firestore process document created {process_id}",
        extra={"process_id": process_id},
    )

    process_helper = ProcessHelper(db)
    background_tasks.add_task(
        process_helper.process_links_background, process_id, request.urls
    )
    logger.info(
        f"Background URL processing scheduled {process_id}",
        extra={"process_id": process_id},
    )

    return {"message": "saved!", "process_id": process_id}


@app.get("/processes/recent")
def get_recent_processes():
    processes = db.get_latest_processes(limit=5)
    return {"processes": processes}


@app.get("/files/processed")
def get_processed_files():
    base_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "uploads", "processed"
    )

    categories = {
        "docs": [],
        "links": [],
        "media": [],
    }

    for category in categories.keys():
        category_dir = os.path.join(base_dir, category)
        if not os.path.isdir(category_dir):
            continue
        try:
            for entry in os.listdir(category_dir):
                if entry.endswith(".meta"):
                    meta_path = os.path.join(category_dir, entry)
                    try:
                        with open(meta_path, "r") as f:
                            data = json.load(f)
                            categories[category].append(data)
                    except Exception:
                        # Skip unreadable/bad JSON meta files
                        continue
        except FileNotFoundError:
            continue

    return categories


@app.post("/download")
async def download_file(request: DownloadFileRequest):
    """
    Download a file by name and type.
    Request body should contain:
    - file_name: name of the file without extension
    - file_type: either "docs" or "media"
    """
    base_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "uploads", "processed"
    )

    # Validate file type
    if request.file_type not in ["docs", "media"]:
        raise HTTPException(
            status_code=400, detail="file_type must be either 'docs' or 'media'"
        )

    # Construct the search directory
    search_dir = os.path.join(base_dir, request.file_type)

    if not os.path.isdir(search_dir):
        raise HTTPException(
            status_code=404, detail=f"No {request.file_type} directory found"
        )

    # Search for files with the given name (without extension)
    # Look for any file that starts with the given name
    pattern = os.path.join(search_dir, f"{request.file_name}.*")
    matching_files = glob.glob(pattern)

    # Filter out .meta files
    matching_files = [f for f in matching_files if not f.endswith(".meta")]

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail=f"No file found with name '{request.file_name}' in {request.file_type} directory",
        )

    # If multiple files match, take the first one
    file_path = matching_files[0]

    # Get the original filename for the download
    original_filename = os.path.basename(file_path)

    logger.info(f"Downloading file: {file_path}")

    return FileResponse(
        path=file_path,
        filename=original_filename,
        media_type="application/octet-stream",
    )
