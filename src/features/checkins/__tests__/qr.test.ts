import { parseSpaceQrPayload } from "../qr";

describe("parseSpaceQrPayload", () => {
  it("extracts the space id from a well-formed payload", () => {
    expect(parseSpaceQrPayload("repere:space:abc-123")).toBe("abc-123");
  });

  it("trims surrounding whitespace around the id", () => {
    expect(parseSpaceQrPayload("repere:space: abc-123 ")).toBe("abc-123");
  });

  it("rejects a code with no Repère prefix", () => {
    expect(parseSpaceQrPayload("https://example.com/wifi")).toBeNull();
  });

  it("rejects a prefix with nothing after it", () => {
    expect(parseSpaceQrPayload("repere:space:")).toBeNull();
    expect(parseSpaceQrPayload("repere:space:   ")).toBeNull();
  });

  it("rejects an unrelated Repère-looking code", () => {
    expect(parseSpaceQrPayload("repere:location:abc-123")).toBeNull();
  });
});
