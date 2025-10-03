from google.cloud import firestore
from typing import List
from datetime import datetime


class FirestoreHelper:
    def __init__(self):
        self.db = firestore.Client()

    def create_process_document(
        self, process_id: str, files: List[str], user_id: str
    ) -> None:
        files = [{"old_name": file, "new_name": ""} for file in files]
        doc_ref = self.db.collection("processes").document(process_id)
        doc_ref.set(
            {
                "id": process_id,
                "files": files,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "finished_at": None,
                "status": {"type": "processing", "message": ""},
                "user_id": user_id,
            }
        )

    def update_process_document(
        self, process_id: str, status: str, message: str
    ) -> None:
        doc_ref = self.db.collection("processes").document(process_id)
        doc_ref.update(
            {
                "status": {"type": status, "message": message},
                "updated_at": datetime.now(),
            }
        )

    def update_tuple_with_new_name(
        self, process_id: str, old_name: str, new_name: str
    ) -> None:
        doc_ref = self.db.collection("processes").document(process_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            files = data.get("files", [])
            # Update the file with matching old_name
            updated_files = []
            for file in files:
                if file.get("old_name") == old_name:
                    updated_files.append({"old_name": old_name, "new_name": new_name})
                else:
                    updated_files.append(file)
            doc_ref.update({"files": updated_files})

    def finish_process(self, process_id: str) -> None:
        doc_ref = self.db.collection("processes").document(process_id)
        doc_ref.update(
            {
                "finished_at": datetime.now(),
                "status": {"type": "completed", "message": ""},
            }
        )

    def get_latest_processes(self, user_id: str, limit: int = 5):
        query = (
            self.db.collection("processes")
            .where("user_id", "==", user_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        results = []
        for doc in query.stream():
            data = doc.to_dict()
            # Ensure the document id is present and consistent
            if "id" not in data:
                data["id"] = doc.id
            results.append(data)
        return results
