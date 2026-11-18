import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { ApplePay } from "../src/applepay.js";
import {
  FakePaymentRequest,
  domException,
  fakeFetch,
  flush,
  jsonResponse,
} from "./helpers/fakes.js";

const MERCHANT_SESSION = { merchantSessionIdentifier: "SSH123", nonce: "abc" };
const TOKEN = { token: "tok_123" };

function settings(overrides = {}) {
  return {
    key: "company-key",
    domain: "gateway.example.com",
    domainName: "shop.example.com",
    payment: {
      merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
      supportedNetworks: ["visa", "masterCard", "discover", "amex"],
      countryCode: "US",
      version: 3,
      merchantIdentifier: "merchant-id",
      requiredBillingContactFields: ["email", "name", "phone", "postalAddress"],
    },
    details: {
      total: { label: "Total Amount", amount: { currency: "USD", value: "10.61" } },
    },
    options: { requestShipping: false },
    ...overrides,
  };
}

function gatewayFetch(overrides = {}) {
  return fakeFetch({
    "/api/public/applepay/validatemerchant": () => jsonResponse(MERCHANT_SESSION),
    "/api/public/applepay/paymentauthorized": () => jsonResponse(TOKEN),
    ...overrides,
  });
}

let originalPaymentRequest;
let originalFetch;

beforeEach(() => {
  originalPaymentRequest = globalThis.PaymentRequest;
  originalFetch = globalThis.fetch;
  globalThis.PaymentRequest = FakePaymentRequest;
  globalThis.fetch = gatewayFetch();
  FakePaymentRequest.reset();
});

afterEach(() => {
  globalThis.PaymentRequest = originalPaymentRequest;
  globalThis.fetch = originalFetch;
  delete globalThis.window;
});

describe("constructor", () => {
  for (const field of ["key", "domain", "payment", "details", "options"]) {
    test(`throws when ${field} is missing`, () => {
      assert.throws(
        () => new ApplePay(settings({ [field]: undefined })),
        new Error(`missing required parameter ${field}`)
      );
    });
  }

  test("rejects an invalid sheetTimeout", () => {
    for (const sheetTimeout of [-1, "5000"]) {
      assert.throws(
        () => new ApplePay(settings({ sheetTimeout })),
        /sheetTimeout must be a positive number/
      );
    }
  });

  test("builds an Apple Pay PaymentRequest from the settings", () => {
    const s = settings();
    new ApplePay(s);

    const request = FakePaymentRequest.last;
    assert.deepEqual(request.methodData, [
      { supportedMethods: "https://apple.com/apple-pay", data: s.payment },
    ]);
    assert.deepEqual(request.details, s.details);
    assert.deepEqual(request.options, s.options);
  });

  test("domainName is optional", () => {
    const ap = new ApplePay(settings({ domainName: "" }));
    assert.equal(ap.domainName, null);
  });

  test("surfaces PaymentRequest constructor errors", () => {
    globalThis.PaymentRequest = class {
      constructor() {
        throw new TypeError("bad payment data");
      }
    };
    assert.throws(() => new ApplePay(settings()), /bad payment data/);
  });
});

