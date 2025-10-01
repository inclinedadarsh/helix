from fastapi import FastAPI, UploadFile, File, BackgroundTasks
import uuid
import logging
from .utils import FirestoreHelper, ProcessHelper

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


# TODO: Implement cerebras file renaming
# TODO: Add a route to get the status of a process
# TODO: Add a route to get all processes
# TODO: Add a route to get all files (processed and processing)
