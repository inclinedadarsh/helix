from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import json
import uuid
import logging
import glob
from .utils import FirestoreHelper, ProcessHelper, ClerkHelper
from .schema import ProcessUrlRequest, DownloadFileRequest, SingleLinkUploadRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
db = FirestoreHelper()
clerk = ClerkHelper()


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
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(..., max_items=10),
    current_user: str = Depends(clerk.get_clerk_payload),
):
    process_id = uuid.uuid4().hex
    logger.info(
        f"Upload received; starting process {process_id}",
        extra={"process_id": process_id, "num_files": len(files)},
    )

    db.create_process_document(
        process_id, [file.filename for file in files], current_user
    )
    logger.info(
        f"Firestore process document created {process_id}",
        extra={"process_id": process_id},
    )

    process_helper = ProcessHelper(db)
    background_tasks.add_task(
        process_helper.process_files_background, process_id, current_user, files
    )
    logger.info(
        f"Background task scheduled {process_id}", extra={"process_id": process_id}
    )

    return {"message": "saved!", "process_id": process_id}


@app.post("/process-urls")
async def process_urls(
    background_tasks: BackgroundTasks,
    request: ProcessUrlRequest,
    current_user: str = Depends(clerk.get_clerk_payload),
):
    process_id = uuid.uuid4().hex
    logger.info(
        f"URL list received; starting process {process_id}",
        extra={"process_id": process_id, "num_urls": len(request.urls)},
    )

    db.create_process_document(process_id, request.urls, current_user)
    logger.info(
        f"Firestore process document created {process_id}",
        extra={"process_id": process_id},
    )

    process_helper = ProcessHelper(db)
    background_tasks.add_task(
        process_helper.process_links_background, process_id, current_user, request.urls
    )
    logger.info(
        f"Background URL processing scheduled {process_id}",
        extra={"process_id": process_id},
    )

    return {"message": "saved!", "process_id": process_id}


@app.post("/upload-single-link")
async def upload_single_link(
    background_tasks: BackgroundTasks,
    request: SingleLinkUploadRequest,
):
    """
    Process a single link without authentication.
    Accepts a link and username, processes the link and stores it under the username.
    """
    process_id = uuid.uuid4().hex
    logger.info(
        f"Single link upload received; starting process {process_id}",
        extra={
            "process_id": process_id,
            "link": request.link,
            "username": request.username,
        },
    )

    # Create process document using username as user_id
    db.create_process_document(process_id, [request.link], request.username)
    logger.info(
        f"Firestore process document created {process_id}",
        extra={"process_id": process_id},
    )

    process_helper = ProcessHelper(db)
    background_tasks.add_task(
        process_helper.process_links_background,
        process_id,
        request.username,
        [request.link],
    )
    logger.info(
        f"Background single link processing scheduled {process_id}",
        extra={"process_id": process_id},
    )

    return {"message": "Link processing started!", "process_id": process_id}


@app.get("/processes/recent")
def get_recent_processes(current_user: str = Depends(clerk.get_clerk_payload)):
    processes = db.get_latest_processes(current_user, limit=5)
    return {"processes": processes}


@app.get("/files/processed")
def get_processed_files(current_user: str = Depends(clerk.get_clerk_payload)):
    base_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "uploads", current_user, "processed"
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
async def download_file(
    request: DownloadFileRequest, current_user: str = Depends(clerk.get_clerk_payload)
):
    """
    Download a file by name and type.
    Request body should contain:
    - file_name: name of the file without extension
    - file_type: either "docs" or "media"
    """
    uploads_base_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "uploads", current_user
    )

    # Check metadata in processed directory
    processed_dir = os.path.join(uploads_base_dir, "processed")
    # Get actual files from original directory
    original_dir = os.path.join(uploads_base_dir, "original")

    # Validate file type
    if request.file_type not in ["docs", "media"]:
        raise HTTPException(
            status_code=400, detail="file_type must be either 'docs' or 'media'"
        )

    # Check if metadata exists in processed directory
    processed_search_dir = os.path.join(processed_dir, request.file_type)
    if not os.path.isdir(processed_search_dir):
        raise HTTPException(
            status_code=404, detail=f"No {request.file_type} directory found"
        )

    # Look for metadata file to confirm the file exists
    meta_pattern = os.path.join(processed_search_dir, f"{request.file_name}.meta")
    if not os.path.exists(meta_pattern):
        raise HTTPException(
            status_code=404,
            detail=f"No file found with name '{request.file_name}' in {request.file_type} directory",
        )

    # Now look for the actual file in original directory
    original_search_dir = os.path.join(original_dir, request.file_type)
    if not os.path.isdir(original_search_dir):
        raise HTTPException(
            status_code=404,
            detail=f"No {request.file_type} directory found in original folder",
        )

    # Search for files with the given name (without extension) in original directory
    pattern = os.path.join(original_search_dir, f"{request.file_name}.*")
    matching_files = glob.glob(pattern)

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
