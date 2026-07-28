# react-native-klasha-webview — monorepo

This repository holds two things:

| Path | What it is |
| :-- | :-- |
| [`react-native-klasha-webview/`](./react-native-klasha-webview) | the published npm package — **[full documentation is here](./react-native-klasha-webview/README.md)** |
| this directory | an Expo demo app that consumes the local package |

It is an npm workspace, so a single `npm install` at the root wires both up.

## Running the demo

```sh
npm install
npx expo start
```

Then press `i` / `a`, or scan the QR code with Expo Go.

The demo needs a Klasha merchant key. Either edit `MERCHANT_KEY` in
[`App.js`](./App.js) or set an environment variable before starting:

```sh
EXPO_PUBLIC_KLASHA_MERCHANT_KEY="your-key" npx expo start
```

The demo runs with `isTestMode` on, so it uses the Klasha sandbox.

> A real merchant key used to be hardcoded in `App.js` and is still in this
> repository's git history. If it was yours, rotate it.

## Running the tests

```sh
npm test
```

which runs the package's Jest suite (`react-native-klasha-webview/__tests__`).

## Stack

- Expo SDK 57 / React Native 0.86 / React 19
- `react-native-webview` 13.16.1 (the version Expo SDK 57 pins)

## Contributing

Please fork and submit a pull request.

If this saved you time, a star on the repo is appreciated, and you can
[follow me on Twitter](https://twitter.com/dansteveade).

— Dansteve Adekanbi

## License

MIT — see [LICENSE](./react-native-klasha-webview/LICENSE.md).
