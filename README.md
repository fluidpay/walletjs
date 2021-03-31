# @fluidpay/walletjs

### Installation

```
npm install @fluidpay/walletjs
```

### Overview

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
> > > ---
