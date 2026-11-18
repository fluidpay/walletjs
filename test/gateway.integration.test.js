// Calls a real gateway's Apple Pay merchant validation endpoint. Skipped
// unless these are set:
//
//   WALLETJS_GATEWAY_DOMAIN     e.g. sandbox.fluidpay.com
//   WALLETJS_APPLE_PAY_KEY      the `key` passed to new ApplePay()
//   WALLETJS_MERCHANT_ID        payment.merchantIdentifier
//   WALLETJS_DOMAIN_NAME        optional, the site domain registered with Apple
//
// A passing run proves the gateway can produce an Apple merchant session for
// these settings, which is the step Safari performs right after the sheet
// opens. It does not need a device or a card.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { ApplePay } from "../src/applepay.js";
import { FakePaymentRequest } from "./helpers/fakes.js";

const env = process.env;
const configured =
  env.WALLETJS_GATEWAY_DOMAIN && env.WALLETJS_APPLE_PAY_KEY && env.WALLETJS_MERCHANT_ID;
const skip = configured ? false : "set WALLETJS_GATEWAY_DOMAIN, WALLETJS_APPLE_PAY_KEY and WALLETJS_MERCHANT_ID";

const APPLE_VALIDATION_URL = "https://apple-pay-gateway.apple.com/paymentservices/startSession";

function applePay(overrides = {}) {
  return new ApplePay({
    key: env.WALLETJS_APPLE_PAY_KEY,
    domain: env.WALLETJS_GATEWAY_DOMAIN,
    domainName: env.WALLETJS_DOMAIN_NAME,
    payment: {
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["visa"],
      countryCode: "US",
      version: 3,
      merchantIdentifier: env.WALLETJS_MERCHANT_ID,
    },
    details: { total: { label: "Total", amount: { currency: "USD", value: "1.00" } } },
    options: {},
    ...overrides,
  });
}

let originalPaymentRequest;
before(() => {
  originalPaymentRequest = globalThis.PaymentRequest;
  globalThis.PaymentRequest = FakePaymentRequest;
});
after(() => {
  globalThis.PaymentRequest = originalPaymentRequest;
});

test("gateway returns an Apple merchant session", { skip }, async () => {
  const session = await applePay().validateMerchant(APPLE_VALIDATION_URL);

  assert.equal(typeof session.merchantSessionIdentifier, "string");
  assert.equal(typeof session.signature, "string");
  if (env.WALLETJS_DOMAIN_NAME) {
    assert.equal(session.domainName, env.WALLETJS_DOMAIN_NAME);
  }
});

test("gateway rejects an unknown key with a readable error", { skip }, async () => {
  await assert.rejects(
    applePay({ key: "not-a-real-key" }).validateMerchant(APPLE_VALIDATION_URL),
    /merchant validation failed \(HTTP 4\d\d\)/
  );
});
