export class GooglePay {
  constructor(settings) {
    this.domReady(() => {
      // Validate settings.
      this.validate(settings);

      // Set settings.
      this.settings = settings;

      // Set payments client.
      this.paymentsClient = null;

      // Set container.
      let el;
      if (typeof settings.container === "string") {
        const container = settings.container;
        el = document.querySelector(container);
      } else {
        el = settings.container;
      }
      this.settings.container = el;

      // Initialize the Google Pay settings.
      this.gpSettings = {
        baseRequest: {
          apiVersion: 2,
          apiVersionMinor: 0,
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "fluidpay",
            gatewayMerchantId: this.settings.gatewayMerchantId,
          },
        },
      };

      this.gpSettings.baseCardPaymentMethod = {
        type: "CARD",
        parameters: {
          allowedAuthMethods: this.settings.allowedCardAuthMethods,
          allowedCardNetworks: this.settings.allowedCardNetworks,
        },
      };

      this.gpSettings.cardPaymentMethod = Object.assign(
        {},
        this.gpSettings.baseCardPaymentMethod,
        {
          tokenizationSpecification: this.gpSettings.tokenizationSpecification,
        }
      );

      // Append the Google Pay library.
      this.loadGooglePayJSFile();
    });
  }

  domReady(callback) {
    document.readyState === "interactive" || document.readyState === "complete"
      ? callback()
      : document.addEventListener("DOMContentLoaded", callback);
  }

  loadGooglePayJSFile() {
    let script = document.createElement("script");
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.onload = this.onGooglePayLoaded.bind(this);
    document.head.appendChild(script);
  }

  validate(settings) {
    // Check container.
    let el;
    if (typeof settings.container === "string") {
      const container = settings.container;
      el = document.querySelector(container);
    } else {
      el = settings.container;
    }
    if (!el) {
      throw new Error("Could not find container");
    }

    // Check allowedCardNetworks.
    let networks = [];
    for (const network of settings.allowedCardNetworks) {
      // Check if valid enum.
      if (
        network !== "AMEX" &&
        network !== "DISCOVER" &&
        network !== "INTERAC" &&
        network !== "JCB" &&
        network !== "MASTERCARD" &&
        network !== "VISA"
      ) {
        throw new Error("Invalid card network in allowedCardNetworks");
      }

      // Check for duplicates.
      if (networks.indexOf(network) !== -1) {
        throw new Error("Duplicate value found in allowedCardNetworks");
      }
      networks.push(network);
    }

    // Check allowedCardAuthMethods.
    let authMethods = [];
    for (const authMethod of settings.allowedCardAuthMethods) {
      // Check if valid enum.
      if (authMethod !== "PAN_ONLY" && authMethod !== "CRYPTOGRAM_3DS") {
        throw new Error(
          "Invalid authentication method in allowedCardAuthMethods"
        );
      }

      // Check for duplicates.
      if (authMethods.indexOf(authMethod) !== -1) {
        throw new Error("Duplicate value found in allowedCardAuthMethods");
      }
      authMethods.push(authMethod);
    }
  }

  getGoogleIsReadyToPayRequest() {
    return Object.assign({}, this.gpSettings.baseRequest, {
      allowedPaymentMethods: [this.gpSettings.baseCardPaymentMethod],
    });
  }

  getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, this.gpSettings.baseRequest);
    paymentDataRequest.allowedPaymentMethods = [
      this.gpSettings.cardPaymentMethod,
    ];
    paymentDataRequest.transactionInfo = this.getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
      merchantName: this.settings.merchantName,
    };

    return paymentDataRequest;
  }

  getGooglePaymentsClient() {
    if (this.paymentsClient === null) {
      this.paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: "TEST",
      });
    }

    return this.paymentsClient;
  }

  onGooglePayLoaded() {
    const paymentsClient = this.getGooglePaymentsClient();
    paymentsClient
      .isReadyToPay(this.getGoogleIsReadyToPayRequest())
      .then((response) => {
        if (response.result) {
          this.addGooglePayButton();
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  addGooglePayButton() {
    const paymentsClient = this.getGooglePaymentsClient();
    const button = paymentsClient.createButton({
      onClick: this.onGooglePaymentButtonClicked.bind(this),
    });
    this.settings.container.appendChild(button);
  }

  getGoogleTransactionInfo() {
    return {
      countryCode: this.settings.transactionInfo.countryCode,
      currencyCode: this.settings.transactionInfo.currencyCode,
      totalPriceStatus: "FINAL",
      totalPrice: this.settings.transactionInfo.totalPrice,
    };
  }

  onGooglePaymentButtonClicked() {
    const paymentDataRequest = this.getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = this.getGoogleTransactionInfo();

    const paymentsClient = this.getGooglePaymentsClient();
    this.settings.onGooglePaymentButtonClicked(
      paymentsClient.loadPaymentData(paymentDataRequest)
    );
  }
}
