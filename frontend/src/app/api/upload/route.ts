import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Convert FormData to a format the backend expects
    const files: File[] = [];
    const fileEntries = Array.from(formData.entries());

    for (const [key, value] of fileEntries) {
      if (key.startsWith("file_") && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Create FormData for backend - FastAPI expects files with key "files"
    const backendFormData = new FormData();
    files.forEach((file) => {
      backendFormData.append("files", file);
    });

    // Send to backend
    const response = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error(`Backend upload failed: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json(
      {
        message: "Files uploaded successfully",
        filesUploaded: files.length,
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
