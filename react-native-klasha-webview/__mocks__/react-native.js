/**
 * Minimal stand-in for `react-native` so the component can be rendered with
 * `react-test-renderer` without installing the whole framework.
 *
 * Each primitive becomes a host element whose type is its name, so tests can
 * find it with `root.findAllByType("Modal")` etc.
 */
const React = require("react");

function hostComponent(name) {
  const Component = React.forwardRef((props, ref) =>
    React.createElement(name, { ...props, ref }, props.children)
  );
  Component.displayName = name;
  return Component;
}

const absoluteFillObject = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

module.exports = {
  ActivityIndicator: hostComponent("ActivityIndicator"),
  Modal: hostComponent("Modal"),
  SafeAreaView: hostComponent("SafeAreaView"),
  Text: hostComponent("Text"),
  TouchableOpacity: hostComponent("TouchableOpacity"),
  View: hostComponent("View"),
  StyleSheet: {
    create: (sheet) => sheet,
    flatten: (style) => style,
    absoluteFillObject,
    absoluteFill: absoluteFillObject,
    hairlineWidth: 1,
  },
  Platform: { OS: "ios", select: (spec) => spec.ios ?? spec.default },
};
