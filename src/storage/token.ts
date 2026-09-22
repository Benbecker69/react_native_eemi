import * as SecureStore from "expo-secure-store";

// The mobile session token (see docs/api-mobile.md in the Next.js repo). Kept
// in the iOS Keychain via SecureStore, never in AsyncStorage — it is a real
// bearer credential, not a preference. SecureStore is included in Expo Go.
const TOKEN_KEY = "repere_mobile_token";

export async function readToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // A locked/unavailable Keychain reads as "no session" rather than a crash.
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
