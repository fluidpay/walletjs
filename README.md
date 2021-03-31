# @fluidpay/walletjs

### Installation

```console
$ npm install @fluidpay/walletjs
```

### Basic Usage

> ### HTML:
>
> ```html
> <button type="button" onclick="mySubmitFunc()">Apple Pay Button</button>
> ```
>
> ### JS:
>
> ```javascript
> import { walletjs } from "@fluidpay/walletjs";
>
> const key = "myKey0123456789";
>
> const payment = {
>   merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
>   supportedNetworks: ["visa", "masterCard", "discover"],
>   countryCode: "US",
>   version: 3,
>   merchantIdentifier: "my.merchant.id.app",
> };
>
> const details = {
>   total: {
>     label: "Total Amount",
>     amount: { currency: "USD", value: "10.61" },
>   },
>   // Optional Line Items
>   // displayItems: [
>   //{
>   //label: "subtotal",
>   //amount: { currency: "USD", value: "9.99" },
>   //},
>   //{
>   //label: "tax",
>   //amount: { currency: "USD", value: "0.62" },
>   //},
>   //],
> };
>
> const options = {
>   requestShipping: false,
> };
>
> const sandbox = true;
>
> async function mySubmitFunc() {
>   var response = await walletjs.applepay.submit(
>     key,
>     payment,
>     details,
>     options,
>     sandbox
>   );
>   console.log(response);
> }
> ```
>
> ### Response:
>
> ```json
> // success
> { "status": "success", "token": "aBCd1234" };
>
> // fail
> { "status": "fail", "error": "missing required parameter - key" };
> ```
>
> ---

<!-- ### Overview

> ### walletjs
>
> the walletjs object is essentially a wrapper that contains the Apple Pay and Google Pay classes.
>
> | Type   | Parameters              |
> | ------ | ----------------------- |
> | Object | `applepay`, `googlepay` |

---

> ### applepay
>
> the applepay class is used to handle communication to and from Apple Pay servers.
>
> | Type  | Methods    |
> | ----- | ---------- |
> | Class | `submit()` |
>
> > ### submit()
> >
> > the submit method is used for building and submitting an Apple Pay request.
> > |Type|Required Parameters|Optional Parameters |
> > |-|-|-|
> > |Method|`key`, `payment`, `details`, `options`|`sandbox`
> >
> > > ---
> > >
> > > ### key
> > >
> > > | Type   | Details                                  | Enum Values |
> > > | ------ | ---------------------------------------- | ----------- |
> > > | String | the key is your Fluidpay Certificate ID. | _NA_        |
> > >
> > > ```
> > > const key = "myCertificateId0123"
> > > ```
> > >
> > > ---
> >
> > > ---
> > >
> > > ### payment
> > >
> > > | Type   | Details                                          | Enum Values |
> > > | ------ | ------------------------------------------------ | ----------- |
> > > | Object | the payment object describes the type of payment |             |
> > >
> > > ```
> > > const payment = {
> > >   merchantCapabilities: [
> > >     "supports3DS",
> > >     "supportsCredit",
> > >     "supportsDebit",
> > >   ],
> > >   supportedNetworks: ["discover", "masterCard", "visa"],
> > >   countryCode: "US",
> > >   version: 3,
> > >   merchantIdentifier: "merchant.com.fluidpay.app",
> > > }
> > > ```
> > >
> > > --- -->
