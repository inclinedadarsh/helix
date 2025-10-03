import { NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    // Validate URLs
    const validUrls = urls.filter((url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 },
      );
    }

    // Get auth headers for backend
    const headers = await getAuthHeaders();

    // Send to FastAPI backend
    const response = await fetch("http://localhost:8000/process-urls", {
      method: "POST",
      headers,
      body: JSON.stringify({ urls: validUrls }),
    });

    if (!response.ok) {
      throw new Error(`Backend processing failed: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json(
      {
        message: "URLs processed successfully",
        urlsProcessed: validUrls.length,
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("URL processing error:", error);
    return NextResponse.json(
      {
        error: "URL processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
