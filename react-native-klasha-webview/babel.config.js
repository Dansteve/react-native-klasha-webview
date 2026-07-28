/**
 * Only used by Jest. React Native apps consume `index.js` through Metro and
 * `babel-preset-expo` / `metro-react-native-babel-preset`, not this file.
 */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
