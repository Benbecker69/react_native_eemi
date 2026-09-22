// Runs before every test file's module graph loads (see package.json's
// jest.setupFiles). `src/services/api.ts` reads EXPO_PUBLIC_API_URL into a
// module-scope constant at import time, so it must be set before any test
// imports that module — a real .env value if present, a fake one otherwise.
process.env.EXPO_PUBLIC_API_URL ||= "https://test.invalid";

// Pins the Intl/Date time zone used by `src/utils/format.ts` tests so they
// don't depend on the machine running them — test-only, the shipped app
// still uses the device's real time zone (no TZ override at runtime).
process.env.TZ ||= "Europe/Paris";
