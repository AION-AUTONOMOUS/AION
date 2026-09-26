import { SERVICE_CATALOG } from '../server-api/paypal/services.js';

const PAYPAL_BASE_URL = 'https://api-m.paypal.com';
const ALLOWED_ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-theta-eight.vercel.app';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
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

function validOrderId(orderId) {
  return typeof orderId === 'string' && /^[A-Z0-9-]{5,64}$/.test(orderId);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { orderId } = req.body || {};
  if (!validOrderId(orderId)) return res.status(400).json({ success: false, error: 'رقم الطلب غير صالح' });

  try {
    const accessToken = await getAccessToken();
    const orderRes = await fetch(
      PAYPAL_BASE_URL + '/v2/checkout/orders/' + encodeURIComponent(orderId),
      { headers: { Authorization: 'Bearer ' + accessToken } }
    );
    if (!orderRes.ok) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });

    const order = await orderRes.json();
    const purchaseUnit = order.purchase_units?.[0];
    const amount = purchaseUnit?.amount;
    const customId = purchaseUnit?.custom_id;

    if (order.status !== 'COMPLETED') {
      return res.status(200).json({ success: false, error: 'الطلب غير مكتمل', status: order.status || 'UNKNOWN' });
    }

    const catalogService = Object.values(SERVICE_CATALOG).find(item => item.id === customId);
    if (!catalogService) return res.status(200).json({ success: false, error: 'الخدمة المرتبطة بالطلب غير معروفة' });

    const paidAmount = Number(amount?.value);
    const currency = amount?.currency_code;

    if (!Number.isFinite(paidAmount) || currency !== 'USD') {
      return res.status(200).json({ success: false, error: 'بيانات المبلغ أو العملة غير صالحة' });
    }

    if (Math.abs(paidAmount - catalogService.price) > 0.000001) {
      return res.status(200).json({ success: false, error: 'المبلغ المدفوع لا يطابق سعر الخدمة' });
    }

    const capture = purchaseUnit?.payments?.captures?.find(item => item.status === 'COMPLETED');

    return res.status(200).json({
      success: true,
      orderId,
      serviceId: catalogService.id,
      amount: paidAmount,
      currency,
      status: order.status,
      transactionId: capture?.id || null,
      payer: order.payer?.email_address || 'N/A',
      date: order.update_time || order.create_time || new Date().toISOString()
    });
  } catch (error) {
    console.error('AION PayPal verify error:', error);
    return res.status(502).json({ success: false, error: 'خطأ في التحقق من الدفع' });
  }
}
