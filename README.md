# @fluidpay/walletjs

## Installation

```console
$ npm install @fluidpay/walletjs
```

## Basic Usage

### Apple Pay

##### html

```html
<button type="button" onclick="myApplePayFunc()">Apple Pay Button</button>
```

##### js

```javascript
import { walletjs } from "@fluidpay/walletjs";

const key = "myKey0123456789";

const payment = {
  merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
  supportedNetworks: ["visa", "masterCard", "discover"],
  countryCode: "US",
  version: 3,
  merchantIdentifier: "my.merchant.id.app"
};

const details = {
  total: {
    label: "Total Amount",
    amount: { currency: "USD", value: "10.61" }
  }
  // Optional Line Items
  // displayItems: [
  //{
  //label: "subtotal",
  //amount: { currency: "USD", value: "9.99" },
  //},
  //{
  //label: "tax",
  //amount: { currency: "USD", value: "0.62" },
  //},
  //],
};

const options = {
  requestShipping: false
};

const domain = "sandbox.fluidpay.com";

async function myApplePayFunc() {
  var response = await walletjs.applepay.submit(
    key,
    payment,
    details,
    options,
    domain
  );
  console.log(response);
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

### Google Pay

##### html

```html
<div id="container"></div>
```

##### js

```javascript
// Create the settings.
const settings = {
  container: "#container",
  merchantName: "Example Merchant",
  gatewayMerchantId: "googletest",
  allowedCardNetworks: ["VISA"],
  allowedCardAuthMethods: ["PAN_ONLY"],
  transactionInfo: {
    countryCode: "US",
    currencyCode: "USD",
    totalPrice: "1.00"
  },
  onGooglePaymentButtonClicked: paymentDataRequest => {
    paymentDataRequest
      .then(paymentData => {
        // Get the token.
        const token = paymentData.paymentMethodData.tokenizationData.token;

        // Send the token to your backend server, which will
        // then call our API to create a new transaction with
        // the token set as the payment method.
      })
      .catch(err => {
        console.log(err);
      });
  }
};

// Create a new Google Pay instance with your
// given settings.
let gp = new GooglePay(settings);
```

## Additional Resources

- [Fluidpay Documentation](https://sandbox.fluidpay.com/docs/tokenizer/)
- [MDN Payment Request API](https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API)
