# react-native-klasha-webview

Accept [Klasha](https://klasha.com) payments in a React Native app. The official
Klasha inline checkout (`https://js.klasha.com/pay.js`) is hosted inside a
`react-native-webview`, so there is nothing to link and no native code to build.

---

## Upgrading from 0.0.x — read this first

`1.0.0` is a rewrite of the WebView page. Several of these changes affect money.

| | 0.0.1 | 1.0.0 |
| :-- | :-- | :-- |
| **`isTestMode`** | never passed to `KlashaClient` (8 args, not 9) — which on the current `pay.js` means sandbox traffic would go to production | forwarded as the 9th `KlashaClient` argument, coerced to a real boolean |
| **Script URLs** | jQuery + `klastatic.fra1.digitaloceanspaces.com/...` (bucket deleted, 404) + `js.Klasha.co/v1/inline.js` (no DNS) | the single live `https://js.klasha.com/pay.js`; jQuery removed |
| **Prop injection** | every prop was pasted into a `'...'` JS literal, so a value containing `'` executed as code inside the payment page | the whole config is serialised with `JSON.stringify` and HTML-escaped |
| **Defaults** | declared in `Klasha.defaultProps` *after* `forwardRef()` had wrapped the component, so React applied none of them | ordinary destructuring defaults |
| **`'${x}' \|\| fallback`** | always truthy, so a missing prop produced the literal string `"undefined"` | defaults resolved in JS before serialisation |
| **`kit.phone`** | only `phone_number` was set, which `pay.js` never reads | `phone` (and `phone_number` for compatibility) |
| **Container `<div>`** | hardcoded `id="ktest"`, appended again on every run | unique per instance, reused, cleaned up |

**`isTestMode` now defaults to `true`** (sandbox), and the default actually
applies — on 0.0.1 the whole `defaultProps` block was dead code. Pass
`isTestMode={false}` explicitly to take real money.

---

## Installation

```sh
npm install react-native-klasha-webview react-native-webview
# or
yarn add react-native-klasha-webview react-native-webview
```

Expo:

```sh
npx expo install react-native-webview
```

Bare React Native, iOS: `cd ios && pod install && cd ..`

Peer requirements: `react >= 17`, `react-native >= 0.65`,
`react-native-webview >= 11`.

TypeScript definitions ship with the package — no `@types` install needed.

---

## Usage

### Built-in pay button

```jsx
import React from "react";
import { View } from "react-native";
import KlashaWebView from "react-native-klasha-webview";

export function Pay() {
  return (
    <View style={{ flex: 1 }}>
      <KlashaWebView
        merchantKey="your-merchant-key"
        businessId="your-business-id"
        amount={120000}
        countryCode="NGN"
        sourceCurrency="NGN"
        customerEmail="buyer@example.com"
        customerPhoneNumber="08000000000"
        customerFullname="Ada Lovelace"
        isTestMode={__DEV__}
        buttonText="Pay Now"
        callBack={(res) => console.log(res.data)}
        onError={(err) => console.warn(err.message)}
      />
    </View>
  );
}
```

### Your own trigger

```jsx
<KlashaWebView
  merchantKey="your-merchant-key"
  amount={120000}
  isTestMode={false}
  renderButton={(startTransaction) => (
    <Button title="Checkout" onPress={startTransaction} />
  )}
  callBack={(res) => console.log(res.data)}
/>
```

### Via a ref

```jsx
const klasha = useRef(null);

<KlashaWebView ref={klasha} showPayButton={false} merchantKey="..." amount={5000} />;

<TouchableOpacity onPress={() => klasha.current.startTransaction()}>
  <Text>Pay Now</Text>
</TouchableOpacity>;
```

Ref handle: `startTransaction()`, `closeTransaction()`, `getTransactionRef()`.
The original `StartTransaction()` / `endTransaction()` names still work.

---

## Props

### Payment

| Prop | Type | Default | Notes |
| :-- | :-- | :-- | :-- |
| `merchantKey` | `string` | — | **Required.** From your Klasha dashboard. |
| `businessId` | `string \| number` | `1` | |
| `amount` | `number \| string` | `10` | In `countryCode` currency. Must be `> 0`. |
| `countryCode` | `string` | `"NGN"` | Destination currency. |
| `sourceCurrency` | `string` | `countryCode` | |
| `callbackUrl` | `string` | `""` | |
| `customerEmail` | `string` | `""` | Required by Klasha. |
| `customerPhoneNumber` | `string` | `""` | Sent as `kit.phone`. |
| `customerFullname` | `string` | `""` | |
| `tx_ref` | `string` | generated | A fresh 16-char reference per transaction if omitted. |
| `paymentType` | `string` | `"paylink"` | |
| `isTestMode` | `boolean` | **`true`** | `true` = Klasha sandbox. Pass `false` to take real money. |
| `containerId` | `string` | generated | DOM id inside the WebView. Must match `[A-Za-z0-9_-]+`. |

### Behaviour

| Prop | Type | Default | Notes |
| :-- | :-- | :-- | :-- |
| `autoStart` | `boolean` | `false` | Open the checkout on mount. |
| `showPayButton` | `boolean` | `true` | |
| `callBack` | `(payload) => void` | — | Called with `{ data: { event: "done", response } }`. |
| `onError` | `(payload) => void` | — | Config errors and script-load failures. |
| `handleWebViewMessage` | `(raw: string) => void` | — | Every raw message from the WebView. |

### Presentation

| Prop | Type | Default |
| :-- | :-- | :-- |
| `buttonText` | `string` | `"Pay Now"` |
| `btnStyles` / `textStyles` | style | — |
| `ActivityIndicatorColor` | `string` | `"green"` |
| `renderButton` | `(start) => ReactElement` | — |
| `SafeAreaViewContainer` | style | — |
| `SafeAreaViewContainerModal` | style | — |
| `modalProps` | `Partial<ModalProps>` | — |
| `webViewProps` | `object` | — |

---

## Security notes

- **Never ship a secret key.** `merchantKey` is a publishable key; if a real one
  has ever been committed to a repository, rotate it.
- The WebView page is generated with `JSON.stringify` plus HTML escaping, so no
  prop value — including customer-supplied names and emails — can escape into
  the payment page's script context. There is a regression test for this.
- Errors and warnings never log the config object, because it holds the
  merchant key.

## Development

```sh
npm install     # from the repository root (npm workspaces)
npm test        # jest
```

The test suite executes the generated WebView page inside jsdom against a mock
`KlashaClient` and asserts the exact constructor arguments. It cannot and does
not complete a real payment.

## Contributing

Fork and open a pull request. See [contribution.md](contribution.md).

## License

MIT — see [LICENSE.md](LICENSE.md).
