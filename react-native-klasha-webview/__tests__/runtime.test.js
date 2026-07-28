/**
 * Executes the generated page inside jsdom against a mock `KlashaClient`.
 *
 * This is as far as automated testing can go: completing a real payment needs
 * live merchant credentials and a real Klasha gateway, so nothing here claims
 * an end-to-end payment was made. What it does prove is exactly which values
 * `pay.js` would be constructed with.
 */
import { resolveKlashaConfig } from "../src/config";
import { buildKlashaHtml } from "../src/html";
import { createMockClient, runPage } from "./helpers/page";

const ARG = {
  MERCHANT_KEY: 0,
  BUSINESS_ID: 1,
  AMOUNT: 2,
  CONTAINER_ID: 3,
  CALLBACK_URL: 4,
  COUNTRY_CODE: 5,
  SOURCE_CURRENCY: 6,
  KIT: 7,
  IS_TEST_MODE: 8,
};

function open(props) {
  const config = resolveKlashaConfig(props);
  const { KlashaClient, calls, init } = createMockClient();
  const page = runPage(buildKlashaHtml(config), { KlashaClient });
  return { config, calls, init, page };
}

beforeEach(() => {
  delete window.__pwned;
  delete window.__pwned2;
  delete window.__pwned3;
});

describe("KlashaClient construction", () => {
  it("passes the 9th argument, isTestMode, as a real boolean", () => {
    // The headline bug: every previous version stopped at 8 arguments, so
    // isTestMode was undefined -> falsy -> the LIVE gateway.
    const testMode = open({ merchantKey: "mk", isTestMode: true });
    expect(testMode.calls).toHaveLength(1);
    expect(testMode.calls[0]).toHaveLength(9);
    expect(testMode.calls[0][ARG.IS_TEST_MODE]).toBe(true);
    expect(typeof testMode.calls[0][ARG.IS_TEST_MODE]).toBe("boolean");

    const liveMode = open({ merchantKey: "mk", isTestMode: false });
    expect(liveMode.calls[0]).toHaveLength(9);
    expect(liveMode.calls[0][ARG.IS_TEST_MODE]).toBe(false);
  });

  it("defaults to test mode when isTestMode is not supplied", () => {
    const { calls } = open({ merchantKey: "mk" });
    expect(calls[0][ARG.IS_TEST_MODE]).toBe(true);
  });

  it("never forwards the string \"false\" as a truthy test flag", () => {
    const { calls } = open({ merchantKey: "mk", isTestMode: "false" });
    expect(calls[0][ARG.IS_TEST_MODE]).toBe(false);
  });

  it("keeps the first eight arguments in the documented order", () => {
    const { config, calls } = open({
      merchantKey: "mk",
      businessId: "7",
      amount: 2500,
      callbackUrl: "https://example.com/cb",
      countryCode: "NGN",
      sourceCurrency: "USD",
    });
    const args = calls[0];

    expect(args[ARG.MERCHANT_KEY]).toBe("mk");
    expect(args[ARG.BUSINESS_ID]).toBe("7");
    expect(args[ARG.AMOUNT]).toBe(2500);
    expect(args[ARG.CONTAINER_ID]).toBe(config.containerId);
    expect(args[ARG.CALLBACK_URL]).toBe("https://example.com/cb");
    expect(args[ARG.COUNTRY_CODE]).toBe("NGN");
    expect(args[ARG.SOURCE_CURRENCY]).toBe("USD");
  });

  it("calls init() on the instance", () => {
    const { init } = open({ merchantKey: "mk" });
    expect(init).toHaveBeenCalledTimes(1);
  });
});

