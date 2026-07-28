/**
 * Pure, framework-free resolution of the props a merchant passes to
 * <KlashaWebView /> into the exact shape that `https://js.klasha.com/pay.js`
 * expects.
 *
 * Everything in here is deliberately free of React and react-native imports so
 * that it can be unit tested in plain Node.
 */

const TX_REF_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Characters that are safe to drop straight into an HTML `id` attribute. */
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

let containerCounter = 0;

function randomString(length) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += TX_REF_ALPHABET.charAt(
      Math.floor(Math.random() * TX_REF_ALPHABET.length)
    );
  }
  return result;
}

/**
 * Generate a transaction reference. `pay.js` interpolates `kit.tx_ref` straight
 * into the redirect URL, so it must always be a non-empty string.
 */
export function generateTxRef(length = 16) {
  return randomString(length);
}

/**
 * Generate a DOM id that is unique per component instance. `pay.js` renders
 * into `document.getElementById(containerId)`; the old implementation
 * hardcoded `"ktest"`, which collided as soon as two payment components existed
 * on the same page.
 */
export function generateContainerId() {
  containerCounter += 1;
  return `klasha-container-${containerCounter}-${randomString(6)}`;
}

const isNil = (value) => value === undefined || value === null;

/** Use `fallback` when the caller gave us nothing usable. */
function orDefault(value, fallback) {
  return isNil(value) || value === "" ? fallback : value;
}

function toText(value, fallback = "") {
  if (isNil(value)) return fallback;
  if (typeof value === "string") return value;
  return String(value);
}

/**
 * `isTestMode` decides whether the merchant hits the Klasha sandbox or the LIVE
 * gateway, so it has to be a real boolean before it reaches `pay.js`.
 *
 * Note that a plain `Boolean("false")` is `true`, which is exactly the sort of
 * mistake that would silently charge real cards, so the common "stringly typed"
 * falsey values are handled explicitly.
 */
export function toBoolean(value) {
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (normalised === "false" || normalised === "0" || normalised === "") {
      return false;
    }
    return true;
  }
  return Boolean(value);
}

function toAmount(value) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

/**
 * Turn component props into the config object that gets serialised into the
 * WebView page.
 *
 * Defaults live here as ordinary destructuring defaults. They used to live in
 * `Klasha.defaultProps`, which was assigned *after* `forwardRef()` had already
 * wrapped the component -- so React never saw them, and every "default"
 * (including `isTestMode: true`) was dead code. React 19 removes
 * `defaultProps` for function components entirely.
 *
 * @param {object} props
 * @returns {object} resolved config
 */
export function resolveKlashaConfig({
  merchantKey,
  businessId = 1,
  amount = 10,
  containerId,
  callbackUrl = "",
  countryCode = "NGN",
  sourceCurrency,
  customerEmail,
  customerPhoneNumber,
  customerFullname,
  tx_ref: txRef,
  paymentType = "paylink",
  isTestMode = true,
} = {}) {
  const resolvedCountryCode = toText(orDefault(countryCode, "NGN"), "NGN");
  const requestedContainerId = toText(containerId);
  const resolvedContainerId = SAFE_ID.test(requestedContainerId)
    ? requestedContainerId
    : generateContainerId();

  return {
    merchantKey: toText(merchantKey),
    businessId: orDefault(businessId, 1),
    amount: toAmount(orDefault(amount, 10)),
    containerId: resolvedContainerId,
    callbackUrl: toText(callbackUrl),
    countryCode: resolvedCountryCode,
    sourceCurrency: toText(
      orDefault(sourceCurrency, resolvedCountryCode),
      resolvedCountryCode
    ),
    customerEmail: toText(customerEmail),
    customerPhoneNumber: toText(customerPhoneNumber),
    customerFullname: toText(customerFullname),
    txRef: toText(orDefault(txRef, generateTxRef())),
    paymentType: toText(orDefault(paymentType, "paylink"), "paylink"),
    isTestMode: toBoolean(isTestMode),
  };
}

/**
 * Cheap sanity check so a misconfigured integration fails with a readable
 * message instead of a blank WebView.
 *
 * @returns {string[]} human readable problems; empty when the config is usable
 */
export function validateKlashaConfig(config) {
  const errors = [];
  if (!config.merchantKey) {
    errors.push("`merchantKey` is required.");
  }
  if (!Number.isFinite(config.amount) || config.amount <= 0) {
    errors.push("`amount` must be a number greater than 0.");
  }
  if (!config.countryCode) {
    errors.push("`countryCode` is required (for example \"NGN\").");
  }
  if (!config.txRef) {
    errors.push("`tx_ref` could not be resolved.");
  }
  return errors;
}
