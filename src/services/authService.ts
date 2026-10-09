import type { AuthResult, MemberType, MeUser } from "@/types/api";
import { apiFetch } from "./api";

// Business intents, not URLs.

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

/**
 * Same two fields as the web's own "Profil" tab — see docs/api-mobile.md
 * "PATCH /me". `memberType` can't be `null` here: the server requires one of
 * the three values (422 otherwise), unlike the field on a freshly-read `MeUser`,
 * which is `null` until onboarding (web) or this screen (mobile) sets it.
 */
export async function updateProfile(input: {
  name: string;
  memberType: Exclude<MemberType, null>;
}): Promise<MeUser> {
  const { user } = await apiFetch<{ user: MeUser }>("/me", { method: "PATCH", body: input });
  return user;
}

/**
 * The same two changes as the web's "Sécurité" tab (see docs/api-mobile.md
 * in the web repo, "POST /me/password"). Both require the current password:
 * a stored session token alone doesn't prove it's still the account's owner
 * typing, not a device that only has a stolen token.
 */
export function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  return apiFetch<void>("/me/password", { method: "POST", body: input });
}

/** A successful change returns the fresh `MeUser` — the e-mail changed, nothing else. */
export async function changeEmail(input: {
  currentPassword: string;
  email: string;
}): Promise<MeUser> {
  const { user } = await apiFetch<{ user: MeUser }>("/me/email", { method: "POST", body: input });
  return user;
}