describe("submit", () => {
  test("validates the merchant, authorizes the payment and returns the token", async () => {
    const ap = new ApplePay(settings());
    const result = ap.submit();
    const request = FakePaymentRequest.last;

    const session = await request.validateMerchant("https://apple.example/startSession");
    assert.deepEqual(session, MERCHANT_SESSION);

    const response = request.authorize({ token: { paymentData: "encrypted" } });
    const out = await result;

    assert.equal(out.status, "success");
    assert.deepEqual(out.token, TOKEN);
    assert.equal(out.raw_response, response);
    assert.equal(response.completedWith, "success");

    const [validate, authorize] = globalThis.fetch.calls;
    assert.equal(validate.url, "https://gateway.example.com/api/public/applepay/validatemerchant");
    assert.equal(validate.init.method, "post");
    assert.deepEqual(validate.body, {
      PKeyCompany: "company-key",
      AppleMerchantId: "merchant-id",
      ValidationUrl: "https://apple.example/startSession",
      DomainName: "shop.example.com",
    });
    assert.equal(authorize.url, "https://gateway.example.com/api/public/applepay/paymentauthorized");
    assert.deepEqual(authorize.body, {
      PKeyCompany: "company-key",
      AppleMerchantId: "merchant-id",
      ApplePayPayment: { token: { paymentData: "encrypted" } },
    });
  });

  test("sends DomainName null when domainName is not set", async () => {
    const ap = new ApplePay(settings({ domainName: undefined }));
    ap.submit();
    await FakePaymentRequest.last.validateMerchant();
    assert.equal(globalThis.fetch.calls[0].body.DomainName, null);
  });

  test("passes a promise to event.complete synchronously", async () => {
    const ap = new ApplePay(settings());
    ap.submit();
    const request = FakePaymentRequest.last;

    let completedWith;
    request.onmerchantvalidation({
      validationURL: "https://apple.example/startSession",
      complete: (p) => {
        completedWith = p;
      },
    });

    assert.ok(completedWith instanceof Promise, "complete() must be called before the handler returns");
    assert.deepEqual(await completedWith, MERCHANT_SESSION);
  });

  test("reports the gateway error when merchant validation fails", async () => {
    globalThis.fetch = gatewayFetch({
      "/api/public/applepay/validatemerchant": () =>
        jsonResponse({ status: "failed", msg: "bad request error: invalid PKeyCompany" }, 400),
    });
    const ap = new ApplePay(settings());
    const result = ap.submit();
    const request = FakePaymentRequest.last;

    await assert.rejects(request.validateMerchant(), /invalid PKeyCompany/);
    // Safari aborts the sheet when the merchant session promise rejects.
    request.rejectShow(domException("AbortError", "The operation was aborted."));

    assert.deepEqual(await result, {
      status: "fail",
      error: "merchant validation failed (HTTP 400): bad request error: invalid PKeyCompany",
    });
  });

  test("reports a network error during merchant validation", async () => {
    globalThis.fetch = gatewayFetch({
      "/api/public/applepay/validatemerchant": () => {
        throw new TypeError("Load failed");
      },
    });
    const ap = new ApplePay(settings());
    const result = ap.submit();
    const request = FakePaymentRequest.last;

    await assert.rejects(request.validateMerchant(), /Load failed/);
    request.rejectShow(domException("AbortError"));

    assert.deepEqual(await result, { status: "fail", error: "Load failed" });
  });

  test("returns fail when the user cancels the sheet", async () => {
    const ap = new ApplePay(settings());
    const result = ap.submit();
    FakePaymentRequest.last.rejectShow(domException("AbortError", "The operation was aborted."));

    assert.deepEqual(await result, { status: "fail", error: "The operation was aborted." });
  });

  test("returns the user activation error so callers can show a button", async () => {
    const ap = new ApplePay(settings());
    const result = ap.submit();
    FakePaymentRequest.last.rejectShow(
      domException("SecurityError", "show() must be triggered by user activation.")
    );

    assert.deepEqual(await result, {
      status: "fail",
      error: "show() must be triggered by user activation.",
    });
  });

  test("completes the sheet with fail when payment authorization fails", async () => {
    globalThis.fetch = gatewayFetch({
      "/api/public/applepay/paymentauthorized": () => jsonResponse({ msg: "decline" }, 402),
    });
    const ap = new ApplePay(settings());
    const result = ap.submit();
    const request = FakePaymentRequest.last;
    await request.validateMerchant();
    const response = request.authorize();

    assert.deepEqual(await result, {
      status: "fail",
      error: "payment authorization failed (HTTP 402): decline",
    });
    assert.equal(response.completedWith, "fail");
  });

  test("always returns a string error, even for errors without a message", async () => {
    const ap = new ApplePay(settings());
    const result = ap.submit();
    FakePaymentRequest.last.rejectShow("something odd");

    assert.deepEqual(await result, { status: "fail", error: "something odd" });
  });

  test("can be called again on the same instance", async () => {
    const ap = new ApplePay(settings());

    const first = ap.submit();
    FakePaymentRequest.last.rejectShow(domException("AbortError"));
    await first;

    const second = ap.submit();
    assert.equal(FakePaymentRequest.instances.length, 2, "a new PaymentRequest is created");
    const request = FakePaymentRequest.last;
    await request.validateMerchant();
    request.authorize();

    assert.equal((await second).status, "success");
  });
});

describe("stuck sheets", () => {
  // Safari never settles show() after the user dismisses the
  // "Add cards to Apple Pay" prompt.

  test("abort() releases a pending submit()", async () => {
    const ap = new ApplePay(settings());
    const result = ap.submit();

    assert.equal(await ap.abort(), true);
    assert.deepEqual(await result, { status: "fail", error: "The operation was aborted." });
  });

  test("abort() is a no-op when nothing is showing", async () => {
    const ap = new ApplePay(settings());
    assert.equal(await ap.abort(), false);
    assert.equal(FakePaymentRequest.last.abortCalls, 0);
  });

  test("a new submit() aborts a stuck sheet from another instance", async () => {
    const first = new ApplePay(settings());
    const firstResult = first.submit();
    const firstRequest = FakePaymentRequest.last;

    const second = new ApplePay(settings());
    const secondResult = second.submit();
    const secondRequest = FakePaymentRequest.last;

    assert.equal(firstRequest.abortCalls, 1);
    assert.deepEqual(await firstResult, { status: "fail", error: "The operation was aborted." });

    await secondRequest.validateMerchant();
    secondRequest.authorize();
    assert.equal((await secondResult).status, "success");
  });

  test("sheetTimeout gives up when the sheet never opens", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const ap = new ApplePay(settings({ sheetTimeout: 5000 }));
    const result = ap.submit();

    t.mock.timers.tick(5000);

    assert.deepEqual(await result, {
      status: "fail",
      error: "Apple Pay sheet did not open within 5000ms",
    });
  });

  test("sheetTimeout does not fire once merchant validation starts", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const ap = new ApplePay(settings({ sheetTimeout: 5000 }));
    const result = ap.submit();
    const request = FakePaymentRequest.last;

    await request.validateMerchant();
    t.mock.timers.tick(10000);
    await flush();
    assert.equal(request.abortCalls, 0);

    request.authorize();
    assert.equal((await result).status, "success");
  });
});

describe("isAvailable", () => {
  test("is false outside Safari", () => {
    assert.equal(ApplePay.isAvailable(), false);
    globalThis.window = {};
    assert.equal(ApplePay.isAvailable(), false);
  });

  test("uses ApplePaySession.canMakePayments()", () => {
    globalThis.window = { ApplePaySession: { canMakePayments: () => true } };
    assert.equal(ApplePay.isAvailable(), true);
    globalThis.window = { ApplePaySession: { canMakePayments: () => false } };
    assert.equal(ApplePay.isAvailable(), false);
  });

  test("is false when canMakePayments() throws", () => {
    globalThis.window = {
      ApplePaySession: {
        canMakePayments: () => {
          throw new Error("insecure document");
        },
      },
    };
    assert.equal(ApplePay.isAvailable(), false);
  });
});
