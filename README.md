# @fluidpay/walletjs

## Installation

```console
$ npm install @fluidpay/walletjs
```

## Basic Usage

### Apple Pay

##### html

```html
<button type="button" onclick="submitApplePay()">Apple Pay Button</button>
```

##### js

```javascript
import walletjs from "@fluidpay/walletjs";

const ap = new walletjs.ApplePay({
  key: "myKey0123456789",
  domain: "sandbox.fluidpay.com",
  domainName: "", // optionally override the Merchant Domain referenced in their certificate.
  payment: {
    merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
    supportedNetworks: ["visa", "masterCard", "discover"],
    countryCode: "US",
    version: 3,
    merchantIdentifier: "my.merchant.id.app",
    // Use requiredBillingContactFields to request the user's
    // billing address that is associated with their payment method.
    requiredBillingContactFields: ["email", "name", "phone", "postalAddress"], // Default undefinied
  },

  details: {
    total: {
      label: "Total Amount",
      amount: { currency: "USD", value: "10.61" },
    },
  },

  options: {
    requestShipping: false,
  },
});

function submitApplePay() {
  var resp = ap.submit();
  console.log(resp);
}
```

## Response

##### success

```json
{ "status": "success", "token": "aBCd1234" };
```

##### fail

```json
{ "status": "fail", "error": "missing required parameter - key" };
```

### Google Pay™

###### js

```javascript
import walletjs from "@fluidpay/walletjs";

// Create a new Google Pay instance with your
// given settings.
let gp = new walletjs.GooglePay({
  container: "#container",
  merchantName: "Example Merchant",
  gatewayMerchantId: "<PUBLIC_API_KEY>",
  allowedCardNetworks: ["VISA"],
  allowedCardAuthMethods: ["PAN_ONLY"],
  transactionInfo: {
    countryCode: "US",
    currencyCode: "USD",
    totalPrice: "1.23",
  },
  // Deal with response from payment clicked
  onGooglePaymentButtonClicked: (paymentDataRequest) => {
    paymentDataRequest
      .then((paymentData) => {
        // Get the token.
        const token = paymentData.paymentMethodData.tokenizationData.token;

        // Send the token to your backend server, which will
        // then call our API to create a new transaction with
        // the token set as the payment method.
      })
      .catch((err) => {
        console.log(err);
      });
  },
});
```

###### HTML (Template)

```html
<!-- The div where the button will go -->
<div id="container"></div>
```

## Additional Resources

- [Fluidpay Documentation](https://sandbox.fluidpay.com/docs/tokenizer/)
- [MDN Payment Request API](https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API)
