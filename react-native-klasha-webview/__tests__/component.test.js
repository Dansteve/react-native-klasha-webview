import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import KlashaWebView from "../index";
import { extractConfig } from "./helpers/page";

const MERCHANT_KEY = "test-merchant-key";

function render(props = {}, ref) {
  let renderer;
  act(() => {
    renderer = TestRenderer.create(
      <KlashaWebView merchantKey={MERCHANT_KEY} ref={ref} {...props} />
    );
  });
  return renderer;
}

const findWebView = (renderer) => renderer.root.findAllByType("WebView");

const webViewConfig = (renderer) =>
  extractConfig(findWebView(renderer)[0].props.source.html);

describe("defaults", () => {
  it("has no defaultProps (they were dead code on a forwardRef component)", () => {
    expect(KlashaWebView.defaultProps).toBeUndefined();
  });

  it("still applies every default via destructuring", () => {
    const renderer = render({ autoStart: true });
    const config = webViewConfig(renderer);

    expect(config.isTestMode).toBe(true);
    expect(config.businessId).toBe(1);
    expect(config.amount).toBe(10);
    expect(config.countryCode).toBe("NGN");
    expect(config.sourceCurrency).toBe("NGN");
    expect(config.paymentType).toBe("paylink");
  });

  it("renders the default pay button", () => {
    const renderer = render();
    expect(renderer.root.findAllByType("TouchableOpacity")).toHaveLength(1);
    expect(renderer.root.findByType("Text").props.children).toBe("Pay Now");
  });

  it("hides the button when showPayButton is false", () => {
    const renderer = render({ showPayButton: false });
    expect(renderer.root.findAllByType("TouchableOpacity")).toHaveLength(0);
  });

  it("does not auto start by default", () => {
    expect(findWebView(render())).toHaveLength(0);
  });
});

describe("opening and closing", () => {
  it("mounts the WebView only while the checkout is open", () => {
    const ref = React.createRef();
    const renderer = render({ showPayButton: false }, ref);

    expect(findWebView(renderer)).toHaveLength(0);

    act(() => ref.current.startTransaction());
    expect(findWebView(renderer)).toHaveLength(1);

    act(() => ref.current.closeTransaction());
    expect(findWebView(renderer)).toHaveLength(0);
  });

  it("keeps the original capitalised ref API working", () => {
    const ref = React.createRef();
    const renderer = render({ showPayButton: false }, ref);

    act(() => ref.current.StartTransaction());
    expect(findWebView(renderer)).toHaveLength(1);

    act(() => ref.current.endTransaction());
    expect(findWebView(renderer)).toHaveLength(0);
  });

  it("opens when the built-in button is pressed", () => {
    const renderer = render();
    act(() => renderer.root.findByType("TouchableOpacity").props.onPress());
    expect(findWebView(renderer)).toHaveLength(1);
  });

  it("opens immediately with autoStart", () => {
    expect(findWebView(render({ autoStart: true }))).toHaveLength(1);
  });

  it("mints a fresh tx_ref for each transaction", () => {
    const ref = React.createRef();
    const renderer = render({ showPayButton: false }, ref);

    act(() => ref.current.startTransaction());
    const first = webViewConfig(renderer).txRef;

    act(() => ref.current.closeTransaction());
    act(() => ref.current.startTransaction());
    const second = webViewConfig(renderer).txRef;

    expect(first).toEqual(expect.any(String));
    expect(second).not.toBe(first);
  });

  it("honours a caller supplied tx_ref", () => {
    const renderer = render({ autoStart: true, tx_ref: "pinned-ref" });
    expect(webViewConfig(renderer).txRef).toBe("pinned-ref");
  });
});

describe("validation", () => {
  it("refuses to open without a merchant key and reports it", () => {
    const onError = jest.fn();
    let renderer;
    act(() => {
      renderer = TestRenderer.create(
        <KlashaWebView autoStart onError={onError} />
      );
    });

    expect(findWebView(renderer)).toHaveLength(0);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].message).toContain("`merchantKey`");
  });
});

describe("messages from the WebView", () => {
  function open() {
    const callBack = jest.fn();
    const handleWebViewMessage = jest.fn();
    const renderer = render({
      autoStart: true,
      showPayButton: false,
      callBack,
      handleWebViewMessage,
    });
    return { renderer, callBack, handleWebViewMessage };
  }

  const send = (renderer, payload) =>
    act(() =>
      findWebView(renderer)[0].props.onMessage({
        nativeEvent: { data: JSON.stringify(payload) },
      })
    );

  it("closes and invokes callBack on `done`", () => {
    const { renderer, callBack } = open();
    send(renderer, { event: "done", response: { status: "successful" } });

    expect(callBack).toHaveBeenCalledWith({
      data: { event: "done", response: { status: "successful" } },
    });
    expect(findWebView(renderer)).toHaveLength(0);
  });

  it("forwards every raw message to handleWebViewMessage", () => {
    const { renderer, handleWebViewMessage } = open();
    send(renderer, { event: "ready" });
    expect(handleWebViewMessage).toHaveBeenCalledWith(
      JSON.stringify({ event: "ready" })
    );
  });

  it("survives a non-JSON message", () => {
    const { renderer } = open();
    expect(() =>
      act(() =>
        findWebView(renderer)[0].props.onMessage({
          nativeEvent: { data: "not json" },
        })
      )
    ).not.toThrow();
  });
});

describe("customisation", () => {
  it("uses renderButton when provided", () => {
    const renderer = render({
      renderButton: (start) =>
        React.createElement("CustomButton", { onPress: start }),
    });
    const custom = renderer.root.findByType("CustomButton");
    expect(renderer.root.findAllByType("TouchableOpacity")).toHaveLength(0);

    act(() => custom.props.onPress());
    expect(findWebView(renderer)).toHaveLength(1);
  });

  it("gives each instance its own container id", () => {
    const a = webViewConfig(render({ autoStart: true }));
    const b = webViewConfig(render({ autoStart: true }));
    expect(a.containerId).not.toBe(b.containerId);
  });
});
