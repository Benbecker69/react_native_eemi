import { joinName, splitName } from "../name";

describe("splitName", () => {
  it("splits a two-word name on the first space", () => {
    expect(splitName("Camille Roussel")).toEqual({ firstName: "Camille", lastName: "Roussel" });
  });

  it("keeps everything after the first space as the last name", () => {
    expect(splitName("Jean Paul De La Croix")).toEqual({
      firstName: "Jean",
      lastName: "Paul De La Croix",
    });
  });

  it("leaves the last name empty for a one-word name", () => {
    expect(splitName("Admin")).toEqual({ firstName: "Admin", lastName: "" });
  });

  it("trims surrounding and internal spacing", () => {
    expect(splitName("  Camille   Roussel  ")).toEqual({ firstName: "Camille", lastName: "Roussel" });
  });
});

describe("joinName", () => {
  it("joins first and last name with one space", () => {
    expect(joinName("Camille", "Roussel")).toBe("Camille Roussel");
  });

  it("trims each part before joining", () => {
    expect(joinName(" Camille ", " Roussel ")).toBe("Camille Roussel");
  });

  it("round-trips through splitName", () => {
    const { firstName, lastName } = splitName("Camille Roussel");
    expect(joinName(firstName, lastName)).toBe("Camille Roussel");
  });
});
