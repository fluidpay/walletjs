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
  merchantIdentifier: "my.merchant.id.app",
};

const details = {
  total: {
    label: "Total Amount",
    amount: { currency: "USD", value: "10.61" },
  },
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
  requestShipping: false,
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

### Google Pay

##### html

```html
<button type="button" onclick="myGooglePayFunc()">Google Pay Button</button>
```

##### js

```javascript
import { walletjs } from "@fluidpay/walletjs";

async function myGooglePayFunc() {
  var response = await walletjs.googlepay.submit();
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

## Additional Resources

- [Fluidpay Documentation](https://sandbox.fluidpay.com/docs/tokenizer/)
- [MDN Payment Request API](https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API)
