from fastapi import FastAPI, UploadFile, File, BackgroundTasks
import os
import json
import uuid
import logging
from .utils import FirestoreHelper, ProcessHelper
from .schema import ProcessUrlRequest

app = FastAPI()
db = FirestoreHelper()

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
