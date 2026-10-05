import { SERVICE_CATALOG } from '../server-api/paypal/services.js';
import { getJson, setJson, addToIndex } from '../config/aion-stack-store.js';
import { fulfillTeacherOrder } from './teacher-fulfillment.js';
import { paypalBaseUrl, paypalClientId, paypalClientSecret } from './paypal/config.js';

const PAYPAL_BASE_URL = paypalBaseUrl();
const ALLOWED_ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getAccessToken() {
  const clientId = paypalClientId();
  const secret = paypalClientSecret();
  if (!clientId || !secret) throw new Error('PayPal configuration is incomplete');
  const auth = Buffer.from(clientId + ':' + secret).toString('base64');
  const tokenRes = await fetch(PAYPAL_BASE_URL + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) throw new Error('PayPal authentication failed');
  return tokenData.access_token;
}

function validOrderId(orderId) { return typeof orderId === 'string' && /^[A-Z0-9-]{5,100}$/.test(orderId); }

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { orderId, aionOrderId } = req.body || {};
  if (!validOrderId(orderId)) return res.status(400).json({ success:false,error:'رقم PayPal غير صالح' });

  try {
    const accessToken = await getAccessToken();
    const orderRes = await fetch(PAYPAL_BASE_URL + '/v2/checkout/orders/' + encodeURIComponent(orderId), {headers:{Authorization:'Bearer '+accessToken}});
    if (!orderRes.ok) return res.status(404).json({success:false,error:'الطلب غير موجود'});
    const paypalOrder = await orderRes.json();
    const purchaseUnit=paypalOrder.purchase_units?.[0];
    const amount=purchaseUnit?.amount;
    const customId=String(purchaseUnit?.custom_id||'').trim();
    const resolvedAionOrderId=String(aionOrderId||customId).trim();
    const teacherOrder=await getJson('teacher-orders:'+resolvedAionOrderId);

    if (!teacherOrder) return res.status(404).json({success:false,error:'طلب AION غير موجود'});
    if (teacherOrder.paypalOrderId && teacherOrder.paypalOrderId!==orderId) return res.status(409).json({success:false,error:'طلب PayPal لا يطابق طلب AION'});
    if (customId!==teacherOrder.id) return res.status(409).json({success:false,error:'مرجع PayPal لا يطابق طلب AION'});
    if (paypalOrder.status!=='COMPLETED') return res.status(200).json({success:false,error:'الطلب غير مكتمل',status:paypalOrder.status||'UNKNOWN'});
    const catalogService=Object.values(SERVICE_CATALOG).find(item=>item.id===teacherOrder.serviceId);
    if(!catalogService) return res.status(200).json({success:false,error:'الخدمة المرتبطة بالطلب غير معروفة'});
    const paidAmount=Number(amount?.value), currency=amount?.currency_code;
    if(!Number.isFinite(paidAmount)||currency!=='USD') return res.status(200).json({success:false,error:'بيانات المبلغ أو العملة غير صالحة'});
    if(Math.abs(paidAmount-catalogService.price)>0.000001) return res.status(200).json({success:false,error:'المبلغ المدفوع لا يطابق سعر الخدمة'});

    const capture= purchaseUnit?.payments?.captures?.find(item=>item.status==='COMPLETED');
    const transactionId=capture?.id||null;

    let paidOrder=teacherOrder;
    if(teacherOrder.paymentStatus!=='confirmed'){
      paidOrder={...teacherOrder,status:'PAID',paymentStatus:'confirmed',paypalOrderId:orderId,providerEventId:orderId,paymentReference:transactionId,revenueRecognized:true,paidAt:new Date().toISOString(),verifiedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      await setJson('teacher-orders:'+teacherOrder.id,paidOrder);
      await setJson('teacher-revenue:'+teacherOrder.id,{id:'AION-TCH-REV-'+Date.now().toString(36).toUpperCase(),orderId:teacherOrder.id,serviceId:teacherOrder.serviceId,customerId:'anonymous-teacher-customer',amountUsd:paidAmount,currency,paymentReference:transactionId,recognizedAt:paidOrder.paidAt,source:'confirmed-paypal-payment'});
      await addToIndex('teacher-revenue',teacherOrder.id);
    }

    const delivery=await fulfillTeacherOrder(teacherOrder.id);
    return res.status(200).json({success:true,orderId, aionOrderId:teacherOrder.id,serviceId:teacherOrder.serviceId,amount:paidAmount,currency,status:paypalOrder.status,transactionId,payer:paypalOrder.payer?.email_address||'N/A',date:paypalOrder.update_time||paypalOrder.create_time||new Date().toISOString(),delivery});
  } catch(error) {
    console.error('AION PayPal verify/teacher fulfillment error:',error);
    return res.status(502).json({success:false,error:'خطأ في التحقق أو تنفيذ الطلب'});
  }
}
