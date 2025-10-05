import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/env";

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

    if (!["docs", "media", "links"].includes(file_type)) {
      return NextResponse.json(
        { error: "file_type must be either 'docs', 'media', or 'links'" },
        { status: 400 },
      );
    }

    // Get auth headers for backend
    const headers = await getAuthHeaders();

    const res = await fetch(`${BACKEND_URL}/files`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        file_name,
        file_type,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete file", status: res.status },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
