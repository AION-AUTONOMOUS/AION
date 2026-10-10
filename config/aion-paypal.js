import crypto from 'node:crypto';

const ENV = String(process.env.PAYPAL_ENVIRONMENT || 'live').toLowerCase();
const BASE = ENV === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
const REQUEST_TIMEOUT_MS = 10000;
let cachedToken = null;
let tokenExpiresAt = 0;

function requireConfig(){
  if(!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) throw new Error('PayPal server credentials are not configured');
}
async function paypalFetch(url, options = {}) {
  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (cause) {
    const timedOut = cause?.name === 'TimeoutError' || cause?.name === 'AbortError';
    const error = new Error(timedOut
      ? 'PayPal request timed out; retry safely'
      : 'PayPal network request failed; retry safely');
    error.statusCode = 503;
    error.cause = cause;
    throw error;
  }
}

async function parseResponse(response){
  const text = await response.text(); let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text }; }
  if(!response.ok) {
    const error = new Error(data?.details?.[0]?.description || data?.message || ('PayPal HTTP ' + response.status));
    error.statusCode = response.status === 429 || response.status >= 500 ? 503 : 502;
    throw error;
  }
  return data;
}
async function accessToken(){
  requireConfig();
  if(cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;
  const basic = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64');
  const response = await paypalFetch(BASE + '/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic ' + basic,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials'});
  const data = await parseResponse(response); cachedToken=data.access_token; tokenExpiresAt=Date.now()+Number(data.expires_in||300)*1000; return cachedToken;
}
function requestId(value){ return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0,24); }
export function paypalHealth(){ return {provider:'PayPal',environment:ENV,configured:Boolean(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET),mode:'server-side-orders-v2'}; }
export async function createPayPalOrder({orderId,offer,returnUrl,cancelUrl}){
  const token=await accessToken(); const amount=Number(offer.priceUsd).toFixed(2);
  const response=await paypalFetch(BASE+'/v2/checkout/orders',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation','PayPal-Request-Id':requestId(orderId)},body:JSON.stringify({
    intent:'CAPTURE',
    purchase_units:[{reference_id:'default',invoice_id:orderId,custom_id:orderId,description:offer.name,amount:{currency_code:'USD',value:amount},items:[{name:offer.name,sku:offer.id,quantity:'1',unit_amount:{currency_code:'USD',value:amount},category:'DIGITAL_GOODS'}]}],
    payment_source:{paypal:{experience_context:{brand_name:'AION AUTONOMOUS',user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING',return_url:returnUrl,cancel_url:cancelUrl}}}
  })});
  const data=await parseResponse(response);
  const approval=(data.links||[]).find(x=>x.rel==='payer-action'||x.rel==='approve');
  if(!approval?.href) { const error = new Error('PayPal approval link was not returned'); error.statusCode = 502; throw error; }
  return {id:data.id,status:data.status,approvalUrl:approval.href,environment:ENV};
}
export async function capturePayPalOrder({paypalOrderId,expectedOrderId,expectedAmountUsd}){
  const token=await accessToken();
  const detailsResponse=await paypalFetch(BASE+'/v2/checkout/orders/'+encodeURIComponent(paypalOrderId),{headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
  const details=await parseResponse(detailsResponse); const unit=details.purchase_units?.[0];
  if(!unit || (unit.custom_id!==expectedOrderId && unit.invoice_id!==expectedOrderId)) throw new Error('PayPal order does not match the AION order');
  if(unit.amount?.currency_code!=='USD' || Number(unit.amount?.value).toFixed(2)!==Number(expectedAmountUsd).toFixed(2)) throw new Error('PayPal amount or currency does not match the AION order');
  let captured=details;
  if(details.status!=='COMPLETED'){
    const captureResponse=await paypalFetch(BASE+'/v2/checkout/orders/'+encodeURIComponent(paypalOrderId)+'/capture',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','PayPal-Request-Id':requestId(paypalOrderId+':capture')},body:'{}'});
    captured=await parseResponse(captureResponse);
  }
  if(captured.status!=='COMPLETED') throw new Error('PayPal payment is not completed: '+captured.status);
  const capture=captured.purchase_units?.[0]?.payments?.captures?.find(x=>x.status==='COMPLETED');
  if(!capture?.id) { const error = new Error('Completed PayPal capture reference was not returned'); error.statusCode = 502; throw error; }
  return {orderId:captured.id,status:captured.status,captureId:capture.id,amount:capture.amount?.value,currency:capture.amount?.currency_code,payerEmail:captured.payer?.email_address||captured.payment_source?.paypal?.email_address||null};
}