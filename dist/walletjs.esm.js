class t{constructor(t){this.key=t.key?t.key:null,this.domain=t.domain?t.domain:null,this.payment=t.payment?t.payment:null,this.details=t.details?t.details:null,this.options=t.options?t.options:null;var e=this.validate();if(e)throw new Error(e);this.request=new PaymentRequest([{supportedMethods:"https://apple.com/apple-pay",data:this.payment}],this.details,this.options)}validate(){return null==this.key?"missing required parameter key":null==this.domain?"missing required parameter domain":null==this.payment?"missing required parameter payment":null==this.details?"missing required parameter details":null==this.options?"missing required parameter options":void 0}async submit(){try{this.request.onmerchantvalidation=async t=>{await fetch(`https://${this.domain}/api/applepay/validatemerchant`,{method:"post",headers:{"content-type":"application/json"},body:JSON.stringify({PKeyCompany:this.key,AppleMerchantId:this.payment.merchantIdentifier,ValidationUrl:t.validationURL})}).then((t=>t.json())).then((e=>t.complete(e))).catch((e=>t.complete(e)))};var t=await request.show(),e=null;return await fetch(`https://${this.domain}/api/applepay/paymentauthorized`,{method:"post",headers:{"content-type":"application/json"},body:JSON.stringify({PKeyCompany:this.key,AppleMerchantId:this.payment.merchantIdentifier,ApplePayPayment:t.details})}).then((t=>t.json())).then((n=>{t.complete("success"),e=n})).catch((e=>{throw t.complete("fail"),new Error(e)})),{status:"success",token:e}}catch(t){return{status:"fail",error:t.message}}}}class e{constructor(t){this.domReady((()=>{let e;if(this.validate(t),this.settings=t,this.paymentsClient=null,"string"==typeof t.container){const n=t.container;e=document.querySelector(n)}else e=t.container;this.settings.container=e,this.gpSettings={baseRequest:{apiVersion:2,apiVersionMinor:0},tokenizationSpecification:{type:"PAYMENT_GATEWAY",parameters:{gateway:"fluidpay",gatewayMerchantId:this.settings.gatewayMerchantId}}},this.gpSettings.baseCardPaymentMethod={type:"CARD",parameters:{allowedAuthMethods:this.settings.allowedCardAuthMethods,allowedCardNetworks:this.settings.allowedCardNetworks}},this.gpSettings.cardPaymentMethod=Object.assign({},this.gpSettings.baseCardPaymentMethod,{tokenizationSpecification:this.gpSettings.tokenizationSpecification}),this.loadGooglePayJSFile()}))}domReady(t){"interactive"===document.readyState||"complete"===document.readyState?t():document.addEventListener("DOMContentLoaded",t)}loadGooglePayJSFile(){let t=document.createElement("script");t.src="https://pay.google.com/gp/p/js/pay.js",t.onload=this.onGooglePayLoaded.bind(this),document.head.appendChild(t)}validate(t){let e;if("string"==typeof t.container){const n=t.container;e=document.querySelector(n)}else e=t.container;if(!e)throw new Error("Could not find container");let n=[];for(const e of t.allowedCardNetworks){if("AMEX"!==e&&"DISCOVER"!==e&&"INTERAC"!==e&&"JCB"!==e&&"MASTERCARD"!==e&&"VISA"!==e)throw new Error("Invalid card network in allowedCardNetworks");if(-1!==n.indexOf(e))throw new Error("Duplicate value found in allowedCardNetworks");n.push(e)}let a=[];for(const e of t.allowedCardAuthMethods){if("PAN_ONLY"!==e&&"CRYPTOGRAM_3DS"!==e)throw new Error("Invalid authentication method in allowedCardAuthMethods");if(-1!==a.indexOf(e))throw new Error("Duplicate value found in allowedCardAuthMethods");a.push(e)}}getGoogleIsReadyToPayRequest(){return Object.assign({},this.gpSettings.baseRequest,{allowedPaymentMethods:[this.gpSettings.baseCardPaymentMethod]})}getGooglePaymentDataRequest(){const t=Object.assign({},this.gpSettings.baseRequest);return t.allowedPaymentMethods=[this.gpSettings.cardPaymentMethod],t.transactionInfo=this.getGoogleTransactionInfo(),t.merchantInfo={merchantName:this.settings.merchantName},t}getGooglePaymentsClient(){return null===this.paymentsClient&&(this.paymentsClient=new window.google.payments.api.PaymentsClient({environment:"TEST"})),this.paymentsClient}onGooglePayLoaded(){this.getGooglePaymentsClient().isReadyToPay(this.getGoogleIsReadyToPayRequest()).then((t=>{t.result&&this.addGooglePayButton()})).catch((t=>{console.error(t)}))}addGooglePayButton(){const t=this.getGooglePaymentsClient().createButton({onClick:this.onGooglePaymentButtonClicked.bind(this)});this.settings.container.appendChild(t)}getGoogleTransactionInfo(){return{countryCode:this.settings.transactionInfo.countryCode,currencyCode:this.settings.transactionInfo.currencyCode,totalPriceStatus:"FINAL",totalPrice:this.settings.transactionInfo.totalPrice}}onGooglePaymentButtonClicked(){const t=this.getGooglePaymentDataRequest();t.transactionInfo=this.getGoogleTransactionInfo();const e=this.getGooglePaymentsClient();this.settings.onGooglePaymentButtonClicked(e.loadPaymentData(t))}}export{t as ApplePay,e as GooglePay};
