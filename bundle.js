class t{constructor(t,e,a,n,s){this.key=t||null,this.payment=e||null,this.details=a||null,this.options=n||null,this.domain=s||null}validate(){for(const[t,e]of Object.entries(this))if(null===e)throw new Error(`missing required parameter - ${t}`)}mapToPaymentRequest(){return new PaymentRequest([{supportedMethods:"https://apple.com/apple-pay",data:this.payment}],this.details,this.options)}}const e={applepay:{submit:async function(e,a,n,s,o){try{const l=new t(e,a,n,s,o);l.validate();const r=l.mapToPaymentRequest();r.onmerchantvalidation=async t=>{const n=`https://${o}/api/public/applepay/validatemerchant`;await fetch(n,{method:"post",headers:{"content-type":"application/json"},body:JSON.stringify({PKeyCompany:e,AppleMerchantId:a.merchantIdentifier,ValidationUrl:t.validationURL})}).then((t=>t.json())).then((e=>t.complete(e))).catch((e=>t.complete(e)))};var i=await r.show(),p=null;const c=`https://${o}/api/public/applepay/paymentauthorized`;return await fetch(c,{method:"post",headers:{"content-type":"application/json"},body:JSON.stringify({PKeyCompany:e,AppleMerchantId:a.merchantIdentifier,ApplePayPayment:i.details})}).then((t=>t.json())).then((t=>{i.complete("success"),p=t})).catch((t=>{throw i.complete("fail"),new Error(t)})),{status:"success",token:p}}catch(t){return{status:"fail",error:t.message}}}}};export{e as walletjs};
