import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/auth";

const BACKEND_URL = "http://localhost:8000/download";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { file_name, file_type } = body;

    if (!file_name || !file_type) {
      return NextResponse.json(
        { error: "file_name and file_type are required" },
        { status: 400 },
      );
    }

    if (!["docs", "media"].includes(file_type)) {
      return NextResponse.json(
        { error: "file_type must be either 'docs' or 'media'" },
        { status: 400 },
      );
    }

    // Get auth headers for backend
    const headers = await getAuthHeaders();

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        file_name,
        file_type,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to download file", status: res.status },
        { status: res.status },
      );
    }

    // Get the file content and headers from the backend response
    const fileBuffer = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      res.headers.get("content-disposition") ||
      `attachment; filename="${file_name}"`;

    // Return the file as a response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
