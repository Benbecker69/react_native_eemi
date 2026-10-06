import type { MemberSummary } from "@/types/api";
import { apiFetch } from "./api";

// Business intent, not a URL — see the `backend-api-client` skill.

/** The home screen's figures — counted by the server, never from the pages the app happens to have loaded. */
export async function getSummary(): Promise<MemberSummary> {
  const { summary } = await apiFetch<{ summary: MemberSummary }>("/me/summary");
  return summary;
}
