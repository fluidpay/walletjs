class t{constructor(t,e,a,n,p){this.key=t||null,this.payment=e||null,this.details=a||null,this.options=n||null,this.sandbox=void 0===p||p}validate(){for(const[t,e]of Object.entries(this))if(null===e)throw new Error(`missing required parameter - ${t}`)}mapToPaymentRequest(){return new PaymentRequest([{supportedMethods:"https://apple.com/apple-pay",data:this.payment}],this.details,this.options)}}const e={applepay:{submit:async function(e,a,n,p,s){try{const l=new t(e,a,n,p,s);l.validate();const c=l.mapToPaymentRequest();c.onmerchantvalidation=async t=>{const n=!0===l.sandbox?"https://sandbox.fluidpay.com/api/public/applepay/validatemerchant":"https://fluidpay.com/api/public/applepay/validatemerchant";await fetch(n,{method:"post",headers:{"content-type":"application/json"},body:JSON.stringify({PKeyCompany:e,AppleMerchantId:a.merchantIdentifier,ValidationUrl:t.validationURL})}).then((t=>t.json())).then((e=>t.complete(e))).catch((e=>t.complete(e)))};var o=await c.show(),i=null;const r=!0===l.sandbox?"https://sandbox.fluidpay.com/api/public/applepay/paymentauthorized":"https://fluidpay.com/api/public/applepay/paymentauthorized";return await fetch(r,{method:"post",headers:{"content-type":"application/json"},body:JSON.stringify({PKeyCompany:e,AppleMerchantId:a.merchantIdentifier,ApplePayPayment:o.details})}).then((t=>t.json())).then((t=>{o.complete("success"),i=t})).catch((t=>{throw o.complete("fail"),new Error(t)})),{status:"success",token:i}}catch(t){return{status:"fail",error:t.message}}}}};export{e as walletjs};