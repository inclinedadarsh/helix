import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8000/files/processed";

export async function GET() {
  try {
    const res = await fetch(BACKEND_URL, {
      method: "GET",
      // Ensure we always hit the backend for latest
      cache: "no-store",
      headers: {
        "content-type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: res.status },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}
