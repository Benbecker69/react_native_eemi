import { apiFetch, setUnauthorizedHandler } from "@/services/api";
import { ApiError } from "@/services/ApiError";
import { readToken } from "@/storage/token";

// The token store is mocked so this file tests apiFetch's own logic (headers,
// error mapping, the global 401 hook) in isolation from SecureStore — see
// token.test.ts for that module's own tests.
jest.mock("@/storage/token", () => ({ readToken: jest.fn() }));
const mockedReadToken = readToken as jest.MockedFunction<typeof readToken>;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn();
  setUnauthorizedHandler(null);
});

describe("apiFetch — authentication", () => {
  it("does not read a token or call fetch when auth is required but none is stored", async () => {
    mockedReadToken.mockResolvedValue(null);

    await expect(apiFetch("/reservations")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("attaches the stored token as a bearer header", async () => {
    mockedReadToken.mockResolvedValue("rpm_test-token");
    (globalThis.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch("/me");

    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer rpm_test-token");
  });

  it("skips the token entirely for auth: false calls (login/register)", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch("/auth/login", { method: "POST", body: { email: "a" }, auth: false });

    expect(mockedReadToken).not.toHaveBeenCalled();
    const [, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("calls the registered handler exactly once on a 401 response, and still throws", async () => {
    mockedReadToken.mockResolvedValue("rpm_expired");
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(401, { error: { code: "SESSION_EXPIRED", message: "Session expirée." } }),
    );
    const handler = jest.fn();
    setUnauthorizedHandler(handler);

    await expect(apiFetch("/me")).rejects.toMatchObject({
      status: 401,
      code: "SESSION_EXPIRED",
      message: "Session expirée.",
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("apiFetch — responses", () => {
  it("resolves with the parsed JSON body on success", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    (globalThis.fetch as jest.Mock).mockResolvedValue(jsonResponse(200, { user: { id: "u1" } }));

    await expect(apiFetch("/me")).resolves.toEqual({ user: { id: "u1" } });
  });

  it("resolves with undefined for a 204 (logout)", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    (globalThis.fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("maps a documented error body to its code and French message", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse(409, {
        error: { code: "SLOT_TAKEN", message: "Ce créneau vient d'être réservé." },
      }),
    );

    await expect(apiFetch("/reservations", { method: "POST" })).rejects.toMatchObject({
      status: 409,
      code: "SLOT_TAKEN",
      message: "Ce créneau vient d'être réservé.",
    });
  });

  it("falls back to a generic error when the body isn't the documented shape", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      new Response("<html>502</html>", { status: 502 }),
    );

    await expect(apiFetch("/health", { auth: false })).rejects.toMatchObject({
      status: 502,
      code: "UNKNOWN_ERROR",
    });
  });
});

describe("apiFetch — network failures", () => {
  it("turns a rejected fetch into a NETWORK_ERROR ApiError", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    (globalThis.fetch as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));

    await expect(apiFetch("/me")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("turns an aborted fetch (timeout) into a TIMEOUT ApiError", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    (globalThis.fetch as jest.Mock).mockRejectedValue(abortError);

    await expect(apiFetch("/me")).rejects.toMatchObject({ status: 0, code: "TIMEOUT" });
  });

  it("ApiError.isNetworkError is true only for client-side failures (status 0)", async () => {
    mockedReadToken.mockResolvedValue("rpm_ok");
    (globalThis.fetch as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));

    try {
      await apiFetch("/me");
      throw new Error("expected apiFetch to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).isNetworkError).toBe(true);
    }
  });
});
