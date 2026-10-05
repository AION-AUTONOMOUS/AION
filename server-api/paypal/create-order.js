import crypto from 'node:crypto';
import { getService } from '../../server-api/paypal/services.js';
import { addToIndex, setJson } from '../../config/aion-stack-store.js';
import { paypalBaseUrl, paypalClientId, paypalClientSecret } from './config.js';

const PAYPAL_BASE_URL = paypalBaseUrl();
const ALLOWED_ORIGIN = process.env.AION_PUBLIC_ORIGIN || 'https://aion-production-fbf3.up.railway.app';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getAccessToken() {
  const clientId = paypalClientId();
  const clientSecret = paypalClientSecret();
  if (!clientId || !clientSecret) throw new Error('PayPal configuration is incomplete');
  const auth = Buffer.from(clientId + ':' + clientSecret).toString('base64');
  const tokenRes = await fetch(PAYPAL_BASE_URL + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) throw new Error('PayPal authentication failed');
  return tokenData.access_token;
}

function text(v, max=15000) { return String(v ?? '').trim().slice(0, max); }
function newAionOrderId() { return 'AION-TCH-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomUUID().slice(0,8).toUpperCase(); }

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const service = getService(body.serviceTitle);
  if (!service) return res.status(400).json({ error: 'Invalid service' });

  const aionOrderId = typeof body.orderId === 'string' && /^[A-Z0-9-]{8,64}$/.test(body.orderId.trim())
    ? body.orderId.trim()
    : newAionOrderId();

  const order = {
    id: aionOrderId,
    type: 'teacher-service',
    serviceId: service.id,
    serviceTitle: body.serviceTitle,
    description: service.description,
    amountUsd: service.price,
    currency: 'USD',
    country: text(body.country, 100),
    grade: text(body.grade, 100),
    subject: text(body.subject, 100),
    term: text(body.term, 100),
    details: text(body.details, 3000),
    pdfText: text(body.pdfText, 15000),
    prompt: text(body.prompt, 15000),
    status: 'PAYMENT_PENDING',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'not-started',
    deliveryStatus: 'not-started',
    revenueRecognized: false,
    createdAt: new Date().toISOString()
  };

  await setJson('teacher-orders:' + order.id, order);
  await addToIndex('teacher-orders', order.id);

  try {
    const accessToken = await getAccessToken();
    const invoiceId = order.id;
    const orderRes = await fetch(PAYPAL_BASE_URL + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': invoiceId
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        application_context: {
          brand_name: 'AION AUTONOMOUS',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: ALLOWED_ORIGIN + '/teacher.html?paypal_return=1',
          cancel_url: ALLOWED_ORIGIN + '/teacher.html?paypal_cancel=1'
        },
        purchase_units: [{
          reference_id: service.id,
          invoice_id: order.id,
          custom_id: order.id,
          description: service.description,
          amount: { currency_code: 'USD', value: service.price.toFixed(2) }
        }]
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.id) throw new Error(orderData.message || 'PayPal order creation failed');

    const approvalLink = Array.isArray(orderData.links)
      ? (orderData.links.find(link => link.rel === 'payer-action')?.href || orderData.links.find(link => link.rel === 'approve')?.href || null)
      : null;

    const updated = {
      ...order,
      paypalOrderId: orderData.id,
      paymentStatus: 'pending',
      status: 'PAYMENT_PENDING',
      updatedAt: new Date().toISOString()
    };
    await setJson('teacher-orders:' + order.id, updated);

    return res.status(200).json({
      id: orderData.id,
      aionOrderId: order.id,
      verificationToken: crypto.createHmac('sha256', process.env.AION_VERIFY_SECRET || paypalClientSecret())
        .update([orderData.id, service.id, service.price.toFixed(2), 'AION-V2'].join('|')).digest('hex'),
      serviceId: service.id,
      amount: service.price.toFixed(2),
      currency: 'USD',
      embeddedCheckout: true,
      approvalUrl: approvalLink || null
    });
  } catch (err) {
    await setJson('teacher-orders:' + order.id, {...order,status:'PAYMENT_FAILED',paymentStatus:'failed',paymentError:String(err?.message||err),updatedAt:new Date().toISOString()});
    console.error('AION PayPal create-order error:', err);
    return res.status(502).json({ error: 'Payment provider unavailable', aionOrderId: order.id });
  }
}
