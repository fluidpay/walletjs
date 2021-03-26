class ApplePay {
  // constructor
  constructor(domain, key, payment, details, options, sandbox) {
    this.domain = domain ? domain : null;
    this.key = key ? key : null;
    this.payment = payment ? payment : null;
    this.details = details ? details : null;
    this.options = options ? options : null;
    this.sandbox = sandbox !== undefined ? sandbox : true;
  }
  // methods
  validate() {
    for (const [key, val] of Object.entries(this)) {
      if (val === null) {
        throw new Error(`missing required parameter - ${key}`);
      }
      continue;
    }
  }
  mapToPaymentRequest() {
    return new PaymentRequest(
      [{ supportedMethods: "https://apple.com/apple-pay", data: this.payment }],
      this.details,
      this.options
    );
  }
}

export const applepay = {
  submit: async function (domain, key, payment, details, options, sandbox) {
    try {
      // create applepay object
      const applepay = new ApplePay(
        domain,
        key,
        payment,
        details,
        options,
        sandbox
      );

      // validate parameters
      applepay.validate();

      // map request & validate merchant
      const request = applepay.mapToPaymentRequest();
      request.onmerchantvalidation = async (event) => {
        const uri =
          applepay.sandbox === true
            ? "https://sandbox.fluidpay.com/api/public/applepay/validatemerchant"
            : "https://fluidpay.com/api/public/applepay/validatemerchant";
        await fetch(uri, {
          method: "post",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            PKeyCompany: key,
            AppleMerchantId: payment.merchantIdentifier,
            ValidationUrl: event.validationURL,
            domain: domain,
          }),
        })
          .then((res) => res.json())
          .then((data) => event.complete(data))
          .catch((err) => event.complete(err));
      };

      // trigger the ui
      var response = await request.show();

      // tokenize the payment token
      const uri =
        applepay.sandbox === true
          ? "https://sandbox.fluidpay.com/api/public/applepay/paymentauthorized"
          : "https://fluidpay.com/api/public/applepay/paymentauthorized";
      await fetch(uri, {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          PKeyCompany: key,
          AppleMerchantId: payment.merchantIdentifier,
          ApplePayPayment: response.details,
          domain: domain,
        }),
      })
        .then((res) => res.json())
        .then((data) => response.complete("success"))
        .catch((err) => {
          response.complete("fail");
          throw new Error(err);
        });

      // return success
      return { status: "success", data: response.details };
    } catch (err) {
      // return fail
      return { status: "fail", error: err.message };
    }
  },
};
