import {
  generateContainerId,
  generateTxRef,
  resolveKlashaConfig,
  toBoolean,
  validateKlashaConfig,
} from "../src/config";

describe("resolveKlashaConfig defaults", () => {
  // These used to live in `Klasha.defaultProps`, assigned after forwardRef()
  // had already wrapped the component, so React never applied any of them.
  it("applies every documented default when only merchantKey is given", () => {
    const config = resolveKlashaConfig({ merchantKey: "mk" });

    expect(config.businessId).toBe(1);
    expect(config.amount).toBe(10);
    expect(config.countryCode).toBe("NGN");
    expect(config.sourceCurrency).toBe("NGN");
    expect(config.paymentType).toBe("paylink");
    expect(config.isTestMode).toBe(true);
    expect(config.txRef).toEqual(expect.any(String));
    expect(config.txRef.length).toBeGreaterThan(0);
  });

  it("defaults sourceCurrency to countryCode", () => {
    expect(resolveKlashaConfig({ countryCode: "KES" }).sourceCurrency).toBe(
      "KES"
    );
  });

  it("never yields the literal string \"undefined\" for missing props", () => {
    const config = resolveKlashaConfig({ merchantKey: "mk" });

    Object.entries(config).forEach(([key, value]) => {
      expect(`${key}=${value}`).not.toContain("undefined");
    });

    expect(config.customerEmail).toBe("");
    expect(config.customerPhoneNumber).toBe("");
    expect(config.customerFullname).toBe("");
    expect(config.callbackUrl).toBe("");
  });

  it("tolerates an entirely empty props object", () => {
    const config = resolveKlashaConfig();
    expect(config.merchantKey).toBe("");
    expect(config.countryCode).toBe("NGN");
    expect(config.isTestMode).toBe(true);
  });

  it("does not let explicit values fall through to the defaults", () => {
    const config = resolveKlashaConfig({
      merchantKey: "mk",
      businessId: "42",
      amount: "2500",
      countryCode: "GHS",
      sourceCurrency: "USD",
      paymentType: "card",
      tx_ref: "my-ref",
      isTestMode: false,
    });

    expect(config.businessId).toBe("42");
    expect(config.amount).toBe(2500);
    expect(config.countryCode).toBe("GHS");
    expect(config.sourceCurrency).toBe("USD");
    expect(config.paymentType).toBe("card");
    expect(config.txRef).toBe("my-ref");
    expect(config.isTestMode).toBe(false);
  });
});

describe("isTestMode coercion", () => {
  it("is always a real boolean", () => {
    expect(typeof resolveKlashaConfig({ isTestMode: 1 }).isTestMode).toBe(
      "boolean"
    );
    expect(typeof resolveKlashaConfig({ isTestMode: 0 }).isTestMode).toBe(
      "boolean"
    );
    expect(typeof resolveKlashaConfig({ isTestMode: null }).isTestMode).toBe(
      "boolean"
    );
  });

  it("treats the stringly-typed falsey values as false", () => {
    // Boolean("false") is true, which would silently take real money.
    expect(toBoolean("false")).toBe(false);
    expect(toBoolean("0")).toBe(false);
    expect(toBoolean("")).toBe(false);
    expect(toBoolean("true")).toBe(true);
    expect(resolveKlashaConfig({ isTestMode: "false" }).isTestMode).toBe(false);
  });

  it("falls back to test mode when the prop is omitted", () => {
    expect(resolveKlashaConfig({}).isTestMode).toBe(true);
    expect(resolveKlashaConfig({ isTestMode: undefined }).isTestMode).toBe(true);
  });
});

describe("container ids", () => {
  it("generates a unique id per call", () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => generateContainerId())
    );
    expect(ids.size).toBe(50);
  });

  it("rejects a caller-supplied id that is not a safe DOM id", () => {
    const config = resolveKlashaConfig({
      containerId: 'x" onload="alert(1)',
    });
    expect(config.containerId).not.toContain('"');
    expect(config.containerId).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("keeps a safe caller-supplied id", () => {
    expect(resolveKlashaConfig({ containerId: "checkout_1" }).containerId).toBe(
      "checkout_1"
    );
  });
});

describe("generateTxRef", () => {
  it("produces a non-empty unique alphanumeric reference", () => {
    const refs = new Set(Array.from({ length: 200 }, () => generateTxRef()));
    expect(refs.size).toBe(200);
    refs.forEach((ref) => expect(ref).toMatch(/^[A-Za-z0-9]{16}$/));
  });
});

describe("validateKlashaConfig", () => {
  it("passes a well formed config", () => {
    expect(
      validateKlashaConfig(resolveKlashaConfig({ merchantKey: "mk" }))
    ).toEqual([]);
  });

  it("flags a missing merchant key", () => {
    expect(validateKlashaConfig(resolveKlashaConfig({}))).toContain(
      "`merchantKey` is required."
    );
  });

  it("flags a non-numeric amount", () => {
    const errors = validateKlashaConfig(
      resolveKlashaConfig({ merchantKey: "mk", amount: "not a number" })
    );
    expect(errors).toContain("`amount` must be a number greater than 0.");
  });
});
