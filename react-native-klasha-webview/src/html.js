/**
 * Builds the HTML document that is handed to the WebView.
 *
 * The previous implementation interpolated every prop directly into single
 * quoted JavaScript string literals:
 *
 *     var merchantKey = '${props.merchantKey}';
 *     ...
 *     fullname: '${props.customerFullname}',
 *
 * Any value containing an apostrophe (`O'Brien`) terminated the literal early
 * and the remainder of the value was evaluated as JavaScript inside the payment
 * page. Customer names and email addresses are attacker influenced in most real
 * applications, so this was a script injection straight into a payments
 * context.
 *
 * The fix: never interpolate into a quoted literal. Serialise the whole config
 * once with `JSON.stringify` (which emits a correctly escaped JS literal) and
 * additionally escape the characters that are meaningful to the *HTML* parser,
 * so that a value containing `</script>` cannot close the script element.
 */

/** The one and only Klasha inline script. Test/live is chosen by `isTestMode`. */
export const KLASHA_SCRIPT_URL = "https://js.klasha.com/pay.js";

/**
 * Serialise an arbitrary value into a JavaScript literal that is safe to embed
 * inside an inline `<script>` element.
 *
 * `JSON.stringify` already escapes quotes and backslashes. What it does not do
 * is escape characters that matter to the HTML tokenizer, so `</script>` inside
 * a string would still terminate the script element. `<`, `>` and `&` are
 * therefore rewritten to their `\uXXXX` escapes, which JavaScript reads as the
 * original character but the HTML parser never sees. U+2028/U+2029 are escaped
 * because they are line terminators in older JavaScript engines.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function serializeForScript(value) {
  const json = JSON.stringify(value === undefined ? null : value);
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Build the WebView document for a resolved Klasha config.
 *
 * @param {object} config output of `resolveKlashaConfig`
 * @param {object} [options]
 * @param {string} [options.scriptUrl] override the Klasha script (tests)
 * @returns {string} a complete HTML document
 */
export function buildKlashaHtml(config, options = {}) {
  const scriptUrl = options.scriptUrl || KLASHA_SCRIPT_URL;

  // `containerId` is constrained to [A-Za-z0-9_-] by resolveKlashaConfig, so it
  // is safe in an HTML attribute. Everything else goes through the serialiser.
  const containerId = config.containerId;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Klasha</title>
<style>
  html, body { margin: 0; padding: 0; background-color: #fff; min-height: 100vh; }
  #klasha-error { display: none; font-family: -apple-system, Roboto, sans-serif; padding: 24px; color: #b00020; }
</style>
</head>
<body>
<div id="${containerId}"></div>
<div id="klasha-error"></div>
<script type="text/javascript">
(function () {
  "use strict";

  var config = ${serializeForScript(config)};
  var scriptUrl = ${serializeForScript(scriptUrl)};
  var started = false;

  function post(payload) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    } catch (err) {
      /* the bridge is gone; nothing useful left to do */
    }
  }

  function fail(message) {
    var node = document.getElementById("klasha-error");
    if (node) {
      node.style.display = "block";
      node.textContent = message;
    }
    post({ event: "error", message: message });
  }

  function onDone(response) {
    post({ event: "done", response: response });
  }

  /* Reuse the container if it already exists; never append a duplicate id. */
  function ensureContainer() {
    var el = document.getElementById(config.containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = config.containerId;
      document.body.insertBefore(el, document.body.firstChild);
    }
    return el;
  }

  function removeContainer() {
    var el = document.getElementById(config.containerId);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  /*
   * pay.js reads exactly these keys off "kit":
   *   businessId, currency, redirect_url, email, phone, productType,
   *   amount, sourceAmount, callBack, tx_ref
   *
   * Note "phone" -- the old wrapper only set "phone_number", which pay.js never
   * reads, so the phone number was silently dropped. Both are set here so that
   * anything downstream still reading the legacy key keeps working.
   *
   * pay.js MUTATES this object (it assigns businessId, currency and
   * redirect_url), so a fresh one is built for every transaction.
   */
  function buildKit() {
    return {
      currency: config.countryCode,
      phone: config.customerPhoneNumber,
      phone_number: config.customerPhoneNumber,
      email: config.customerEmail,
      fullname: config.customerFullname,
      amount: config.amount,
      productType: config.paymentType,
      paymentType: config.paymentType,
      tx_ref: config.txRef,
      callBack: onDone
    };
  }

  function resolveClient() {
    if (typeof window.KlashaClient !== "undefined") return window.KlashaClient;
    if (typeof KlashaClient !== "undefined") return KlashaClient;
    return null;
  }

  function start() {
    if (started) return;
    var Client = resolveClient();
    if (typeof Client !== "function") {
      fail("The Klasha payment script did not expose KlashaClient.");
      return;
    }
    started = true;
    ensureContainer();
    try {
      /*
       * The 9th argument is isTestMode. Omitting it (as every previous version
       * of this wrapper did) leaves it undefined, which is falsy, which sends
       * "test mode" traffic to the LIVE Klasha gateway.
       */
      var client = new Client(
        config.merchantKey,
        config.businessId,
        config.amount,
        config.containerId,
        config.callbackUrl,
        config.countryCode,
        config.sourceCurrency,
        buildKit(),
        config.isTestMode
      );
      client.init();
      post({ event: "ready", tx_ref: config.txRef, isTestMode: config.isTestMode });
    } catch (err) {
      started = false;
      fail("Klasha failed to start: " + ((err && err.message) || String(err)));
    }
  }

  function load() {
    if (resolveClient()) {
      start();
      return;
    }
    var script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = start;
    script.onerror = function () {
      fail("Unable to load the Klasha payment script (" + scriptUrl + ").");
    };
    document.head.appendChild(script);
  }

  window.addEventListener("pagehide", removeContainer);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
</script>
</body>
</html>`;
}
