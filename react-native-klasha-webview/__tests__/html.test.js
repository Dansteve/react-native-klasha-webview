import { resolveKlashaConfig } from "../src/config";
import {
  KLASHA_SCRIPT_URL,
  buildKlashaHtml,
  serializeForScript,
} from "../src/html";
import { extractConfig, extractInlineScript } from "./helpers/page";

const HOSTILE = `O'Brien"); alert(1)//`;
const SCRIPT_BREAKOUT = `</script><script>window.__pwned = true;</script>`;
const TEMPLATE_BREAKOUT = "`${globalThis.__pwned2 = true}`";

describe("serializeForScript", () => {
  it("emits a JavaScript literal, not a bare interpolation", () => {
    expect(serializeForScript("hi")).toBe('"hi"');
    expect(serializeForScript(12)).toBe("12");
    expect(serializeForScript(true)).toBe("true");
    expect(serializeForScript(undefined)).toBe("null");
  });

  it("escapes quotes so a value cannot terminate the literal", () => {
    const out = serializeForScript(HOSTILE);
    // every inner quote is backslash-escaped; only the two delimiters are bare
    expect(out).toBe('"O\'Brien\\"); alert(1)//"');
    expect(out.replace(/\\"/g, "").match(/"/g)).toHaveLength(2);
    expect(JSON.parse(out)).toBe(HOSTILE);
  });

  it("escapes the characters the HTML tokenizer cares about", () => {
    const out = serializeForScript(SCRIPT_BREAKOUT);
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).toContain("\\u003c");
    expect(JSON.parse(out)).toBe(SCRIPT_BREAKOUT);
  });

  it("round-trips through JSON.parse for arbitrary nasty input", () => {
    [
      "'",
      '"',
      "\\",
      "\n",
      "</SCRIPT >",
      "&amp;",
      "\u2028\u2029",
      "😀",
    ].forEach((value) => {
      expect(JSON.parse(serializeForScript(value))).toBe(value);
    });
  });
});

describe("buildKlashaHtml script sources", () => {
  const html = buildKlashaHtml(resolveKlashaConfig({ merchantKey: "mk" }));

  it("uses the one live Klasha script", () => {
    expect(KLASHA_SCRIPT_URL).toBe("https://js.klasha.com/pay.js");
    expect(html).toContain("https://js.klasha.com/pay.js");
  });

  it("no longer references any of the dead endpoints", () => {
    expect(html).not.toContain("klastatic.fra1.digitaloceanspaces.com");
    expect(html).not.toContain("js.Klasha.co");
    expect(html).not.toContain("inline.js");
  });

  it("no longer loads jQuery", () => {
    expect(html.toLowerCase()).not.toContain("jquery");
  });

  it("contains exactly one inline script element", () => {
    expect(html.split("</script>")).toHaveLength(2);
  });
});

describe("injection", () => {
  const config = resolveKlashaConfig({
    merchantKey: HOSTILE,
    customerFullname: HOSTILE,
    customerEmail: SCRIPT_BREAKOUT,
    customerPhoneNumber: TEMPLATE_BREAKOUT,
    callbackUrl: "https://example.com/cb?a=1&b=2",
    tx_ref: "'; window.__pwned3 = true; '",
  });
  const html = buildKlashaHtml(config);

  it("does not let a hostile value escape the script element", () => {
    expect(html).not.toContain("</script><script>");
    expect(html.split("<script")).toHaveLength(2);
  });

  it("keeps the inline script syntactically valid JavaScript", () => {
    const script = extractInlineScript(html);
    // A successful Function() construction means the payload parsed cleanly,
    // i.e. nothing terminated a string literal early.
    // eslint-disable-next-line no-new-func
    expect(() => new Function(script)).not.toThrow();
    // The hostile quote survives only in escaped form.
    expect(script).toContain('O\'Brien\\"); alert(1)//');
    expect(script).not.toContain('"O\'Brien"); alert(1)//"');
  });

  it("preserves the hostile values verbatim as data", () => {
    const parsed = extractConfig(html);
    expect(parsed.merchantKey).toBe(HOSTILE);
    expect(parsed.customerFullname).toBe(HOSTILE);
    expect(parsed.customerEmail).toBe(SCRIPT_BREAKOUT);
    expect(parsed.customerPhoneNumber).toBe(TEMPLATE_BREAKOUT);
    expect(parsed.callbackUrl).toBe("https://example.com/cb?a=1&b=2");
    expect(parsed.txRef).toBe("'; window.__pwned3 = true; '");
  });

  it("keeps the container id out of attacker reach", () => {
    const hostile = buildKlashaHtml(
      resolveKlashaConfig({ containerId: '"><img src=x onerror=alert(1)>' })
    );
    expect(hostile).toMatch(/<div id="[A-Za-z0-9_-]+"><\/div>/);
    expect(hostile).not.toContain("<img");
    expect(hostile).not.toContain("onerror=alert");
  });
});

describe("serialised config", () => {
  it("omits nothing and stringifies no `undefined`", () => {
    const parsed = extractConfig(
      buildKlashaHtml(resolveKlashaConfig({ merchantKey: "mk" }))
    );
    Object.values(parsed).forEach((value) => {
      expect(value).not.toBe("undefined");
    });
    expect(parsed.customerEmail).toBe("");
    expect(parsed.callbackUrl).toBe("");
    expect(parsed.businessId).toBe(1);
  });

  it("carries isTestMode as a boolean", () => {
    expect(
      extractConfig(
        buildKlashaHtml(resolveKlashaConfig({ merchantKey: "mk" }))
      ).isTestMode
    ).toBe(true);
    expect(
      extractConfig(
        buildKlashaHtml(
          resolveKlashaConfig({ merchantKey: "mk", isTestMode: false })
        )
      ).isTestMode
    ).toBe(false);
  });
});
