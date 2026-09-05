const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }

    const query = searchParams.toString();

    if (query) {
      url += `?${query}`;
    }
  }

  console.log("[apiFetch] URL:", url);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      let message = "Something went wrong";

      try {
        const data = await response.json();

        if (typeof data.message === "string") {
          message = data.message;
        }
      } catch {
        // Ignore invalid JSON response.
      }

      throw new Error(message);
    }

    return response.json();
   } catch (error) {
    console.error("[apiFetch] Request failed");
    console.error("[apiFetch] URL:", url);
    console.error("[apiFetch] Error:", error);
    console.error(
      "[apiFetch] Error message:",
      error instanceof Error ? error.message : String(error),
    );

    throw error;
  }
}