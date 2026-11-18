// Only one Apple Pay sheet can be open at a time, across every ApplePay
// instance on the page.
let activeRequest = null;

export class ApplePay {
  constructor(settings) {
    this.key = settings.key ? settings.key : null;
    this.domain = settings.domain ? settings.domain : null;
    this.domainName = settings.domainName ? settings.domainName : null;
    this.payment = settings.payment ? settings.payment : null;
    this.details = settings.details ? settings.details : null;
    this.options = settings.options ? settings.options : null;
    this.sheetTimeout = settings.sheetTimeout ? settings.sheetTimeout : null;

    // Validate the constructor settings
    var validationError = this.validate();
    if (validationError) {
      throw new Error(validationError);
    }

    // Setup payment request
    this.request = this.createRequest();
    this.requestUsed = false;
    this.showing = false;
  }

  static isAvailable() {
    try {
      return (
        typeof window !== "undefined" &&
        !!window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()
      );
    } catch (err) {
      return false;
    }
  }

  validate() {
    if (this.key == null) {
      return "missing required parameter key";
    }
    if (this.domain == null) {
      return "missing required parameter domain";
    }
    if (this.payment == null) {
      return "missing required parameter payment";
    }
    if (this.details == null) {
      return "missing required parameter details";
    }
    if (this.options == null) {
      return "missing required parameter options";
    }
    if (
      this.sheetTimeout != null &&
      (typeof this.sheetTimeout !== "number" || this.sheetTimeout <= 0)
    ) {
      return "sheetTimeout must be a positive number of milliseconds";
    }

    return undefined;
  }

  createRequest() {
    return new PaymentRequest(
      [
        {
          supportedMethods: "https://apple.com/apple-pay",
          data: this.payment,
        },
      ],
      this.details,
      this.options
    );
  }

  // Cancels a sheet that is still open, which makes the pending submit()
  // resolve with status "fail". Resolves to true if a sheet was aborted.
  abort() {
    if (!this.showing) {
      return Promise.resolve(false);
    }
    return this.request.abort().then(
      () => true,
      () => false
    );
  }

  async validateMerchant(validationURL) {
    const res = await fetch(
      `https://${this.domain}/api/public/applepay/validatemerchant`,
      {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          PKeyCompany: this.key,
          AppleMerchantId: this.payment.merchantIdentifier,
          ValidationUrl: validationURL,
          DomainName: this.domainName,
        }),
      }
    );
    if (!res.ok) {
      throw new Error(
        `merchant validation failed (HTTP ${res.status}): ${await readError(res)}`
      );
    }
    return res.json();
  }

  async authorizePayment(details) {
    const res = await fetch(
      `https://${this.domain}/api/public/applepay/paymentauthorized`,
      {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          PKeyCompany: this.key,
          AppleMerchantId: this.payment.merchantIdentifier,
          ApplePayPayment: details,
        }),
      }
    );
    if (!res.ok) {
      throw new Error(
        `payment authorization failed (HTTP ${res.status}): ${await readError(res)}`
      );
    }
    return res.json();
  }

  async submit() {
    // A PaymentRequest can only be shown once.
    if (this.requestUsed) {
      try {
        this.request = this.createRequest();
      } catch (err) {
        return { status: "fail", error: errorMessage(err) };
      }
    }
    this.requestUsed = true;

    const request = this.request;
    let merchantValidationStarted = false;
    let merchantValidationError = null;
    let timedOut = false;
    let timer = null;

    try {
      // Handle applepay merchant validation
      request.onmerchantvalidation = (event) => {
        merchantValidationStarted = true;
        clearTimeout(timer);
        const session = this.validateMerchant(event.validationURL).catch(
          (err) => {
            merchantValidationError = err;
            throw err;
          }
        );
        event.complete(session);
      };

      // Everything before show() must stay synchronous so it still counts as
      // part of the user's click.
      if (activeRequest && activeRequest !== request) {
        abortQuietly(activeRequest);
      }
      activeRequest = request;
      this.showing = true;

      // trigger the ui
      const shown = request.show();

      // Safari never settles show() when the user dismisses the "Add cards to
      // Apple Pay" prompt, so optionally give up if the sheet never opens.
      if (this.sheetTimeout) {
        timer = setTimeout(() => {
          if (!merchantValidationStarted) {
            timedOut = true;
            abortQuietly(request);
          }
        }, this.sheetTimeout);
      }

      const response = await shown;
      clearTimeout(timer);

      // tokenize the payment token
      let token;
      try {
        token = await this.authorizePayment(response.details);
      } catch (err) {
        await response.complete("fail");
        throw err;
      }
      await response.complete("success");

      // return success
      return { status: "success", token: token, raw_response: response };
    } catch (err) {
      // return fail
      let error = errorMessage(err);
      if (merchantValidationError) {
        error = errorMessage(merchantValidationError);
      } else if (timedOut) {
        error = `Apple Pay sheet did not open within ${this.sheetTimeout}ms`;
      }
      return { status: "fail", error: error };
    } finally {
      clearTimeout(timer);
      this.showing = false;
      if (activeRequest === request) {
        activeRequest = null;
      }
    }
  }
}

function abortQuietly(request) {
  try {
    request.abort().catch(() => {});
  } catch (err) {
    // The request was already closed.
  }
}

async function readError(res) {
  try {
    const text = await res.text();
    try {
      const body = JSON.parse(text);
      return body.msg || body.message || body.error || text;
    } catch (err) {
      return text;
    }
  } catch (err) {
    return res.statusText;
  }
}

function errorMessage(err) {
  if (err && typeof err.message === "string" && err.message !== "") {
    return err.message;
  }
  return String(err);
}
