import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import KlashaWebView from "./react-native-klasha-webview/";
export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <KlashaWebView
        buttonText="Pay Now"
        showPayButton={false}
        merchantKey= "GByi/gkhn5+BX4j6uI0lR7HCVo2NvTsVAQhyPko/uK4="
        businessId= "1"
        amount={100}
        isTestMode={true}
        customerEmail="Klashawebview@something.com"
        customerPhoneNumber="08143108254"
        customerFullname="Dansteve Adekanbi"
        callbackUrl=""
        countryCode="NGN"
        sourceCurrency="NGN"
        paymentType=""
        ActivityIndicatorColor="green"
        SafeAreaViewContainer={{ marginTop: 0 }}
        SafeAreaViewContainerModal={{ marginTop: 0 }}
        callBack={(res) => {
          // handle response here
          console.log(res);
        }}
        autoStart={true}
      />
    </View>

  );
}

const params = {
  merchantKey: "GByi/gkhn5+BX4j6uI0lR7HCVo2NvTsVAQhyPko/uK4=",
  businessId: "1"
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
