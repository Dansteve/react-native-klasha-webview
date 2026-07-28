import * as React from "react";
import type { ModalProps, StyleProp, TextStyle, ViewStyle } from "react-native";

export interface KlashaResolvedConfig {
  merchantKey: string;
  businessId: string | number;
  amount: number;
  containerId: string;
  callbackUrl: string;
  countryCode: string;
  sourceCurrency: string;
  customerEmail: string;
  customerPhoneNumber: string;
  customerFullname: string;
  txRef: string;
  paymentType: string;
  /** Always a real boolean. `true` selects the Klasha sandbox. */
  isTestMode: boolean;
}

/** Payload delivered to `callBack` once the checkout reports completion. */
export interface KlashaCallbackPayload {
  data: {
    event: "done";
    response: unknown;
  };
}

export interface KlashaErrorPayload {
  event: "error";
  message: string;
  errors?: string[];
}

export interface KlashaWebViewProps {
  /** Klasha merchant (public) key. Required. */
  merchantKey: string;
  /** Klasha business id. Defaults to `1`. */
  businessId?: string | number;
  /** Amount to charge, in `countryCode` currency. Defaults to `10`. */
  amount?: number | string;
  /** Merchant callback URL. Defaults to `""`. */
  callbackUrl?: string;
  /** Destination currency / country code, e.g. `"NGN"`. Defaults to `"NGN"`. */
  countryCode?: string;
  /** Source currency. Defaults to `countryCode`. */
  sourceCurrency?: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerFullname?: string;
  /** Transaction reference. A unique one is generated when omitted. */
  tx_ref?: string;
  /** Klasha product type. Defaults to `"paylink"`. */
  paymentType?: string;
  /**
   * `true` (the default) routes the payment through the Klasha sandbox.
   * Set to `false` to take real money.
   */
  isTestMode?: boolean;
  /**
   * DOM id of the checkout container inside the WebView. A unique id is
   * generated per component instance when omitted. Must match `[A-Za-z0-9_-]+`.
   */
  containerId?: string;

  /** Open the checkout as soon as the component mounts. Defaults to `false`. */
  autoStart?: boolean;
  /** Render the built-in pay button. Defaults to `true`. */
  showPayButton?: boolean;

  /** Invoked when the checkout reports a completed transaction. */
  callBack?: (payload: KlashaCallbackPayload) => void;
  /** Invoked on configuration or script-loading failures. */
  onError?: (payload: KlashaErrorPayload) => void;
  /** Receives every raw message string posted from the WebView. */
  handleWebViewMessage?: (data: string) => void;

  /** Label of the built-in button. Defaults to `"Pay Now"`. */
  buttonText?: string;
  /** Spinner colour. Defaults to `"green"`. */
  ActivityIndicatorColor?: string;
  /** Render your own trigger. Receives a function that opens the checkout. */
  renderButton?: (startTransaction: () => void) => React.ReactElement;
  btnStyles?: StyleProp<ViewStyle>;
  textStyles?: StyleProp<TextStyle>;
  SafeAreaViewContainer?: StyleProp<ViewStyle>;
  SafeAreaViewContainerModal?: StyleProp<ViewStyle>;
  /** Extra props forwarded to the `<Modal />`. */
  modalProps?: Partial<ModalProps>;
  /** Extra props forwarded to the `<WebView />`. */
  webViewProps?: Record<string, unknown>;
}

export interface KlashaWebViewRef {
  /** @deprecated use `startTransaction` */
  StartTransaction: () => void;
  /** @deprecated use `closeTransaction` */
  endTransaction: () => void;
  startTransaction: () => void;
  closeTransaction: () => void;
  getTransactionRef: () => string;
}

declare const KlashaWebView: React.ForwardRefExoticComponent<
  KlashaWebViewProps & React.RefAttributes<KlashaWebViewRef>
>;

export default KlashaWebView;

/** Serialise a resolved config into the WebView document. Exported for tests. */
export function buildKlashaHtml(
  config: KlashaResolvedConfig,
  options?: { scriptUrl?: string }
): string;

export function resolveKlashaConfig(
  props?: Partial<KlashaWebViewProps>
): KlashaResolvedConfig;

export function validateKlashaConfig(config: KlashaResolvedConfig): string[];

export function generateTxRef(length?: number): string;
