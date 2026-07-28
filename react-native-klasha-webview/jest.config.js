module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // The library's peers are stubbed so the test suite stays dependency-light
    // and does not need a full React Native install to exercise the component.
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^react-native-webview$": "<rootDir>/__mocks__/react-native-webview.js",
  },
  collectCoverageFrom: ["index.js", "src/**/*.js"],
};
