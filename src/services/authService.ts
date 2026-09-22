import type { AuthResult, MeUser } from "@/types/api";
import { apiFetch } from "./api";

// Business intents, not URLs — see the `backend-api-client` skill.

export function register(input: {
  name: string;
  email: string;
  password: string;
  deviceName?: string;
}): Promise<AuthResult> {
  return apiFetch<AuthResult>("/auth/register", { method: "POST", body: input, auth: false });
}

export function login(input: {
  email: string;
  password: string;
  deviceName?: string;
}): Promise<AuthResult> {
  return apiFetch<AuthResult>("/auth/login", { method: "POST", body: input, auth: false });
}

/** Revokes the session on the server. Callers still clear the local token even if this fails. */
export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export async function me(): Promise<MeUser> {
  const { user } = await apiFetch<{ user: MeUser }>("/me");
  return user;
}
