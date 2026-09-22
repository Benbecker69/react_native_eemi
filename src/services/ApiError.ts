import type { ApiErrorCode } from "@/types/api";

/**
 * Thrown by `apiFetch` for anything that isn't a successful response —
 * including a local, no-network-call refusal when no token is stored (same
 * `code` the server would have used, so callers only ever branch on `code`).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}
