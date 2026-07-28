const React = require("react");

const WebView = React.forwardRef((props, ref) =>
  React.createElement("WebView", { ...props, ref })
);
WebView.displayName = "WebView";

module.exports = { WebView, default: WebView };
