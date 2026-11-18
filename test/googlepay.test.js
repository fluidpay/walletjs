import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { GooglePay } from "../src/googlepay.js";
import { flush } from "./helpers/fakes.js";

function fakeDocument({ readyState = "complete", container = { children: [] } } = {}) {
  const listeners = {};
  const doc = {
    readyState,
    head: { scripts: [], appendChild: (el) => doc.head.scripts.push(el) },
    querySelector: (selector) => (selector === "#container" ? container : null),
    createElement: (tag) => ({ tag }),
    addEventListener: (name, cb) => {
      listeners[name] = cb;
    },
    fire: (name) => listeners[name](),
  };
  container.appendChild = (el) => container.children.push(el);
  return doc;
}

function fakeGoogle({ ready = true } = {}) {
  const google = { clients: [], requests: {} };
  google.payments = {
    api: {
      PaymentsClient: class {
        constructor(opts) {
          this.opts = opts;
          google.clients.push(this);
        }
        isReadyToPay(req) {
          google.requests.isReadyToPay = req;
          return Promise.resolve({ result: ready });
        }
        createButton(opts) {
          google.requests.createButton = opts;
          return { button: true, onClick: opts.onClick };
        }
        loadPaymentData(req) {
          google.requests.loadPaymentData = req;
          return Promise.resolve({ paymentMethodData: { tokenizationData: { token: "gp_tok" } } });
        }
      },
    },
  };
  return google;
}

function settings(overrides = {}) {
  return {
    container: "#container",
    merchantName: "Example Merchant",
    gatewayMerchantId: "pub_123",
    allowedCardNetworks: ["VISA", "MASTERCARD"],
    allowedCardAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    transactionInfo: { countryCode: "US", currencyCode: "USD", totalPrice: "1.23" },
    onGooglePaymentButtonClicked: () => {},
    ...overrides,
  };
}

// Creates the instance and runs the pay.js onload callback.
async function load(gpSettings, { ready = true } = {}) {
  globalThis.window.google = fakeGoogle({ ready });
  const gp = new GooglePay(gpSettings);
  const script = globalThis.document.head.scripts[0];
  script.onload();
  await flush();
  return { gp, script, google: globalThis.window.google };
}

beforeEach(() => {
  globalThis.document = fakeDocument();
  globalThis.window = {};
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.window;
});

describe("validation", () => {
  test("throws when the container is not found", () => {
    assert.throws(() => new GooglePay(settings({ container: "#missing" })), /Could not find container/);
  });

  test("accepts a container element instead of a selector", () => {
    const el = { children: [], appendChild() {} };
    const gp = new GooglePay(settings({ container: el }));
    assert.equal(gp.settings.container, el);
  });

  test("rejects unknown card networks", () => {
    assert.throws(
      () => new GooglePay(settings({ allowedCardNetworks: ["VISA", "DINERS"] })),
      /Invalid card network/
    );
  });

  test("rejects duplicate card networks", () => {
    assert.throws(
      () => new GooglePay(settings({ allowedCardNetworks: ["VISA", "VISA"] })),
      /Duplicate value found in allowedCardNetworks/
    );
  });

  test("rejects unknown auth methods", () => {
    assert.throws(
      () => new GooglePay(settings({ allowedCardAuthMethods: ["PIN"] })),
      /Invalid authentication method/
    );
  });

  test("rejects duplicate auth methods", () => {
    assert.throws(
      () => new GooglePay(settings({ allowedCardAuthMethods: ["PAN_ONLY", "PAN_ONLY"] })),
      /Duplicate value found in allowedCardAuthMethods/
    );
  });
});

describe("setup", () => {
  test("waits for DOMContentLoaded when the document is still loading", () => {
    globalThis.document = fakeDocument({ readyState: "loading" });
    const gp = new GooglePay(settings());
    assert.equal(gp.settings, undefined);
    assert.equal(globalThis.document.head.scripts.length, 0);

    globalThis.document.fire("DOMContentLoaded");
    assert.equal(globalThis.document.head.scripts.length, 1);
  });

  test("loads pay.js", () => {
    new GooglePay(settings());
    const [script] = globalThis.document.head.scripts;
    assert.equal(script.src, "https://pay.google.com/gp/p/js/pay.js");
  });

  test("adds the button when the user is ready to pay", async () => {
    const { google } = await load(settings({ buttonType: "donate" }));
    const container = globalThis.document.querySelector("#container");

    assert.equal(container.children.length, 1);
    assert.equal(google.requests.createButton.buttonType, "donate");
    assert.deepEqual(google.requests.isReadyToPay, {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
            allowedCardNetworks: ["VISA", "MASTERCARD"],
          },
        },
      ],
    });
  });

  test("defaults the button type to buy", async () => {
    const { google } = await load(settings());
    assert.equal(google.requests.createButton.buttonType, "buy");
  });

  test("does not add the button when the user is not ready to pay", async () => {
    await load(settings(), { ready: false });
    assert.equal(globalThis.document.querySelector("#container").children.length, 0);
  });
});

describe("payment data request", () => {
  async function click(gpSettings) {
    let paymentData;
    const { google } = await load({
      ...gpSettings,
      onGooglePaymentButtonClicked: (p) => {
        paymentData = p;
      },
    });
    google.requests.createButton.onClick();
    return { request: google.requests.loadPaymentData, paymentData };
  }

  test("tokenizes through the gateway with the public key", async () => {
    const { request, paymentData } = await click(settings());

    assert.deepEqual(request.allowedPaymentMethods[0].tokenizationSpecification, {
      type: "PAYMENT_GATEWAY",
      parameters: { gateway: "gatewayprocessing", gatewayMerchantId: "pub_123" },
    });
    assert.deepEqual(request.transactionInfo, {
      countryCode: "US",
      currencyCode: "USD",
      totalPriceStatus: "FINAL",
      totalPrice: "1.23",
    });
    assert.equal(request.merchantInfo.merchantName, "Example Merchant");
    assert.equal(
      (await paymentData).paymentMethodData.tokenizationData.token,
      "gp_tok"
    );
  });

  test("includes optional billing, shipping and email settings", async () => {
    const { request } = await click(
      settings({
        billingAddressRequired: true,
        billingAddressParameters: { format: "FULL" },
        shippingAddressRequired: true,
        shippingAddressParameters: { allowedCountryCodes: ["US"] },
        emailRequired: false,
        merchantId: "BCR2DN",
        merchantOrigin: "shop.example.com",
        authJwt: "jwt",
      })
    );

    assert.equal(request.allowedPaymentMethods[0].parameters.billingAddressRequired, true);
    assert.deepEqual(request.allowedPaymentMethods[0].parameters.billingAddressParameters, {
      format: "FULL",
    });
    assert.equal(request.shippingAddressRequired, true);
    assert.deepEqual(request.shippingAddressParameters, { allowedCountryCodes: ["US"] });
    assert.equal(request.emailRequired, false);
    assert.deepEqual(request.merchantInfo, {
      merchantName: "Example Merchant",
      merchantId: "BCR2DN",
      merchantOrigin: "shop.example.com",
      authJwt: "jwt",
    });
  });

  test("leaves optional settings out when not set", async () => {
    const { request } = await click(settings());

    assert.equal("billingAddressRequired" in request.allowedPaymentMethods[0].parameters, false);
    assert.equal("shippingAddressRequired" in request, false);
    assert.equal("emailRequired" in request, false);
  });
});
