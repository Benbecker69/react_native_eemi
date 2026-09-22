import * as SecureStore from "expo-secure-store";
import { clearToken, readToken, saveToken } from "@/storage/token";

// expo-secure-store wraps the iOS Keychain — a native module Jest can't run,
// so it's mocked here rather than exercised for real (that happens on the
// iPhone instead, per the plan's Phase 3 verification step).
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("saveToken stores the value under the app's own key", async () => {
  await saveToken("rpm_abc");
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith("repere_mobile_token", "rpm_abc");
});

it("readToken returns whatever is stored", async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("rpm_abc");
  await expect(readToken()).resolves.toBe("rpm_abc");
});

it("readToken returns null when nothing is stored", async () => {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  await expect(readToken()).resolves.toBeNull();
});

it("readToken returns null (not a throw) if the Keychain read fails", async () => {
  (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error("Keychain locked"));
  await expect(readToken()).resolves.toBeNull();
});

it("clearToken removes the app's key", async () => {
  await clearToken();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("repere_mobile_token");
});
