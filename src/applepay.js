export class ApplePay {
  constructor(settings) {
    this.key = settings.key ? settings.key : null;
    this.domain = settings.domain ? settings.domain : null;
    this.domainName = settings.domainName ? settings.domainName : null;
    this.payment = settings.payment ? settings.payment : null;
    this.details = settings.details ? settings.details : null;
    this.options = settings.options ? settings.options : null;

    // Validate the constructor settings
    var validationError = this.validate();
    if (validationError) {
      throw new Error(validationError);
    }

    // Setup payment request
    this.request = new PaymentRequest(
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

    return undefined;
  }

  async submit() {
    try {
      // Handle applepay merchant validation
      this.request.onmerchantvalidation = async (event) => {
        await fetch(
          `https://${this.domain}/api/public/applepay/validatemerchant`,
          {
            method: "post",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              PKeyCompany: this.key,
              AppleMerchantId: this.payment.merchantIdentifier,
              ValidationUrl: event.validationURL,
              DomainName: this.domainName,
            }),
          }
        )
          .then((res) => res.json())
          .then((data) => event.complete(data))
          .catch((err) => event.complete(err));
      };

      // trigger the ui
      var response = await this.request.show();

      // tokenize the payment token
      var token = null;
      await fetch(
        `https://${this.domain}/api/public/applepay/paymentauthorized`,
        {
          method: "post",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            PKeyCompany: this.key,
            AppleMerchantId: this.payment.merchantIdentifier,
            ApplePayPayment: response.details,
          }),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          response.complete("success");
          token = data;
        })
        .catch((err) => {
          response.complete("fail");
          throw new Error(err);
        });

      // return success
      return { status: "success", token: token, raw_response: response };
    } catch (err) {
      // return fail
      return { status: "fail", error: err.message };
    }
  }
}
