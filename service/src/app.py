from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import json
import uuid
import logging
import glob
from pathlib import Path
from .utils import FirestoreHelper, ProcessHelper, ClerkHelper
from .utils.agent import helix
from .schema import (
    ProcessUrlRequest,
    DownloadFileRequest,
    SingleLinkUploadRequest,
    SearchRequest,
    SearchResponse,
    DeleteFileRequest,
)
from fastapi.middleware.cors import CORSMiddleware


def get_uploads_base_dir() -> Path:
    """Get the uploads base directory (adjacent to project root)."""
    # Uploads directory is one level up from project root (adjacent to project)
    base_dir = Path(__file__).resolve().parents[2]  # Go up 2 levels from src/app.py
    return base_dir / "uploads"


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
    base_dir = get_uploads_base_dir() / current_user / "processed"

    categories = {
        "docs": [],
        "links": [],
        "media": [],
    }

    for category in categories.keys():
        category_dir = base_dir / category
        if not category_dir.is_dir():
            continue
        try:
            for entry in category_dir.iterdir():
                if entry.name.endswith(".meta"):
                    try:
                        with open(entry, "r") as f:
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
    uploads_base_dir = get_uploads_base_dir() / current_user

    # Check metadata in processed directory
    processed_dir = uploads_base_dir / "processed"
    # Get actual files from original directory
    original_dir = uploads_base_dir / "original"

    # Validate file type
    if request.file_type not in ["docs", "media"]:
        raise HTTPException(
            status_code=400, detail="file_type must be either 'docs' or 'media'"
        )

    # Check if metadata exists in processed directory
    processed_search_dir = processed_dir / request.file_type
    if not processed_search_dir.is_dir():
        raise HTTPException(
            status_code=404, detail=f"No {request.file_type} directory found"
        )

    # Look for metadata file to confirm the file exists
    meta_pattern = processed_search_dir / f"{request.file_name}.meta"
    if not meta_pattern.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No file found with name '{request.file_name}' in {request.file_type} directory",
        )

    # Now look for the actual file in original directory
    original_search_dir = original_dir / request.file_type
    if not original_search_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"No {request.file_type} directory found in original folder",
        )

    # Search for files with the given name (without extension) in original directory
    pattern = str(original_search_dir / f"{request.file_name}.*")
    matching_files = glob.glob(pattern)

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail=f"No file found with name '{request.file_name}' in {request.file_type} directory",
        )

    # If multiple files match, take the first one
    file_path = matching_files[0]

    # Get the original filename for the download
    original_filename = Path(file_path).name

    logger.info(f"Downloading file: {file_path}")

    return FileResponse(
        path=file_path,
        filename=original_filename,
        media_type="application/octet-stream",
    )


@app.delete("/files")
async def delete_file(
    request: DeleteFileRequest,
    current_user: str = Depends(clerk.get_clerk_payload),
):
    """
    Delete a file by name for the current user.
    Removes .meta and .md files from processed directory and original file from original directory.
    Request body should contain:
    - file_name: name of the file without extension
    """
    try:
        logger.info(
            f"Delete file request received for user: {current_user}, file: {request.file_name}"
        )

        # Get base directories
        base_dir = get_uploads_base_dir() / current_user
        processed_dir = base_dir / "processed"
        original_dir = base_dir / "original"

        logger.info(f"Base directory: {base_dir}")
        logger.info(f"Processed directory exists: {processed_dir.exists()}")
        logger.info(f"Original directory exists: {original_dir.exists()}")

        deleted_files = []
        found_any = False

        # Categories to search in
        categories = ["docs", "media", "links"]
        logger.info(f"Searching in categories: {categories}")

        # Search in processed directories for .meta and .md files
        for category in categories:
            category_processed_dir = processed_dir / category
            logger.info(
                f"Checking processed category '{category}': {category_processed_dir}"
            )
            logger.info(f"Category directory exists: {category_processed_dir.exists()}")

            if category_processed_dir.exists():
                # Look for .meta file
                meta_file = category_processed_dir / f"{request.file_name}.meta"
                logger.info(f"Looking for meta file: {meta_file}")
                logger.info(f"Meta file exists: {meta_file.exists()}")

                if meta_file.exists():
                    meta_file.unlink()
                    deleted_files.append(str(meta_file))
                    found_any = True
                    logger.info(f"Deleted meta file: {meta_file}")

                # Look for .md file
                md_file = category_processed_dir / f"{request.file_name}.md"
                logger.info(f"Looking for markdown file: {md_file}")
                logger.info(f"Markdown file exists: {md_file.exists()}")

                if md_file.exists():
                    md_file.unlink()
                    deleted_files.append(str(md_file))
                    found_any = True
                    logger.info(f"Deleted markdown file: {md_file}")

        # Search in original directories for the actual file
        for category in categories:
            category_original_dir = original_dir / category
            logger.info(
                f"Checking original category '{category}': {category_original_dir}"
            )
            logger.info(
                f"Original category directory exists: {category_original_dir.exists()}"
            )

            if category_original_dir.exists():
                # Look for files with the given name and any extension
                pattern = f"{request.file_name}.*"
                logger.info(
                    f"Searching for pattern: {pattern} in {category_original_dir}"
                )
                matching_files = list(category_original_dir.glob(pattern))
                logger.info(
                    f"Found {len(matching_files)} matching files: {matching_files}"
                )

                for file_path in matching_files:
                    logger.info(f"Deleting original file: {file_path}")
                    file_path.unlink()
                    deleted_files.append(str(file_path))
                    found_any = True
                    logger.info(f"Successfully deleted original file: {file_path}")

        logger.info(f"Total files found and deleted: {len(deleted_files)}")
        logger.info(f"Found any files: {found_any}")

        if not found_any:
            logger.warning(
                f"No files found with name '{request.file_name}' for user '{current_user}'"
            )
            raise HTTPException(
                status_code=404,
                detail=f"No file found with name '{request.file_name}' for user '{current_user}'",
            )

        logger.info(
            f"Successfully deleted {len(deleted_files)} files for user {current_user}"
        )
        logger.info(f"Deleted files list: {deleted_files}")

        return {
            "message": f"Successfully deleted file '{request.file_name}'",
            "deleted_files": deleted_files,
            "count": len(deleted_files),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error deleting file '{request.file_name}' for user {current_user}: {str(e)}"
        )
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", response_model=SearchResponse)
async def search(
    request: SearchRequest,
):
    """
    Search across user's processed files using multi-agent system.
    Request body should contain:
    - query: The search query string
    """
    user_id = request.user_id
    try:
        logger.info(f"Search request received from user: {user_id}")

        base_dir = get_uploads_base_dir() / user_id / "processed"
        for subdirectory in ["links", "docs", "media"]:
            dir_path = base_dir / subdirectory
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Ensured directory exists: {dir_path}")

        result = await helix(user_id, request.query)

        return SearchResponse(query=request.query, result=result)
    except Exception as e:
        logger.error(f"Error processing search request for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
