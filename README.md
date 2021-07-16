# react-native-klasha-webview

The package allows you accept payment using Klasha and guess what , it doesn't require any form of linking, just install and begin to use .

### [](https://github.com/dansteve/react-native-klasha-webview#installation)Installation

Add react-native-klasha-webview to your project by running;

`npm install react-native-klasha-webview`

or

`yarn add react-native-klasha-webview`

### **One more thing**

To frontload the installation work, let's also install and configure dependencies used by this project, being **react-native-webview**

run

`yarn add react-native-webview`

for IOS: `cd iOS && pod install && cd ..`

for expo applications run;

`expo install react-native-webview`

and that's it, you're all good to go!

### [](https://github.com/dansteve/react-native-klasha-webview#usage)Usage 1

```javascript
import React from "react";
import KlashaWebView from "react-native-klasha-webview";
import { View } from "react-native";

function Pay() {
  return (
    <View style={{ flex: 1 }}>
      <KlashaWebView
        buttonText="Pay Now"
        showPayButton={false}
        merchantKey="your-merchantKey"
        businessId="your-businessId"
        amount={120000}
        customerEmail="Klashawebview@something.com"
        customerPhoneNumber="08143108254"
        customerFullname="Dansteve Adekanbi"
        callbackUrl=""
        countryCode="NGN"
        sourceCurrency="NGN"
        paymentType=""
        ActivityIndicatorColor="green"
        SafeAreaViewContainer={{ marginTop: 5 }}
        SafeAreaViewContainerModal={{ marginTop: 5 }}
        callBack={(res) => {
          // handle response here
          console.log(res);
        }}
        autoStart={false}
      />
    </View>
  );
}
```

### Usage 2 - Custom Pay Button

Make use of a custom payment trigger button. See example below;

```javascript
import React from 'react';
import KlashaWebView from 'react-native-klasha-webview';
import { View } from 'react-native';

function Pay() {
  return (
    <View style={{flex: 1}}>
      <KlashaWebView
        buttonText="Pay Now"
        showPayButton={false}
        merchantKey="your-merchantKey"
        businessId="your-businessId"
        amount={120000}
        customerEmail="Klashawebview@something.com"
        customerPhoneNumber="08143108254"
        customerFullname="Dansteve Adekanbi"
        callbackUrl=""
        countryCode="NGN"
        sourceCurrency="NGN"
        paymentType=""
        tx_ref={uuid()} // this is only for cases where you have a reference number generated
        ActivityIndicatorColor="green"
        SafeAreaViewContainer={{marginTop: 5}}
        SafeAreaViewContainerModal={{marginTop: 5}}
        handleWebViewMessage={(e) => {
          // handle the message
        }}
        callBack={(e) => {
          // handle response here
          console.log(res);
        }}
        autoStart={false}
        renderButton={(onPress) => {
          <Button onPress={onPress}>
            Pay Now
          </Button>
        }}
      />
    </View>
  );
}
```

## Usage 3 - Using Refs

Make use of a `ref` to start transaction. See example below;

```javascript
import React, { useRef } from 'react';
import KlashaWebView from 'react-native-klasha-webview';
import { View, TouchableOpacity,Text } from 'react-native';

function Pay(){
  const KlashaWebViewRef = useRef();

  return (
    <View style={{flex: 1}}>
      <KlashaWebView
        showPayButton={false}
        merchantKey="your-merchantKey"
        businessId="your-businessId"
        amount={120000}
        customerEmail="Klashawebview@something.com"
        customerPhoneNumber="08143108254"
        customerFullname="Dansteve Adekanbi"
        callbackUrl=""
        countryCode="NGN"
        sourceCurrency="NGN"
        paymentType=""
        ActivityIndicatorColor="green"
        SafeAreaViewContainer={{marginTop: 5}}
        SafeAreaViewContainerModal={{marginTop: 5}}
        tx_ref={KlashaWebViewRef}
        callBack={(res) => {
          // handle response here
          console.log(res);
        }}
      />

        <TouchableOpacity onPress={()=> KlashaWebViewRef.current.StartTransaction()}>
          <Text>Pay Now</Text>
        </TouchableOpacity>
      </View>
  );
}
```

## Note:

You can also make use of the new props `autoStart` to initiate payment once the screen mounts. Just see `autoStart={true}`. This is set to `false` by default.

## API's

| Name                                 |                                                                                           use/description                                                                                           |                                                      extra |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | ---------------------------------------------------------: |
| `buttonText`                         |                                                                                     Defines text on the button                                                                                      |                                         default: `Pay Now` |
| `textStyles`                         |                                                                                  Defines styles for text in button                                                                                  |                                                     `nill` |
| `btnStyles`                          |                                                                                      Defines style for button                                                                                       |                                                     `nill` |
| `merchantKey`                        |                                                                   merchantKey(visit Klasha.com to get yours)                                                                   |                                                     `nill` |
| `businessId`                             |                                                                                          businessId                                                                                          |                                                     `1` |
| `amount`                             |                                                                                          Amount to be paid                                                                                          |                                                     `nill` |
| `callbackUrl`                             |                                                                                          callbackUrl                                                                                          |                                                     `nill` |
| `countryCode(required by Klasha)`                             |                                                                                          countryCode                                                                                          |                                                     `nill` |
| `sourceCurrency`                             |                                                                                          sourceCurrency                                                                                          |                                                     `countryCode` |
| `ActivityIndicatorColor`             |                                                                                           color of loader                                                                                           |                                           default: `green` |
| `customerEmail(required by Klasha)` |                                                                                            Customer email                                                                                            |                                            default: `nill` |
| `customerPhoneNumber(required by Klasha)`                      |                                                                                           Customer mobile                                                                                            |                                            default: `nill` |
| `customerFullname(required by Klasha)`                        |                                                                                            Customer Name                                                                                             |                                            default: `nill` |
| `callBack`                          |                                    callback function                                     |                                            default: `nill` |
| `autoStart`                          |                                                                               Auto start payment once page is opened                                                                                |                                           default: `false` |
| `SafeAreaViewContainer`              |                                                                                  style for SafeAreaView containter                                                                                  |                                            default: `nill` |
| `SafeAreaViewContainerModal`         |                                                                                  style for SafeAreaView for modal                                                                                   |                                            default: `nill` |
| `showPayButton`                      |                                                                                Control the Pay Now button visibility                                                                                |                                            default: `true` |
| `tx_ref`                          |                                                                         Reference number, if you have already generated one                                                                         | default: `''+Math.floor((Math.random() * 1000000000) + 1)` |
| `renderButton`                       |                                                            Render your own Pay Now button, should be used when `showPayButton` is `true`                                                            |                                            default: `null` |
| `handleWebViewMessage`               |                                                                          Will be called when a WebView receives a message                                                                           |                                            default: `true` |

> For more information checkout [klasha's documentation](https://documenter.getpostman.com/view/8963555/TzJoFgHh)

## Contributing

Please feel free to fork this package and contribute by submitting a pull request to enhance the functionalities.

## How can I thank you?

Why not star the github repo? I'd love the attention! Why not share the link for this repository on Twitter or anywhere? Spread the word!

Don't forget to [follow me on twitter](https://twitter.com/dansteveade)!

Thanks!
Dansteve Adekanbi.

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
