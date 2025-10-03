import { auth } from "@clerk/nextjs/server";

/**
 * Get the Clerk JWT token for backend authentication
 * @returns Promise<string | null> - The JWT token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Get headers with Authorization for backend API calls
 * @param additionalHeaders - Additional headers to include
 * @param includeContentType - Whether to include Content-Type: application/json (default: true)
 * @returns Promise<HeadersInit> - Headers with Authorization
 */
export async function getAuthHeaders(
  additionalHeaders: Record<string, string> = {},
  includeContentType: boolean = true,
): Promise<HeadersInit> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    ...additionalHeaders,
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
