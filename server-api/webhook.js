import { paypalBaseUrl, paypalClientId, paypalClientSecret } from './paypal/config.js';
import { confirmCustomerPayment } from '../config/aion-customer-revenue.js';
import { postConfirmedPaymentReceipt } from '../financial-core/customer-payment-ledger.js';
async function ensurePaymentJournal(order) {
  if (process.env.NODE_ENV === 'test' &&
      process.env.AION_TEST_ALLOW_MEMORY_FINANCIAL_STORE === '1' &&
      !String(process.env.REDIS_URL || '').trim()) {
    return { skipped: 'explicit-memory-test-adapter' };
  }
  try {
    return await postConfirmedPaymentReceipt(order);
  } catch (error) {
    throw new Error('Durable financial journal unavailable: ' + String(error?.message || error));
  }
}


async function paypalAccessToken(clientId, secret) {
  const basic = Buffer.from(clientId + ':' + secret).toString('base64');
  const response = await fetch(paypalBaseUrl() + '/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + basic },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(8000)
  });
  const data = await response.json();
  if (!response.ok || !data?.access_token) throw new Error('PayPal OAuth access token could not be obtained');
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  // PayPal verification is required for the payment endpoint. Automation
  // forwarding is optional and must not disable verified payment processing.
  if (!paypalWebhookId) {
    return res.status(500).json({
      success: false,
      error: 'PayPal webhook configuration incomplete'
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

    const accessToken = await paypalAccessToken(clientId, secret);
    const verificationResponse = await fetch(
      paypalBaseUrl() + '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        signal: AbortSignal.timeout(8000),
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
    const captureStatus = String(resource?.status || '').toUpperCase();

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' && captureStatus === 'COMPLETED') {
      const relatedPayPalOrderId = String(resource?.supplementary_data?.related_ids?.order_id || '').trim();
      const amountValue = resource?.amount?.value;
      const amountCurrency = resource?.amount?.currency_code;
      if (!relatedPayPalOrderId || !webhookEvent?.id || !resource?.id ||
          typeof amountValue !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(amountValue) ||
          typeof amountCurrency !== 'string') {
        return res.status(400).json({ success: false, error: 'Verified PayPal capture is missing its related order or amount evidence' });
      }

      // A capture webhook points to the PayPal checkout order. Resolve the local AION order
      // through PayPal's server-side order details, and verify this exact capture and amount.
      const orderResponse = await fetch(
        paypalBaseUrl() + '/v2/checkout/orders/' + encodeURIComponent(relatedPayPalOrderId),
        { headers: { 'Authorization': 'Bearer ' + accessToken }, signal: AbortSignal.timeout(8000) }
      );
      const paypalOrder = await orderResponse.json();
      if (!orderResponse.ok || String(paypalOrder?.status || '').toUpperCase() !== 'COMPLETED') {
        throw new Error('PayPal checkout order could not be verified as completed');
      }

      const purchaseUnits = Array.isArray(paypalOrder?.purchase_units) ? paypalOrder.purchase_units : [];
      const matchedUnit = purchaseUnits.find(unit =>
        String(unit?.custom_id || unit?.invoice_id || '').trim() &&
        String(unit?.amount?.currency_code || '').toUpperCase() === String(amountCurrency).toUpperCase() &&
        Number(unit?.amount?.value).toFixed(2) === Number(amountValue).toFixed(2) &&
        Array.isArray(unit?.payments?.captures) &&
        unit.payments.captures.some(item =>
          item?.id === resource.id &&
          String(item?.status || '').toUpperCase() === 'COMPLETED' &&
          String(item?.amount?.currency_code || '').toUpperCase() === String(amountCurrency).toUpperCase() &&
          Number(item?.amount?.value).toFixed(2) === Number(amountValue).toFixed(2)
        )
      );
      const aionOrderId = String(matchedUnit?.custom_id || matchedUnit?.invoice_id || '').trim();
      if (!aionOrderId) {
        return res.status(400).json({ success: false, error: 'PayPal order does not contain a matching AION order and completed capture' });
      }

      const confirmedOrder = await confirmCustomerPayment(aionOrderId, {
        paymentProvider: 'paypal',
        verificationStatus: 'SUCCESS',
        providerEventId: webhookEvent.id,
        paymentReference: resource.id,
        amountUsd: amountValue,
        currency: amountCurrency
      });
      if (!confirmedOrder) {
        return res.status(404).json({ success: false, error: 'AION order not found; payment was not recorded' });
      }
      await ensurePaymentJournal(confirmedOrder);
    }

    if (n8nWebhookUrl) {
      try {
        const forwardResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookEvent),
          signal: AbortSignal.timeout(8000)
        });
        if (!forwardResponse.ok) {
          console.error('AION automation webhook failed:', forwardResponse.status);
          // The verified payment has already been recorded. Return success to
          // PayPal so a downstream automation outage does not cause webhook retries.
        }
      } catch (forwardError) {
        console.error('AION automation webhook unavailable:', String(forwardError?.message || forwardError));
        // Payment recording is independent of optional downstream automation.
      }
    }

    return res.status(200).json({
      success: true,
      status: n8nWebhookUrl ? 'Verified event processed; automation forwarding attempted' : 'Verified event processed; automation forwarding not configured'
    });

  } catch (error) {
    console.error(
      'AION webhook error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      error: 'Webhook processing failed'
    });
  }
};
