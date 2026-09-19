
```javascript
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookEvent = req.body;
  const headers = req.headers;

  if (!paypalWebhookId || !n8nWebhookUrl) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Configuration incomplete' });
  }

  try {
    const auth = Buffer.from(
      process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_SECRET
    ).toString('base64');

    const verificationResponse = await fetch(
      'https://api-m.paypal.com/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + auth,
        },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: paypalWebhookId,
          webhook_event: webhookEvent,
        }),
      }
    );

    const verificationResult = await verificationResummary = await verificationResponse.json();

    if (verificationResult.verification_status !== 'SUCCESS') {
      console.error('PayPal signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookEvent),
    });

    return res.status(200).json({ status: 'Forwarded to n8n' });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
```

