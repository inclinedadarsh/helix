import { NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/auth";

export async function GET() {
  try {
    // Get auth headers for backend
    const headers = await getAuthHeaders();

    const response = await fetch("http://localhost:8000/processes/recent", {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Recent processes error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recent processes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
