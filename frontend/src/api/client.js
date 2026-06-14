const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

const DEFAULT_TIMEOUT = 30000;

async function request(path, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, headers: customHeaders, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...customHeaders,
      },
      signal: controller.signal,
      ...restOptions,
    });

    if (!response.ok) {
      let message = "";
      try {
        message = await response.text();
      } catch {
        message = `HTTP ${response.status}`;
      }
      const error = new Error(message || `Request failed: ${response.status}`);
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),
  patch: (path, body, options) =>
    request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    }),
  delete: (path, options) =>
    request(path, {
      method: "DELETE",
      ...options,
    }),
};

export { API_BASE };
