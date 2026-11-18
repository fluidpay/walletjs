// Test doubles for the browser APIs WalletJS depends on.

export class FakePaymentRequest {
  static instances = [];

  constructor(methodData, details, options) {
    this.methodData = methodData;
    this.details = details;
    this.options = options;
    this.state = "created";
    this.onmerchantvalidation = null;
    this.abortCalls = 0;
    FakePaymentRequest.instances.push(this);
  }

  static reset() {
    FakePaymentRequest.instances = [];
  }

  static get last() {
    return FakePaymentRequest.instances[FakePaymentRequest.instances.length - 1];
  }

  show() {
    if (this.state !== "created") {
      return Promise.reject(domException("InvalidStateError"));
    }
    this.state = "interactive";
    return new Promise((resolve, reject) => {
      this.resolveShow = (response) => {
        this.state = "closed";
        resolve(response);
      };
      this.rejectShow = (err) => {
        this.state = "closed";
        reject(err);
      };
    });
  }

  abort() {
    this.abortCalls++;
    if (this.state !== "interactive") {
      return Promise.reject(domException("InvalidStateError"));
    }
    this.rejectShow(domException("AbortError", "The operation was aborted."));
    return Promise.resolve();
  }

  // Simulates Safari opening the sheet and asking for a merchant session.
  // Resolves with whatever the page passed to event.complete().
  validateMerchant(validationURL = "https://apple-pay-gateway.apple.com/paymentservices/startSession") {
    return new Promise((resolve) => {
      this.onmerchantvalidation({
        validationURL,
        complete: (session) => resolve(Promise.resolve(session)),
      });
    });
  }

  // Simulates the user authorizing the payment with Touch ID / Face ID.
  authorize(details = { token: { paymentData: "encrypted" } }) {
    const response = new FakePaymentResponse(details);
    this.resolveShow(response);
    return response;
  }
}

export class FakePaymentResponse {
  constructor(details) {
    this.details = details;
    this.completedWith = undefined;
  }

  complete(result) {
    this.completedWith = result;
    return Promise.resolve();
  }
}

export function domException(name, message = name) {
  return new DOMException(message, name);
}

// Records every call and answers from a list of handlers keyed by URL suffix.
export function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : undefined });
    const route = Object.keys(routes).find((suffix) => url.endsWith(suffix));
    if (!route) {
      throw new TypeError(`unexpected fetch to ${url}`);
    }
    return routes[route](url, init);
  };
  fn.calls = calls;
  return fn;
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}
