import { readToken } from "@/storage/token";
import { ApiError } from "./ApiError";

// The one client every service goes through — see the `backend-api-client`
// skill. Nothing outside `src/services` calls `fetch` against the API.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT_MS = 15_000;

/**
 * Runs once, on any 401 from any call. `AuthContext` registers this to clear
 * the stored token and the query cache — see docs/api-mobile.md "Session" and
 * the plan's "401 global → nettoyage du jeton et du cache → retour connexion".
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Attach the stored bearer token. Default true — every route needs one except health/register/login. */
  auth?: boolean;
};

// A plain function, not a type-predicate `asserts` (those only narrow
// parameters/`this`, never an outer module-level const like BASE_URL) — see
// TS2775/TS1225. A missing .env is a setup mistake, not something to recover
// from at runtime, so this fails loudly rather than fetching `undefined/...`.
function getBaseUrl(): string {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      "MISSING_CONFIG",
      "EXPO_PUBLIC_API_URL n'est pas configuré (copiez .env.example vers .env).",
    );
  }
  return BASE_URL;
}

async function readErrorBody(response: Response): Promise<{ code: string; message: string }> {
  try {
    const data = (await response.json()) as { error?: { code?: string; message?: string } };
    if (data?.error?.code && data.error.message) {
      return { code: data.error.code, message: data.error.message };
    }
  } catch {
    // Not JSON, or not the expected shape — fall through to the generic message.
  }
  return { code: "UNKNOWN_ERROR", message: `Erreur du serveur (${response.status}).` };
}

/**
 * `path` starts with `/`, e.g. `/reservations`. Throws `ApiError` for
 * anything but a 2xx response — including client-side network/timeout
 * failures (status 0) and a locally-refused call when `auth` is required but
 * no token is stored (saves a round trip, matches the server's own 401).
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    // The free ngrok domain shows an HTML "visit site" interstitial to
    // browser-shaped requests; this header is ngrok's own documented way to
    // skip it — harmless against a non-ngrok host, so left on unconditionally.
    "ngrok-skip-browser-warning": "true",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = await readToken();
    if (!token) {
      throw new ApiError(401, "UNAUTHENTICATED", "Connexion requise.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    throw new ApiError(
      0,
      timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      timedOut
        ? "Le serveur met trop de temps à répondre."
        : "Impossible de joindre le serveur. Vérifiez votre connexion.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const { code, message } = await readErrorBody(response);
    if (response.status === 401) onUnauthorized?.();
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(0, "INVALID_RESPONSE", "Réponse du serveur illisible.");
  }
}
