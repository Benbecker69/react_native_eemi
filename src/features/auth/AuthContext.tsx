import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "@/services/authService";
import { setUnauthorizedHandler } from "@/services/api";
import { queryClient } from "@/storage/queryClient";
import { clearToken, readToken, saveToken } from "@/storage/token";
import type { MeUser } from "@/types/api";

// The routing gate: `status` decides between the `(auth)` and `(app)` route
// groups in the root layout (`Stack.Protected`). It only reflects "do we
// have a token", never a network round trip — so it resolves from a fast
// local SecureStore read and doesn't block the splash screen on the tunnel
// being reachable. Once inside `(app)`, screens fetch `/me` themselves
// (via TanStack Query) and a 401 from *any* call flips this back to
// "signedOut" through `setUnauthorizedHandler`, without the caller having to
// know that happened.
type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; token: string; user: MeUser | null };

type AuthContextValue = {
  state: AuthState;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  /** Called once a screen has fetched /me, so the header/profile can show it without refetching. */
  setUser: (user: MeUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEVICE_NAME = "iPhone (Expo Go)";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  // Avoids a double sign-out if a burst of parallel requests all 401 at once.
  const signingOutRef = useRef(false);

  const forceSignOut = useCallback(() => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    clearToken()
      .catch(() => {})
      .finally(() => {
        queryClient.clear();
        setState({ status: "signedOut" });
        signingOutRef.current = false;
      });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(forceSignOut);
    return () => setUnauthorizedHandler(null);
  }, [forceSignOut]);

  useEffect(() => {
    let cancelled = false;
    readToken().then((token) => {
      if (cancelled) return;
      setState(token ? { status: "signedIn", token, user: null } : { status: "signedOut" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const result = await authService.login({ ...input, deviceName: DEVICE_NAME });
    await saveToken(result.token);
    setState({ status: "signedIn", token: result.token, user: result.user });
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const result = await authService.register({ ...input, deviceName: DEVICE_NAME });
      await saveToken(result.token);
      setState({ status: "signedIn", token: result.token, user: result.user });
    },
    [],
  );

  const logout = useCallback(async () => {
    // Best-effort: the local session is cleared either way, even offline.
    try {
      await authService.logout();
    } catch {
      // Ignored — see docs/api-mobile.md, logout only needs to work locally to be safe.
    }
    await clearToken();
    queryClient.clear();
    setState({ status: "signedOut" });
  }, []);

  const setUser = useCallback((user: MeUser) => {
    setState((previous) =>
      previous.status === "signedIn" ? { ...previous, user } : previous,
    );
  }, []);

  const value = useMemo(
    () => ({ state, login, register, logout, setUser }),
    [state, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
