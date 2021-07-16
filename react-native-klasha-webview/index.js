/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

/*jshint esversion: 9 */

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Modal,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";

function Klasha(props, ref) {
  const [isLoading, setisLoading] = useState(true);
  const [showModal, setshowModal] = useState(false);

  useEffect(() => {
    autoStartCheck();
  }, []);

  const autoStartCheck = () => {
    if (props.autoStart) {
      setshowModal(true);
    }
  };

  useImperativeHandle(ref, () => ({
    StartTransaction() {
      setshowModal(true);
    },
    endTransaction() {
      setshowModal(false);
    },
  }));

  const Klashacontent = `   
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Klasha</title>
      <link rel="stylesheet" href="/styles.css">
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
      <script src=" ${props.isTestMode ? 'https://klastatic.fra1.digitaloceanspaces.com/test/js/klasha-integration.js' : 'https://klastatic.fra1.digitaloceanspaces.com/prod/js/klasha-integration.js'} "></script>
  </head>
  
  <body onload="initializePopup()" style="background-color:#fff;height:100vh ">
      <div id="ktest"></div>
      <script src="https://js.Klasha.co/v1/inline.js"></script>
      <script type="text/javascript">
          window.onload = initializePopup;
          //Initializing Payment Popup
          function initializePopup() {
  
              var merchantKey = '${props.merchantKey}';
              var businessId = '${props.businessId}' || 1;
              var amount = '${props.amount}';
              var callbackUrl = '${props.callbackUrl}' || '';
              var countryCode = '${props.countryCode}';
              var sourceCurrency = '${props.sourceCurrency}' || countryCode;
              var kit = {
                  currency: countryCode,
                  phone_number: '${props.customerPhoneNumber}',
                  email: '${props.customerEmail}',
                  fullname: '${props.customerFullname}',
                  tx_ref: '${props.tx_ref}' || makeId(8),
                  paymentType: '${props.paymentType}' || "paylink",
                  callBack: callWhenDone
              };
  
              //form validation
              // if (!kit.email || !kit.amount || !kit.currency) {
              //     return validateFeilds(kit.email, kit.total, kit.currency)
              // }
  
              var client = new KlashaClient(merchantKey, businessId , amount, "ktest", callbackUrl, countryCode, sourceCurrency,
                  kit);
              client.init();
          }
  
          //Callback function when payment is complete
          function callWhenDone(response) {
              var resp = {event:'done', response:response};
              window.ReactNativeWebView.postMessage(JSON.stringify(resp));
          }
  
          function makeId(length) {
              var result = '';
              var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
              var charactersLength = characters.length;
              for (var i = 0; i < length; i++) {
                  result += characters.charAt(Math.floor(Math.random() * charactersLength));
              }
              return result;
          }
      </script>
  </body>
  
  </html>
      `;

  const messageReceived = (data) => {
    var webResponse = JSON.parse(data);
    if (props.handleWebViewMessage) {
      props.handleWebViewMessage(data);
    }
    switch (webResponse.event) {
      case "done":
        setshowModal(false);
        props?.callBack({
          // status: "success",
          // transactionRef: reference,
          data: webResponse,
        });
        break;
      default:
        if (props.handleWebViewMessage) {
          props.handleWebViewMessage(data);
        }
        break;
    }
  };

  const showPaymentModal = () => {
    setshowModal(true);
  };

  const button = props.renderButton ? (
    props.renderButton(showPaymentModal)
  ) : (
    <TouchableOpacity
      style={props.btnStyles}
      onPress={() => showPaymentModal()}
    >
      <Text style={props.textStyles}>{props.buttonText}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[{ flex: 1 }, props.SafeAreaViewContainer]}>
      <Modal
        style={[{ flex: 1 }]}
        visible={showModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={[{ flex: 1 }, props.SafeAreaViewContainerModal]}>
          <WebView
            style={[{ flex: 1 }]}
            source={{ html: Klashacontent }}
            onMessage={(e) => {
              messageReceived(e.nativeEvent.data);
            }}
            onLoadStart={() => setisLoading(true)}
            onLoadEnd={() => setisLoading(false)}
          />

          {isLoading && (
            <View>
              <ActivityIndicator
                size="large"
                color={props.ActivityIndicatorColor}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
      {props.showPayButton && button}
    </SafeAreaView>
  );
}

export default forwardRef(Klasha);

Klasha.defaultProps = {
  buttonText: "Pay Now",
  amount: 10,
  ActivityIndicatorColor: "green",
  autoStart: false,
  showPayButton: true,
  countryCode: "NGN",
  isTestMode : true,
  tx_ref: "" + Math.floor(Math.random() * 1000000000 + 1),
};
