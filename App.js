import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import KlashaWebView from "./react-native-klasha-webview";

/**
 * Put your own Klasha merchant key here, or better, read it from an env var.
 *
 * NOTE: a live key used to be committed to this file. Never commit a real key;
 * it stays in git history forever.
 */
const MERCHANT_KEY = process.env.EXPO_PUBLIC_KLASHA_MERCHANT_KEY || "YOUR_KLASHA_MERCHANT_KEY";

export default function App() {
  const klasha = useRef(null);
  const [lastResult, setLastResult] = useState(null);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <Text style={styles.title}>react-native-klasha-webview</Text>
      <Text style={styles.subtitle}>
        Sandbox demo. isTestMode is on, so nothing is charged.
      </Text>

      <KlashaWebView
        ref={klasha}
        SafeAreaViewContainer={{ flex: 0 }}
        buttonText="Pay 100 NGN"
        btnStyles={styles.button}
        textStyles={styles.buttonText}
        merchantKey={MERCHANT_KEY}
        businessId="1"
        amount={100}
        isTestMode
        customerEmail="buyer@example.com"
        customerPhoneNumber="08000000000"
        customerFullname="Ada Lovelace"
        callbackUrl=""
        countryCode="NGN"
        sourceCurrency="NGN"
        paymentType="paylink"
        ActivityIndicatorColor="green"
        callBack={(res) => setLastResult(res.data)}
        onError={(err) => Alert.alert("Klasha", err.message)}
      />

      {lastResult ? (
        <Text style={styles.result}>{JSON.stringify(lastResult, null, 2)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "600", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  result: { marginTop: 24, fontSize: 12, color: "#333" },
});
