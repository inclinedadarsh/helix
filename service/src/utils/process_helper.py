from __future__ import annotations

import logging
import json
import shutil
from pathlib import Path
from typing import List

from fastapi import UploadFile

from .ai import AIHelper
from .db import FirestoreHelper
from . import transcribe_media, process_file as convert_file
from .url_helper import url_to_markdown


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
        # Subdirectories inside processed output
        self._processed_media_dir = self._processed_dir / "media"
        self._processed_docs_dir = self._processed_dir / "docs"
        self._processed_links_dir = self._processed_dir / "links"
        self._processed_media_dir.mkdir(parents=True, exist_ok=True)
        self._processed_docs_dir.mkdir(parents=True, exist_ok=True)
        self._processed_links_dir.mkdir(parents=True, exist_ok=True)

        self._media_extensions = {"mp4", "mp3"}

        self.ai_helper = AIHelper()

    def _truncate(self, text: str, limit: int = 2000) -> str:
        if not isinstance(text, str):
            return ""
        return text[:limit]

    def _sanitize_base_name(self, name: str) -> str:
        sanitized = "".join(
            c if (c.isalnum() or c == "_") else "_" for c in (name or "").strip()
        ).strip("_")
        return sanitized or "file"

    def _move_and_rename_with_meta(
        self,
        src_path: Path,
        base_name: str,
        original_name: str,
        summary: str,
        tags: List[str],
    ) -> str:
        # Ensure base name is sanitized and unique alongside .meta
        base_name = self._sanitize_base_name(base_name)
        ext = src_path.suffix
        ext_no_dot = ext.lstrip(".").lower()
        # Choose destination root based on media vs docs
        dest_root = (
            self._processed_media_dir
            if ext_no_dot in self._media_extensions
            else self._processed_docs_dir
        )
        candidate_base = base_name
        counter = 1
        while True:
            file_dest = dest_root / f"{candidate_base}{ext}"
            meta_dest = dest_root / f"{candidate_base}.meta"
            if not file_dest.exists() and not meta_dest.exists():
                break
            candidate_base = f"{base_name}-{counter}"
            counter += 1

        # Move/rename the actual file
        shutil.move(str(src_path), str(file_dest))

        # Write the .meta JSON file
        meta_payload = {
            "old_name": original_name,
            "name": candidate_base,
            "summary": summary,
            "tags": tags or [],
        }
        with meta_dest.open("w", encoding="utf-8") as f:
            json.dump(meta_payload, f, ensure_ascii=False, indent=2)

        # Return path relative to processed dir so callers can locate it
        return str(file_dest.relative_to(self._processed_dir))

    def _write_link_meta(
        self, base_name: str, original_url: str, summary: str, tags: List[str]
    ) -> str:
        # Ensure base name is sanitized and unique alongside .meta in links dir
        base_name = self._sanitize_base_name(base_name)
        candidate_base = base_name or "link"
        counter = 1
        while True:
            meta_dest = self._processed_links_dir / f"{candidate_base}.meta"
            if not meta_dest.exists():
                break
            candidate_base = f"{base_name}-{counter}"
            counter += 1

        meta_payload = {
            "old_name": original_url,
            "name": candidate_base,
            "summary": summary,
            "tags": tags or [],
        }
        with meta_dest.open("w", encoding="utf-8") as f:
            json.dump(meta_payload, f, ensure_ascii=False, indent=2)

        # Return path relative to processed dir so callers can locate it
        return str(meta_dest.relative_to(self._processed_dir))

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

                content = self._truncate(text, 2000)

                name, summary, tags = self.ai_helper.get_analyzed_file_data(content)

                new_name = self._move_and_rename_with_meta(
                    path, name, original_name, summary, tags
                )
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

    def process_links_background(self, process_id: str, urls: List[str]) -> None:
        logger.info(
            "Background URL processing started",
            extra={"process_id": process_id, "url_count": len(urls)},
        )

        for idx, url in enumerate(urls, start=1):
            try:
                logger.info(
                    f"Processing URL {url}",
                    extra={
                        "process_id": process_id,
                        "url": url,
                        "index": idx,
                    },
                )
                self._update_status(process_id, f"Fetching and analyzing the URL {url}")

                markdown = url_to_markdown(url)
                content = self._truncate(markdown, 2000)

                name, summary, tags = self.ai_helper.get_analyzed_file_data(content)

                new_name = self._write_link_meta(name, url, summary, tags)
                self._update_tuple_with_new_name(process_id, url, new_name)

                logger.info(
                    f"URL processed and meta written to {new_name}",
                    extra={
                        "process_id": process_id,
                        "old_name": url,
                        "new_name": new_name,
                        "index": idx,
                    },
                )
            except Exception:
                logger.exception(
                    f"Error processing URL {url}",
                    extra={
                        "process_id": process_id,
                        "url": url,
                        "index": idx,
                    },
                )
                continue

        self.db.finish_process(process_id)
        logger.info(
            f"Background URL processing completed {process_id}",
            extra={"process_id": process_id},
        )
