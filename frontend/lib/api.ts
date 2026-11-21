// Tiny typed fetch helper. The browser only calls relative /api/* URLs;
// next.config.ts rewrites them to the backend.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
    } catch {
      // Body was not JSON (e.g. proxy error); keep statusText.
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// --- Types mirroring backend/app/models.py ---

export type Contact = {
  id: number;
  name: string;
  phone: string | null;
  telegram_chat_id: string | null;
  created_at: string;
};

export type ContactInput = {
  name: string;
  phone?: string;
  telegram_chat_id?: string;
};

export const contactsApi = {
  list: () => api<Contact[]>("/contacts"),
  create: (body: ContactInput) =>
    api<Contact>("/contacts", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: number) => api<void>(`/contacts/${id}`, { method: "DELETE" }),
};

export const health = () => api<{ status: string }>("/health");