describe("the kit object", () => {
  it("sets `phone`, which is the key pay.js actually reads", () => {
    const { calls } = open({
      merchantKey: "mk",
      customerPhoneNumber: "08143108254",
    });
    const kit = calls[0][ARG.KIT];

    expect(kit.phone).toBe("08143108254");
    // legacy key kept for backwards compatibility, but `phone` is the one that counts
    expect(kit.phone_number).toBe("08143108254");
  });

  it("carries the fields pay.js reads", () => {
    const { config, calls } = open({
      merchantKey: "mk",
      amount: 4200,
      countryCode: "KES",
      customerEmail: "buyer@example.com",
      paymentType: "card",
    });
    const kit = calls[0][ARG.KIT];

    expect(kit.currency).toBe("KES");
    expect(kit.email).toBe("buyer@example.com");
    expect(kit.amount).toBe(4200);
    expect(kit.productType).toBe("card");
    expect(kit.tx_ref).toBe(config.txRef);
    expect(typeof kit.callBack).toBe("function");
  });

  it("never produces the literal string \"undefined\"", () => {
    const { calls } = open({ merchantKey: "mk" });
    const kit = calls[0][ARG.KIT];

    Object.entries(kit).forEach(([key, value]) => {
      if (typeof value === "string") {
        expect(`${key}:${value}`).not.toContain("undefined");
      }
    });
    expect(kit.email).toBe("");
    expect(kit.phone).toBe("");
    expect(kit.tx_ref).not.toBe("");
  });

  it("delivers the completion callback over the React Native bridge", () => {
    const { calls, page } = open({ merchantKey: "mk" });
    page.postMessage.mockClear();

    calls[0][ARG.KIT].callBack({ status: "successful" });

    expect(page.postMessage).toHaveBeenCalledTimes(1);
    expect(JSON.parse(page.postMessage.mock.calls[0][0])).toEqual({
      event: "done",
      response: { status: "successful" },
    });
  });
});

describe("injection, executed", () => {
  it("cannot break out of the payload no matter what the props contain", () => {
    const hostileName = `O'Brien"); alert(1)//`;
    const { calls } = open({
      merchantKey: `'; window.__pwned = true; '`,
      customerFullname: hostileName,
      customerEmail: `</script><script>window.__pwned2 = true;</script>`,
      customerPhoneNumber: "`${window.__pwned3 = true}`",
    });

    expect(window.__pwned).toBeUndefined();
    expect(window.__pwned2).toBeUndefined();
    expect(window.__pwned3).toBeUndefined();

    // and the values still arrive intact, as data
    const kit = calls[0][ARG.KIT];
    expect(calls[0][ARG.MERCHANT_KEY]).toBe(`'; window.__pwned = true; '`);
    expect(kit.fullname).toBe(hostileName);
    expect(kit.email).toBe(`</script><script>window.__pwned2 = true;</script>`);
    expect(kit.phone).toBe("`${window.__pwned3 = true}`");
  });
});

describe("the container element", () => {
  it("renders exactly one container with the configured id", () => {
    const { config } = open({ merchantKey: "mk" });
    expect(
      document.querySelectorAll(`#${config.containerId}`)
    ).toHaveLength(1);
  });

  it("does not append a duplicate when the page script runs again", () => {
    const config = resolveKlashaConfig({ merchantKey: "mk" });
    const html = buildKlashaHtml(config);
    const { KlashaClient } = createMockClient();

    runPage(html, { KlashaClient });
    // Re-run the inline script against the same document, as a remount would.
    // eslint-disable-next-line no-new-func
    new Function(
      html.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/)[1]
    )();

    expect(document.querySelectorAll(`div[id="${config.containerId}"]`)).toHaveLength(1);
  });

  it("uses a unique id per instance instead of the old hardcoded \"ktest\"", () => {
    const a = resolveKlashaConfig({ merchantKey: "mk" });
    const b = resolveKlashaConfig({ merchantKey: "mk" });
    expect(a.containerId).not.toBe(b.containerId);
    expect(a.containerId).not.toBe("ktest");
  });
});

describe("script loading", () => {
  it("loads https://js.klasha.com/pay.js when KlashaClient is absent", () => {
    const html = buildKlashaHtml(resolveKlashaConfig({ merchantKey: "mk" }));
    const page = runPage(html);

    expect(page.scripts).toEqual(["https://js.klasha.com/pay.js"]);
  });

  it("reports an error when the payment script fails to load", () => {
    const html = buildKlashaHtml(resolveKlashaConfig({ merchantKey: "mk" }));
    const page = runPage(html);

    const script = document.head.querySelector("script");
    script.onerror();

    const messages = page.postMessage.mock.calls.map((call) =>
      JSON.parse(call[0])
    );
    expect(messages[0].event).toBe("error");
    expect(messages[0].message).toContain("https://js.klasha.com/pay.js");
  });
});
