/** Read the CSRF token from the cookie */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Wrapper around fetch that automatically includes the CSRF token
 * header for mutation requests (POST, PUT, DELETE).
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);

  // Add CSRF header for mutation requests
  if (method !== "GET" && method !== "HEAD") {
    const token = getCsrfToken();
    if (token) {
      headers.set("x-csrf-token", token);
    }
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });
}
