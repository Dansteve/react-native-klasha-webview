/**
 * react-native-klasha-webview
 *
 * Accept Klasha payments from a React Native app by hosting the official
 * `https://js.klasha.com/pay.js` inline checkout inside a WebView.
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import {
  generateContainerId,
  generateTxRef,
  resolveKlashaConfig,
  validateKlashaConfig,
} from "./src/config";
import { buildKlashaHtml } from "./src/html";

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Defaults are declared here, as ordinary destructuring defaults.
 *
 * They used to live in a `Klasha.defaultProps = { ... }` block placed *after*
 * `export default forwardRef(Klasha)`. React never saw them: `forwardRef` had
 * already captured the inner function, `defaultProps` is ignored on forwardRef
 * components in React 18, and React 19 dropped `defaultProps` for function
 * components altogether. Every one of those defaults -- including
 * `isTestMode: true` -- was inert.
 */
function Klasha(
  {
    // --- payment ---
    merchantKey,
    businessId = 1,
    amount = 10,
    callbackUrl = "",
    countryCode = "NGN",
    sourceCurrency,
    customerEmail,
    customerPhoneNumber,
    customerFullname,
    tx_ref: txRefProp,
    paymentType = "paylink",
    isTestMode = true,
    containerId,

    // --- behaviour ---
    autoStart = false,
    showPayButton = true,
    onError,
    callBack,
    handleWebViewMessage,

    // --- presentation ---
    buttonText = "Pay Now",
    ActivityIndicatorColor = "green",
    renderButton,
    btnStyles,
    textStyles,
    SafeAreaViewContainer,
    SafeAreaViewContainerModal,
    modalProps,
    webViewProps,
  },
  ref
) {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // One container id per component instance. `pay.js` renders into
  // document.getElementById(containerId); the old code hardcoded "ktest" and
  // appended a fresh <div id="ktest"> on every run.
  const instanceContainerId = useRef(null);
  if (instanceContainerId.current === null) {
    instanceContainerId.current = containerId || generateContainerId();
  }

  // A transaction reference is minted per transaction, not once per module.
  const [sessionTxRef, setSessionTxRef] = useState(
    () => txRefProp || generateTxRef()
  );

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const config = useMemo(
    () =>
      resolveKlashaConfig({
        merchantKey,
        businessId,
        amount,
        containerId: instanceContainerId.current,
        callbackUrl,
        countryCode,
        sourceCurrency,
        customerEmail,
        customerPhoneNumber,
        customerFullname,
        tx_ref: txRefProp || sessionTxRef,
        paymentType,
        isTestMode,
      }),
    [
      merchantKey,
      businessId,
      amount,
      callbackUrl,
      countryCode,
      sourceCurrency,
      customerEmail,
      customerPhoneNumber,
      customerFullname,
      txRefProp,
      sessionTxRef,
      paymentType,
      isTestMode,
    ]
  );

  const html = useMemo(() => buildKlashaHtml(config), [config]);

  const closeTransaction = useCallback(() => {
    setShowModal(false);
    setIsLoading(true);
  }, []);

  const startTransaction = useCallback(() => {
    const errors = validateKlashaConfig(config);
    if (errors.length > 0) {
      const message = `[react-native-klasha-webview] ${errors.join(" ")}`;
      if (onErrorRef.current) {
        onErrorRef.current({ event: "error", message, errors });
      } else if (typeof console !== "undefined" && console.warn) {
        // Never log the config object itself -- it holds the merchant key.
        console.warn(message);
      }
      return;
    }
    // Fresh reference for every attempt unless the merchant pinned one.
    if (!txRefProp) {
      setSessionTxRef(generateTxRef());
    }
    setIsLoading(true);
    setShowModal(true);
  }, [config, txRefProp]);

  useEffect(() => {
    if (autoStart) {
      startTransaction();
    }
    // Only on mount: autoStart is a "do this once" flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      // Original (capitalised) API, kept for backwards compatibility.
      StartTransaction: startTransaction,
      endTransaction: closeTransaction,
      // Conventional casing.
      startTransaction,
      closeTransaction,
      getTransactionRef: () => config.txRef,
    }),
    [startTransaction, closeTransaction, config.txRef]
  );

  const messageReceived = useCallback(
    (raw) => {
      if (handleWebViewMessage) {
        handleWebViewMessage(raw);
      }

      let webResponse;
      try {
        webResponse = JSON.parse(raw);
      } catch (err) {
        return;
      }

      switch (webResponse.event) {
        case "done":
          closeTransaction();
          if (callBack) {
            callBack({ data: webResponse });
          }
          break;
        case "error":
          if (onErrorRef.current) {
            onErrorRef.current(webResponse);
          }
          break;
        default:
          break;
      }
    },
    [callBack, closeTransaction, handleWebViewMessage]
  );

  const button = renderButton ? (
    renderButton(startTransaction)
  ) : (
    <TouchableOpacity
      accessibilityRole="button"
      style={btnStyles}
      onPress={startTransaction}
    >
      <Text style={textStyles}>{buttonText}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.fill, SafeAreaViewContainer]}>
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={closeTransaction}
        {...modalProps}
      >
        <SafeAreaView style={[styles.fill, SafeAreaViewContainerModal]}>
          {/*
            The WebView is only mounted while the modal is open. That guarantees
            a brand new document -- and therefore a brand new `kit` object --
            for every transaction, which matters because pay.js mutates it.
          */}
          {showModal && (
            <WebView
              style={styles.fill}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              source={{ html, baseUrl: "https://js.klasha.com" }}
              onMessage={(event) => messageReceived(event.nativeEvent.data)}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              {...webViewProps}
            />
          )}

          {isLoading && showModal && (
            <View style={styles.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={ActivityIndicatorColor} />
            </View>
          )}
        </SafeAreaView>
      </Modal>
      {showPayButton && button}
    </SafeAreaView>
  );
}

const KlashaWebView = forwardRef(Klasha);
KlashaWebView.displayName = "KlashaWebView";

export default KlashaWebView;
export { buildKlashaHtml } from "./src/html";
export {
  generateTxRef,
  resolveKlashaConfig,
  validateKlashaConfig,
} from "./src/config";
