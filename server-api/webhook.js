import { paypalBaseUrl, paypalClientId, paypalClientSecret } from './paypal/config.js';
import { confirmCustomerPayment } from '../config/aion-customer-revenue.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!paypalWebhookId || !n8nWebhookUrl) {
    return res.status(500).json({
      success: false,
      error: 'Configuration incomplete'
    });
  }

  try {
    const webhookEvent = req.body;
    const headers = req.headers;

    const clientId = paypalClientId();
    const secret = paypalClientSecret();

    if (!clientId || !secret) {
      return res.status(500).json({
        success: false,
        error: 'PayPal credentials are not configured'
      });
    }

    const auth = Buffer.from(
      clientId + ':' + secret
    ).toString('base64');

    const verificationResponse = await fetch(
      paypalBaseUrl() + '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + auth
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: paypalWebhookId,
          webhook_event: webhookEvent
        })
      }
    );

    const verificationResult = await verificationResponse.json();

    if (!verificationResponse.ok || verificationResult.verification_status !== 'SUCCESS') {
      console.error(
        'PayPal signature verification failed:',
        verificationResult
      );

      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    const eventType = String(webhookEvent?.event_type || '');
    const resource = webhookEvent?.resource || {};
    // PAYMENT.CAPTURE.COMPLETED normally carries the capture itself as resource.
    // Retain support for order-shaped payloads without treating them as verified by shape alone.
    const purchaseUnit = Array.isArray(resource?.purchase_units) ? resource.purchase_units[0] : null;
    const capture = resource?.id && resource?.status
      ? resource
      : purchaseUnit?.payments?.captures?.[0] || null;
    const captureStatus = String(capture?.status || '').toUpperCase();
    const orderId = String(resource?.custom_id || purchaseUnit?.custom_id || '').trim();
    const amountValue = capture?.amount?.value;
    const amountCurrency = capture?.amount?.currency_code;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' && captureStatus === 'COMPLETED') {
      if (!orderId || !webhookEvent?.id || !capture?.id ||
          typeof amountValue !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(amountValue) ||
          typeof amountCurrency !== 'string') {
        return res.status(400).json({ success: false, error: 'Verified payment event is missing AION order mapping or amount evidence' });
      }
      await confirmCustomerPayment(orderId, {
        paymentProvider: 'paypal',
        verificationStatus: 'SUCCESS',
        providerEventId: webhookEvent.id,
        paymentReference: capture.id,
        amountUsd: amountValue,
        currency: amountCurrency
      });
    }

    const forwardResponse = await fetch(
      n8nWebhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookEvent)
      }
    );

    if (!forwardResponse.ok) {
      const forwardText =
        await forwardResponse.text();

      console.error(
        'Automation webhook failed:',
        forwardResponse.status,
        forwardText
      );

      return res.status(502).json({
        success: false,
        error: 'Automation webhook failed',
        provider_status: forwardResponse.status
      });
    }

    return res.status(200).json({
      success: true,
      status: 'Forwarded to automation'
    });

  } catch (error) {
    console.error(
      'AION webhook error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details:
        error?.message || 'Unknown error'
    });
  }
};
