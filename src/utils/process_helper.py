from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import List

from fastapi import UploadFile

from .db import FirestoreHelper
from . import transcribe_media, process_file as convert_file


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s"
    )


class ProcessHelper:
    def __init__(self, db: FirestoreHelper):
        self.db = db
        # Resolve uploads directory at project root (one level up from src)
        base_dir = Path(__file__).resolve().parents[2]
        self._uploads_dir = base_dir / "uploads"
        self._processing_dir = self._uploads_dir / "processing"
        self._processed_dir = self._uploads_dir / "processed"
        self._uploads_dir.mkdir(parents=True, exist_ok=True)
        self._processing_dir.mkdir(parents=True, exist_ok=True)
        self._processed_dir.mkdir(parents=True, exist_ok=True)

        self._media_extensions = {"mp4", "mp3"}

    def _truncate(self, text: str, limit: int = 2000) -> str:
        if not isinstance(text, str):
            return ""
        return text[:limit]

    def _move_to_processed(self, src_path: Path, process_id: str, index: int) -> str:
        ext = src_path.suffix
        new_name = f"{process_id}-{index}{ext}"
        dst_path = self._processed_dir / new_name
        shutil.move(str(src_path), str(dst_path))
        return new_name

    def _update_status(self, process_id: str, message: str) -> None:
        self.db.update_process_document(process_id, "processing", message)

    def _update_tuple_with_new_name(
        self, process_id: str, old_name: str, new_name: str
    ) -> None:
        self.db.update_tuple_with_new_name(process_id, old_name, new_name)

    def _save_uploads(self, files: List[UploadFile]) -> List[Path]:
        saved_paths: List[Path] = []
        for file in files:
            dst_path = self._processing_dir / file.filename
            with dst_path.open("wb") as out_f:
                shutil.copyfileobj(file.file, out_f)
            saved_paths.append(dst_path)
        return saved_paths

    def process_files_background(
        self, process_id: str, files: List[UploadFile]
    ) -> None:
        logger.info(
            "Background processing started",
            extra={"process_id": process_id, "file_count": len(files)},
        )

        saved_paths = self._save_uploads(files)

        for idx, (upload, path) in enumerate(zip(files, saved_paths), start=1):
            original_name = upload.filename
            ext = path.suffix.lower().lstrip(".")
            try:
                logger.info(
                    f"Analyzing file {original_name}",
                    extra={
                        "process_id": process_id,
                        "file": original_name,
                        "index": idx,
                    },
                )
                self._update_status(process_id, f"Analyzing the file {original_name}")

                if ext in self._media_extensions:
                    text = transcribe_media(str(path))
                else:
                    text = convert_file(str(path))

                _ = self._truncate(text, 1000)

                new_name = self._move_to_processed(path, process_id, idx)
                self._update_tuple_with_new_name(process_id, original_name, new_name)
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
                logger.exception(
                    f"Error processing file {original_name}",
                    extra={
                        "process_id": process_id,
                        "file": original_name,
                        "index": idx,
                    },
                )
                continue

        self.db.finish_process(process_id)
        logger.info(
            f"Background processing completed {process_id}",
            extra={"process_id": process_id},
        )
