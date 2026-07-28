/**
 * Helpers for exercising the generated WebView document.
 *
 * `runPage` actually executes the injected script inside jsdom against a mock
 * `KlashaClient`, which is the only honest way to assert what arguments the
 * Klasha SDK would really receive. A real payment cannot be performed here.
 */

/** Pull the serialised config object back out of the generated page. */
export function extractConfig(html) {
  const match = html.match(/\n\s*var config = (.*);\n/);
  if (!match) {
    throw new Error("could not find the serialised config in the page");
  }
  return JSON.parse(match[1]);
}

/** The raw text of the single inline <script> element. */
export function extractInlineScript(html) {
  const match = html.match(
    /<script type="text\/javascript">([\s\S]*?)<\/script>/
  );
  if (!match) {
    throw new Error("could not find the inline script in the page");
  }
  return match[1];
}

/** The markup that sits before the inline script (i.e. the container divs). */
export function extractBody(html) {
  const match = html.match(/<body>([\s\S]*?)<script/);
  return match ? match[1] : "";
}

/**
 * Render the page into the ambient jsdom document and run its script.
 *
 * @param {string} html
 * @param {object} [options]
 * @param {Function} [options.KlashaClient] mock constructor to expose globally
 * @returns {{ postMessage: jest.Mock, scripts: string[] }}
 */
export function runPage(html, { KlashaClient } = {}) {
  document.head.innerHTML = "";
  document.body.innerHTML = extractBody(html);

  const postMessage = jest.fn();
  window.ReactNativeWebView = { postMessage };

  delete window.KlashaClient;
  if (KlashaClient) {
    window.KlashaClient = KlashaClient;
  }

  // eslint-disable-next-line no-new-func
  new Function(extractInlineScript(html))();

  // No-op when the script already ran (readyState !== "loading").
  document.dispatchEvent(new window.Event("DOMContentLoaded"));

  return {
    postMessage,
    scripts: Array.from(document.head.querySelectorAll("script")).map(
      (node) => node.src
    ),
  };
}

/** Build a mock KlashaClient that records the arguments it was constructed with. */
export function createMockClient() {
  const calls = [];
  const init = jest.fn();
  function KlashaClient(...args) {
    calls.push(args);
    this.init = init;
  }
  return { KlashaClient, calls, init };
}
