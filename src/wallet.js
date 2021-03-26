// import { applepay } from "./applepay/applepay";
const applepay = require("./_applepay");
// import { creditcard } from "./creditcard/creditcard";
// import { googlepay } from "./googlepay/googlepay";

module.exports.walletjs = {
  applepay,
  // creditcard,
  // googlepay,
};

const domain = "fpwallet.loca.lt";
const key = "c1dl67herttrbao2es60";
const payment = {
  merchantCapabilities: ["supports3DS", "supportsCredit", "supportsDebit"],
  supportedNetworks: ["discover", "masterCard", "visa"],
  countryCode: "US",
  version: 3,
  merchantIdentifier: "merchant.com.fluidpay.app",
};
const details = {
  total: { label: "total", amount: { currency: "USD", value: "10.00" } },
  displayItems: [
    { label: "subtotal", amount: { currency: "USD", value: "4.00" } },
    { label: "tax", amount: { currency: "USD", value: "1.00" } },
    { label: "shipping", amount: { currency: "USD", value: "5.00" } },
  ],
};
const options = { requestShipping: false, shippingType: "shipping" };
const sandbox = true;

const w = this.walletjs.applepay.submit(
  domain,
  key,
  payment,
  details,
  options
  // sandbox
);

console.log(w);
