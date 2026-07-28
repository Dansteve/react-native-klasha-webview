// React 18+ requires this flag before `act()` may be used.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// react-test-renderer prints a deprecation notice on every `create()` call.
// It is the only renderer that works without a full react-native install, so
// the notice is silenced rather than repeated ~20 times per run.
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("react-test-renderer is deprecated")
  ) {
    return;
  }
  originalError(...args);
};
