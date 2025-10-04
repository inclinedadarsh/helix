import { NextResponse } from "next/server";
import { getAuthHeaders } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/env";

export async function GET() {
  try {
    const headers = await getAuthHeaders();

    const res = await fetch(`${BACKEND_URL}/files/processed`, {
      method: "GET",
      // Ensure we always hit the backend for latest
      cache: "no-store",
      headers,
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
