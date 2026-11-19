// Checks the built bundles in dist/, which is what sites actually load.
// Run `npm run build` first if src/ changed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";

import { FakePaymentRequest } from "./helpers/fakes.js";

const require = createRequire(import.meta.url);

function assertBundle(walletjs) {
  assert.equal(typeof walletjs.ApplePay, "function");
  assert.equal(typeof walletjs.GooglePay, "function");
  assert.equal(typeof walletjs.ApplePay.isAvailable, "function");
  assert.equal(typeof walletjs.ApplePay.prototype.submit, "function");
  assert.equal(typeof walletjs.ApplePay.prototype.abort, "function");
}

for (const file of ["walletjs.js", "walletjs.umd.js"]) {
  test(`dist/${file} defines a walletjs global when loaded with a <script> tag`, () => {
    const code = readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8");
    const context = vm.createContext({ PaymentRequest: FakePaymentRequest });
    vm.runInContext(code, context);
    assertBundle(context.walletjs);
  });
}

test("dist/walletjs.esm.js has a default export", async () => {
  const mod = await import("../dist/walletjs.esm.js");
  assertBundle(mod.default);
});

test("dist/walletjs.cjs.js can be required", () => {
  // The package is "type": "module", so load the CommonJS build as a script.
  const code = readFileSync(new URL("../dist/walletjs.cjs.js", import.meta.url), "utf8");
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require });
  assertBundle(module.exports.default);
});

test("dist/walletjs.js matches the Apple Pay source behavior", () => {
  const code = readFileSync(new URL("../dist/walletjs.js", import.meta.url), "utf8");
  assert.match(code, /apple\.com\/apple-pay/);
  assert.match(code, /\/api\/public\/applepay\/validatemerchant/);
  assert.match(code, /\/api\/public\/applepay\/paymentauthorized/);
  assert.match(code, /sheetTimeout/, "dist is stale: run npm run build");
  assert.match(code, /DisplayName/, "dist is stale: run npm run build");
});
